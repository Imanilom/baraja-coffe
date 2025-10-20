import mongoose from 'mongoose';
import Role from '../models/Role.model.js';
import User from '../models/user.model.js';
import Product from '../models/modul_market/Product.model.js';
import ProductStock from '../models//modul_menu/ProductStock.model.js';
import Request from '../models/modul_market/Request.model.js';
import Warehouse from '../models//modul_market/Warehouse.model.js';
import MarketList from '../models/modul_market/MarketList.model.js';

class RequestController {
  
  // Membuat request baru (hanya membuat request, belum mengambil stok)
  async createRequest(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user._id).session(session);
 

    const { requestedWarehouse, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Items wajib diisi' });
    }

    const transferItems = [];
    const purchaseItems = [];
    const stockUpdates = [];

    // Cari gudang pusat (asumsi ada warehouse dengan nama 'Gudang Pusat')
    const centralWarehouse = await Warehouse.findOne({ name: 'Gudang Pusat' }).session(session);
    if (!centralWarehouse) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Gudang Pusat tidak ditemukan' });
    }

    for (const item of items) {
      const { productId, quantity, notes, type = 'transfer' } = item;
      
      if (!productId || !quantity || quantity <= 0) {
        await session.abortTransaction();
        return res.status(400).json({
          message: 'Data item tidak lengkap atau quantity <= 0'
        });
      }

      const productDoc = await Product.findById(productId).session(session);
      if (!productDoc) {
        await session.abortTransaction();
        return res.status(404).json({
          message: `Produk dengan ID ${productId} tidak ditemukan`
        });
      }

      if (quantity < productDoc.minimumrequest) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Permintaan minimal ${productDoc.minimumrequest} ${productDoc.unit} untuk ${productDoc.name}`
        });
      }

      // Cek stok yang tersedia di gudang pusat
      const centralStock = await ProductStock.findOne({
        productId,
        warehouse: centralWarehouse._id
      }).session(session);

      const availableStock = centralStock ? centralStock.currentStock : 0;
      
      const requestItem = {
        productId,
        productName: productDoc.name,
        productSku: productDoc.sku,
        category: productDoc.category,
        quantity,
        unit: productDoc.unit,
        notes: notes || '',
        status: 'approved',
        fulfilledQuantity: type === 'transfer' ? quantity : 0, // Langsung terpenuhi untuk transfer
        availableStock,
        minimumRequest: productDoc.minimumrequest,
        sourceWarehouse: type === 'transfer' ? centralWarehouse._id : null,
        destinationWarehouse: requestedWarehouse,
        processedAt: new Date(),
        processedBy: user.username,
        type
      };

      if (type === 'purchase') {
        purchaseItems.push(requestItem);
      } else {
        transferItems.push(requestItem);
      }

      // **STOK LANGSUNG BERPINDAH MESKI MINUS**
      if (type === 'transfer') {
        // 1. Kurangi stok gudang pusat (bisa minus)
        stockUpdates.push({
          updateOne: {
            filter: { 
              productId, 
              warehouse: centralWarehouse._id 
            },
            update: {
              $inc: { currentStock: -quantity },
              $push: { 
                movements: {
                  quantity: -quantity,
                  type: 'out',
                  referenceId: null, // Akan diupdate setelah request dibuat
                  notes: `Transfer ke ${requestedWarehouse}`,
                  destinationWarehouse: requestedWarehouse,
                  handledBy: user.username,
                  date: new Date()
                }
              }
            },
            upsert: true
          }
        });

        // 2. Tambah stok gudang tujuan
        stockUpdates.push({
          updateOne: {
            filter: { 
              productId, 
              warehouse: requestedWarehouse 
            },
            update: {
              $inc: { currentStock: quantity },
              $push: { 
                movements: {
                  quantity: quantity,
                  type: 'in',
                  referenceId: null, // Akan diupdate setelah request dibuat
                  notes: `Transfer dari Gudang Pusat`,
                  sourceWarehouse: centralWarehouse._id,
                  handledBy: user.username,
                  date: new Date()
                }
              },
              $setOnInsert: {
                category: productDoc.category,
                productName: productDoc.name,
                productSku: productDoc.sku
              }
            },
            upsert: true
          }
        });
      }
    }

    // Buat request
    const newRequest = new Request({
      requestedWarehouse,
      requester: user.username,
      transferItems,
      purchaseItems,
      status: 'approved', // Langsung approved
      fulfillmentStatus: transferItems.length > 0 ? 'fulfilled' : 'pending',
      processedBy: user.username,
      processedAt: new Date()
    });

    const savedRequest = await newRequest.save({ session });

    // Update referenceId di stock movements dengan ID request yang baru
    for (const update of stockUpdates) {
      if (update.updateOne.$push && update.updateOne.$push.movements) {
        update.updateOne.$push.movements.$each[0].referenceId = savedRequest._id;
      }
    }

    // Eksekusi update stok
    if (stockUpdates.length > 0) {
      await ProductStock.bulkWrite(stockUpdates, { session });
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Request berhasil dibuat dan langsung diproses',
      data: savedRequest
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating request:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan server.'
    });
  } finally {
    session.endSession();
  }
};

  // Approve request dan fulfill stok
async approveAndFulfillRequest(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user._id).populate("role").session(session);
    if (!user) throw new Error("User tidak ditemukan");

    const { requestId, items, notes } = req.body;
    const request = await Request.findById(requestId).session(session);

    if (!request) throw new Error("Request tidak ditemukan");
    if (request.status !== "pending") {
      throw new Error("Request sudah di-approve atau ditolak sebelumnya");
    }

    const destWarehouseId = request.requestedWarehouse;
    const destWarehouse = await Warehouse.findById(destWarehouseId).session(session);
    if (!destWarehouse) throw new Error("Gudang tujuan tidak valid");

    // --- PROCESS TRANSFER ITEMS ---
    for (const item of request.transferItems || []) {
      const adjustment = items.find(adj => adj.itemId === item._id.toString());
      const actualQuantity = adjustment ? adjustment.actualQuantity : item.quantity;
      
      const sourceWarehouseId = item.sourceWarehouse;
      if (!sourceWarehouseId) {
        throw new Error(`Source warehouse tidak ditemukan untuk item ${item.productName}`);
      }

      const sourceStock = await ProductStock.findOne({
        productId: item.productId,
        warehouse: sourceWarehouseId
      }).session(session);

      if (!sourceStock) {
        throw new Error(`Stock asal tidak ditemukan untuk ${item.productName} di warehouse ${sourceWarehouseId}`);
      }

      if (sourceStock.currentStock < actualQuantity) {
        throw new Error(`Stok tidak cukup di gudang asal (${sourceStock.currentStock} < ${actualQuantity}) untuk ${item.productName}`);
      }

      const outMovement = {
        quantity: actualQuantity,
        type: "out",
        referenceId: request._id,
        notes: `Transfer ke ${destWarehouse.name} (Request Approval)${actualQuantity !== item.quantity ? ` - Disesuaikan dari ${item.quantity} ke ${actualQuantity}` : ''}`,
        sourceWarehouse: sourceWarehouseId,
        destinationWarehouse: destWarehouseId,
        handledBy: user.username,
        date: new Date()
      };

      sourceStock.currentStock -= actualQuantity;
      sourceStock.movements.push(outMovement);
      await sourceStock.save({ session });

      let destStock = await ProductStock.findOne({
        productId: item.productId,
        warehouse: destWarehouseId
      }).session(session);

      if (!destStock) {
        destStock = new ProductStock({
          productId: item.productId,
          category: item.category,
          productName: item.productName,
          productSku: item.productSku,
          warehouse: destWarehouseId,
          currentStock: 0,
          movements: []
        });
      }

      const inMovement = {
        quantity: actualQuantity,
        type: "in",
        referenceId: request._id,
        notes: `Transfer dari ${destWarehouse.name} (Request Approval)${actualQuantity !== item.quantity ? ` - Disesuaikan dari ${item.quantity} ke ${actualQuantity}` : ''}`,
        sourceWarehouse: sourceWarehouseId,
        destinationWarehouse: destWarehouseId,
        handledBy: user.username,
        date: new Date()
      };

      destStock.currentStock += actualQuantity;
      destStock.movements.push(inMovement);
      await destStock.save({ session });

      item.status = "fulfilled";
      item.fulfilledQuantity = actualQuantity; // <-- INI SUDAH BENAR
      item.processedAt = new Date();
      item.processedBy = user.username;
      
      if (actualQuantity !== item.quantity) {
        const adjustmentType = actualQuantity > item.quantity ? "lebih" : "kurang";
        const difference = Math.abs(actualQuantity - item.quantity);
        item.adjustmentNotes = `Quantity disesuaikan: ${adjustmentType} ${difference} dari yang diminta`;
      }
    }

    // --- PROCESS PURCHASE ITEMS ---
    for (const item of request.purchaseItems || []) {
      const adjustment = items.find(adj => adj.itemId === item._id.toString());
      const actualQuantity = adjustment ? adjustment.actualQuantity : item.quantity;
      
      const sourceWarehouseId = item.sourceWarehouse;
      if (!sourceWarehouseId) {
        throw new Error(`Source warehouse tidak ditemukan untuk item ${item.productName}`);
      }

      const sourceStock = await ProductStock.findOne({
        productId: item.productId,
        warehouse: sourceWarehouseId
      }).session(session);

      if (!sourceStock) {
        throw new Error(`Stock tidak ditemukan untuk ${item.productName} di gudang pusat`);
      }

      if (sourceStock.currentStock < actualQuantity) {
        throw new Error(`Stok tidak cukup di gudang pusat (${sourceStock.currentStock} < ${actualQuantity}) untuk ${item.productName}`);
      }

      const outMovement = {
        quantity: actualQuantity,
        type: "out",
        referenceId: request._id,
        notes: `Request pembelian oleh ${request.requester}${actualQuantity !== item.quantity ? ` - Disesuaikan dari ${item.quantity} ke ${actualQuantity}` : ''}`,
        sourceWarehouse: sourceWarehouseId,
        destinationWarehouse: destWarehouseId,
        handledBy: user.username,
        date: new Date()
      };

      sourceStock.currentStock -= actualQuantity;
      sourceStock.movements.push(outMovement);
      await sourceStock.save({ session });

      let destStock = await ProductStock.findOne({
        productId: item.productId,
        warehouse: destWarehouseId
      }).session(session);

      if (!destStock) {
        destStock = new ProductStock({
          productId: item.productId,
          category: item.category,
          productName: item.productName,
          productSku: item.productSku,
          warehouse: destWarehouseId,
          currentStock: 0,
          minStock: 0,
          movements: []
        });
      }

      const inMovement = {
        quantity: actualQuantity,
        type: "in",
        referenceId: request._id,
        notes: `Pembelian dari gudang pusat${actualQuantity !== item.quantity ? ` - Disesuaikan dari ${item.quantity} ke ${actualQuantity}` : ''}`,
        sourceWarehouse: sourceWarehouseId,
        destinationWarehouse: destWarehouseId,
        handledBy: user.username,
        date: new Date()
      };

      destStock.currentStock += actualQuantity;
      destStock.movements.push(inMovement);
      await destStock.save({ session });

      item.status = "fulfilled";
      item.fulfilledQuantity = actualQuantity; // <-- INI SUDAH BENAR
      item.processedAt = new Date();
      item.processedBy = user.username;
      
      if (actualQuantity !== item.quantity) {
        const adjustmentType = actualQuantity > item.quantity ? "lebih" : "kurang";
        const difference = Math.abs(actualQuantity - item.quantity);
        item.adjustmentNotes = `Quantity disesuaikan: ${adjustmentType} ${difference} dari yang diminta`;
      }

      // --- SOLUSI UTAMA: UPDATE/CARI & UPDATE PURCHASE DOCUMENT ---
      // Cari dokumen Purchase yang terkait dengan request ini
      let purchase = await MarketList.findOne({
        'items.productId': item.productId,
        relatedRequests: request._id
      }).session(session);

      if (purchase) {
        // Jika Purchase sudah ada, update quantityPurchased untuk item ini
        const purchaseItem = purchase.items.find(pi => pi.productId.toString() === item.productId.toString());
        if (purchaseItem) {
          purchaseItem.quantityPurchased = actualQuantity;
          // Opsional: Hitung ulang amountCharged jika perlu
          // purchaseItem.amountCharged = purchaseItem.quantityPurchased * purchaseItem.pricePerUnit;
        }
        await purchase.save({ session });
      } else {
        // Jika belum ada, buat dokumen Purchase baru
        // Catatan: Anda mungkin perlu menyesuaikan field lain seperti pricePerUnit, supplierName, dll.
        // Untuk contoh ini, kita asumsikan data dasar sudah ada.
        const newPurchaseItem = {
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          category: item.category,
          unit: item.unit,
          quantityRequested: item.quantity,
          quantityPurchased: actualQuantity, // <-- Gunakan actualQuantity di sini
          // pricePerUnit: 0, // Anda perlu logika untuk mendapatkan harga
          // supplierName: '', // Anda perlu logika untuk mendapatkan supplier
          // amountCharged: 0, // amountCharged = quantityPurchased * pricePerUnit
          // payment: { ... }
        };

        const newPurchase = new Purchase({
          date: new Date(),
          day: new Date().toLocaleDateString('id-ID', { weekday: 'long' }),
          items: [newPurchaseItem],
          relatedRequests: [request._id],
          createdBy: user.username
        });

        await newPurchase.save({ session });
      }
      // --- AKHIR SOLUSI ---
    }

    // --- UPDATE REQUEST OVERALL ---
    const allItems = [...(request.transferItems || []), ...(request.purchaseItems || [])];
    const totalRequested = allItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalFulfilled = allItems.reduce((sum, item) => sum + (item.fulfilledQuantity || 0), 0);
    
    let fulfillmentStatus = "pending";
    if (totalFulfilled >= totalRequested) {
      fulfillmentStatus = totalFulfilled > totalRequested ? "excess" : "fulfilled";
    } else if (totalFulfilled > 0) {
      fulfillmentStatus = "partial";
    }

    request.fulfillmentStatus = fulfillmentStatus;
    request.status = "approved";
    request.processedBy = user.username;
    request.processedAt = new Date();
    request.notes = notes || "";
    
    const adjustedItems = allItems.filter(item => item.fulfilledQuantity !== item.quantity);
    if (adjustedItems.length > 0) {
      const adjustmentSummary = adjustedItems.map(item => 
        `${item.productName}: ${item.quantity} → ${item.fulfilledQuantity}`
      ).join(', ');
      request.adjustmentSummary = `Items disesuaikan: ${adjustmentSummary}`;
    }

    await request.save({ session });
    await session.commitTransaction();

    let message = "Request berhasil di-approve dan stok berhasil dipindahkan.";
    if (fulfillmentStatus === "excess") {
      message += " Beberapa item diterima lebih dari yang diminta.";
    } else if (fulfillmentStatus === "partial") {
      message += " Beberapa item diterima kurang dari yang diminta.";
    } else if (adjustedItems.length > 0) {
      message += " Ada penyesuaian quantity pada beberapa item.";
    }

    res.json({
      success: true,
      message,
      request,
      summary: {
        totalRequested,
        totalFulfilled,
        fulfillmentStatus,
        adjustedItemsCount: adjustedItems.length
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Error approveAndFulfillRequest:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
}

  // Reject request
  async rejectRequest(req, res) {
    try {
        const user = await User.findById(req.user._id).populate('role').session(session);
        if (!user) {
          await session.abortTransaction();
          return res.status(403).json({ message: 'User tidak ditemukan' });
        }

      const { requestId, reason } = req.body;
      
      const requestDoc = await Request.findById(requestId);
      if (!requestDoc) {
        return res.status(404).json({ message: 'Request tidak ditemukan' });
      }

      if (requestDoc.status !== 'pending') {
        return res.status(400).json({ message: 'Request sudah diproses' });
      }

      requestDoc.status = 'rejected';
      requestDoc.reviewed = true;
      requestDoc.reviewedBy = user.username;
      requestDoc.reviewedAt = new Date();
      requestDoc.rejectionReason = reason;
      requestDoc.fulfillmentStatus = 'tidak tersedia';

      await requestDoc.save();

      res.status(200).json({
        success: true,
        message: 'Request berhasil ditolak',
        data: requestDoc
      });

    } catch (error) {
      console.error('Error rejecting request:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Terjadi kesalahan server.' 
      });
    }
  }

  // Get request list dengan filter
  async getRequests(req, res) {
      try {
        // Ambil user dan populate role
        const user = await User.findById(req.user._id).populate('role');
        if (!user) return res.status(403).json({ message: 'Akses ditolak' });

        const { 
          status, 
          department, 
          fulfillmentStatus,
          page = 1, 
          limit = 20,
          startDate,
          endDate
        } = req.query;

        const filter = {};

        // Role-based filter
        if (user.role?.permissions && !user.role.permissions.includes('manage_inventory')) {
          // Staff biasa hanya lihat request mereka sendiri
          filter.requester = user.username;
        }

        if (status) filter.status = status;
        if (department) filter.requestedWarehouse = department;
        if (fulfillmentStatus) filter.fulfillmentStatus = fulfillmentStatus;

        if (startDate || endDate) {
          filter.date = {};
          if (startDate) filter.date.$gte = new Date(startDate);
          if (endDate) filter.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        // Ambil request dari DB
        const requests = await Request.find(filter)
          .populate('requestedWarehouse', 'name code')
          .populate('transferItems.productId', 'name sku category unit')
          .populate('purchaseItems.productId', 'name sku category unit')
          .sort({ date: -1 })
          .skip(skip)
          .limit(parseInt(limit));

        const total = await Request.countDocuments(filter);

        // Format response
        const formattedRequests = requests.map(reqDoc => ({
          _id: reqDoc._id,
          requestedWarehouse: reqDoc.requestedWarehouse,
          requester: reqDoc.requester,
          status: reqDoc.status,
          fulfillmentStatus: reqDoc.fulfillmentStatus,
          transferItems: reqDoc.transferItems || [],
          purchaseItems: reqDoc.purchaseItems || [],
          date: reqDoc.date
        }));

        res.status(200).json({
          success: true,
          data: {
            requests: formattedRequests,
            pagination: {
              current: parseInt(page),
              pages: Math.ceil(total / limit),
              total
            }
          }
        });

      } catch (error) {
        console.error('Error getting requests:', error);
        res.status(500).json({ 
          success: false,
          message: error.message || 'Terjadi kesalahan server.' 
        });
      }
    }

// Get request detail

async getRequestDetail(req, res) {
  try {
    const { requestId } = req.params;

    // Cek validitas ObjectId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid Request ID' });
    }

    const user = await User.findById(req.user._id);
    const request = await Request.findById(requestId)
      .populate({
        path: 'purchaseItems.productId',
        select: 'name sku category unit'
      })
      .populate('requestedWarehouse', 'name code');


    if (!request) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    if (user.role === 'staff' && request.requester !== user.username) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    res.status(200).json({ success: true, data: request });

  } catch (error) {
    console.error('Error getting request detail:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Terjadi kesalahan server.' 
    });
  }
}



}

export default new RequestController();