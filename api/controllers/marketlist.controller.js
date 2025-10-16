// controllers/marketlistController.js
import MarketList from '../models/modul_market/MarketList.model.js';
import Request from '../models/modul_market/Request.model.js';
import Warehouse from '../models/modul_market/Warehouse.model.js';
import Product from '../models/modul_market/Product.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import DeliveryTracking from '../models/modul_market/DeliveryTracking.model.js';
import CashFlow from '../models/modul_market/CashFlow.model.js';
import Debt from '../models/modul_market/Debt.model.js';
import User from '../models/user.model.js';
import { getDayName } from '../services/getDay.js';
import { recordStockMovement } from '../utils/stockMovement.js';
import mongoose from 'mongoose';


export const createRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user._id).session(session);
    if (!user || !['staff', 'admin', 'superadmin'].includes(user.role)) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Akses ditolak' });
    }

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

// Ambil semua request (hanya untuk role inventory)
export const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find().populate({
      path: 'items.productId',
      select: 'name sku category unit'
    });

    res.json(requests);
  } catch (error) {
    console.error('Error saat mengambil semua request:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi ID menggunakan mongoose
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID',
      });
    }

    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Error in getRequestById:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving request',
      error: error.message,
    });
  }
};

export const getAllRequestWithSuppliers = async (req, res) => {
  try {
    // Ambil semua request dan populate productId
    const requests = await Request.find()
      .populate('purchaseItems.productId')
      .populate('transferItems.productId')
      .lean();

    // Gabungkan semua items (transfer + purchase)
    const enrichedRequests = requests.map(req => {
      const items = [...req.transferItems, ...req.purchaseItems];

      // Kumpulkan semua productId yang valid
      const productIds = items
        .map(item => item.productId?._id)
        .filter(id => id !== null && id !== undefined);

      return { ...req, items, productIds };
    });

    // Ambil semua productId unik
    const uniqueProductIds = [
      ...new Set(enrichedRequests.flatMap(r => r.productIds))
    ];

    // Ambil semua produk yang relevan
    const products = uniqueProductIds.length > 0
      ? await Product.find({ _id: { $in: uniqueProductIds } }).lean()
      : [];

    // Buat mapping productId -> product
    const productMap = {};
    products.forEach(product => {
      productMap[product._id.toString()] = product;
    });

    // Enrich setiap request dan item dengan suppliers
    const finalRequests = enrichedRequests.map(req => ({
      ...req,
      items: req.items.map(item => {
        let product;
        if (item.productId) {
          product = productMap[item.productId._id?.toString()];
        } else {
          product = products.find(p => p.sku === item.productSku || p.name === item.productName);
        }

        return {
          ...item,
          productId: product?._id || item._id,
          suppliers: product?.suppliers || [],
        };
      })
    }));

    res.status(200).json({ success: true, data: finalRequests });
  } catch (error) {
    console.error('Failed to get request list:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Setujui beberapa item dalam request
// export const approveRequestItems = async (req, res) => {
//   try {
//     const { requestId, items, reviewedBy } = req.body;

//     if (!requestId || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ message: 'Request ID dan daftar item harus disediakan' });
//     }

//     const request = await Request.findById(requestId);
//     if (!request) {
//       return res.status(404).json({ message: 'Request tidak ditemukan' });
//     }

//     // Validasi dan update status item
//     for (const updatedItem of items) {
//       const item = request.items.id(updatedItem.itemId);
//       if (!item) continue; // Lewati jika item tidak ditemukan

//       if (updatedItem.status) item.status = updatedItem.status;
//       if (updatedItem.fulfilledQuantity !== undefined) item.fulfilledQuantity = updatedItem.fulfilledQuantity;

//       // Jika status "dibeli", isi fulfilledQuantity otomatis jika belum ada
//       if (updatedItem.status === 'dibeli' && item.fulfilledQuantity === undefined) {
//         item.fulfilledQuantity = item.quantity;
//       }

//       // Jika status "tidak tersedia", set fulfilledQuantity ke 0
//       if (updatedItem.status === 'tidak tersedia') {
//         item.fulfilledQuantity = 0;
//       }
//     }

//     // Tandai bahwa request sudah direview
//     request.reviewed = true;
//     request.reviewedBy = reviewedBy || 'anonymous';
//     request.reviewedAt = new Date();
//     request.status = 'approved'; // Set status ke approved
//     request.fulfillmentStatus = 'dibeli';

//     await request.save();

//     res.status(200).json({ message: 'Request berhasil direview', request });
//   } catch (error) {
//     console.error('Gagal mereview request:', error);
//     res.status(500).json({ message: 'Terjadi kesalahan saat mereview request' });
//   }
// };

export const approveRequestItems = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { requestId, items, reviewedBy, sourceWarehouse } = req.body;

    if (!requestId || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Request ID, items, dan source warehouse harus disediakan' });
    }

    const request = await Request.findById(requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    // Cari warehouse tujuan berdasarkan department
    const destinationWarehouse = await Warehouse.findOne({ 
      name: request.department 
    }).session(session);

    if (!destinationWarehouse) {
      await session.abortTransaction();
      return res.status(404).json({ 
        message: `Warehouse untuk department ${request.department} tidak ditemukan` 
      });
    }

    // Proses setiap item yang diapprove
    for (const updatedItem of items) {
      const item = request.items.id(updatedItem.itemId);
      if (!item) continue;

      const quantityToApprove = updatedItem.quantity || item.quantity;

      // Record stock movement (transfer dari gudang pusat ke department)
      await recordStockMovement(session, {
        productId: item.productId,
        quantity: quantityToApprove,
        type: 'transfer',
        referenceId: requestId,
        notes: `Request approval - ${item.productName}`,
        sourceWarehouse: sourceWarehouse, // Gudang pusat
        destinationWarehouse: destinationWarehouse._id, // Department warehouse
        handledBy: reviewedBy
      });

      // Update item status
      item.status = 'approved';
      item.fulfilledFromStock = quantityToApprove;
      item.deliveredQuantity = quantityToApprove;
    }

    // Update request status
    request.reviewed = true;
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    request.status = 'approved';
    request.fulfillmentStatus = 'in_progress';

    await request.save({ session });
    await session.commitTransaction();

    res.status(200).json({ 
      success: true,
      message: 'Request berhasil diapprove dan stok ditransfer', 
      data: request 
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Gagal approve request:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Terjadi kesalahan saat approve request' 
    });
  } finally {
    session.endSession();
  }
};

export const receiveItems = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { requestId, receivedBy, proofOfDelivery, destinationWarehouse } = req.body;

    const request = await Request.findById(requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    const deliveryTracking = await DeliveryTracking.findOne({ 
      requestId: requestId 
    }).session(session);

    if (!deliveryTracking) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Data pengiriman tidak ditemukan' });
    }

    // Proses setiap item yang diterima
    for (const item of request.items) {
      if (item.status === 'approved' && item.deliveredQuantity > 0) {
        
        // Record stock movement (in ke warehouse tujuan)
        await recordStockMovement(session, {
          productId: item.productId,
          quantity: item.deliveredQuantity,
          type: 'in',
          referenceId: requestId,
          notes: `Penerimaan barang dari pembelian - ${item.productName}`,
          destinationWarehouse: destinationWarehouse,
          handledBy: receivedBy
        });

        // Update item status
        item.status = 'received';
        item.receivedQuantity = item.deliveredQuantity;
      }
    }

    // Update delivery tracking
    deliveryTracking.status = 'received';
    deliveryTracking.receivedBy = receivedBy;
    deliveryTracking.receivedDate = new Date();
    deliveryTracking.proofOfDelivery = proofOfDelivery;

    // Update request status
    request.status = 'received';
    request.fulfillmentStatus = 'completed';

    await deliveryTracking.save({ session });
    await request.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Barang berhasil diterima dan stok diperbarui',
      data: {
        request,
        delivery: deliveryTracking
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error receiving items:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan server.'
    });
  } finally {
    session.endSession();
  }
};

export const recordPurchaseStockIn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { requestId, purchaseItems, destinationWarehouse, handledBy } = req.body;

    const request = await Request.findById(requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    const marketListItems = [];

    for (const purchaseItem of purchaseItems) {
      const { itemId, pricePerUnit, supplierId, supplierName, quantityPurchased } = purchaseItem;
      
      const item = request.items.id(itemId);
      if (!item) continue;

      // Record stock movement untuk barang yang dibeli
      await recordStockMovement(session, {
        productId: item.productId,
        quantity: quantityPurchased,
        type: 'in',
        referenceId: requestId,
        notes: `Pembelian dari supplier ${supplierName} - ${item.productName}`,
        destinationWarehouse: destinationWarehouse,
        handledBy: handledBy
      });

      // Update data pembelian di request
      item.purchaseData = {
        pricePerUnit,
        supplierId,
        supplierName,
        purchasedAt: new Date(),
        quantityPurchased
      };

      // Siapkan data untuk market list
      marketListItems.push({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        category: item.category,
        unit: item.unit,
        quantityRequested: item.quantity,
        quantityPurchased: quantityPurchased,
        pricePerUnit: pricePerUnit,
        supplierId: supplierId,
        supplierName: supplierName,
        amountCharged: quantityPurchased * pricePerUnit,
        amountPaid: quantityPurchased * pricePerUnit,
        remainingBalance: 0,
        payment: {
          method: 'cash',
          status: 'paid',
          amount: quantityPurchased * pricePerUnit,
          date: new Date()
        }
      });

      // Update product supplier data
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $push: {
            suppliers: {
              supplierId: supplierId,
              supplierName: supplierName,
              price: pricePerUnit,
              lastPurchaseDate: new Date()
            }
          }
        },
        { session }
      );
    }

    // Buat market list untuk arsip pembelian
    const marketList = new MarketList({
      date: new Date(),
      day: new Date().toLocaleDateString('id-ID', { weekday: 'long' }),
      items: marketListItems,
      relatedRequests: [requestId],
      createdBy: handledBy
    });

    await marketList.save({ session });
    await request.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Data pembelian berhasil diinput dan stok diperbarui',
      data: {
        request,
        marketList
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error recording purchase stock:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan server.'
    });
  } finally {
    session.endSession();
  }
};

export const getStockMovementHistory = async (req, res) => {
  try {
    const { 
      productId, 
      warehouse, 
      type, 
      startDate, 
      endDate,
      page = 1, 
      limit = 50 
    } = req.query;

    const filter = {};
    
    if (productId) filter.productId = productId;
    if (warehouse) filter.warehouse = warehouse;
    if (type) filter['movements.type'] = type;
    
    if (startDate || endDate) {
      filter['movements.date'] = {};
      if (startDate) filter['movements.date'].$gte = new Date(startDate);
      if (endDate) filter['movements.date'].$lte = new Date(endDate);
    }

    const stockRecords = await ProductStock.find(filter)
      .populate('productId', 'name sku category unit')
      .populate('warehouse', 'name location')
      .populate('movements.sourceWarehouse', 'name')
      .populate('movements.destinationWarehouse', 'name')
      .sort({ 'movements.date': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Extract dan flatten movements
    const movements = [];
    stockRecords.forEach(record => {
      record.movements.forEach(movement => {
        movements.push({
          product: record.productId,
          warehouse: record.warehouse,
          movement: {
            ...movement.toObject(),
            stockAfter: record.currentStock
          },
          date: movement.date
        });
      });
    });

    // Sort by date descending
    movements.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = await ProductStock.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        movements: movements.slice(0, limit),
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error getting stock movement history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan server.'
    });
  }
};

// Tolak request dengan alasan tertentu
export const rejectRequest = async (req, res) => {
  try {
    const { requestId, rejectedBy, reason } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: 'Request ID harus disediakan' });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    request.status = 'rejected';
    request.reviewed = true;
    request.reviewedBy = rejectedBy || 'anonymous';
    request.reviewedAt = new Date();

    if (reason) {
      request.items.forEach(item => {
        item.status = 'tidak tersedia';
        item.notes = `Ditolak: ${reason}`;
        item.fulfilledQuantity = 0;
      });
    }

    await request.save();
    res.status(200).json({ message: 'Request berhasil ditolak', request });
  } catch (error) {
    console.error('Gagal menolak request:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menolak request' });
  }
};

// Filter request berdasarkan status, department, atau rentang tanggal
export const getRequests = async (req, res) => {
  try {
    const { status, department, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (department) query.department = department;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const requests = await Request.find(query).sort({ date: -1 }).populate({
      path: 'items.productId',
      select: 'name sku category unit'
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Gagal mengambil data request:', error);
    res.status(500).json({ message: 'Gagal mengambil data request' });
  }
};


export const createMarketList = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user._id).populate('role');
    if (!user) return res.status(403).json({ message: 'Akses ditolak' });

    if (!user.role.permissions.includes('manage_inventory')) {
      return res.status(403).json({ message: 'Tidak memiliki izin untuk melakukan operasi ini' });
    }

    const { date, items = [], additionalExpenses = [], purpose = 'direct_purchase' } = req.body;
    if (!date) throw new Error("Tanggal belanja harus diisi");
    if (items.length === 0 && additionalExpenses.length === 0) {
      throw new Error("Harus ada setidaknya satu item atau pengeluaran tambahan");
    }

    const day = new Date(date).toLocaleDateString("id-ID", { weekday: "long" });

    // Validasi warehouse
    const warehouseIds = [...new Set(items.map(item => item.warehouse).filter(Boolean))];
    const existingWarehouses = await Warehouse.find({
      _id: { $in: warehouseIds }
    }).session(session);

    if (existingWarehouses.length !== warehouseIds.length) {
      throw new Error("Satu atau lebih warehouse tidak valid");
    }

    const processedItems = [];
    const relatedRequestIds = new Set();
    let totalCharged = 0;
    let totalPaid = 0;
    let totalPhysical = 0;
    let totalNonPhysical = 0;

    for (const item of items) {
      if (!item.warehouse) {
        throw new Error(`Warehouse wajib diisi untuk produk ${item.productName}`);
      }

      // Validasi dan konversi nilai numerik
      const quantityPurchased = parseFloat(item.quantityPurchased) || 0;
      const pricePerUnit = parseFloat(item.pricePerUnit) || 0;
      const amountPaid = parseFloat(item.amountPaid) || 0;
      
      const amountCharged = quantityPurchased * pricePerUnit;

      if (amountPaid > amountCharged) {
        throw new Error(`Jumlah dibayar tidak boleh lebih besar dari jumlah yang dibebankan untuk produk ${item.productName}`);
      }

      let itemPhysical = 0;
      let itemNonPhysical = 0;

      if (item.payment && item.payment.method) {
        switch (item.payment.method) {
          case 'cash':
            itemPhysical = amountPaid;
            itemNonPhysical = 0;
            break;
          case 'card':
          case 'transfer':
            itemPhysical = 0;
            itemNonPhysical = amountPaid;
            break;
          case 'mixed':
            itemPhysical = parseFloat(item.payment.amountPhysical) || 0;
            itemNonPhysical = parseFloat(item.payment.amountNonPhysical) || 0;
            
            if (itemPhysical + itemNonPhysical !== amountPaid) {
              throw new Error(`Untuk metode pembayaran mixed, total amountPhysical + amountNonPhysical harus sama dengan amountPaid untuk produk ${item.productName}`);
            }
            break;
          default:
            itemPhysical = amountPaid;
            itemNonPhysical = 0;
        }
      } else {
        itemPhysical = amountPaid;
        itemNonPhysical = 0;
      }

      totalPhysical += itemPhysical;
      totalNonPhysical += itemNonPhysical;

      processedItems.push({
        ...item,
        quantityPurchased,
        pricePerUnit,
        amountCharged,
        amountPaid,
        remainingBalance: Math.max(0, amountCharged - amountPaid),
        payment: item.payment ? {
          ...item.payment,
          amountPhysical: itemPhysical,
          amountNonPhysical: itemNonPhysical
        } : undefined,
        purpose
      });

      totalCharged += amountCharged;
      totalPaid += amountPaid;

      if (item.requestId) relatedRequestIds.add(item.requestId);
    }

    let additionalPhysical = 0;
    let additionalNonPhysical = 0;
    let additionalTotal = 0;

    for (const expense of additionalExpenses) {
      const amount = parseFloat(expense.amount) || 0;
      additionalTotal += amount;

      if (expense.payment && expense.payment.method) {
        switch (expense.payment.method) {
          case 'cash':
            additionalPhysical += amount;
            break;
          case 'card':
          case 'transfer':
            additionalNonPhysical += amount;
            break;
          case 'mixed':
            additionalPhysical += parseFloat(expense.payment.amountPhysical) || 0;
            additionalNonPhysical += parseFloat(expense.payment.amountNonPhysical) || 0;
            break;
          default:
            additionalPhysical += amount;
        }
      } else {
        additionalPhysical += amount;
      }
    }

    // TOTAL KESELURUHAN
    const grandTotalPhysical = totalPhysical + additionalPhysical;
    const grandTotalNonPhysical = totalNonPhysical + additionalNonPhysical;
    const grandTotalPaid = totalPaid + additionalTotal;

    // Validasi saldo cukup sebelum transaksi
    const lastBalance = await getLastBalance();
    
    const lastBalancePhysical = parseFloat(lastBalance.balancePhysical) || 0;
    const lastBalanceNonPhysical = parseFloat(lastBalance.balanceNonPhysical) || 0;
    
    if (grandTotalPhysical > lastBalancePhysical) {
      throw new Error(`Saldo fisik tidak mencukupi. Dibutuhkan: ${grandTotalPhysical}, Tersedia: ${lastBalancePhysical}`);
    }
    
    if (grandTotalNonPhysical > lastBalanceNonPhysical) {
      throw new Error(`Saldo non-fisik tidak mencukupi. Dibutuhkan: ${grandTotalNonPhysical}, Tersedia: ${lastBalanceNonPhysical}`);
    }

    const marketListDoc = new MarketList({
      date,
      day,
      items: processedItems,
      additionalExpenses,
      relatedRequests: Array.from(relatedRequestIds),
      createdBy: user.username,
      purpose,
      totalCharged,
      totalPaid,
      totalPhysical,
      totalNonPhysical
    });

    const savedMarketList = await marketListDoc.save({ session });

    // Update stok produk
    const productStockUpdates = [];
    for (const item of processedItems) {
      const notes = purpose === 'replenish' 
        ? `Replenish stok oleh ${user.username}`
        : `Pembelian oleh ${user.username}`;

      const purchaseMovement = {
        quantity: item.quantityPurchased,
        type: "in",
        referenceId: savedMarketList._id,
        notes: notes,
        destinationWarehouse: item.warehouse,
        handledBy: user.username,
        date: new Date(date),
      };

      productStockUpdates.push({
        updateOne: {
          filter: { productId: item.productId, warehouse: item.warehouse },
          update: {
            $inc: { currentStock: item.quantityPurchased },
            $push: { movements: purchaseMovement },
            $setOnInsert: {
              category: item.category,
              productName: item.productName,
              productSku: item.productSku
            },
          },
          upsert: true,
        },
      });

      // Update request hanya untuk direct_purchase yang terkait request
      if (purpose === 'direct_purchase' && item.requestId && item.requestItemId) {
        const request = await Request.findById(item.requestId).session(session);
        if (!request) continue;

        let itemToUpdate = null;
        
        // Cari di transferItems
        itemToUpdate = request.transferItems.id(item.requestItemId);
        if (!itemToUpdate) {
          // Cari di purchaseItems
          itemToUpdate = request.purchaseItems.id(item.requestItemId);
        }

        if (itemToUpdate) {
          const newFulfilled = (parseFloat(itemToUpdate.fulfilledQuantity) || 0) + item.quantityPurchased;
          const finalFulfilled = Math.min(newFulfilled, itemToUpdate.quantity);

          itemToUpdate.fulfilledQuantity = finalFulfilled;
          itemToUpdate.processedAt = new Date(date);
          itemToUpdate.processedBy = user.username;

          if (finalFulfilled >= itemToUpdate.quantity) {
            itemToUpdate.status = "fulfilled";
          } else if (finalFulfilled > 0) {
            itemToUpdate.status = "partial";
          }

          await request.save({ session });
        }
      }
    }

    if (productStockUpdates.length > 0) {
      await ProductStock.bulkWrite(productStockUpdates, { session });
    }

    // Update status request overall untuk direct_purchase
    if (purpose === 'direct_purchase') {
      for (const requestId of relatedRequestIds) {
        const request = await Request.findById(requestId).session(session);
        if (!request) continue;

        const allItems = [...request.transferItems, ...request.purchaseItems];
        const isFullyFulfilled = allItems.every(i => (parseFloat(i.fulfilledQuantity) || 0) >= i.quantity);
        const hasPartial = allItems.some(i => (parseFloat(i.fulfilledQuantity) || 0) > 0);

        request.fulfillmentStatus = isFullyFulfilled ? "fulfilled" : hasPartial ? "partial" : "pending";
        await request.save({ session });
      }
    }

    // Catat cashflow
    if (totalPaid > 0 || additionalTotal > 0) {
      const lastBalanceTotal = parseFloat(lastBalance.balance) || 0;
      const newBalance = lastBalanceTotal - grandTotalPaid;
      
      const newBalancePhysical = lastBalancePhysical - grandTotalPhysical;
      const newBalanceNonPhysical = lastBalanceNonPhysical - grandTotalNonPhysical;

      if (newBalancePhysical < 0 || newBalanceNonPhysical < 0) {
        throw new Error("Saldo tidak boleh negatif setelah transaksi");
      }

      let overallPaymentMethod = 'physical';
      if (grandTotalPhysical > 0 && grandTotalNonPhysical > 0) {
        overallPaymentMethod = 'mixed';
      } else if (grandTotalNonPhysical > 0) {
        overallPaymentMethod = 'non-physical';
      }

      const cashflowDescription = purpose === 'replenish' 
        ? `Replenish stok - ${savedMarketList._id}`
        : `Belanja harian - ${savedMarketList._id}`;

      const cashflow = new CashFlow({
        date,
        day,
        description: cashflowDescription,
        cashOut: grandTotalPaid,
        cashOutPhysical: grandTotalPhysical,
        cashOutNonPhysical: grandTotalNonPhysical,
        balance: newBalance,
        balancePhysical: newBalancePhysical,
        balanceNonPhysical: newBalanceNonPhysical,
        destination: "Supplier",
        paymentMethod: overallPaymentMethod,
        relatedMarketList: savedMarketList._id,
        createdBy: user.username,
      });
      await cashflow.save({ session });
    }

    // Catat hutang untuk jumlah yang belum dibayar
    for (const item of processedItems) {
      const unpaidAmount = item.amountCharged - item.amountPaid;
      if (unpaidAmount > 0) {
        const debt = new Debt({
          date,
          supplierId: item.supplierId || null,
          supplierName: item.supplierName || "Unknown Supplier",
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantityPurchased,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          amount: unpaidAmount,
          paidAmount: item.amountPaid,
          paymentMethod: item.payment?.method || "cash",
          marketListId: savedMarketList._id,
          status: item.amountPaid > 0 ? 'partial' : 'unpaid',
          notes: purpose === 'replenish' ? `Hutang replenish - ${date}` : `Hutang belanja - ${date}`,
          createdBy: user.username,
        });
        await debt.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    const updatedBalance = await getLastBalance();

    const successMessage = purpose === 'replenish' 
      ? "Stok berhasil di-replenish."
      : "Belanja berhasil disimpan. Stok masuk, dan request otomatis terpenuhi jika ada referensi.";

    res.status(201).json({
      success: true,
      marketList: savedMarketList,
      cashBalance: updatedBalance.balance,
      physicalBalance: updatedBalance.balancePhysical,
      nonPhysicalBalance: updatedBalance.balanceNonPhysical,
      totalCharged,
      totalPaid,
      additionalTotal,
      grandTotal: totalCharged + additionalTotal,
      paymentBreakdown: {
        physical: grandTotalPhysical,
        nonPhysical: grandTotalNonPhysical
      },
      message: successMessage,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating market list:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Controller untuk mengedit transaksi marketlist
export const updateMarketList = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID transaksi tidak valid'
      });
    }

    // Cari transaksi yang akan diupdate
    const existingMarketList = await MarketList.findById(id);
    if (!existingMarketList) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi marketlist tidak ditemukan'
      });
    }

    // Update data
    const updatedMarketList = await MarketList.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        // Pastikan date di-update jika ada perubahan date
        ...(updateData.date && { date: new Date(updateData.date) })
      },
      { 
        new: true, // Mengembalikan dokumen yang sudah diupdate
        runValidators: true // Menjalankan validasi schema
      }
    ).populate('items.productId').populate('relatedRequests');

    res.status(200).json({
      success: true,
      message: 'Transaksi marketlist berhasil diupdate',
      data: updatedMarketList
    });

  } catch (error) {
    console.error('Error updating marketlist:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Controller untuk mengedit item tertentu dalam transaksi
export const updateMarketListItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const itemUpdateData = req.body;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'ID transaksi atau item tidak valid'
      });
    }

    // Cari transaksi
    const marketList = await MarketList.findById(id);
    if (!marketList) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi marketlist tidak ditemukan'
      });
    }

    // Cari item dalam transaksi
    const itemIndex = marketList.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan dalam transaksi'
      });
    }

    // Update item
    marketList.items[itemIndex] = {
      ...marketList.items[itemIndex].toObject(),
      ...itemUpdateData
    };

    // Simpan perubahan (middleware pre-save akan terpanggil)
    const updatedMarketList = await marketList.save();
    
    // Populate data yang diperlukan
    await updatedMarketList.populate('items.productId');
    await updatedMarketList.populate('relatedRequests');

    res.status(200).json({
      success: true,
      message: 'Item berhasil diupdate',
      data: updatedMarketList
    });

  } catch (error) {
    console.error('Error updating marketlist item:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Controller untuk mengedit pengeluaran tambahan
export const updateAdditionalExpense = async (req, res) => {
  try {
    const { id, expenseId } = req.params;
    const expenseUpdateData = req.body;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({
        success: false,
        message: 'ID transaksi atau pengeluaran tidak valid'
      });
    }

    // Cari transaksi
    const marketList = await MarketList.findById(id);
    if (!marketList) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi marketlist tidak ditemukan'
      });
    }

    // Cari pengeluaran tambahan
    const expenseIndex = marketList.additionalExpenses.findIndex(
      expense => expense._id.toString() === expenseId
    );

    if (expenseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Pengeluaran tambahan tidak ditemukan'
      });
    }

    // Update pengeluaran tambahan
    marketList.additionalExpenses[expenseIndex] = {
      ...marketList.additionalExpenses[expenseIndex].toObject(),
      ...expenseUpdateData
    };

    const updatedMarketList = await marketList.save();
    await updatedMarketList.populate('items.productId');
    await updatedMarketList.populate('relatedRequests');

    res.status(200).json({
      success: true,
      message: 'Pengeluaran tambahan berhasil diupdate',
      data: updatedMarketList
    });

  } catch (error) {
    console.error('Error updating additional expense:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Controller untuk partial update (PATCH) - hanya update field tertentu
export const partialUpdateMarketList = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID transaksi tidak valid'
      });
    }

    const existingMarketList = await MarketList.findById(id);
    if (!existingMarketList) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi marketlist tidak ditemukan'
      });
    }

    // Update hanya field yang ada dalam request body
    const updatedMarketList = await MarketList.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true,
        runValidators: true
      }
    ).populate('items.productId').populate('relatedRequests');

    res.status(200).json({
      success: true,
      message: 'Transaksi marketlist berhasil diupdate secara parsial',
      data: updatedMarketList
    });

  } catch (error) {
    console.error('Error partial updating marketlist:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Controller untuk menghapus transaksi marketlist
export const deleteMarketList = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { id } = req.params;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'ID transaksi tidak valid'
      });
    }

    // Cari transaksi yang akan dihapus
    const marketList = await MarketList.findById(id).session(session);
    if (!marketList) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Transaksi marketlist tidak ditemukan'
      });
    }

    // Cek status request terkait
    if (marketList.relatedRequests && marketList.relatedRequests.length > 0) {
      const relatedRequests = await Request.find({
        _id: { $in: marketList.relatedRequests }
      }).session(session);

      // Cek jika ada request yang sudah approve atau reject
      const blockedRequests = relatedRequests.filter(request => 
        request.status === 'approved' || request.status === 'rejected'
      );

      if (blockedRequests.length > 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Tidak dapat menghapus transaksi karena terdapat request yang sudah diapprove atau reject',
          blockedRequests: blockedRequests.map(req => ({
            id: req._id,
            status: req.status,
            requester: req.requester
          }))
        });
      }
    }

    // Hapus entri arus kas terkait
    await deleteRelatedCashFlow(marketList._id, session);

    // Update status request yang terkait (jika ada)
    await updateRelatedRequests(marketList.relatedRequests, session);

    // Hapus transaksi marketlist
    await MarketList.findByIdAndDelete(id).session(session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Transaksi marketlist berhasil dihapus',
      data: {
        deletedMarketList: marketList._id,
        deletedCashFlowEntries: true,
        updatedRequests: marketList.relatedRequests || []
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting marketlist:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Fungsi untuk menghapus entri arus kas terkait
const deleteRelatedCashFlow = async (marketListId, session) => {
  try {
    // Cari semua entri arus kas yang terkait dengan marketlist ini
    const relatedCashFlows = await CashFlow.find({ 
      relatedMarketList: marketListId 
    }).session(session);

    if (relatedCashFlows.length === 0) {
      return { deleted: 0, message: 'Tidak ada entri arus kas terkait' };
    }

    // Simpan informasi untuk recalculate balance
    const cashFlowDates = [...new Set(relatedCashFlows.map(cf => cf.date))].sort();
    const firstAffectedDate = cashFlowDates[0];

    // Hapus entri arus kas terkait
    const deleteResult = await CashFlow.deleteMany({ 
      relatedMarketList: marketListId 
    }).session(session);

    // Recalculate balance mulai dari tanggal pertama yang terpengaruh
    await recalculateCashFlowBalanceFromDate(firstAffectedDate, session);

    return { 
      deleted: deleteResult.deletedCount, 
      affectedDates: cashFlowDates 
    };

  } catch (error) {
    console.error('Error deleting related cash flow:', error);
    throw new Error(`Gagal menghapus entri arus kas: ${error.message}`);
  }
};

// Fungsi untuk recalculate balance arus kas mulai dari tanggal tertentu
const recalculateCashFlowBalanceFromDate = async (startDate, session) => {
  try {
    // Dapatkan saldo terakhir sebelum tanggal startDate
    const lastBalanceBefore = await CashFlow.findOne({
      date: { $lt: startDate }
    }).sort({ date: -1, createdAt: -1 }).session(session);

    let runningBalance = {
      balance: lastBalanceBefore ? Number(lastBalanceBefore.balance) || 0 : 0,
      balancePhysical: lastBalanceBefore ? Number(lastBalanceBefore.balancePhysical) || 0 : 0,
      balanceNonPhysical: lastBalanceBefore ? Number(lastBalanceBefore.balanceNonPhysical) || 0 : 0
    };

    // Dapatkan semua entri arus kas mulai dari startDate, diurutkan berdasarkan tanggal
    const cashFlowsFromDate = await CashFlow.find({
      date: { $gte: startDate }
    }).sort({ date: 1, createdAt: 1 }).session(session);

    // Recalculate balance untuk setiap entri
    for (const cashFlow of cashFlowsFromDate) {
      // Hitung saldo baru
      const cashIn = Number(cashFlow.cashIn) || 0;
      const cashOut = Number(cashFlow.cashOut) || 0;
      const cashInPhysical = Number(cashFlow.cashInPhysical) || 0;
      const cashOutPhysical = Number(cashFlow.cashOutPhysical) || 0;
      const cashInNonPhysical = Number(cashFlow.cashInNonPhysical) || 0;
      const cashOutNonPhysical = Number(cashFlow.cashOutNonPhysical) || 0;

      runningBalance.balance += (cashIn - cashOut);
      runningBalance.balancePhysical += (cashInPhysical - cashOutPhysical);
      runningBalance.balanceNonPhysical += (cashInNonPhysical - cashOutNonPhysical);

      // Pastikan saldo non-fisik tidak negatif
      runningBalance.balanceNonPhysical = Math.max(0, runningBalance.balanceNonPhysical);

      // Update entri arus kas dengan saldo yang baru
      await CashFlow.findByIdAndUpdate(
        cashFlow._id,
        {
          balance: runningBalance.balance,
          balancePhysical: runningBalance.balancePhysical,
          balanceNonPhysical: runningBalance.balanceNonPhysical
        },
        { session }
      );
    }

    return { 
      recalculatedEntries: cashFlowsFromDate.length,
      finalBalance: runningBalance 
    };

  } catch (error) {
    console.error('Error recalculating cash flow balance:', error);
    throw new Error(`Gagal recalculate balance arus kas: ${error.message}`);
  }
};

// Fungsi untuk update request yang terkait
const updateRelatedRequests = async (relatedRequestIds, session) => {
  if (!relatedRequestIds || relatedRequestIds.length === 0) {
    return { updated: 0 };
  }

  try {
    // Reset status fulfillment untuk request yang terkait
    const updateResult = await Request.updateMany(
      {
        _id: { $in: relatedRequestIds },
        status: 'pending' // Hanya update request yang masih pending
      },
      {
        $set: {
          fulfillmentStatus: 'pending',
          'transferItems.$[].status': 'pending',
          'transferItems.$[].fulfilledQuantity': 0,
          'purchaseItems.$[].status': 'pending',
          'purchaseItems.$[].fulfilledQuantity': 0,
          processedAt: null,
          processedBy: null
        }
      },
      { session }
    );

    return { updated: updateResult.modifiedCount };

  } catch (error) {
    console.error('Error updating related requests:', error);
    throw new Error(`Gagal update request terkait: ${error.message}`);
  }
};

// Controller untuk menghapus item tertentu dari marketlist
export const deleteMarketListItem = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { id, itemId } = req.params;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(itemId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'ID transaksi atau item tidak valid'
      });
    }

    // Cari transaksi
    const marketList = await MarketList.findById(id).session(session);
    if (!marketList) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Transaksi marketlist tidak ditemukan'
      });
    }

    // Cari item yang akan dihapus
    const itemToDelete = marketList.items.id(itemId);
    if (!itemToDelete) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan dalam transaksi'
      });
    }

    // Hapus entri arus kas terkait dengan item ini (jika ada pembayaran)
    if (itemToDelete.amountPaid > 0) {
      await deleteItemRelatedCashFlow(marketList._id, itemToDelete, session);
    }

    // Hapus item dari array
    marketList.items.pull({ _id: itemId });

    // Simpan perubahan
    const updatedMarketList = await marketList.save({ session });
    await updatedMarketList.populate('items.productId');
    await updatedMarketList.populate('relatedRequests');

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Item berhasil dihapus dari transaksi',
      data: {
        deletedItem: itemToDelete,
        updatedMarketList: updatedMarketList
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting marketlist item:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Fungsi untuk menghapus entri arus kas terkait item
const deleteItemRelatedCashFlow = async (marketListId, item, session) => {
  try {
    // Hapus entri arus kas yang terkait dengan item ini
    // Asumsi: description mengandung informasi tentang item
    const deleteResult = await CashFlow.deleteMany({
      relatedMarketList: marketListId,
      description: { $regex: item.productName, $options: 'i' }
    }).session(session);

    return { deleted: deleteResult.deletedCount };

  } catch (error) {
    console.error('Error deleting item related cash flow:', error);
    throw new Error(`Gagal menghapus entri arus kas item: ${error.message}`);
  }
};

// Controller untuk menghapus pengeluaran tambahan
export const deleteAdditionalExpense = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { id, expenseId } = req.params;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(expenseId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'ID transaksi atau pengeluaran tidak valid'
      });
    }

    // Cari transaksi
    const marketList = await MarketList.findById(id).session(session);
    if (!marketList) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Transaksi marketlist tidak ditemukan'
      });
    }

    // Cari pengeluaran tambahan yang akan dihapus
    const expenseToDelete = marketList.additionalExpenses.id(expenseId);
    if (!expenseToDelete) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Pengeluaran tambahan tidak ditemukan'
      });
    }

    // Hapus entri arus kas terkait dengan pengeluaran tambahan ini (jika ada pembayaran)
    if (expenseToDelete.amount > 0) {
      await deleteExpenseRelatedCashFlow(marketList._id, expenseToDelete, session);
    }

    // Hapus pengeluaran tambahan dari array
    marketList.additionalExpenses.pull({ _id: expenseId });

    // Simpan perubahan
    const updatedMarketList = await marketList.save({ session });
    await updatedMarketList.populate('items.productId');
    await updatedMarketList.populate('relatedRequests');

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Pengeluaran tambahan berhasil dihapus',
      data: {
        deletedExpense: expenseToDelete,
        updatedMarketList: updatedMarketList
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting additional expense:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Fungsi untuk menghapus entri arus kas terkait pengeluaran tambahan
const deleteExpenseRelatedCashFlow = async (marketListId, expense, session) => {
  try {
    // Hapus entri arus kas yang terkait dengan pengeluaran tambahan ini
    const deleteResult = await CashFlow.deleteMany({
      relatedMarketList: marketListId,
      description: { $regex: expense.name, $options: 'i' }
    }).session(session);

    return { deleted: deleteResult.deletedCount };

  } catch (error) {
    console.error('Error deleting expense related cash flow:', error);
    throw new Error(`Gagal menghapus entri arus kas pengeluaran: ${error.message}`);
  }
};


// Controller untuk mendapatkan semua data debts
export const getAllDebts = async (req, res) => {
  try {
    const { status, supplierId, startDate, endDate } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (supplierId) {
      query.supplierId = supplierId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const debts = await Debt.find(query)
      .populate('supplierId', 'name')
      .populate('productId', 'name sku')
      .sort({ date: -1 });

    res.status(200).json(debts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller untuk mendapatkan detail debt berdasarkan ID
export const getDebtById = async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id)
      .populate('supplierId', 'name')
      .populate('productId', 'name sku');

    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    res.status(200).json(debt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller untuk melakukan pembayaran debt
export const payDebt = async (req, res) => {
  try {
    const { paidAmount, paymentMethod, notes } = req.body;

    const debt = await Debt.findById(req.params.id);

    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    // Validasi jumlah pembayaran
    if (paidAmount <= 0) {
      return res.status(400).json({ message: 'Jumlah pembayaran harus lebih dari 0' });
    }

    if (paidAmount > (debt.amount - debt.paidAmount)) {
      return res.status(400).json({ message: 'Jumlah pembayaran melebihi sisa hutang' });
    }

    // Update data pembayaran
    debt.paidAmount += paidAmount;
    debt.paymentMethod = paymentMethod || debt.paymentMethod;
    debt.notes = notes || debt.notes;

    // Update status berdasarkan jumlah pembayaran
    if (debt.paidAmount === debt.amount) {
      debt.status = 'paid';
      debt.paidDate = new Date();
    } else if (debt.paidAmount > 0) {
      debt.status = 'partial';
    }

    const updatedDebt = await debt.save();
    res.status(200).json(updatedDebt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller untuk update data debt (selain pembayaran)
export const updateDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Pastikan paidAmount tidak diupdate melalui endpoint ini
    if ('paidAmount' in updateData) {
      return res.status(400).json({ message: 'Gunakan endpoint pembayaran untuk update paidAmount' });
    }

    const updatedDebt = await Debt.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedDebt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    res.status(200).json(updatedDebt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller untuk menghapus debt
export const deleteDebt = async (req, res) => {
  try {
    const deletedDebt = await Debt.findByIdAndDelete(req.params.id);

    if (!deletedDebt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    res.status(200).json({ message: 'Debt deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller untuk mendapatkan total hutang per supplier
export const getDebtSummaryBySupplier = async (req, res) => {
  try {
    // First validate all supplier references
    const invalidDebts = await Debt.find({
      supplierId: {
        $exists: true,
        $not: { $type: 'objectId' } // Find non-ObjectId values
      }
    });

    if (invalidDebts.length > 0) {
      console.warn(`Found ${invalidDebts.length} debts with invalid supplierId references`);
      // Optionally fix them here or report to admin
    }

    const summary = await Debt.aggregate([
      {
        $match: {
          status: { $in: ['unpaid', 'partial'] },
          supplierId: {
            $exists: true,
            $ne: null,
            $type: 'objectId' // Only proper ObjectIds
          }
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplierId',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      {
        $unwind: {
          path: '$supplier',
          preserveNullAndEmptyArrays: false // Exclude debts without valid suppliers
        }
      },
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplier.name' },
          totalDebt: { $sum: '$amount' },
          totalPaid: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $addFields: {
          remainingDebt: { $subtract: ['$totalDebt', '$totalPaid'] }
        }
      },
      {
        $sort: { remainingDebt: -1 }
      }
    ]);

    if (!summary.length) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada data hutang aktif untuk supplier yang valid.'
      });
    }

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error in getDebtSummaryBySupplier:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mengambil ringkasan hutang.',
      error: error.message
    });
  }
};

export const getUnpaidMarketLists = async (req, res) => {
  try {
    const unpaidLists = await MarketList.find({ 'payment.status': 'unpaid' }).sort({ date: -1 });

    res.status(200).json({
      message: 'Berhasil mengambil market list yang belum dibayar',
      data: unpaidLists
    });
  } catch (error) {
    console.error('Error saat mengambil data unpaid:', error);
    res.status(500).json({ message: 'Gagal mengambil data unpaid', error: error.message });
  }
};

export const payMarketList = async (req, res) => {
  try {
    const { id } = req.params;
    const { method, type, bankFrom, bankTo, recipientName, profofPayment, notes } = req.body;

    if (!method || !type) {
      return res.status(400).json({ message: 'Tipe dan metode pembayaran wajib diisi' });
    }

    const update = {
      'payment.method': method,
      'payment.type': type,
      'payment.status': 'paid',
      'payment.notes': notes || '',
    };

    // Tambahkan informasi bank jika tipe online
    if (type === 'online') {
      update['payment.bankFrom'] = bankFrom;
      update['payment.bankTo'] = bankTo;
      update['payment.recipientName'] = recipientName;
      update['payment.profofPayment'] = profofPayment;
    }

    const updatedList = await MarketList.findByIdAndUpdate(id, { $set: update }, { new: true });

    if (!updatedList) {
      return res.status(404).json({ message: 'Market list tidak ditemukan' });
    }

    res.status(200).json({
      message: 'Pembayaran berhasil disimpan',
      data: updatedList
    });
  } catch (error) {
    console.error('Error saat membayar market list:', error);
    res.status(500).json({ message: 'Gagal membayar market list', error: error.message });
  }
};

// Lihat catatan cashflow (semua role bisa lihat jika login)
export const getCashFlow = async (req, res) => {
  try {
    const cashFlow = await CashFlow.find().sort({ date: -1 }).populate('relatedMarketList');
    res.json(cashFlow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addCashIn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      date,
      description,
      cashIn,
      cashInPhysical,
      cashInNonPhysical,
      source,
      destination,
      proof
    } = req.body;
    
    // Validasi input dasar
    if (!date || !description) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Tanggal dan deskripsi harus diisi'
      });
    }

    // Parse dan validasi nilai numerik
    const cashInValue = parseFloat(cashIn) || 0;
    const cashInPhysicalValue = parseFloat(cashInPhysical) || 0;
    const cashInNonPhysicalValue = parseFloat(cashInNonPhysical) || 0;

    if (cashInValue <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Jumlah kas masuk harus lebih dari 0'
      });
    }

    // Validasi konsistensi jumlah
    const totalIn = cashInPhysicalValue + cashInNonPhysicalValue;
    if (Math.abs(totalIn - cashInValue) > 0.01) { // Tolerance for floating point
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Total cashInPhysical + cashInNonPhysical harus sama dengan cashIn'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      await session.abortTransaction();
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }

    const day = getDayName(date);
    
    // Ambil saldo terakhir dengan validasi
    const lastBalance = await getLastBalance();
    
    // Pastikan semua nilai balance valid
    const lastBalanceValue = Number(lastBalance.balance) || 0;
    const lastBalancePhysical = Number(lastBalance.balancePhysical) || 0;
    const lastBalanceNonPhysical = Number(lastBalance.balanceNonPhysical) || 0;

    // Hitung saldo baru dengan validasi
    const newBalance = lastBalanceValue + cashInValue;
    const newBalancePhysical = lastBalancePhysical + cashInPhysicalValue;
    const newBalanceNonPhysical = lastBalanceNonPhysical + cashInNonPhysicalValue;

    // Final validation - pastikan tidak ada NaN
    if (isNaN(newBalance) || isNaN(newBalancePhysical) || isNaN(newBalanceNonPhysical)) {
      await session.abortTransaction();
      console.error('NaN detected in balance calculation:', {
        lastBalance,
        cashInValue,
        cashInPhysicalValue,
        cashInNonPhysicalValue
      });
      return res.status(500).json({ 
        message: 'Terjadi kesalahan dalam perhitungan saldo' 
      });
    }

    // Tentukan payment method
    let paymentMethod = 'physical';
    if (cashInPhysicalValue > 0 && cashInNonPhysicalValue > 0) {
      paymentMethod = 'mixed';
    } else if (cashInNonPhysicalValue > 0) {
      paymentMethod = 'non-physical';
    }

    // Simpan ke database
    const cashFlow = new CashFlow({
      day,
      date: new Date(date),
      description,
      cashIn: cashInValue,
      cashInPhysical: cashInPhysicalValue,
      cashInNonPhysical: cashInNonPhysicalValue,
      cashOut: 0,
      cashOutPhysical: 0,
      cashOutNonPhysical: 0,
      balance: newBalance,
      balancePhysical: newBalancePhysical,
      balanceNonPhysical: newBalanceNonPhysical,
      source: source || '',
      destination: destination || '',
      paymentMethod,
      proof: proof || '',
      createdBy: user.username
    });

    await cashFlow.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Kas masuk berhasil dicatat',
      data: cashFlow
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error menambahkan kas masuk:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  } finally {
    session.endSession();
  }
};

export const withdrawCash = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      date,
      description,
      amount,
      destination,
      proof
    } = req.body;
    
    // Validasi input
    if (!date || !description) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Tanggal dan deskripsi harus diisi'
      });
    }

    const amountValue = parseFloat(amount) || 0;
    if (amountValue <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Jumlah penarikan harus lebih dari 0'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      await session.abortTransaction();
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }

    const day = getDayName(date);
    
    // Ambil saldo terakhir dengan validasi
    const lastBalance = await getLastBalance();
    
    // Pastikan semua nilai balance valid
    const lastBalanceValue = Number(lastBalance.balance) || 0;
    const lastBalancePhysical = Number(lastBalance.balancePhysical) || 0;
    const lastBalanceNonPhysical = Number(lastBalance.balanceNonPhysical) || 0;
    
    // Validasi saldo non-fisik mencukupi
    if (lastBalanceNonPhysical < amountValue) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Saldo non-fisik tidak mencukupi. Dibutuhkan: ${amountValue}, Tersedia: ${lastBalanceNonPhysical}`
      });
    }

    // Hitung saldo baru (perpindahan dari non-fisik ke fisik)
    const newBalance = lastBalanceValue; // Total balance tetap
    const newBalancePhysical = lastBalancePhysical + amountValue;
    const newBalanceNonPhysical = lastBalanceNonPhysical - amountValue;

    // Final validation - pastikan tidak ada NaN
    if (isNaN(newBalance) || isNaN(newBalancePhysical) || isNaN(newBalanceNonPhysical)) {
      await session.abortTransaction();
      console.error('NaN detected in balance calculation:', {
        lastBalance,
        amountValue
      });
      return res.status(500).json({ 
        message: 'Terjadi kesalahan dalam perhitungan saldo' 
      });
    }

    // Simpan transaksi penarikan tunai
    const cashFlow = new CashFlow({
      day,
      date: new Date(date),
      description: `Penarikan Tunai: ${description}`,
      cashIn: 0,
      cashInPhysical: 0,
      cashInNonPhysical: 0,
      cashOut: 0, // Tidak ada pengurangan total
      cashOutPhysical: 0,
      cashOutNonPhysical: 0,
      balance: newBalance,
      balancePhysical: newBalancePhysical,
      balanceNonPhysical: newBalanceNonPhysical,
      source: 'Penarikan Tunai',
      destination: destination || '',
      paymentMethod: 'mixed',
      proof: proof || '',
      createdBy: user.username
    });

    await cashFlow.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Penarikan tunai berhasil dicatat',
      data: cashFlow
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error melakukan penarikan tunai:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  } finally {
    session.endSession();
  }
};

// GET /api/marketlist/cashflow?start=YYYY-MM-DD&end=YYYY-MM-DD
export const getFilteredCashFlow = async (req, res) => {
  try {
    const { start, end } = req.query;
    const filters = {};

    if (start && end) {
      filters.date = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    const cashFlows = await CashFlow.find(filters).sort({ date: -1 }).populate('relatedMarketList');
    res.json(cashFlows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/marketlist/cashflow/weekly-report?start=YYYY-MM-DD&end=YYYY-MM-DD
export const getWeeklyReport = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Ambil entri terakhir SEBELUM periode (sebelum startDate)
    const lastBeforeStart = await CashFlow.findOne({
      date: { $lt: startDate }
    }).sort({ date: -1, createdAt: -1 });

    // Tentukan saldo awal berdasarkan entri terakhir sebelum periode
    const startingBalance = lastBeforeStart ? Number(lastBeforeStart.balance) || 0 : 0;
    const startingPhysical = lastBeforeStart ? Number(lastBeforeStart.balancePhysical) || 0 : 0;
    const startingNonPhysical = lastBeforeStart ? Number(lastBeforeStart.balanceNonPhysical) || 0 : 0;

    // Ambil transaksi dalam periode
    const periodCashFlows = await CashFlow.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1, createdAt: 1 }); // Urutkan juga berdasarkan createdAt untuk kepastian urutan

    // Inisialisasi hasil
    const result = {
      summary: {
        period: { start, end },
        startingBalance,
        startingPhysical,
        startingNonPhysical,
        physical: { in: 0, out: 0, balance: startingPhysical },
        nonPhysical: { in: 0, out: 0, balance: startingNonPhysical },
        totalIn: 0,
        totalOut: 0,
        endingBalance: startingBalance,
        endingPhysical: startingPhysical,
        endingNonPhysical: startingNonPhysical
      },
      transactions: {
        physical: [],
        nonPhysical: [],
        mixed: [],
        all: []
      }
    };

    // Gunakan saldo awal sebagai titik awal
    let currentBalance = startingBalance;
    let currentPhysical = startingPhysical;
    let currentNonPhysical = startingNonPhysical;

    for (const flow of periodCashFlows) {
      // Gunakan nilai yang tersimpan di database sebagai saldo akhir transaksi ini
      const transaction = {
        _id: flow._id,
        date: flow.date,
        day: flow.day,
        description: flow.description,
        cashIn: flow.cashIn,
        cashOut: flow.cashOut,
        balance: flow.balance,
        cashInPhysical: flow.cashInPhysical,
        cashOutPhysical: flow.cashOutPhysical,
        balancePhysical: flow.balancePhysical,
        cashInNonPhysical: flow.cashInNonPhysical,
        cashOutNonPhysical: flow.cashOutNonPhysical,
        balanceNonPhysical: flow.balanceNonPhysical,
        paymentMethod: flow.paymentMethod,
        source: flow.source,
        destination: flow.destination,
        createdBy: flow.createdBy,
        proof: flow.proof,
        relatedMarketList: flow.relatedMarketList
      };

      // Akumulasi total berdasarkan paymentMethod
      if (flow.paymentMethod === 'physical') {
        result.summary.physical.in += flow.cashIn;
        result.summary.physical.out += flow.cashOut;
        result.transactions.physical.push(transaction);
      } else if (flow.paymentMethod === 'non-physical') {
        result.summary.nonPhysical.in += flow.cashIn;
        result.summary.nonPhysical.out += flow.cashOut;
        result.transactions.nonPhysical.push(transaction);
      } else if (flow.paymentMethod === 'mixed') {
        // Untuk mixed, gunakan nilai fisik & non-fisik secara terpisah
        result.summary.physical.in += flow.cashInPhysical;
        result.summary.physical.out += flow.cashOutPhysical;
        result.summary.nonPhysical.in += flow.cashInNonPhysical;
        result.summary.nonPhysical.out += flow.cashOutNonPhysical;
        result.transactions.mixed.push(transaction);
      }

      result.transactions.all.push(transaction);
      result.summary.totalIn += flow.cashIn;
      result.summary.totalOut += flow.cashOut;
    }

    // Ambil saldo akhir dari transaksi terakhir dalam periode
    if (periodCashFlows.length > 0) {
      const lastInPeriod = periodCashFlows[periodCashFlows.length - 1];
      result.summary.endingBalance = Number(lastInPeriod.balance) || 0;
      result.summary.endingPhysical = Number(lastInPeriod.balancePhysical) || 0;
      result.summary.endingNonPhysical = Number(lastInPeriod.balanceNonPhysical) || 0;
    } else {
      // Jika tidak ada transaksi dalam periode, saldo akhir = saldo awal
      result.summary.endingBalance = startingBalance;
      result.summary.endingPhysical = startingPhysical;
      result.summary.endingNonPhysical = startingNonPhysical;
    }

    // Update balance di summary
    result.summary.physical.balance = result.summary.endingPhysical;
    result.summary.nonPhysical.balance = result.summary.endingNonPhysical;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

// Fungsi untuk mendapatkan saldo terakhir
export const getLastBalance = async () => {
  try {
    const lastEntry = await CashFlow.findOne().sort({ date: -1, createdAt: -1 });
    
    if (!lastEntry) {
      console.log('No previous cashflow entry found, using default balances');
      return { 
        balance: 0, 
        balancePhysical: 0, 
        balanceNonPhysical: 0 
      };
    }

    // Validasi ketat untuk memastikan tidak ada NaN
    const balance = Number(lastEntry.balance);
    const balancePhysical = Number(lastEntry.balancePhysical);
    const balanceNonPhysical = Number(lastEntry.balanceNonPhysical);

    // Jika ada nilai yang invalid, gunakan default 0
    const result = {
      balance: isNaN(balance) ? 0 : balance,
      balancePhysical: isNaN(balancePhysical) ? 0 : balancePhysical,
      balanceNonPhysical: isNaN(balanceNonPhysical) ? 0 : balanceNonPhysical
    };

    
    return result;

  } catch (error) {
    console.error("Error getting last balance:", error);
    return { 
      balance: 0, 
      balancePhysical: 0, 
      balanceNonPhysical: 0 
    };
  }
};

export const getBalanceSummary = async (req, res) => {
  try {
    const lastBalance = await getLastBalance();

    res.json({
      totalBalance: lastBalance.balance,
      physicalBalance: lastBalance.balancePhysical,
      nonPhysicalBalance: lastBalance.balanceNonPhysical,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error('Error mendapatkan summary saldo:', error);
    res.status(500).json({ message: error.message });
  }
};


export const getMarketListReportByDate = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Parameter "start" dan "end" harus diisi (YYYY-MM-DD).' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999); // Sertakan semua data hingga akhir hari

    const data = await MarketList.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    res.status(200).json(data);
  } catch (err) {
    console.error('Gagal mengambil laporan:', err);
    next(err);
  }
};