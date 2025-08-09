import Product from '../models/modul_market/Product.model.js';
import Supplier from '../models/modul_market/Supplier.model.js'; // Pastikan model Supplier sudah ada
import mongoose from 'mongoose';

// 1. Tambah Produk Baru
export const createProduct = async (req, res) => {
  try {
    const productsInput = Array.isArray(req.body) ? req.body : [req.body];
    const productsToInsert = [];

    for (const input of productsInput) {
      const { sku, barcode, name, category, unit, suppliers } = input;

      if (!sku || !name || !category || !unit) {
        return res.status(400).json({ message: 'SKU, Nama, Kategori, dan Satuan wajib diisi untuk setiap produk.' });
      }

      // Validasi format suppliers jika disediakan
      let supplierData = [];
      if (suppliers && Array.isArray(suppliers)) {
        for (const sup of suppliers) {
          const supplier = await Supplier.findById(sup.supplierId);
          if (!supplier) {
            return res.status(400).json({ message: `Supplier dengan ID ${sup.supplierId} tidak ditemukan.` });
          }
          supplierData.push({
            supplierId: sup.supplierId,
            supplierName: supplier.name,
            price: sup.price || 0,
            lastPurchaseDate: sup.lastPurchaseDate ? new Date(sup.lastPurchaseDate) : undefined
          });
        }
      }

      productsToInsert.push({
        sku: sku.toUpperCase(),
        barcode: barcode ? barcode.trim() : undefined,
        name: name.trim(),
        category,
        unit: unit.trim(),
        suppliers: supplierData
      });
    }

    const savedProducts = await Product.insertMany(productsToInsert, { ordered: false });
    res.status(201).json({ message: 'Produk berhasil dibuat', data: savedProducts });
  } catch (error) {
    console.error('Error saat membuat produk:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'SKU atau Barcode sudah terdaftar pada salah satu produk.' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// 2. Ambil Semua Produk
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ count: products.length, data: products });
  } catch (error) {
    console.error('Error saat mengambil daftar produk:', error.message);
    res.status(500).json({ message: 'Gagal mengambil data produk', error: error.message });
  }
};

// 3. Ambil Detail Produk Berdasarkan ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    res.json({ data: product });
  } catch (error) {
    console.error('Error saat mengambil detail produk:', error.message);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }
    res.status(500).json({ message: 'Gagal mengambil data produk', error: error.message });
  }
};

// 4. Update Produk
export const updateProduct = async (req, res) => {
  try {
    const { sku, barcode, name, category, unit, suppliers } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    // Update field biasa
    product.sku = sku ? sku.toUpperCase() : product.sku;
    product.barcode = barcode !== undefined ? barcode.trim() : product.barcode;
    product.name = name ? name.trim() : product.name;
    product.category = category || product.category;
    product.unit = unit || product.unit;

    // Update suppliers jika ada
    if (suppliers && Array.isArray(suppliers)) {
      const updatedSuppliers = [];
      for (const sup of suppliers) {
        const supplier = await Supplier.findById(sup.supplierId);
        if (!supplier) {
          return res.status(400).json({ message: `Supplier dengan ID ${sup.supplierId} tidak ditemukan.` });
        }

        updatedSuppliers.push({
          supplierId: sup.supplierId,
          supplierName: supplier.name,
          price: sup.price ?? product.suppliers.find(s => s.supplierId == sup.supplierId)?.price ?? 0,
          lastPurchaseDate: sup.lastPurchaseDate ? new Date(sup.lastPurchaseDate) : product.suppliers.find(s => s.supplierId == sup.supplierId)?.lastPurchaseDate
        });
      }
      product.suppliers = updatedSuppliers;
    }

    const updatedProduct = await product.save();
    res.json({ message: 'Produk berhasil diperbarui', data: updatedProduct });
  } catch (error) {
    console.error('Error saat memperbarui produk:', error.message);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'SKU atau Barcode sudah digunakan' });
    }
    res.status(500).json({ message: 'Gagal memperbarui produk', error: error.message });
  }
};

// 5. Hapus Produk
export const deleteProduct = async (req, res) => {
  try {
    const result = await Product.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Error saat menghapus produk:', error.message);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }
    res.status(500).json({ message: 'Gagal menghapus produk', error: error.message });
  }
};

export const searchProducts = async (req, res) => {
  const { q } = req.query;
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { barcode: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};