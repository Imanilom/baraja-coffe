import Product from '../models/modul_market/Product.model.js';
import Supplier from '../models/modul_market/Supplier.model.js';
import { logActivity } from '../helpers/logActivity.js';
import mongoose from 'mongoose';

// Helper: validasi supplier list
const validateSuppliers = async (suppliers) => {
  const supplierData = [];
  const seenIds = new Set();

  for (const sup of suppliers) {
    if (!mongoose.Types.ObjectId.isValid(sup.supplierId)) {
      throw new Error(`Supplier ID ${sup.supplierId} tidak valid`);
    }
    if (seenIds.has(sup.supplierId.toString())) {
      throw new Error(`Supplier ID ${sup.supplierId} duplikat`);
    }
    seenIds.add(sup.supplierId.toString());

    const supplier = await Supplier.findById(sup.supplierId);
    if (!supplier) {
      throw new Error(`Supplier dengan ID ${sup.supplierId} tidak ditemukan`);
    }

    supplierData.push({
      supplierId: sup.supplierId,
      supplierName: supplier.name,
      price: sup.price || 0,
      lastPurchaseDate: sup.lastPurchaseDate ? new Date(sup.lastPurchaseDate) : undefined
    });
  }
  return supplierData;
};

// 1. Tambah Produk
export const createProduct = async (req, res) => {
  try {
    const productsInput = Array.isArray(req.body) ? req.body : [req.body];
    const productsToInsert = [];

    for (const input of productsInput) {
      const { sku, barcode, name, category, unit, suppliers, minimumrequest, limitperrequest } = input;

      if (!sku || !name || !category || !unit) {
        return res.status(400).json({ message: 'SKU, Nama, Kategori, dan Satuan wajib diisi untuk setiap produk.' });
      }

      let supplierData = [];
      if (suppliers && suppliers.length) {
        supplierData = await validateSuppliers(suppliers);
      }

      productsToInsert.push({
        sku: sku.trim().toUpperCase(),
        barcode: barcode?.trim() || undefined,
        name: name.trim(),
        category,
        unit: unit.trim(),
        minimumrequest: minimumrequest ?? 1,
        limitperrequest: limitperrequest ?? 1,
        suppliers: supplierData
      });
    }

    const savedProducts = await Product.insertMany(productsToInsert, { ordered: false });

    // === LOGGING ===
    for (const product of savedProducts) {
      await logActivity({
        user: req.user?._id,
        identifier: req.user?.email || req.user?.username,
        action: 'CREATE',
        module: 'Product',
        description: `Membuat produk baru: ${product.name} (SKU: ${product.sku})`,
        timestamp: new Date(),
        req,
      });
    }

    res.status(201).json({ message: 'Produk berhasil dibuat', data: savedProducts });
  } catch (error) {
    console.error('Error saat membuat produk:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'SKU atau Barcode sudah terdaftar pada salah satu produk.' });
    }
    res.status(400).json({ message: error.message });
        await logActivity({
        user: req.user?._id,
        identifier: req.user?.email || req.user?.username,
        action: 'CREATE',
        module: 'Product',
        description: `Membuat produk baru: ${product.name} (SKU: ${product.sku})`,
        timestamp: new Date(),
        status: 'FAILED',
        req,
      });
  }
};

// 2. Ambil Semua Produk
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data produk', error: error.message });
  }
};

// 3. Detail Produk
export const getProductById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID produk tidak valid' });
  }
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    res.json({ data: product });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data produk', error: error.message });
  }
};

// 4. Update Produk
export const updateProduct = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID produk tidak valid' });
  }

  try {
    const { sku, barcode, name, category, unit, suppliers, minimumrequest, limitperrequest } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });

    if (sku) product.sku = sku.trim().toUpperCase();
    if (barcode !== undefined) product.barcode = barcode?.trim() || undefined;
    if (name) product.name = name.trim();
    if (category) product.category = category;
    if (unit) product.unit = unit.trim();
    if (minimumrequest !== undefined) product.minimumrequest = minimumrequest;
    if (limitperrequest !== undefined) product.limitperrequest = limitperrequest;

    if (suppliers && suppliers.length) {
      product.suppliers = await validateSuppliers(suppliers);
    }

    const updatedProduct = await product.save();

    // === LOGGING ===
    await logActivity({
      user: req.user?._id,
      action: 'UPDATE',
      module: 'Product',
      description: `Mengupdate produk: ${updatedProduct.name} (SKU: ${updatedProduct.sku})`,
      timestamp: new Date(),
      req,
    });

    res.json({ message: 'Produk berhasil diperbarui', data: updatedProduct });
  } catch (error) {
    console.error('Error saat update produk:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'SKU atau Barcode sudah digunakan' });
    }
    res.status(400).json({ message: error.message });
    await logActivity({
      user: req.user?._id,
      action: 'UPDATE',
      module: 'Product',
      description: `(Gagal Update)`,
      timestamp: new Date(),
      status: 'FAILED',
      req,
    });
  }
};

// 3. Update Product Price
export const updateProductPrice = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID produk tidak valid' });
  }

  try {
    const { supplierId, price } = req.body;

    if (!supplierId || price === undefined || price === null) {
      return res.status(400).json({ message: 'supplierId dan price wajib diisi' });
    }

    if (price < 0) {
      return res.status(400).json({ message: 'Harga tidak boleh negatif' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const supplierIndex = product.suppliers.findIndex(
      (s) => s.supplierId.toString() === supplierId.toString()
    );

    if (supplierIndex === -1) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan pada produk ini' });
    }

    product.suppliers[supplierIndex].price = Number(price);
    product.suppliers[supplierIndex].lastPurchaseDate = new Date();

    await product.save();

    // === LOGGING ===
    await logActivity({
      user: req.user?._id,
      action: 'UPDATE',
      module: 'Product',
      description: `Update harga produk ${product.name} (SKU: ${product.sku}) supplier ${product.suppliers[supplierIndex].supplierName} menjadi Rp${price}`,
      timestamp: new Date(),
      req,
    });

    res.json({
      message: 'Harga produk berhasil diperbarui',
      data: {
        productId: product._id,
        productName: product.name,
        supplierId: product.suppliers[supplierIndex].supplierId,
        supplierName: product.suppliers[supplierIndex].supplierName,
        price: product.suppliers[supplierIndex].price,
        lastPurchaseDate: product.suppliers[supplierIndex].lastPurchaseDate
      }
    });

  } catch (error) {
    console.error('Error saat update harga produk:', error);
    res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    await logActivity({
      user: req.user?._id,
      action: 'UPDATE',
      module: 'Product',
      description: `gagal update harga`,
      timestamp: new Date(),
      req,
    });
  }
};


// 4. Delete Product
export const deleteProduct = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID produk tidak valid' });
  }
  try {
    const result = await Product.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Produk tidak ditemukan' });

    // === LOGGING ===
    await logActivity({
      user: req.user?._id,
      action: 'DELETE',
      module: 'Product',
      description: `Menghapus produk: ${result.name} (SKU: ${result.sku})`,
      timestamp: new Date(),
      req,
    });

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus produk', error: error.message });
    await logActivity({
      user: req.user?._id,
      action: 'DELETE',
      module: 'Product',
      description: `Menghapus produk: ${result.name} (SKU: ${result.sku})`,
      timestamp: new Date(),
      status: 'FAILED',
      req,
    });
  }
};


// 6. Pencarian Produk
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

    res.json({ count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
