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
    
    // Variabel untuk tracking pembayaran berdasarkan metode
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
            // Cash = semua fisik
            itemPhysical = amountPaid;
            itemNonPhysical = 0;
            break;
          case 'card':
          case 'transfer':
            // Card/Transfer = semua non-fisik
            itemPhysical = 0;
            itemNonPhysical = amountPaid;
            break;
          case 'mixed':
            // Mixed = gunakan amountPhysical dan amountNonPhysical dari item
            itemPhysical = parseFloat(item.payment.amountPhysical) || 0;
            itemNonPhysical = parseFloat(item.payment.amountNonPhysical) || 0;
            
            if (itemPhysical + itemNonPhysical !== amountPaid) {
              throw new Error(`Untuk metode pembayaran mixed, total amountPhysical + amountNonPhysical harus sama dengan amountPaid untuk produk ${item.productName}`);
            }
            break;
          default:
            // Default = semua fisik
            itemPhysical = amountPaid;
            itemNonPhysical = 0;
        }
      } else {
        // Default jika tidak ada payment method
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
        paymentMethod: item.payment?.method || 'cash',
        amountPhysical: itemPhysical,
        amountNonPhysical: itemNonPhysical,
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

      // Tentukan pembagian fisik/non-fisik untuk pengeluaran tambahan
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

    // TOTAL KESELURUHAN (belanja + pengeluaran tambahan)
    const grandTotalPhysical = totalPhysical + additionalPhysical;
    const grandTotalNonPhysical = totalNonPhysical + additionalNonPhysical;
    const grandTotalPaid = totalPaid + additionalTotal;

    // Validasi saldo cukup sebelum transaksi
    const lastBalance = await getLastBalance();
    
    // Pastikan nilai balance valid
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
          const newFulfilled = (parseFloat(itemToUpdate.fulfilledQuantity) || 0) + item.quantityPurchased;
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
          const isFullyFulfilled = allItems.every(i => (parseFloat(i.fulfilledQuantity) || 0) >= i.quantity);
          const hasPartial = allItems.some(i => (parseFloat(i.fulfilledQuantity) || 0) > 0);

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
      const isFullyFulfilled = allItems.every(i => (parseFloat(i.fulfilledQuantity) || 0) >= i.quantity);
      const hasPartial = allItems.some(i => (parseFloat(i.fulfilledQuantity) || 0) > 0);

      request.fulfillmentStatus = isFullyFulfilled ? "fulfilled" : hasPartial ? "partial" : "pending";
      await request.save({ session });
    }

    // Catat cashflow dengan pembagian fisik/non-fisik
    if (totalPaid > 0 || additionalTotal > 0) {
      // Hitung saldo baru dengan memastikan tidak ada NaN
      const lastBalanceTotal = parseFloat(lastBalance.balance) || 0;
      const newBalance = lastBalanceTotal - grandTotalPaid;
      
      const newBalancePhysical = lastBalancePhysical - grandTotalPhysical;
      const newBalanceNonPhysical = lastBalanceNonPhysical - grandTotalNonPhysical;

      // Validasi saldo tidak negatif (jika perlu)
      if (newBalancePhysical < 0 || newBalanceNonPhysical < 0) {
        throw new Error("Saldo tidak boleh negatif setelah transaksi");
      }

      // Tentukan metode pembayaran overall
      let overallPaymentMethod = 'physical';
      if (grandTotalPhysical > 0 && grandTotalNonPhysical > 0) {
        overallPaymentMethod = 'mixed';
      } else if (grandTotalNonPhysical > 0) {
        overallPaymentMethod = 'non-physical';
      }

      const cashflow = new CashFlow({
        date,
        day,
        description: `Belanja harian - ${savedMarketList._id}`,
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
          notes: `Hutang belanja - ${date}`,
          createdBy: user.username,
        });
        await debt.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Dapatkan saldo terbaru setelah transaksi
    const updatedBalance = await getLastBalance();

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