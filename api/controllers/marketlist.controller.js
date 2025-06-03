// controllers/marketlistController.js
import MarketList from '../models/modul_market/MarketList.model.js';
import Request from '../models/modul_market/Request.model.js';
import CashFlow from '../models/modul_market/CashFlow.model.js';
import User from '../models/user.model.js';
import { getDayName } from '../services/getDay.js';

// Buat Request dari staff (perlu login)
export const createRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user || user.role !== 'staff') {
      return res.status(403).json({ message: 'Hanya staff yang bisa membuat request' });
    }

    const { department, items, date } = req.body;

    const request = new Request({
      requester: user.username,
      department,
      items,
      date: date ? new Date(date) : undefined // pakai jika ada, kalau tidak default
    });

    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Lihat semua request (hanya untuk pembeli)
export const getAllRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'inventory') {
      return res.status(403).json({ message: 'Hanya petugas belanja yang bisa melihat request' });
    }
    const requests = await Request.find().sort({ date: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveRequestItems = async (req, res) => {
  try {
    const { requestId, items, reviewedBy } = req.body;

    if (!requestId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Request ID dan item yang diupdate harus disediakan' });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    items.forEach(({ itemId, status, fulfilledQuantity }) => {
      const item = request.items.id(itemId);
      if (!item) return; // lewati jika item tidak ditemukan

      if (status) item.status = status;
      if (fulfilledQuantity !== undefined) item.fulfilledQuantity = fulfilledQuantity;
    });

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

export const getRequests = async (req, res) => {
  try {
    const { status, department, startDate, endDate } = req.query;

    const query = {};

    // Filter by status (e.g., pending, approved, rejected)
    if (status) {
      query.status = status;
    }

    // Filter by department (e.g., dapur, bar)
    if (department) {
      query.department = department;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const requests = await Request.find(query).sort({ date: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Gagal mengambil data request:', error);
    res.status(500).json({ message: 'Gagal mengambil data request' });
  }
};





  // Input belanja harian berdasarkan request
 export const createMarketList = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'inventory') {
      return res.status(403).json({ message: 'Hanya petugas belanja yang bisa mencatat belanja' });
    }

    const { date, items, payment } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items tidak boleh kosong' });
    }

    const day = getDayName(date);

    // Validasi hanya untuk item yang dibeli
    const purchasedItems = items.filter(item => item.status !== 'tidak tersedia');

    purchasedItems.forEach(item => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (isNaN(quantity) || isNaN(price) || quantity <= 0 || price <= 0) {
        throw new Error(`Item "${item.item}" memiliki price atau quantity tidak valid`);
      }

      item.quantity = quantity;
      item.price = price;
      item.total = price * quantity;
    });

    const notPurchasedItems = items.filter(item => item.status === 'tidak tersedia');
    notPurchasedItems.forEach(item => {
      if (!item.notes || item.notes.trim() === '') {
        throw new Error(`Catatan wajib diisi untuk item "${item.item}"`);
      }
    });

    // Ambil semua request untuk update status
    const allRequests = await Request.find({});
    const updatedRequestIds = new Set();

    for (const purchasedItem of items) {
      for (const request of allRequests) {
        let changed = false;
        for (const reqItem of request.items) {
          if (
            reqItem.item.toLowerCase() === purchasedItem.item.toLowerCase() &&
            reqItem.status === 'pending'
          ) {
            updatedRequestIds.add(request._id.toString());

            const reqQty = reqItem.quantity;
            const fulfilledQty = purchasedItem.quantity;

            reqItem.fulfilledQuantity = fulfilledQty;

            if (fulfilledQty === 0) {
              reqItem.status = 'tidak tersedia';
            } else if (fulfilledQty === reqQty) {
              reqItem.status = 'dibeli';
            } else if (fulfilledQty > reqQty) {
              reqItem.status = 'lebih';
            } else if (fulfilledQty < reqQty) {
              reqItem.status = 'kurang';
            }

            changed = true;
            break;
          }
        }
        if (changed) await request.save();
      }
    }

    const marketList = new MarketList({
      day,
      items,
      payment,
      createdBy: user.username,
      relatedRequests: Array.from(updatedRequestIds),
    });

    await marketList.save();

    const totalOut = items.reduce((sum, item) => sum + (item.total || 0), 0);

    const lastBalance = await getLastBalance();
    const newBalance = lastBalance - totalOut;

    const cashFlow = new CashFlow({
      day,
      description: `Belanja harian oleh ${user.username}`,
      cashOut: payment.method === 'cash' ? totalOut : 0,
      cashIn: 0,
      balance: newBalance,
      relatedMarketList: marketList._id,
      createdBy: user.username
    });

    await cashFlow.save();

    res.status(201).json({ marketList, cashFlow });

  } catch (error) {
    console.error('Error saat membuat market list:', error);
    res.status(500).json({ message: error.message });
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
    const { date, description, cashIn, source, destination } = req.body;
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
      createdBy: user.username
    });

    await cashFlow.save();

    res.status(201).json(cashFlow);

  } catch (error) {
    console.error('Error menambahkan kas masuk:', error);
    res.status(500).json({ message: error.message });
  }
};


const getLastBalance = async () => {
  const lastEntry = await CashFlow.findOne().sort({ date: -1 });
  return lastEntry ? lastEntry.balance : 0;
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
    const flows = await CashFlow.find({
      date: { $gte: new Date(start), $lte: new Date(end) }
    });

    const totalIn = flows.reduce((sum, f) => sum + f.cashIn, 0);
    const totalOut = flows.reduce((sum, f) => sum + f.cashOut, 0);
    const net = totalIn - totalOut;

    res.json({
      start,
      end,
      summary: {
        totalCashIn: totalIn,
        totalCashOut: totalOut,
        netCash: net
      },
      data: flows
    });
  } catch (error) {
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




