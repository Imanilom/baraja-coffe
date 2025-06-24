import ProductStock from '../models/modul_menu/ProductStock.model.js';
import Product from '../models/modul_market/Product.model.js'; // Pastikan model Product ada
import mongoose from 'mongoose';


// GET /stock?productId=65f1234567890abcde123456
export const getProductStock = async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID Produk tidak valid' });
    }

    const productStock = await ProductStock.findOne({ productId }).populate('productId', 'name sku');

    if (!productStock) {
      return res.status(404).json({
        success: true,
        data: {
          productId,
          name: 'Unknown',
          currentStock: 0,
          minStock: 0,
          movements: []
        }
      });
    }

    res.status(200).json({ success: true, data: productStock });

  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data stok' });
  }
};


// POST /stock/movement
export const addStockMovement = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, quantity, type, notes = '', referenceId = null } = req.body;

    if (!productId || !quantity || !type) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    if (!['in', 'out', 'adjustment'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Tipe pergerakan tidak valid' });
    }

    let productStock = await ProductStock.findOne({ productId }).session(session);

    if (!productStock) {
      productStock = new ProductStock({ productId });
    }

    productStock.movements.push({
      date: new Date(),
      quantity,
      type,
      notes,
      referenceId
    });

    await productStock.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Pergerakan stok berhasil dicatat',
      data: productStock
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error adding movement:', error);
    res.status(500).json({ success: false, message: 'Gagal mencatat pergerakan stok' });
  } finally {
    session.endSession();
  }
};

// GET /stock/:productId/movements
export const getStockMovements = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID Produk tidak valid' });
    }

    const productStock = await ProductStock.findOne({ productId }).populate('productId', 'name');

    if (!productStock) {
      return res.status(404).json({ success: false, message: 'Stok tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      data: {
        product: productStock.productId.name,
        movements: productStock.movements
      }
    });

  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat stok' });
  }
};

// PUT /stock/:productId/min-stock
export const updateMinStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { minStock } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID Produk tidak valid' });
    }

    if (typeof minStock !== 'number' || minStock < 0) {
      return res.status(400).json({ success: false, message: 'Nilai minStock tidak valid' });
    }

    let productStock = await ProductStock.findOne({ productId });

    if (!productStock) {
      productStock = new ProductStock({ productId, minStock });
    } else {
      productStock.minStock = minStock;
    }

    await productStock.save();

    res.status(200).json({
      success: true,
      message: 'Minimum stok berhasil diupdate',
      data: productStock
    });

  } catch (error) {
    console.error('Error updating min stock:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate min stock' });
  }
};

// GET /stock/all
export const getAllStock = async (req, res) => {
  try {
    const stocks = await ProductStock.find().populate('productId', 'name sku category');

    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks
    });

  } catch (error) {
    console.error('Error fetching all stock:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil semua stok' });
  }
};