import mongoose from 'mongoose';
import Role from '../models/Role.model.js';
import User from '../models/user.model.js';
import Product from '../models/modul_market/Product.model.js';
import ProductStock from '../models//modul_menu/ProductStock.model.js';
import Request from '../models/modul_market/Request.model.js';
import Warehouse from '../models//modul_market/Warehouse.model.js';

class RequestController {
  
  // Membuat request baru (hanya membuat request, belum mengambil stok)
  async createRequest(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user._id).populate('role').session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'User tidak ditemukan' });
    }

    const { requestedWarehouse, items } = req.body;
    if (!requestedWarehouse) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Warehouse (departemen) wajib diisi' });
    }

    // Cari Gudang Pusat
    const centralWarehouse = await Warehouse.findOne({ code: 'gudang-pusat' }).session(session);
    if (!centralWarehouse) {
      await session.abortTransaction();
      return res.status(500).json({ message: 'Gudang Pusat tidak ditemukan' });
    }

    const transferItems = [];
    const purchaseItems = [];

    for (const item of items) {
      const { productId, quantity, notes } = item;
      if (!productId || !quantity || quantity <= 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Data item tidak lengkap atau quantity <= 0' });
      }

      const productDoc = await Product.findById(productId).session(session);
      if (!productDoc) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Produk dengan ID ${productId} tidak ditemukan` });
      }

      if (quantity < productDoc.minimumrequest) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Permintaan minimal ${productDoc.minimumrequest} ${productDoc.unit} untuk ${productDoc.name}`
        });
      }

      // Cek stok di Gudang Pusat
      let centralStockDoc = await ProductStock.findOne({ productId, warehouse: centralWarehouse._id }).session(session);
      if (!centralStockDoc) {
        centralStockDoc = new ProductStock({
          productId,
          warehouse: centralWarehouse._id,
          currentStock: 0,
          minStock: 0,
          movements: []
        });
        await centralStockDoc.save({ session });
        console.log(`Auto-create central warehouse stock for product ${productId}`);
      }

      const itemData = {
        productId,
        productName: productDoc.name,
        productSku: productDoc.sku,
        category: productDoc.category,
        quantity,
        unit: productDoc.unit,
        notes: notes || '',
        status: 'pending',
        fulfilledQuantity: 0,
        availableStock: centralStockDoc.currentStock,
        minimumRequest: productDoc.minimumrequest,
        sourceWarehouse: centralWarehouse._id // ⬅️ SIMPAN SOURCE WAREHOUSE
      };

      if (centralStockDoc.currentStock >= quantity) {
        transferItems.push(itemData);
      } else {
        purchaseItems.push(itemData);
      }
    }

    const newRequest = new Request({
      requestedWarehouse,
      requester: user.username,
      transferItems,
      purchaseItems,
      status: 'pending',
      fulfillmentStatus: 'pending'
    });

    await newRequest.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Request berhasil dibuat, menunggu approval',
      data: newRequest
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating request:', error);
    res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan server.' });
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

    if (!user.role.permissions.includes("manage_inventory")) {
      throw new Error("Tidak memiliki izin untuk approve request");
    }

    const { requestId } = req.body;
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

      if (sourceStock.currentStock < item.quantity) {
        throw new Error(`Stok tidak cukup di gudang asal (${sourceStock.currentStock} < ${item.quantity}) untuk ${item.productName}`);
      }

      // Movement OUT dari gudang asal
      const outMovement = {
        quantity: item.quantity,
        type: "out",
        referenceId: request._id,
        notes: `Transfer ke ${destWarehouse.name} (Request Approval)`,
        sourceWarehouse: sourceWarehouseId,
        destinationWarehouse: destWarehouseId,
        handledBy: user.username,
        date: new Date()
      };

      sourceStock.currentStock -= item.quantity;
      sourceStock.movements.push(outMovement);
      await sourceStock.save({ session });

      // Movement IN ke gudang tujuan
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
        quantity: item.quantity,
        type: "in",
        referenceId: request._id,
        notes: `Transfer dari ${sourceWarehouseId} (Request Approval)`,
        sourceWarehouse: sourceWarehouseId,
        destinationWarehouse: destWarehouseId,
        handledBy: user.username,
        date: new Date()
      };

      destStock.currentStock += item.quantity;
      destStock.movements.push(inMovement);
      await destStock.save({ session });

      // Update status item
      item.status = "fulfilled";
      item.fulfilledQuantity = item.quantity;
      item.processedAt = new Date();
      item.processedBy = user.username;
    }

    // --- PROCESS PURCHASE ITEMS ---
    for (const item of request.purchaseItems || []) {
      const sourceWarehouseId = item.sourceWarehouse;
      if (!sourceWarehouseId) {
        throw new Error(`Source warehouse tidak ditemukan untuk item ${item.productName}`);
      }

      // Cari stok di gudang sumber (pusat)
      const sourceStock = await ProductStock.findOne({
        productId: item.productId,
        warehouse: sourceWarehouseId
      }).session(session);

      if (!sourceStock) {
        throw new Error(`Stock tidak ditemukan untuk ${item.productName} di gudang pusat`);
      }

      if (sourceStock.currentStock < item.quantity) {
        throw new Error(`Stok tidak cukup di gudang pusat (${sourceStock.currentStock} < ${item.quantity}) untuk ${item.productName}`);
      }

      // Movement OUT dari gudang pusat
      const outMovement = {
        quantity: item.quantity,
        type: "out",
        referenceId: request._id,
        notes: `Request pembelian oleh ${request.requester}`,
        sourceWarehouse: sourceWarehouseId,
        destinationWarehouse: destWarehouseId,
        handledBy: user.username,
        date: new Date()
      };

      sourceStock.currentStock -= item.quantity;
      sourceStock.movements.push(outMovement);
      await sourceStock.save({ session });

      // Movement IN ke gudang tujuan (dapur)
      let destStock = await ProductStock.findOne({
        productId: item.productId,
        warehouse: destWarehouseId
      }).session(session);

      if (!destStock) {
        // Buat data stok baru jika belum ada
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
        quantity: item.quantity,
        type: "in",
        referenceId: request._id,
        notes: `Pembelian dari gudang pusat`,
        sourceWarehouse: sourceWarehouseId,
        destinationWarehouse: destWarehouseId,
        handledBy: user.username,
        date: new Date()
      };

      destStock.currentStock += item.quantity;
      destStock.movements.push(inMovement);
      await destStock.save({ session });

      // Update status item
      item.status = "fulfilled";
      item.fulfilledQuantity = item.quantity;
      item.processedAt = new Date();
      item.processedBy = user.username;
    }

    // --- UPDATE REQUEST OVERALL ---
    const allItems = [...(request.transferItems || []), ...(request.purchaseItems || [])];
    const isFullyFulfilled = allItems.every(item => item.fulfilledQuantity >= item.quantity);
    const hasPartial = allItems.some(item => item.fulfilledQuantity > 0);

    request.fulfillmentStatus = isFullyFulfilled ? "fulfilled" : hasPartial ? "partial" : "pending";
    request.status = "approved";
    request.processedBy = user.username;
    request.processedAt = new Date();

    await request.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      message: "Request berhasil di-approve. Stok berhasil dipindahkan dari gudang pusat ke departemen.",
      request
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