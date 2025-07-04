import { TaxAndService } from '../models/TaxAndService.model.js';
import { Outlet } from '../models/Outlet.model.js';
import LoyaltyLevel from '../models/LoyaltyLevel.model.js';

// ✅ GET: Semua data pajak & service
export const getAllCharges = async (req, res) => {
  try {
    const charges = await TaxAndService.find()
      .populate('appliesToOutlets', 'name')
      .populate('appliesToCustomerTypes', 'name'); 

    res.status(200).json(charges);
  } catch (err) {
    res.status(500).json({ 
      error: 'Gagal mengambil data pajak dan service.', 
      details: err.message 
    });
  }
};

// ✅ GET: Satu charge by ID
export const getChargeById = async (req, res) => {
  try {
    const charge = await TaxAndService.findById(req.params.id)
      .populate('appliesToOutlets', 'name')
      .populate('appliesToCustomerTypes', 'name'); 

    if (!charge) return res.status(404).json({ error: 'Data tidak ditemukan.' });

    res.status(200).json(charge);
  } catch (err) {
    res.status(500).json({ 
      error: 'Gagal mengambil data.', 
      details: err.message 
    });
  }
};

// ✅ POST: Tambah tax/service baru
export const createCharge = async (req, res) => {
  try {
    const { appliesToOutlets, appliesToCustomerTypes } = req.body;

    // Validasi input: appliesToOutlets harus ada dan tidak kosong
    if (!appliesToOutlets || !Array.isArray(appliesToOutlets) || appliesToOutlets.length === 0) {
      return res.status(400).json({ error: 'Harus memilih minimal satu outlet.' });
    }

    // Optional: Validasi apakah outlet benar-benar ada
    const outletsExist = await Outlet.find({
      _id: { $in: appliesToOutlets }
    });

    if (outletsExist.length !== appliesToOutlets.length) {
      return res.status(400).json({ error: 'Beberapa outlet tidak ditemukan.' });
    }

    let allLoyaltyLevelIds = [];

    // Jika appliesToCustomerTypes tidak diisi atau kosong → ambil semua loyalty level
    if (!appliesToCustomerTypes || !Array.isArray(appliesToCustomerTypes) || appliesToCustomerTypes.length === 0) {
      const levels = await LoyaltyLevel.find().select('_id');
      allLoyaltyLevelIds = levels.map(level => level._id);
    } else {
      // Validasi apakah ID customer types valid
      const validLevels = await LoyaltyLevel.find({
        _id: { $in: appliesToCustomerTypes }
      });

      if (validLevels.length !== appliesToCustomerTypes.length) {
        return res.status(400).json({ error: 'Beberapa level loyalitas tidak ditemukan.' });
      }
    }

    // Buat objek payload dengan semua data + isi appliesToCustomerTypes jika kosong
    const chargeData = {
      ...req.body,
      appliesToCustomerTypes: allLoyaltyLevelIds.length > 0 ? allLoyaltyLevelIds : appliesToCustomerTypes
    };

    const newCharge = new TaxAndService(chargeData);
    await newCharge.save();

    res.status(201).json(newCharge);
  } catch (err) {
    res.status(400).json({ 
      error: 'Gagal menambahkan data.', 
      details: err.message 
    });
  }
};

// ✅ PUT: Update tax/service
export const updateCharge = async (req, res) => {
  try {
    const { appliesToOutlets, appliesToCustomerTypes } = req.body;

    // Validasi appliesToOutlets jika disertakan
    if (appliesToOutlets !== undefined) {
      if (!Array.isArray(appliesToOutlets) || appliesToOutlets.length === 0) {
        return res.status(400).json({ error: 'Harus memilih minimal satu outlet.' });
      }

      const outletsExist = await Outlet.find({
        _id: { $in: appliesToOutlets }
      });

      if (outletsExist.length !== appliesToOutlets.length) {
        return res.status(400).json({ error: 'Beberapa outlet tidak ditemukan.' });
      }
    }

    let allLoyaltyLevelIds = [];

    // Jika appliesToCustomerTypes tidak diisi atau kosong → ambil semua loyalty level
    if (!appliesToCustomerTypes || !Array.isArray(appliesToCustomerTypes) || appliesToCustomerTypes.length === 0) {
      const levels = await LoyaltyLevel.find().select('_id');
      allLoyaltyLevelIds = levels.map(level => level._id);
    } else {
      const validLevels = await LoyaltyLevel.find({
        _id: { $in: appliesToCustomerTypes }
      });

      if (validLevels.length !== appliesToCustomerTypes.length) {
        return res.status(400).json({ error: 'Beberapa level loyalitas tidak ditemukan.' });
      }
    }

    // Siapkan payload update
    const updateData = {
      ...req.body,
      appliesToCustomerTypes: allLoyaltyLevelIds.length > 0 ? allLoyaltyLevelIds : appliesToCustomerTypes
    };

    const updated = await TaxAndService.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Data tidak ditemukan.' });

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ 
      error: 'Gagal mengubah data.', 
      details: err.message 
    });
  }
};

// ✅ DELETE: Hapus tax/service
export const deleteCharge = async (req, res) => {
  try {
    const deleted = await TaxAndService.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ error: 'Data tidak ditemukan.' });

    res.status(200).json({ message: 'Berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ 
      error: 'Gagal menghapus data.', 
      details: err.message 
    });
  }
};