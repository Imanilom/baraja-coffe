import { TaxAndService } from '../models/TaxAndService.model.js';

// ✅ GET: Semua data pajak & service
export const getAllCharges = async (req, res) => {
  try {
    const charges = await TaxAndService.find()
      .populate('appliesToOutlets', 'name')
      .populate('appliesToMenuItems', 'name');
    res.status(200).json(charges);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data pajak dan service.', details: err.message });
  }
};

// ✅ GET: Satu charge by ID
export const getChargeById = async (req, res) => {
  try {
    const charge = await TaxAndService.findById(req.params.id)
      .populate('appliesToOutlets', 'name')
      .populate('appliesToMenuItems', 'name');
    if (!charge) return res.status(404).json({ error: 'Data tidak ditemukan.' });
    res.status(200).json(charge);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data.', details: err.message });
  }
};

// ✅ POST: Tambah tax/service baru
export const createCharge = async (req, res) => {
  try {
    const newCharge = new TaxAndService(req.body);
    await newCharge.save();
    res.status(201).json(newCharge);
  } catch (err) {
    res.status(400).json({ error: 'Gagal menambahkan data.', details: err.message });
  }
};

// ✅ PUT: Update tax/service
export const updateCharge = async (req, res) => {
  try {
    const updated = await TaxAndService.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Data tidak ditemukan.' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Gagal mengubah data.', details: err.message });
  }
};

// ✅ DELETE: Hapus tax/service
export const deleteCharge = async (req, res) => {
  try {
    const deleted = await TaxAndService.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Data tidak ditemukan.' });
    res.status(200).json({ message: 'Berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus data.', details: err.message });
  }
};
