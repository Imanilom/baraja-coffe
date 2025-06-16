import Supplier from '../models/modul_market/Supplier.model.js';
import mongoose from 'mongoose';

// 1. Tambah Supplier Baru
export const createSupplier = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama supplier wajib diisi' });
    }

    // Cek apakah nama sudah terdaftar
    const existingSupplier = await Supplier.findOne({ name: name.trim() });
    if (existingSupplier) {
      return res.status(400).json({ message: 'Nama supplier sudah terdaftar' });
    }

    const newSupplier = new Supplier({
      name: name.trim(),
      phone: phone ? phone.trim() : undefined,
      email: email ? email.trim() : undefined,
      address: address ? address.trim() : undefined
    });

    const savedSupplier = await newSupplier.save();
    res.status(201).json({ message: 'Supplier berhasil dibuat', data: savedSupplier });
  } catch (error) {
    console.error('Error saat membuat supplier:', error.message);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
      return res.status(400).json({ message: 'Nama supplier sudah digunakan' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// 2. Ambil Semua Supplier
export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ count: suppliers.length, data: suppliers });
  } catch (error) {
    console.error('Error saat mengambil daftar supplier:', error.message);
    res.status(500).json({ message: 'Gagal mengambil data supplier', error: error.message });
  }
};

// 3. Ambil Detail Supplier Berdasarkan ID
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }
    res.json({ data: supplier });
  } catch (error) {
    console.error('Error saat mengambil detail supplier:', error.message);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID supplier tidak valid' });
    }
    res.status(500).json({ message: 'Gagal mengambil data supplier', error: error.message });
  }
};

// 4. Update Supplier
export const updateSupplier = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }

    // Validasi dan update field
    if (name && name.trim() !== supplier.name) {
      const existing = await Supplier.findOne({ name: name.trim() });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Nama supplier sudah digunakan oleh supplier lain' });
      }
      supplier.name = name.trim();
    }

    supplier.phone = phone !== undefined ? phone.trim() : supplier.phone;
    supplier.email = email !== undefined ? email.trim() : supplier.email;
    supplier.address = address !== undefined ? address.trim() : supplier.address;

    const updatedSupplier = await supplier.save();
    res.json({ message: 'Supplier berhasil diperbarui', data: updatedSupplier });
  } catch (error) {
    console.error('Error saat memperbarui supplier:', error.message);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID supplier tidak valid' });
    }
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
      return res.status(400).json({ message: 'Nama supplier sudah digunakan' });
    }
    res.status(500).json({ message: 'Gagal memperbarui supplier', error: error.message });
  }
};

// 5. Hapus Supplier
export const deleteSupplier = async (req, res) => {
  try {
    const result = await Supplier.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }
    res.json({ message: 'Supplier berhasil dihapus' });
  } catch (error) {
    console.error('Error saat menghapus supplier:', error.message);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID supplier tidak valid' });
    }
    res.status(500).json({ message: 'Gagal menghapus supplier', error: error.message });
  }

};

export const createBulkSuppliers = async (req, res) => {
  try {
    const { suppliers } = req.body;
    if (!Array.isArray(suppliers) || suppliers.length === 0) {
      return res.status(400).json({ message: 'Harap masukkan daftar supplier' });
    }

    // Validasi nama unik (opsional)
    const names = suppliers.map(s => s.name.trim());
    const existing = await Supplier.find({ name: { $in: names } });
    const existingNames = existing.map(e => e.name);

    const filtered = suppliers.filter(s => !existingNames.includes(s.name.trim()));

    if (filtered.length === 0) {
      return res.status(400).json({ message: 'Semua supplier sudah terdaftar' });
    }

    const inserted = await Supplier.insertMany(filtered);
    res.status(201).json({
      message: `${inserted.length} supplier berhasil ditambahkan`,
      data: inserted
    });

  } catch (error) {
    console.error('Error saat menambahkan supplier:', error.message);
    res.status(500).json({ message: 'Gagal menambahkan supplier', error: error.message });
  }
};