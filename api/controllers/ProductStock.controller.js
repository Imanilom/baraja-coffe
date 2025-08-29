import mongoose from 'mongoose';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import StockMovement from '../models/modul_menu/StockMovement.model.js';
import Product from '../models/modul_market/Product.model.js';

export const getProductStock = async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID Produk tidak valid' });
    }

    const productStock = await ProductStock.findOne({ productId }).populate('productId', 'name sku unit');
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

// ✅ FIXED: POST /stock/movement — sesuai type movement
export const addStockMovement = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const stockUpdates = req.body;

    if (!Array.isArray(stockUpdates) || stockUpdates.length === 0) {
      return res.status(400).json({ success: false, message: 'Data harus berupa array dan tidak boleh kosong' });
    }

    for (const item of stockUpdates) {
      const { productId, movements } = item;

      if (!productId || !Array.isArray(movements) || movements.length === 0) {
        throw new Error(`Data tidak lengkap untuk productId: ${productId}`);
      }

      const productObjectId = new mongoose.Types.ObjectId(productId);
      let productStock = await ProductStock.findOne({ productId: productObjectId }).session(session);

      if (!productStock) {
        productStock = new ProductStock({ productId: productObjectId, movements: [] });
      }

      for (const move of movements) {
        const { quantity, type, notes = '', referenceId, referenceType, createdBy } = move;

        if (quantity == null || !['in', 'out', 'adjustment'].includes(type)) {
          throw new Error(`Movement tidak valid untuk productId: ${productId}`);
        }

        const movement = new StockMovement({
          productId: productObjectId,
          productStockId: productStock._id,
          quantity,
          type,
          notes,
          referenceId: referenceId ? new mongoose.Types.ObjectId(referenceId) : undefined,
          referenceType,
          createdBy
        });

        await movement.save({ session });
        productStock.movements.push(movement._id);

        // ✅ Update currentStock hanya untuk 'in' dan 'out'
        if (type === 'in') {
          productStock.currentStock += quantity;
        } else if (type === 'out') {
          productStock.currentStock -= quantity;
          if (productStock.currentStock < 0) productStock.currentStock = 0;
        }
      }

      await productStock.save({ session });
    }

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: 'Semua pergerakan stok berhasil dicatat'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error bulk stock movement:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal mencatat pergerakan stok',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

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

    const movements = await StockMovement.find({ productId }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: {
        product: productStock.productId.name,
        movements
      }
    });

  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat stok' });
  }
};

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

export const getAllStock = async (req, res) => {
  try {
    const stocks = await ProductStock.find().populate('productId', 'name sku category unit');
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
