import mongoose from 'mongoose';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import StockMovement from '../models/modul_menu/StockMovement.model.js';
import Warehouse from '../models/modul_market/Warehouse.model.js';
import Product from '../models/modul_market/Product.model.js';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100; // 100ms delay antara retry

export const insertInitialStocks = async (req, res) => {
  try {
    const { stocks } = req.body;

    if (!stocks || !Array.isArray(stocks)) {
      return res.status(400).json({ message: "Data stok tidak valid" });
    }

    let success = false;
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        for (const item of stocks) {
          if (!item.warehouseId) {
            throw new Error(`WarehouseId wajib diisi untuk produk ${item.name}`);
          }

          const product = await Product.findOne({ name: item.name }).session(session);
          if (!product) {
            throw new Error(`Produk ${item.name} tidak ditemukan`);
          }

          // cek apakah stok sudah ada berdasarkan kombinasi productId + category + warehouse
          const existingStock = await ProductStock.findOne({
            productId: product._id,
            category: item.category,
            warehouse: item.warehouseId
          }).session(session);

          if (existingStock) {
            // Update stok & tambah movement
            existingStock.currentStock += item.qty;
            existingStock.movements.push({
              quantity: item.qty,
              type: 'in',
              referenceId: new mongoose.Types.ObjectId(),
              notes: 'Stok awal',
              destinationWarehouse: item.warehouseId,
              handledBy: req.user?.username || "system",
              date: new Date()
            });
            await existingStock.save({ session });
          } else {
            // Buat stok baru
            const newStock = new ProductStock({
              productId: product._id,
              category: item.category,
              warehouse: item.warehouseId,
              currentStock: item.qty,
              minStock: 0,
              movements: [
                {
                  quantity: item.qty,
                  type: 'in',
                  referenceId: new mongoose.Types.ObjectId(),
                  notes: 'Stok awal',
                  destinationWarehouse: item.warehouseId,
                  handledBy: req.user?.username || "system",
                  date: new Date()
                }
              ]
            });
            await newStock.save({ session });
          }
        }

        await session.commitTransaction();
        session.endSession();
        success = true;
        break;

      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        lastError = error;

        if (
          error.hasErrorLabel?.('TransientTransactionError') ||
          error.codeName === 'WriteConflict'
        ) {
          if (attempt < MAX_RETRY_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
            continue;
          }
        } else {
          console.error('Error non-transient:', error);
          break;
        }
      }
    }

    if (success) {
      return res.status(201).json({
        message: 'Stok awal berhasil ditambahkan',
        data: stocks
      });
    } else {
      console.error('Gagal setelah semua retry:', lastError);
      return res.status(500).json({
        message: 'Gagal menambahkan stok awal setelah beberapa percobaan',
        error: lastError.message
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      message: 'Terjadi kesalahan internal',
      error: error.message
    });
  }
}

export const getProductStock = async (req, res) => {
  try {
    const { 
      productId, 
      warehouseId, 
      page = 1, 
      limit = 25,
      search 
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 25));

    const query = {};

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'ID Produk tidak valid' });
      }
      query.productId = new mongoose.Types.ObjectId(productId);
    }

    if (warehouseId) {
      if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
        return res.status(400).json({ success: false, message: 'ID Warehouse tidak valid' });
      }
      query.warehouse = new mongoose.Types.ObjectId(warehouseId);
    }

    const total = await ProductStock.countDocuments(query);

    // Ambil data ProductStock
    const stocks = await ProductStock.find(query)
      .populate('productId', 'name sku unit category')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Ambil semua warehouseId yang unik dari hasil
    const warehouseIds = [...new Set(
      stocks
        .map(stock => stock.warehouse?.toString())
        .filter(id => mongoose.Types.ObjectId.isValid(id))
    )];

    // Ambil semua warehouse yang valid sekaligus (1 query)
    const validWarehouses = {};
    if (warehouseIds.length > 0) {
      const warehouses = await Warehouse.find({
        _id: { $in: warehouseIds.map(id => new mongoose.Types.ObjectId(id)) }
      }).select('name code');

      warehouses.forEach(wh => {
        validWarehouses[wh._id.toString()] = wh;
      });
    }

    // Gabungkan data: tambahkan info warehouse jika ada, jika tidak, tampilkan ID
    const result = stocks.map(stock => {
      const stockObj = stock.toObject();
      
      const whId = stock.warehouse?.toString();
      if (whId && validWarehouses[whId]) {
        stockObj.warehouse = validWarehouses[whId];
      } else {
        // Fallback: tampilkan ID dan info default
        stockObj.warehouse = {
          _id: stock.warehouse || whId,
          name: whId ? 'Gudang tidak ditemukan' : 'Tidak tersedia',
          code: 'invalid'
        };
      }

      return stockObj;
    });

    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('Error fetching product stock:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil data stok'
    });
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
