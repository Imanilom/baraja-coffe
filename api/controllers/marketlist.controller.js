// controllers/marketlistController.js
import MarketList from '../models/modul_market/MarketList.model.js';
import Request from '../models/modul_market/Request.model.js';
import Product from '../models/modul_market/Product.model.js';
import CashFlow from '../models/modul_market/CashFlow.model.js';
import Debt from '../models/modul_market/Debt.model.js';
import User from '../models/user.model.js';
import { getDayName } from '../services/getDay.js';
import mongoose from 'mongoose';


export const createRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !['staff', 'admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const { department, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items wajib diisi' });
    }

    const newRequest = new Request({
      department,
      requester: user.username,
      items: items.map(item => ({
        ...item,
        status: item.status || 'pending',
        fulfilledQuantity: item.fulfilledQuantity || 0
      }))
    });

    await newRequest.save();

    res.status(201).json({
      message: 'Request berhasil dibuat.',
      data: newRequest
    });

  } catch (error) {
    console.error('Error saat membuat request:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

// Ambil semua request (hanya untuk role inventory)
export const getAllRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !['staff', 'inventory', 'admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ message: 'Hanya petugas belanja yang bisa melihat request' });
    }

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


export const getAllRequestWithSuppliers = async (req, res) => {
  try {
    // Ambil semua request dan populate produk
    const requests = await Request.find()
      .populate('items.productId')
      .lean();

    // Buat mapping produkId -> daftar supplier dari koleksi Product
    const productIds = requests.flatMap(r => r.items.map(i => i.productId._id));
    const uniqueProductIds = [...new Set(productIds.map(id => id.toString()))];

    const products = await Product.find({ _id: { $in: uniqueProductIds } }).lean();

    // Buat mapping productId -> suppliers
    const productSupplierMap = {};
    products.forEach(product => {
      productSupplierMap[product._id.toString()] = product.suppliers || [];
    });

    // Tambahkan daftar supplier ke setiap item
    const enrichedRequests = requests.map(req => ({
      ...req,
      items: req.items.map(item => ({
        ...item,
        suppliers: productSupplierMap[item.productId?._id?.toString()] || []
      }))
    }));

    res.status(200).json({ success: true, data: enrichedRequests });
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

    await request.save();

    res.status(200).json({ message: 'Request berhasil direview', request });
  } catch (error) {
    console.error('Gagal mereview request:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mereview request' });
  }
};

// Tolak seluruh request
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

  // Input belanja harian berdasarkan request
export const createMarketList = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user._id).session(session);
    if (!user || user.role !== 'inventory') {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Hanya petugas belanja yang bisa mencatat belanja' });
    }

    const { date, items = [], additionalExpenses = [], payment } = req.body;

    // Validasi dasar
    if (!date) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Tanggal belanja harus diisi' });
    }

    if (items.length === 0 && additionalExpenses.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Harus ada setidaknya satu item atau pengeluaran tambahan' });
    }

    const day = new Date(date).toLocaleDateString('id-ID', { weekday: 'long' });

    // Proses item belanja
    const processedItems = [];
    const debtsToCreate = [];
    const relatedRequestIds = new Set();
    let totalCharged = 0;
    let totalPaid = 0;

    for (const item of items) {
      // Validasi item
      if (!item.productId || !item.productName || !item.productSku || !item.category || !item.unit ||
          item.quantityPurchased <= 0 || item.pricePerUnit <= 0 || !item.supplierName) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Data tidak valid pada item ${item.productName}` });
      }

      // Jika item berasal dari request, tambahkan requestId ke relatedRequestIds
      if (item.requestId) {
        relatedRequestIds.add(item.requestId);
      }

      const amountCharged = item.quantityPurchased * item.pricePerUnit;
      const amountPaid = item.amountPaid || 0;
      const remainingBalance = Math.max(0, amountCharged - amountPaid);
      
      let paymentStatus = 'unpaid';
      if (amountPaid >= amountCharged) {
        paymentStatus = 'paid';
      } else if (amountPaid > 0) {
        paymentStatus = 'partial';
      }

      processedItems.push({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        category: item.category,
        unit: item.unit,
        quantityRequested: item.quantityRequested || 0,
        quantityPurchased: item.quantityPurchased,
        pricePerUnit: item.pricePerUnit,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        amountCharged,
        amountPaid,
        remainingBalance,
        paymentMethod: item.paymentMethod || 'cash',
        paymentStatus,
        proofOfPayment: item.proofOfPayment || '',
        department: item.department || '',
        requestId: item.requestId || null,
        requestItemId: item.requestItemId || null
      });

      totalCharged += amountCharged;
      totalPaid += amountPaid;

      if (remainingBalance > 0) {
        debtsToCreate.push({
          date: new Date(date),
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantityPurchased,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          amount: remainingBalance,
          paymentMethod: item.paymentMethod || 'cash',
          marketListId: null,
          status: 'unpaid',
          notes: `Pembelian ${item.productName} (${item.productSku}) pada ${date}`,
          createdBy: user.username
        });
      }
    }

    // Update status request yang terkait
    for (const requestId of relatedRequestIds) {
      const request = await Request.findById(requestId).session(session);
      if (!request) continue;

      let allItemsFulfilled = true;
      let anyItemUnavailable = false;
      let anyItemShort = false;

      // Update each item in the request
      for (const requestItem of request.items) {
        // Find matching purchased item
        const purchasedItem = items.find(
          item => item.requestItemId === requestItem._id.toString()
        );

        if (purchasedItem) {
          requestItem.fulfilledQuantity = purchasedItem.quantityPurchased;

          // Determine item status based on purchased quantity
          if (purchasedItem.quantityPurchased === 0) {
            requestItem.status = 'tidak tersedia';
            anyItemUnavailable = true;
          } else if (purchasedItem.quantityPurchased >= requestItem.quantity) {
            requestItem.status = 'dibeli';
            if (purchasedItem.quantityPurchased > requestItem.quantity) {
              requestItem.status = 'lebih';
            }
          } else {
            requestItem.status = 'kurang';
            anyItemShort = true;
          }
        }

        // Check if all requested quantity is fulfilled
        if (requestItem.status !== 'dibeli' && requestItem.status !== 'lebih') {
          allItemsFulfilled = false;
        }
      }

      // Update overall request status
      if (anyItemUnavailable) {
        request.status = 'tidak tersedia';
      } else if (anyItemShort) {
        request.status = 'kurang';
      } else if (allItemsFulfilled) {
        request.status = 'dibeli';
      } else {
        request.status = 'partial';
      }

      await request.save({ session });
    }

    // Proses pengeluaran tambahan
    const processedExpenses = [];
    for (const expense of additionalExpenses) {
      if (!expense.name || !expense.amount || expense.amount <= 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Data pengeluaran tambahan tidak valid' });
      }

      processedExpenses.push({
        name: expense.name,
        amount: expense.amount,
        notes: expense.notes || '',
        payment: {
          method: payment.method,
          status: payment.status,
          notes: payment.notes || '',
          ...(payment.method !== 'cash' && {
            bankFrom: payment.bankFrom,
            bankTo: payment.bankTo,
            recipientName: payment.recipientName,
            proofOfPayment: payment.proofOfPayment
          })
        }
      });
    }

    // Buat MarketList
    const marketList = new MarketList({
      date,
      day,
      items: processedItems,
      additionalExpenses: processedExpenses,
      payment: {
        type: ['card', 'transfer'].includes(payment.method) ? 'online' : 'offline',
        method: payment.method,
        status: payment.status,
        notes: payment.notes || '',
        ...(payment.method !== 'cash' && {
          bankFrom: payment.bankFrom,
          bankTo: payment.bankTo,
          recipientName: payment.recipientName,
          proofOfPayment: payment.proofOfPayment
        })
      },
      relatedRequests: Array.from(relatedRequestIds),
      createdBy: user.username
    });

    const savedMarketList = await marketList.save({ session });

    // Update debt records dengan marketListId
    for (const debt of debtsToCreate) {
      debt.marketListId = savedMarketList._id;
      const newDebt = new Debt(debt);
      await newDebt.save({ session });
    }

    // Update cash flow
    const cashFlow = new CashFlow({
      date,
      day,
      description: `Belanja harian oleh ${user.username}`,
      cashOut: totalCharged + processedExpenses.reduce((sum, e) => sum + e.amount, 0),
      cashIn: 0,
      balance: 0,
      relatedMarketList: savedMarketList._id,
      createdBy: user.username
    });

    await cashFlow.save({ session });

    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      data: {
        marketList: savedMarketList,
        cashFlow,
        debtsCreated: debtsToCreate.length
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating market list:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Gagal menyimpan data belanja'
    });
  } finally {
    session.endSession();
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
      return res.status(400).json({ message: 'Tanggal mulai dan akhir harus disertakan.' });
    }

    // Konversi ke Date object
    const startDate = new Date(start);
    const endDate = new Date(end);

    // 1. Ambil semua transaksi dalam rentang waktu dan populate relatedMarketList
    const flows = await CashFlow.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('relatedMarketList').sort({ date: 1 });

    // 2. Hitung Saldo Awal: semua transaksi sebelum start
    const initialFlows = await CashFlow.find({
      date: { $lt: startDate }
    });

    const startingBalance = initialFlows.reduce((sum, f) => sum + (f.cashIn - f.cashOut), 0);

    // 3. Hitung total masuk/keluar dalam periode
    const totalCashIn = flows.reduce((sum, f) => sum + f.cashIn, 0);
    const totalCashOut = flows.reduce((sum, f) => sum + f.cashOut, 0);

    // 4. Hitung Saldo Akhir
    let currentBalance = startingBalance;

    // 5. Kirim response
    res.json({
      start,
      end,
      summary: {
        startingBalance,
        totalCashIn,
        totalCashOut,
        endingBalance: currentBalance + totalCashIn - totalCashOut
      },
      data: flows.map(f => {
        currentBalance += f.cashIn - f.cashOut;
        const balance = Math.max(currentBalance, 0);
        
        // Ambil item dari relatedMarketList
        const purchasedItems = f.relatedMarketList 
          ? f.relatedMarketList.items.map(item => ({
              item: item.item,
              quantity: item.quantity,
              total: item.total,
            }))
          : [];

        // Ambil additional expenses
        const additionalExpenses = f.relatedMarketList
          ? f.relatedMarketList.additionalExpenses.map(exp => ({
              name: exp.name,
              amount: exp.amount,
              notes: exp.notes,
            }))
          : [];

        return {
          day: new Date(f.date).toLocaleDateString('id-ID', { weekday: 'long' }),
          date: f.date.toISOString().split('T')[0],
          description: f.description,
          cashIn: f.cashIn,
          cashOut: f.cashOut,
          balance,
          purchasedItems, // Menambahkan detail barang yang dibeli
          additionalExpenses // Menambahkan detail tambahan biaya
        };
      })
    });

  } catch (error) {
    console.error('Error saat mengambil laporan mingguan:', error);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan internal server' });
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




