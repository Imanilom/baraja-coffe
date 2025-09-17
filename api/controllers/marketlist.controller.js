// controllers/marketlistController.js
import MarketList from '../models/modul_market/MarketList.model.js';
import Request from '../models/modul_market/Request.model.js';
import Warehouse from '../models/modul_market/Warehouse.model.js';
import Product from '../models/modul_market/Product.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import CashFlow from '../models/modul_market/CashFlow.model.js';
import Debt from '../models/modul_market/Debt.model.js';
import User from '../models/user.model.js';
import { getDayName } from '../services/getDay.js';
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

      const { department, items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Items wajib diisi' });
      }

      const requestItems = [];
      
      for (const item of items) {
        const { productId, quantity, notes } = item;
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
        const stockDoc = await ProductStock.findOne({ 
          productId, 
          category: 'Gudang Pusat' 
        }).session(session);
        
        const availableStock = stockDoc ? stockDoc.currentStock : 0;

        requestItems.push({
          productId,
          productName: productDoc.name,
          productSku: productDoc.sku,
          category: productDoc.category,
          quantity,
          unit: productDoc.unit,
          notes: notes || '',
          status: 'pending',
          fulfilledQuantity: 0,
          availableStock, // untuk reference
          minimumRequest: productDoc.minimumrequest
        });
      }

      // Buat request tanpa mengubah stok dulu
      const newRequest = new Request({
        department,
        requester: user.username,
        items: requestItems,
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
export const approveRequestItems = async (req, res) => {
  try {
    const { requestId, items, reviewedBy } = req.body;

    if (!requestId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Request ID dan daftar item harus disediakan' });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    // Validasi dan update status item
    for (const updatedItem of items) {
      const item = request.items.id(updatedItem.itemId);
      if (!item) continue; // Lewati jika item tidak ditemukan

      if (updatedItem.status) item.status = updatedItem.status;
      if (updatedItem.fulfilledQuantity !== undefined) item.fulfilledQuantity = updatedItem.fulfilledQuantity;

      // Jika status "dibeli", isi fulfilledQuantity otomatis jika belum ada
      if (updatedItem.status === 'dibeli' && item.fulfilledQuantity === undefined) {
        item.fulfilledQuantity = item.quantity;
      }

      // Jika status "tidak tersedia", set fulfilledQuantity ke 0
      if (updatedItem.status === 'tidak tersedia') {
        item.fulfilledQuantity = 0;
      }
    }

    // Tandai bahwa request sudah direview
    request.reviewed = true;
    request.reviewedBy = reviewedBy || 'anonymous';
    request.reviewedAt = new Date();
    request.status = 'approved'; // Set status ke approved
    request.fulfillmentStatus='dibeli';

    await request.save();

    res.status(200).json({ message: 'Request berhasil direview', request });
  } catch (error) {
    console.error('Gagal mereview request:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mereview request' });
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

    const { date, items = [], additionalExpenses = [] } = req.body;
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

    for (const item of items) {
      if (!item.warehouse) {
        throw new Error(`Warehouse wajib diisi untuk produk ${item.productName}`);
      }

      const amountCharged = item.quantityPurchased * item.pricePerUnit;
      const amountPaid = item.amountPaid || 0;

      if (amountPaid > amountCharged) {
        throw new Error(`Jumlah dibayar tidak boleh lebih besar dari jumlah yang dibebankan untuk produk ${item.productName}`);
      }

      processedItems.push({
        ...item,
        amountCharged,
        amountPaid,
        remainingBalance: Math.max(0, amountCharged - amountPaid),
      });

      totalCharged += amountCharged;
      totalPaid += amountPaid;

      if (item.requestId) relatedRequestIds.add(item.requestId);
    }

    const marketListDoc = new MarketList({
      date,
      day,
      items: processedItems,
      additionalExpenses,
      relatedRequests: Array.from(relatedRequestIds),
      createdBy: user.username,
    });

    const savedMarketList = await marketListDoc.save({ session });

    // Update stok produk
    const productStockUpdates = [];
    for (const item of processedItems) {
      const purchaseMovement = {
        quantity: item.quantityPurchased,
        type: "in",
        referenceId: savedMarketList._id,
        notes: `Pembelian oleh ${user.username}`,
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

      // Jika item ini untuk memenuhi request, update request item
      if (item.requestId && item.requestItemId) {
        const request = await Request.findById(item.requestId).session(session);
        if (!request) continue;

        // Cari di transferItems atau purchaseItems
        let targetArray = null;
        let itemToUpdate = null;

        if (request.transferItems.id(item.requestItemId)) {
          targetArray = 'transferItems';
          itemToUpdate = request.transferItems.id(item.requestItemId);
        } else if (request.purchaseItems.id(item.requestItemId)) {
          targetArray = 'purchaseItems';
          itemToUpdate = request.purchaseItems.id(item.requestItemId);
        }

        if (itemToUpdate) {
          // Tambahkan fulfilled quantity
          const newFulfilled = itemToUpdate.fulfilledQuantity + item.quantityPurchased;
          const finalFulfilled = Math.min(newFulfilled, itemToUpdate.quantity); // jangan melebihi permintaan

          itemToUpdate.fulfilledQuantity = finalFulfilled;
          itemToUpdate.processedAt = new Date(date);
          itemToUpdate.processedBy = user.username;

          if (finalFulfilled >= itemToUpdate.quantity) {
            itemToUpdate.status = "fulfilled";
          } else {
            itemToUpdate.status = "partial";
          }

          // Update fulfillmentStatus request
          const allItems = [...request.transferItems, ...request.purchaseItems];
          const isFullyFulfilled = allItems.every(i => i.fulfilledQuantity >= i.quantity);
          const hasPartial = allItems.some(i => i.fulfilledQuantity > 0);

          request.fulfillmentStatus = isFullyFulfilled ? "fulfilled" : hasPartial ? "partial" : "pending";
          await request.save({ session });
        }
      }
    }

    if (productStockUpdates.length > 0) {
      await ProductStock.bulkWrite(productStockUpdates, { session });
    }

    // Update status request overall (jika belum fully fulfilled)
    for (const requestId of relatedRequestIds) {
      const request = await Request.findById(requestId).session(session);
      if (!request) continue;

      const allItems = [...request.transferItems, ...request.purchaseItems];
      const isFullyFulfilled = allItems.every(i => i.fulfilledQuantity >= i.quantity);
      const hasPartial = allItems.some(i => i.fulfilledQuantity > 0);

      request.fulfillmentStatus = isFullyFulfilled ? "fulfilled" : hasPartial ? "partial" : "pending";
      await request.save({ session });
    }

    // Catat cashflow & hutang (opsional, sesuai kebutuhan)
    const lastBalance = await getLastBalance(); // ← pastikan fungsi ini ada
    let newBalance = lastBalance;

    if (totalPaid > 0) {
      const cashflow = new CashFlow({
        date,
        day,
        description: `Belanja harian - ${savedMarketList._id}`,
        cashOut: totalPaid,
        balance: lastBalance - totalPaid,
        destination: "Supplier",
        relatedMarketList: savedMarketList._id,
        createdBy: user.username,
      });
      await cashflow.save({ session });
      newBalance = lastBalance - totalPaid;
    }

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
          paymentMethod: item.paymentMethod || "cash",
          marketListId: savedMarketList._id,
          status: item.amountPaid > 0 ? 'partial' : 'unpaid',
          notes: `Hutang belanja - ${date}`,
          createdBy: user.username,
        });
        await debt.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      marketList: savedMarketList,
      cashBalance: newBalance,
      totalCharged,
      totalPaid,
      message: "Belanja berhasil disimpan. Stok masuk, dan request otomatis terpenuhi jika ada referensi.",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating market list:", error);
    res.status(500).json({ success: false, message: error.message });
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
  try {
    const { date, description, cashIn, source, destination, proof} = req.body;
    const day = getDayName(date);
    // Validasi input
    if (!day || !date || !description || typeof cashIn !== 'number' || cashIn <= 0) {
      return res.status(400).json({
        message: 'Semua field harus diisi dan jumlah kas masuk harus > 0'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }

    // Ambil saldo terakhir
    const lastBalance = await getLastBalance();
    const newBalance = lastBalance + cashIn;

    // Simpan ke database
    const cashFlow = new CashFlow({
      day,
      date,
      description,
      cashIn,
      cashOut: 0,
      balance: newBalance,
      source,
      destination,
      proof,
      createdBy: user.username
    });

    await cashFlow.save();

    res.status(201).json(cashFlow);

  } catch (error) {
    console.error('Error menambahkan kas masuk:', error);
    res.status(500).json({ message: error.message });
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

    // Get cash flows with populated market lists
    const cashFlows = await CashFlow.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'relatedMarketList',
      populate: {
        path: 'items additionalExpenses',
        select: 'productName quantityPurchased pricePerUnit paymentMethod paymentStatus name amount'
      }
    }).sort({ date: 1 });

    // Calculate starting balance (sum of all transactions before start date)
    const initialFlows = await CashFlow.find({ date: { $lt: startDate } });
    const startingBalance = initialFlows.reduce((sum, f) => sum + (f.cashIn - f.cashOut), 0);

    // Initialize categorized data
    const result = {
      summary: {
        startingBalance,
        cash: { in: 0, out: 0, balance: 0 },
        transfer: { in: 0, out: 0, balance: 0 },
        credit: { in: 0, out: 0, balance: 0 },
        totalIn: 0,
        totalOut: 0,
        endingBalance: startingBalance
      },
      transactions: {
        cash: [],
        transfer: [],
        credit: [],
        all: []
      }
    };

    let currentBalance = startingBalance;

    // Process each cash flow
    for (const flow of cashFlows) {
      currentBalance += flow.cashIn - flow.cashOut;
      
      // Determine payment method from related market list
      let paymentMethod = 'cash'; // default
      if (flow.relatedMarketList) {
        // Check items for payment methods
        const methods = flow.relatedMarketList.items.map(i => i.paymentMethod);
        if (methods.includes('transfer')) paymentMethod = 'transfer';
        if (methods.includes('credit')) paymentMethod = 'credit';
      }

      // Build transaction object
      const transaction = {
        date: flow.date,
        day: flow.day,
        description: flow.description,
        cashIn: flow.cashIn,
        cashOut: flow.cashOut,
        balance: currentBalance,
        paymentMethod,
        purchasedItems: flow.relatedMarketList?.items?.map(item => ({
          name: item.productName,
          quantity: item.quantityPurchased,
          price: item.pricePerUnit,
          total: item.quantityPurchased * item.pricePerUnit,
          paymentMethod: item.paymentMethod,
          paymentStatus: item.paymentStatus
        })) || [],
        additionalExpenses: flow.relatedMarketList?.additionalExpenses || []
      };

      // Categorize by payment method
      if (paymentMethod === 'cash') {
        result.summary.cash.in += flow.cashIn;
        result.summary.cash.out += flow.cashOut;
        result.transactions.cash.push(transaction);
      } 
      else if (paymentMethod === 'transfer') {
        result.summary.transfer.in += flow.cashIn;
        result.summary.transfer.out += flow.cashOut;
        result.transactions.transfer.push(transaction);
      } 
      else if (paymentMethod === 'credit') {
        result.summary.credit.in += flow.cashIn;
        result.summary.credit.out += flow.cashOut;
        result.transactions.credit.push(transaction);
      }

      result.transactions.all.push(transaction);
      result.summary.totalIn += flow.cashIn;
      result.summary.totalOut += flow.cashOut;
    }

    // Calculate final balances
    result.summary.endingBalance = currentBalance;
    result.summary.cash.balance = result.summary.cash.in - result.summary.cash.out;
    result.summary.transfer.balance = result.summary.transfer.in - result.summary.transfer.out;
    result.summary.credit.balance = result.summary.credit.in - result.summary.credit.out;
    
    res.json({
      success: true,
      data: {
        start,
        end,
        ...result
      }
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

const getLastBalance = async () => {
  const lastEntry = await CashFlow.findOne().sort({ date: -1 });
  return lastEntry ? lastEntry.balance : 0;
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