import { ReceiptSetting } from '../models/ReceiptSetting.model.js'; // Pastikan path benar
import { isValidObjectId } from 'mongoose';

// Helper: Validasi ObjectId
const validateObjectId = (id, res) => {
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  return null;
};

/**
 * GET: Dapatkan setting struk berdasarkan outlet ID
 */
export const getReceiptSettingByOutlet = async (req, res) => {
  const { outletId } = req.params;

  // Validasi outletId
  const error = validateObjectId(outletId, res);
  if (error) return error;

  try {
    const setting = await ReceiptSetting.findOne({ outlet: outletId });
    if (!setting) {
      return res.status(404).json({
        message: 'Setting struk tidak ditemukan untuk outlet ini.',
        data: null,
      });
    }
    return res.status(200).json({
      message: 'Setting struk berhasil diambil.',
      data: setting,
    });
  } catch (err) {
    console.error('Error fetching receipt setting:', err);
    return res.status(500).json({
      error: 'Terjadi kesalahan server saat mengambil data.',
    });
  }
};

/**
 * POST: Buat atau update setting struk untuk suatu outlet
 * Jika sudah ada, update; jika belum, buat baru
 */
export const createOrUpdateReceiptSetting = async (req, res) => {
  const { outletId } = req.params;
  const data = req.body;

  // Validasi outletId
  const error = validateObjectId(outletId, res);
  if (error) return error;

  // Validasi: pastikan outletId sesuai dengan data body (jika disertakan)
  if (data.outlet && data.outlet !== outletId) {
    return res.status(400).json({ error: 'Outlet ID di body harus sesuai dengan parameter' });
  }

  try {
    let setting = await ReceiptSetting.findOne({ outlet: outletId });

    if (setting) {
      // Update jika sudah ada
      Object.assign(setting, data);
      await setting.save();
      return res.status(200).json({
        message: 'Setting struk berhasil diperbarui.',
        data: setting,
      });
    } else {
      // Buat baru
      const newSetting = new ReceiptSetting({
        outlet: outletId,
        ...data,
      });
      const savedSetting = await newSetting.save();
      return res.status(201).json({
        message: 'Setting struk berhasil dibuat.',
        data: savedSetting,
      });
    }
  } catch (err) {
    console.error('Error saving receipt setting:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Setting untuk outlet ini sudah ada (duplikat).' });
    }
    return res.status(500).json({
      error: 'Terjadi kesalahan saat menyimpan data.',
    });
  }
};

/**
 * PUT: Update setting berdasarkan ID (opsional, jika ingin pakai ID langsung)
 */
export const updateReceiptSetting = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const error = validateObjectId(id, res);
  if (error) return error;

  try {
    const setting = await ReceiptSetting.findById(id);
    if (!setting) {
      return res.status(404).json({ message: 'Setting tidak ditemukan.' });
    }

    Object.assign(setting, data);
    await setting.save();

    return res.status(200).json({
      message: 'Setting struk berhasil diperbarui.',
      data: setting,
    });
  } catch (err) {
    console.error('Error updating receipt setting:', err);
    return res.status(500).json({
      error: 'Gagal memperbarui setting struk.',
    });
  }
};

/**
 * GET: Semua setting (opsional, hanya untuk admin)
 */
export const getAllReceiptSettings = async (_req, res) => {
  try {
    const settings = await ReceiptSetting.find().populate('outlet', 'name address');
    return res.status(200).json({
      message: 'Daftar semua setting struk.',
      data: settings,
    });
  } catch (err) {
    console.error('Error fetching all receipt settings:', err);
    return res.status(500).json({
      error: 'Gagal mengambil daftar setting.',
    });
  }
};