import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import Product from '../models/modul_market/Product.model.js';
import Warehouse from '../models/modul_market/Warehouse.model.js';
import mongoose from 'mongoose';
import {
  calculateMaxPortionsForWarehouse,
  getWorkstationWarehouseMapping,
  calculateMenuItemStockForWarehouse
} from '../utils/stockCalculator.js';
import { calibrateSingleMenuStockForAllWarehouses } from '../jobs/stockCalibration.job.js';

/**
 * Hitung porsi maksimal berdasarkan bahan tersedia di semua warehouse terkait
 */
export const calculateCostPrice = async (menuItemId, recipeOverride = null) => {
  let recipe;

  if (recipeOverride) {
    recipe = recipeOverride;
  } else {
    recipe = await Recipe.findOne({ menuItemId });
  }

  if (!recipe) return 0;

  let total = 0;

  const getPrice = (product) => {
    if (!product?.suppliers?.length) return 0;
    const sorted = [...product.suppliers].sort((a, b) =>
      new Date(b.lastPurchaseDate) - new Date(a.lastPurchaseDate)
    );
    return sorted[0]?.price || 0;
  };

  const sumIngredients = async (ingredients) => {
    for (const ing of ingredients) {
      const product = await Product.findById(ing.productId);
      if (!product) continue;
      const price = getPrice(product);
      total += price * ing.quantity;
    }
  };

  await sumIngredients(recipe.baseIngredients);

  for (const addon of recipe.addonOptions) {
    await sumIngredients(addon.ingredients);
  }

  return total;
};

/**
 * Update semua menuItem dengan hitungan availableStock berdasarkan semua warehouse
 */
export const updateMenuAvailableStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const menuItems = await MenuItem.find()
      .populate("category", "name")
      .populate("warehouseStocks.warehouseId", "name code")
      .session(session);

    for (const menuItem of menuItems) {
      const recipe = await Recipe.findOne({ menuItemId: menuItem._id }).session(session);

      if (!recipe || !recipe.baseIngredients.length) {
        // Update MenuStock untuk semua warehouse terkait
        const workstation = menuItem.workstation;
        if (workstation) {
          const warehouses = await getWorkstationWarehouseMapping(workstation);

          for (const [warehouseType, warehouseId] of Object.entries(warehouses)) {
            await MenuStock.findOneAndUpdate(
              {
                menuItemId: menuItem._id,
                warehouseId: warehouseId
              },
              {
                calculatedStock: 0,
                currentStock: 0,
                lastCalculatedAt: new Date()
              },
              { upsert: true, session }
            );
          }
        }

        menuItem.availableStock = 0;
        menuItem.isActive = false;

        // Reset warehouse stocks
        menuItem.warehouseStocks = [];
        await menuItem.save({ session });
        continue;
      }

      const workstation = menuItem.workstation;
      let totalAvailableStock = 0;
      const warehouseStocksUpdate = [];

      if (workstation) {
        const warehouses = await getWorkstationWarehouseMapping(workstation);

        for (const [warehouseType, warehouseId] of Object.entries(warehouses)) {
          // Filter hanya baseIngredients yang isDefault = true
          const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
          let calculatedStock = 0;

          if (defaultIngredients.length) {
            calculatedStock = await calculateMaxPortionsForWarehouse(defaultIngredients, warehouseId);
          }

          // Update atau buat MenuStock untuk warehouse ini
          const menuStock = await MenuStock.findOneAndUpdate(
            {
              menuItemId: menuItem._id,
              warehouseId: warehouseId
            },
            {
              calculatedStock,
              currentStock: calculatedStock,
              manualStock: null,
              lastCalculatedAt: new Date()
            },
            {
              upsert: true,
              new: true,
              session
            }
          );

          totalAvailableStock += menuStock.effectiveStock;

          warehouseStocksUpdate.push({
            warehouseId: warehouseId,
            stock: menuStock.effectiveStock,
            workstation: workstation
          });
        }
      }

      // Update MenuItem dengan warehouse stocks
      menuItem.warehouseStocks = warehouseStocksUpdate;
      menuItem.availableStock = totalAvailableStock;
      menuItem.isActive = totalAvailableStock > 0;

      await menuItem.save({ session });
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: 'Stok menu berhasil diperbarui untuk semua warehouse',
      data: menuItems.map(m => ({
        _id: m._id,
        name: m.name,
        category: m.category?.name,
        workstation: m.workstation,
        availableStock: m.availableStock,
        warehouseStocks: m.warehouseStocks,
        isActive: m.isActive
      }))
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating menu available stock:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate stok menu'
    });
  } finally {
    session.endSession();
  }
};

// Ambil data stok menu dari MenuStock (dengan join ke MenuItem & category) untuk semua warehouse
export const getMenuStocks = async (req, res) => {
  try {
    const { warehouseId } = req.query;

    let query = {};
    if (warehouseId && mongoose.Types.ObjectId.isValid(warehouseId)) {
      query.warehouseId = warehouseId;
    }

    const stocks = await MenuStock.find(query)
      .populate({
        path: "menuItemId",
        select: "name category availableStock workstation warehouseStocks",
        populate: {
          path: "category",
          select: "name"
        }
      })
      .populate({
        path: "warehouseId",
        select: "name code type"
      })
      .lean();

    // Group by menu item untuk agregasi multi-warehouse
    const menuItemMap = new Map();

    stocks.forEach(s => {
      const menuItemId = s.menuItemId?._id?.toString();
      if (!menuItemId) return;

      if (!menuItemMap.has(menuItemId)) {
        menuItemMap.set(menuItemId, {
          _id: menuItemId,
          menuItemId: menuItemId, // Added for frontend compatibility
          name: s.menuItemId?.name,
          category: s.menuItemId?.category?.name || "-",
          workstation: s.menuItemId?.workstation,
          availableStock: s.menuItemId?.availableStock || 0,
          warehouseStocks: [],
          totalEffectiveStock: 0,
          calculatedStock: 0, // Init
          manualStock: 0, // Init
        });
      }

      const effectiveStock = s.manualStock !== null ? s.manualStock : s.calculatedStock;
      const currentItem = menuItemMap.get(menuItemId);

      currentItem.warehouseStocks.push({
        warehouseId: s.warehouseId?._id,
        warehouseName: s.warehouseId?.name || "Unknown",
        warehouseCode: s.warehouseId?.code,
        calculatedStock: s.calculatedStock,
        manualStock: s.manualStock,
        effectiveStock: effectiveStock,
        adjustmentNote: s.adjustmentNote,
        adjustedBy: s.adjustedBy,
        lastCalculatedAt: s.lastCalculatedAt,
        lastAdjustedAt: s.lastAdjustedAt
      });

      currentItem.totalEffectiveStock += effectiveStock;
      currentItem.calculatedStock += (s.calculatedStock || 0);
      if (s.manualStock !== null) {
        currentItem.manualStock += s.manualStock;
      }
    });

    const result = Array.from(menuItemMap.values()).map(item => ({
      ...item,
      effectiveStock: item.totalEffectiveStock, // Map this for frontend
      currentStock: item.totalEffectiveStock    // Map this too just in case
    }));

    res.status(200).json({
      success: true,
      message: "Data stok menu berhasil diambil",
      data: warehouseId ? stocks.map(s => ({
        _id: s._id,
        menuItemId: s.menuItemId?._id,
        menuItemName: s.menuItemId?.name,
        warehouseId: s.warehouseId?._id,
        warehouseName: s.warehouseId?.name,
        category: s.menuItemId?.category?.name || "-",
        calculatedStock: s.calculatedStock,
        manualStock: s.manualStock,
        effectiveStock: s.manualStock !== null ? s.manualStock : s.calculatedStock,
        adjustmentNote: s.adjustmentNote,
        adjustedBy: s.adjustedBy,
        lastCalculatedAt: s.lastCalculatedAt,
        lastAdjustedAt: s.lastAdjustedAt
      })) : result
    });
  } catch (error) {
    console.error("Error fetching menu stocks:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data stok menu"
    });
  }
};

/**
 * Update stok hanya untuk satu menuItem di semua warehouse terkait
 */
export const updateSingleMenuStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { menuItemId } = req.params;
    const { warehouseId } = req.query; // Optional: jika ingin update untuk warehouse tertentu

    if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({
        success: false,
        message: 'ID Menu tidak valid'
      });
    }

    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu tidak ditemukan'
      });
    }

    const recipe = await Recipe.findOne({ menuItemId: menuItem._id }).session(session);
    const workstation = menuItem.workstation;

    if (!workstation) {
      return res.status(400).json({
        success: false,
        message: 'Menu tidak memiliki workstation yang ditentukan'
      });
    }

    const warehouses = await getWorkstationWarehouseMapping(workstation);
    const warehouseStocksUpdate = [];
    let totalAvailableStock = 0;

    // Jika warehouseId di-spesifikasikan, hanya update warehouse tersebut
    if (warehouseId && mongoose.Types.ObjectId.isValid(warehouseId)) {
      if (!Object.values(warehouses).includes(warehouseId)) {
        return res.status(400).json({
          success: false,
          message: 'Warehouse tidak valid untuk workstation ini'
        });
      }

      let calculatedStock = 0;
      if (recipe?.baseIngredients?.length) {
        const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
        if (defaultIngredients.length) {
          calculatedStock = await calculateMaxPortionsForWarehouse(defaultIngredients, warehouseId);
        }
      }

      // Update MenuStock untuk warehouse tertentu
      let menuStockDoc = await MenuStock.findOne({
        menuItemId,
        warehouseId
      }).session(session);

      if (!menuStockDoc) {
        menuStockDoc = new MenuStock({
          menuItemId,
          warehouseId,
          calculatedStock,
          lastCalculatedAt: new Date(),
        });
      } else {
        if (menuStockDoc.manualStock === null) {
          menuStockDoc.calculatedStock = calculatedStock;
          menuStockDoc.currentStock = calculatedStock;
        }
        menuStockDoc.lastCalculatedAt = new Date();
      }

      await menuStockDoc.save({ session });

      // Update warehouse stock in menu item
      const effectiveStock = menuStockDoc.effectiveStock;
      const warehouseIndex = menuItem.warehouseStocks.findIndex(ws =>
        ws.warehouseId.toString() === warehouseId.toString()
      );

      if (warehouseIndex >= 0) {
        menuItem.warehouseStocks[warehouseIndex].stock = effectiveStock;
      } else {
        menuItem.warehouseStocks.push({
          warehouseId,
          stock: effectiveStock,
          workstation
        });
      }

      totalAvailableStock = menuItem.warehouseStocks.reduce((sum, ws) => sum + ws.stock, 0);

    } else {
      // Update untuk semua warehouse terkait
      for (const [warehouseType, whId] of Object.entries(warehouses)) {
        let calculatedStock = 0;
        if (recipe?.baseIngredients?.length) {
          const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
          if (defaultIngredients.length) {
            calculatedStock = await calculateMaxPortionsForWarehouse(defaultIngredients, whId);
          }
        }

        // Update MenuStock untuk setiap warehouse
        let menuStockDoc = await MenuStock.findOne({
          menuItemId,
          warehouseId: whId
        }).session(session);

        if (!menuStockDoc) {
          menuStockDoc = new MenuStock({
            menuItemId,
            warehouseId: whId,
            calculatedStock,
            lastCalculatedAt: new Date(),
          });
        } else {
          if (menuStockDoc.manualStock === null) {
            menuStockDoc.calculatedStock = calculatedStock;
            menuStockDoc.currentStock = calculatedStock;
          }
          menuStockDoc.lastCalculatedAt = new Date();
        }

        await menuStockDoc.save({ session });

        const effectiveStock = menuStockDoc.effectiveStock;
        totalAvailableStock += effectiveStock;

        warehouseStocksUpdate.push({
          warehouseId: whId,
          stock: effectiveStock,
          workstation
        });
      }

      // Update warehouse stocks array
      menuItem.warehouseStocks = warehouseStocksUpdate;
    }

    // Update MenuItem
    menuItem.availableStock = totalAvailableStock;
    menuItem.isActive = totalAvailableStock > 0;
    await menuItem.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: {
        menuItem: menuItem,
        totalAvailableStock,
        warehouseStocks: menuItem.warehouseStocks,
        isActive: menuItem.isActive
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating single menu stock:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate stok menu'
    });
  } finally {
    session.endSession();
  }
};

// PATCH /api/menu-stocks/:menuItemId/adjust - dengan support multi-warehouse
export const adjustMenuStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { menuItemId } = req.params;
    const {
      manualStock,
      adjustmentNote,
      adjustedBy,
      reason,
      wasteQuantity,
      warehouseId // Tambahkan warehouseId untuk multi-warehouse
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'ID Menu tidak valid'
      });
    }

    // Validasi warehouseId jika di-provide
    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      // Jika tidak di-specify, gunakan primary warehouse berdasarkan workstation
      const menuItem = await MenuItem.findById(menuItemId).session(session);
      if (!menuItem) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Menu tidak ditemukan'
        });
      }

      const workstation = menuItem.workstation;
      if (!workstation) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Menu tidak memiliki workstation'
        });
      }

      const warehouses = await getWorkstationWarehouseMapping(workstation);
      // Gunakan primary warehouse (biasanya yang pertama)
      targetWarehouseId = Object.values(warehouses)[0];

      if (!targetWarehouseId) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Tidak ada warehouse untuk workstation ini'
        });
      }
    }

    // Validasi untuk waste/pengurangan stok
    if (reason && wasteQuantity) {
      if (wasteQuantity <= 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Quantity waste harus lebih dari 0'
        });
      }

      const validReasons = ['busuk', 'tidak_bagus', 'kedaluwarsa', 'rusak', 'hilang', 'lainnya'];
      if (!validReasons.includes(reason)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Reason tidak valid. Pilihan: busuk, tidak_bagus, kedaluwarsa, rusak, hilang, lainnya'
        });
      }
    }

    // Handle reset stock untuk warehouse tertentu
    if (manualStock === '' || manualStock === null) {
      const menuStock = await MenuStock.findOne({
        menuItemId,
        warehouseId: targetWarehouseId
      }).session(session);

      if (!menuStock) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Stok menu tidak ditemukan untuk warehouse ini'
        });
      }

      // Hitung calculated stock berdasarkan bahan di warehouse ini
      const recipe = await Recipe.findOne({ menuItemId }).session(session);
      let calculatedStock = 0;

      if (recipe?.baseIngredients?.length) {
        const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
        if (defaultIngredients.length) {
          calculatedStock = await calculateMaxPortionsForWarehouse(defaultIngredients, targetWarehouseId);
        }
      }

      const effectiveStock = calculatedStock;

      // Reset manual stock untuk warehouse ini
      menuStock.manualStock = null;
      menuStock.calculatedStock = calculatedStock;
      menuStock.currentStock = calculatedStock;
      menuStock.adjustmentNote = 'Reset ke stok terhitung sistem';
      menuStock.adjustedBy = adjustedBy || null;
      menuStock.lastAdjustedAt = new Date();
      await menuStock.save({ session });

      // Update MenuItem warehouse stock
      const menuItem = await MenuItem.findById(menuItemId).session(session);
      const previousStatus = menuItem.isActive;

      // Update warehouse stock di array
      const warehouseIndex = menuItem.warehouseStocks.findIndex(ws =>
        ws.warehouseId.toString() === targetWarehouseId.toString()
      );

      if (warehouseIndex >= 0) {
        menuItem.warehouseStocks[warehouseIndex].stock = effectiveStock;
      } else {
        menuItem.warehouseStocks.push({
          warehouseId: targetWarehouseId,
          stock: effectiveStock,
          workstation: menuItem.workstation
        });
      }

      // Hitung total stock dari semua warehouse
      const totalAvailableStock = menuItem.warehouseStocks.reduce((sum, ws) => sum + ws.stock, 0);
      menuItem.availableStock = totalAvailableStock;
      menuItem.isActive = totalAvailableStock > 0; // Aktif jika ada stok di salah satu warehouse

      await menuItem.save({ session });

      const statusChange = previousStatus !== menuItem.isActive
        ? (menuItem.isActive ? 'activated' : 'deactivated')
        : null;

      await session.commitTransaction();

      // ✅ Emit socket dengan informasi warehouse
      const io = req.app.get('io');
      if (io) {
        io.emit('stock_updated', {
          menuItemId: menuItemId.toString(),
          warehouseId: targetWarehouseId.toString(),
          message: 'Stock Reset & Updated',
          stockData: {
            menuItemId: menuStock.menuItemId,
            warehouseId: targetWarehouseId,
            calculatedStock: menuStock.calculatedStock,
            manualStock: menuStock.manualStock,
            effectiveStock,
            isActive: menuItem.isActive,
            statusChange,
            lastAdjustedAt: menuStock.lastAdjustedAt
          },
          phase: 'instant',
          timestamp: new Date()
        });
      }

      // ✅ Kalibrasi background untuk semua warehouse
      console.log(`🔄 Memulai kalibrasi background untuk ${menuItemId} setelah reset stock...`);
      calibrateSingleMenuStockForAllWarehouses(menuItemId.toString())
        .then((calibrationResult) => {
          console.log(`✅ Kalibrasi background berhasil:`, calibrationResult);

          // Emit socket KEDUA: Update setelah kalibrasi
          if (io) {
            io.emit('stock_calibrated', {
              menuItemId: menuItemId.toString(),
              message: 'Stock Calibrated',
              data: calibrationResult,
              phase: 'calibrated',
              timestamp: new Date()
            });
          }
        })
        .catch((calibrationError) => {
          console.error(`⚠️ Kalibrasi background gagal (non-blocking):`, calibrationError.message);
        });

      return res.status(200).json({
        success: true,
        message: `Stok manual berhasil direset untuk warehouse ini${statusChange ? ' dan menu ' + (statusChange === 'activated' ? 'diaktifkan' : 'dinonaktifkan') : ''}`,
        data: {
          ...menuStock.toJSON(),
          warehouseId: targetWarehouseId,
          effectiveStock,
          totalAvailableStock,
          isActive: menuItem.isActive,
          statusChange,
          warehouseStocks: menuItem.warehouseStocks
        }
      });
    }

    // Validasi untuk input manual stock
    if (manualStock < 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Stok manual harus angka ≥ 0'
      });
    }

    // Cari atau buat MenuStock untuk warehouse ini
    let stockDoc = await MenuStock.findOne({
      menuItemId,
      warehouseId: targetWarehouseId
    }).session(session);

    const previousStock = stockDoc ? stockDoc.effectiveStock : 0;

    if (!stockDoc) {
      // Jika belum ada, hitung calculatedStock terlebih dahulu
      const recipe = await Recipe.findOne({ menuItemId }).session(session);
      let calculatedStock = 0;

      if (recipe?.baseIngredients?.length) {
        const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
        if (defaultIngredients.length) {
          calculatedStock = await calculateMaxPortionsForWarehouse(defaultIngredients, targetWarehouseId);
        }
      }

      stockDoc = new MenuStock({
        menuItemId,
        warehouseId: targetWarehouseId,
        calculatedStock,
        manualStock: manualStock,
        adjustmentNote,
        adjustedBy: adjustedBy || null,
        lastAdjustedAt: new Date(),
        lastCalculatedAt: new Date()
      });
    } else {
      stockDoc.manualStock = manualStock;
      stockDoc.adjustmentNote = adjustmentNote || null;
      stockDoc.adjustedBy = adjustedBy || null;
      stockDoc.lastAdjustedAt = new Date();
    }

    await stockDoc.save({ session });

    // ✅ Hitung effective stock untuk warehouse ini
    const effectiveStock = stockDoc.manualStock !== null ? stockDoc.manualStock : stockDoc.calculatedStock;

    // Update MenuItem warehouse stocks
    const menuItem = await MenuItem.findById(menuItemId).session(session);
    const previousStatus = menuItem.isActive;

    // Update warehouse stock di array
    const warehouseIndex = menuItem.warehouseStocks.findIndex(ws =>
      ws.warehouseId.toString() === targetWarehouseId.toString()
    );

    if (warehouseIndex >= 0) {
      menuItem.warehouseStocks[warehouseIndex].stock = effectiveStock;
    } else {
      menuItem.warehouseStocks.push({
        warehouseId: targetWarehouseId,
        stock: effectiveStock,
        workstation: menuItem.workstation
      });
    }

    // Hitung total stock dari semua warehouse
    const totalAvailableStock = menuItem.warehouseStocks.reduce((sum, ws) => sum + ws.stock, 0);
    menuItem.availableStock = totalAvailableStock;

    // Auto activate/deactivate berdasarkan total stok di semua warehouse
    let statusChange = null;
    if (totalAvailableStock > 0 && !menuItem.isActive) {
      menuItem.isActive = true;
      statusChange = 'activated';
      console.log(`🟢 Aktifkan ${menuItem.name} - total stok tersedia (${totalAvailableStock})`);
    } else if (totalAvailableStock <= 0 && menuItem.isActive) {
      menuItem.isActive = false;
      statusChange = 'deactivated';
      console.log(`🔴 Nonaktifkan ${menuItem.name} - total stok habis (${totalAvailableStock})`);
    }

    await menuItem.save({ session });

    // Handle waste/pengurangan stok dengan ProductStock Movement
    if (reason && wasteQuantity) {
      await handleWasteStockMovement(
        menuItemId,
        wasteQuantity,
        reason,
        adjustedBy,
        adjustmentNote,
        previousStock,
        effectiveStock,
        targetWarehouseId, // Tambahkan warehouseId
        session
      );
    }

    await session.commitTransaction();
    console.log('✅ Stok menu berhasil disesuaikan untuk warehouse:', targetWarehouseId);

    // ✅ Emit socket dengan informasi warehouse
    const io = req.app.get('io');
    if (io) {
      io.emit('stock_updated', {
        menuItemId: menuItemId.toString(),
        warehouseId: targetWarehouseId.toString(),
        message: 'Stock Updated',
        stockData: {
          menuItemId: stockDoc.menuItemId,
          warehouseId: targetWarehouseId,
          calculatedStock: stockDoc.calculatedStock,
          manualStock: stockDoc.manualStock,
          effectiveStock,
          totalAvailableStock,
          isActive: menuItem.isActive,
          statusChange,
          lastAdjustedAt: stockDoc.lastAdjustedAt
        },
        phase: 'instant',
        timestamp: new Date()
      });

      // Emit khusus ke cashier room
      io.to('join_cashier_room').emit('update_stock', {
        message: 'Stock Updated',
        data: {
          ...stockDoc.toJSON(),
          effectiveStock,
          totalAvailableStock,
          isActive: menuItem.isActive,
          statusChange
        }
      });
    }

    // ✅ Kalibrasi background untuk semua warehouse
    console.log(`🔄 Memulai kalibrasi background untuk ${menuItemId} setelah adjust stock...`);
    calibrateSingleMenuStockForAllWarehouses(menuItemId.toString())
      .then((calibrationResult) => {
        console.log(`✅ Kalibrasi background berhasil:`, calibrationResult);

        // Emit socket KEDUA: Update setelah kalibrasi
        if (io) {
          io.emit('stock_calibrated', {
            menuItemId: menuItemId.toString(),
            message: 'Stock Calibrated',
            data: calibrationResult,
            phase: 'calibrated',
            timestamp: new Date()
          });

          io.to('join_cashier_room').emit('stock_calibrated', {
            message: 'Stock Calibrated',
            menuItemId,
            data: calibrationResult
          });
        }
      })
      .catch((calibrationError) => {
        console.error(`⚠️ Kalibrasi background gagal (non-blocking):`, calibrationError.message);
      });

    // ✅ Response langsung tanpa menunggu kalibrasi
    res.status(200).json({
      success: true,
      message: `Stok menu berhasil disesuaikan untuk warehouse ini${statusChange ? ' dan menu ' + (statusChange === 'activated' ? 'diaktifkan' : 'dinonaktifkan') : ''}`,
      data: {
        ...stockDoc.toJSON(),
        effectiveStock,
        totalAvailableStock,
        isActive: menuItem.isActive,
        statusChange,
        warehouseStocks: menuItem.warehouseStocks
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error adjusting menu stock:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menyesuaikan stok'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Fungsi untuk menangani waste/pengurangan stok dan mencatat di ProductStock Movement (multi-warehouse)
 */
const handleWasteStockMovement = async (
  menuItemId,
  wasteQuantity,
  reason,
  handledBy,
  notes,
  previousStock,
  currentStock,
  warehouseId, // Tambahkan warehouseId parameter
  session
) => {
  try {
    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (!menuItem) {
      throw new Error('Menu item tidak ditemukan');
    }

    const recipe = await Recipe.findOne({ menuItemId }).session(session);
    if (!recipe || !recipe.baseIngredients || recipe.baseIngredients.length === 0) {
      throw new Error('Resep tidak ditemukan untuk menu item ini');
    }

    const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);

    for (const ingredient of defaultIngredients) {
      const productId = ingredient.productId;
      const quantityPerPortion = ingredient.quantity;
      const totalWasteQuantity = quantityPerPortion * wasteQuantity;

      // Cari ProductStock untuk warehouse ini
      let productStock = await ProductStock.findOne({
        productId: productId,
        warehouse: warehouseId
      }).session(session);

      if (!productStock) {
        // Jika belum ada di warehouse ini, buat baru
        productStock = new ProductStock({
          productId: productId,
          currentStock: 0,
          minStock: 0,
          warehouse: warehouseId
        });
        await productStock.save({ session });
      }

      // Buat movement record untuk waste
      const wasteMovement = {
        quantity: totalWasteQuantity,
        type: 'out',
        referenceId: menuItemId,
        notes: `Waste: ${reason} - ${notes || 'Pengurangan stok karena barang tidak layak'}. Menu: ${menuItem.name}, Qty: ${wasteQuantity}, Warehouse: ${warehouseId}`,
        sourceWarehouse: warehouseId,
        handledBy: handledBy || 'system',
        date: new Date()
      };

      // Update current stock dan tambahkan movement
      productStock.currentStock = Math.max(0, productStock.currentStock - totalWasteQuantity);
      productStock.movements.push(wasteMovement);

      await productStock.save({ session });

      console.log(`Waste recorded for product ${productId} in warehouse ${warehouseId}: ${totalWasteQuantity} ${reason}`);
    }

    // Catat juga di MenuStock Movement
    await recordMenuStockMovement(
      menuItemId,
      warehouseId,
      'waste',
      wasteQuantity,
      reason,
      handledBy,
      notes,
      previousStock,
      currentStock,
      session
    );

  } catch (error) {
    console.error('Error handling waste stock movement:', error);
    throw error;
  }
};

/**
 * Fungsi untuk mencatat movement di MenuStock (multi-warehouse)
 */
const recordMenuStockMovement = async (
  menuItemId,
  warehouseId,
  type,
  quantity,
  reason,
  handledBy,
  notes,
  previousStock,
  currentStock,
  session
) => {
  try {
    // Update MenuStock dengan movement info
    await MenuStock.findOneAndUpdate(
      {
        menuItemId: menuItemId,
        warehouseId: warehouseId
      },
      {
        $push: {
          movements: {
            type: type,
            quantity: quantity,
            reason: reason,
            previousStock: previousStock,
            currentStock: currentStock,
            handledBy: handledBy || 'system',
            notes: notes,
            date: new Date()
          }
        }
      },
      { session }
    );

  } catch (error) {
    console.error('Error recording menu stock movement:', error);
  }
};

// Endpoint khusus untuk waste/pengurangan stok (multi-warehouse)
export const recordWasteStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { menuItemId } = req.params;
    const {
      wasteQuantity,
      reason,
      notes,
      handledBy,
      warehouseId // Tambahkan warehouseId
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'ID Menu tidak valid'
      });
    }

    // Validasi warehouseId
    if (!warehouseId || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Warehouse ID tidak valid'
      });
    }

    // Validasi input
    if (!wasteQuantity || wasteQuantity <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Quantity waste harus lebih dari 0'
      });
    }

    if (!reason) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Reason wajib diisi'
      });
    }

    const validReasons = ['busuk', 'tidak_bagus', 'kedaluwarsa', 'rusak', 'hilang', 'lainnya'];
    if (!validReasons.includes(reason)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Reason tidak valid. Pilihan: busuk, tidak_bagus, kedaluwarsa, rusak, hilang, lainnya'
      });
    }

    // Dapatkan current stock untuk warehouse ini
    const menuStock = await MenuStock.findOne({
      menuItemId,
      warehouseId
    }).session(session);

    if (!menuStock) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Stok menu tidak ditemukan untuk warehouse ini'
      });
    }

    const previousStock = menuStock.effectiveStock;

    // Kurangi manual stock untuk warehouse ini
    const newManualStock = Math.max(0, (menuStock.manualStock || menuStock.calculatedStock) - wasteQuantity);
    menuStock.manualStock = newManualStock;
    menuStock.lastAdjustedAt = new Date();
    await menuStock.save({ session });

    // Update MenuItem warehouse stock
    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (menuItem) {
      const warehouseIndex = menuItem.warehouseStocks.findIndex(ws =>
        ws.warehouseId.toString() === warehouseId.toString()
      );

      if (warehouseIndex >= 0) {
        menuItem.warehouseStocks[warehouseIndex].stock = menuStock.effectiveStock;
      }

      // Update total available stock
      const totalAvailableStock = menuItem.warehouseStocks.reduce((sum, ws) => sum + ws.stock, 0);
      menuItem.availableStock = totalAvailableStock;
      menuItem.isActive = totalAvailableStock > 0;

      await menuItem.save({ session });
    }

    // Catat di ProductStock Movement untuk warehouse ini
    await handleWasteStockMovement(
      menuItemId,
      wasteQuantity,
      reason,
      handledBy,
      notes,
      previousStock,
      menuStock.effectiveStock,
      warehouseId,
      session
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Waste stok berhasil dicatat: ${wasteQuantity} porsi (${reason}) di warehouse ${warehouseId}`,
      data: {
        menuItemId,
        warehouseId,
        previousStock,
        currentStock: menuStock.effectiveStock,
        wasteQuantity,
        reason,
        totalAvailableStock: menuItem?.availableStock || 0,
        isActive: menuItem?.isActive || false
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error recording waste stock:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mencatat waste stok'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Lihat detail stok menu beserta komponen bahan (multi-warehouse)
 */
export const getMenuStockDetails = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { warehouseId } = req.query; // Optional filter by warehouse

    if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({
        success: false,
        message: 'ID Menu tidak valid'
      });
    }

    const menuItem = await MenuItem.findById(menuItemId)
      .populate('toppings.name', 'name')
      .populate('warehouseStocks.warehouseId', 'name code');

    const recipe = await Recipe.findOne({ menuItemId }).populate('baseIngredients.productId');

    let menuStocks;
    if (warehouseId) {
      menuStocks = await MenuStock.find({
        menuItemId,
        warehouseId
      }).populate('warehouseId', 'name code');
    } else {
      menuStocks = await MenuStock.find({
        menuItemId
      }).populate('warehouseId', 'name code');
    }

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Resep tidak ditemukan'
      });
    }

    // Get all warehouses for this menu item's workstation
    let allWarehouses = [];
    if (menuItem.workstation) {
      const warehouseMapping = await getWorkstationWarehouseMapping(menuItem.workstation);
      allWarehouses = Object.entries(warehouseMapping).map(([type, id]) => ({
        type,
        warehouseId: id
      }));
    }

    const details = {
      menuItem: {
        _id: menuItem._id,
        name: menuItem.name,
        availableStock: menuItem.availableStock,
        workstation: menuItem.workstation,
        warehouseStocks: menuItem.warehouseStocks,
        isActive: menuItem.isActive
      },
      allWarehouses: allWarehouses.map(w => ({
        warehouseType: w.type,
        warehouseId: w.warehouseId
      })),
      stockInfo: menuStocks.map(stock => ({
        warehouseId: stock.warehouseId?._id,
        warehouseName: stock.warehouseId?.name,
        warehouseCode: stock.warehouseId?.code,
        calculatedStock: stock.calculatedStock || 0,
        manualStock: stock.manualStock,
        effectiveStock: stock.effectiveStock || 0,
        lastCalculatedAt: stock.lastCalculatedAt,
        lastAdjustedAt: stock.lastAdjustedAt
      })),
      baseIngredients: recipe.baseIngredients.map(ing => {
        const ingredientDetails = {
          productId: ing.productId._id,
          productName: ing.productName,
          productSku: ing.productSku,
          quantityRequired: ing.quantity,
          unit: ing.unit,
          isDefault: ing.isDefault || false,
          warehouseStocks: []
        };

        // Add stock info for each warehouse
        allWarehouses.forEach(w => {
          ingredientDetails.warehouseStocks.push({
            warehouseId: w.warehouseId,
            warehouseType: w.type,
            currentStock: 0,
            portionFromThisItem: 0
          });
        });

        return ingredientDetails;
      }),
      toppingOptions: recipe.toppingOptions.map(t => ({
        toppingName: t.toppingName,
        ingredients: t.ingredients.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantityRequired: i.quantity,
          unit: i.unit
        }))
      })),
      addonOptions: recipe.addonOptions.map(a => ({
        addonName: a.addonName,
        optionLabel: a.optionLabel,
        ingredients: a.ingredients.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantityRequired: i.quantity,
          unit: i.unit
        }))
      }))
    };

    // Isi stok aktual & hitung portion dari tiap bahan per warehouse
    for (const ing of details.baseIngredients) {
      for (const ws of ing.warehouseStocks) {
        const stockDoc = await ProductStock.findOne({
          productId: ing.productId,
          warehouse: ws.warehouseId
        });

        ws.currentStock = stockDoc?.currentStock ?? 0;
        if (ing.quantityRequired > 0) {
          ws.portionFromThisItem = Math.floor(ws.currentStock / ing.quantityRequired);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: details
    });

  } catch (error) {
    console.error('Error fetching menu stock details:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail stok menu'
    });
  }
};

/**
 * Transfer stock antar warehouse untuk menu item
 */
export const transferMenuStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { menuItemId } = req.params;
    const {
      fromWarehouseId,
      toWarehouseId,
      quantity,
      reason,
      handledBy,
      notes
    } = req.body;

    if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({
        success: false,
        message: 'ID Menu tidak valid'
      });
    }

    // Validasi input
    if (!fromWarehouseId || !toWarehouseId) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse sumber dan tujuan harus diisi'
      });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse sumber dan tujuan tidak boleh sama'
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity harus lebih dari 0'
      });
    }

    // Cek stok di warehouse sumber
    const sourceStock = await MenuStock.findOne({
      menuItemId,
      warehouseId: fromWarehouseId
    }).session(session);

    if (!sourceStock || sourceStock.effectiveStock < quantity) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Stok tidak mencukupi di warehouse sumber'
      });
    }

    // Kurangi stok di warehouse sumber
    const sourcePreviousStock = sourceStock.effectiveStock;
    const sourceNewStock = sourcePreviousStock - quantity;

    sourceStock.manualStock = sourceNewStock;
    sourceStock.lastAdjustedAt = new Date();
    sourceStock.adjustmentNote = `Transfer ke ${toWarehouseId}: ${notes || reason}`;
    sourceStock.adjustedBy = handledBy || 'system';
    await sourceStock.save({ session });

    // Tambah stok di warehouse tujuan
    let targetStock = await MenuStock.findOne({
      menuItemId,
      warehouseId: toWarehouseId
    }).session(session);

    const targetPreviousStock = targetStock ? targetStock.effectiveStock : 0;
    const targetNewStock = targetPreviousStock + quantity;

    if (!targetStock) {
      targetStock = new MenuStock({
        menuItemId,
        warehouseId: toWarehouseId,
        manualStock: targetNewStock,
        adjustmentNote: `Transfer dari ${fromWarehouseId}: ${notes || reason}`,
        adjustedBy: handledBy || 'system',
        lastAdjustedAt: new Date()
      });
    } else {
      targetStock.manualStock = targetNewStock;
      targetStock.adjustmentNote = `Transfer dari ${fromWarehouseId}: ${notes || reason}`;
      targetStock.adjustedBy = handledBy || 'system';
      targetStock.lastAdjustedAt = new Date();
    }

    await targetStock.save({ session });

    // Update MenuItem warehouse stocks
    const menuItem = await MenuItem.findById(menuItemId).session(session);

    // Update source warehouse stock
    const sourceIndex = menuItem.warehouseStocks.findIndex(ws =>
      ws.warehouseId.toString() === fromWarehouseId.toString()
    );

    if (sourceIndex >= 0) {
      menuItem.warehouseStocks[sourceIndex].stock = sourceNewStock;
    } else {
      menuItem.warehouseStocks.push({
        warehouseId: fromWarehouseId,
        stock: sourceNewStock,
        workstation: menuItem.workstation
      });
    }

    // Update target warehouse stock
    const targetIndex = menuItem.warehouseStocks.findIndex(ws =>
      ws.warehouseId.toString() === toWarehouseId.toString()
    );

    if (targetIndex >= 0) {
      menuItem.warehouseStocks[targetIndex].stock = targetNewStock;
    } else {
      menuItem.warehouseStocks.push({
        warehouseId: toWarehouseId,
        stock: targetNewStock,
        workstation: menuItem.workstation
      });
    }

    // Update total available stock
    const totalAvailableStock = menuItem.warehouseStocks.reduce((sum, ws) => sum + ws.stock, 0);
    menuItem.availableStock = totalAvailableStock;
    menuItem.isActive = totalAvailableStock > 0;

    await menuItem.save({ session });

    // Catat transfer history
    await recordMenuStockMovement(
      menuItemId,
      fromWarehouseId,
      'transfer_out',
      quantity,
      reason || 'stock_transfer',
      handledBy,
      `Transfer ke ${toWarehouseId}: ${notes || ''}`,
      sourcePreviousStock,
      sourceNewStock,
      session
    );

    await recordMenuStockMovement(
      menuItemId,
      toWarehouseId,
      'transfer_in',
      quantity,
      reason || 'stock_transfer',
      handledBy,
      `Transfer dari ${fromWarehouseId}: ${notes || ''}`,
      targetPreviousStock,
      targetNewStock,
      session
    );

    await session.commitTransaction();

    // Emit socket update
    const io = req.app.get('io');
    if (io) {
      io.emit('stock_transferred', {
        menuItemId: menuItemId.toString(),
        message: 'Stock Transferred',
        data: {
          fromWarehouseId,
          toWarehouseId,
          quantity,
          sourceNewStock,
          targetNewStock,
          totalAvailableStock,
          isActive: menuItem.isActive
        },
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: `Transfer stok berhasil: ${quantity} porsi dari ${fromWarehouseId} ke ${toWarehouseId}`,
      data: {
        menuItemId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        sourceStock: sourceNewStock,
        targetStock: targetNewStock,
        totalAvailableStock,
        isActive: menuItem.isActive,
        timestamp: new Date()
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error transferring menu stock:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal transfer stok'
    });
  } finally {
    session.endSession();
  }
};

// 🔹 Membuat resep baru (dengan warehouse context)
export const createRecipe = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { menuItemId, baseIngredients, toppingOptions, addonOptions } = req.body;

    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu tidak ditemukan'
      });
    }

    if (!Array.isArray(baseIngredients) || baseIngredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Harus ada bahan utama'
      });
    }

    const existingRecipe = await Recipe.findOne({ menuItemId }).session(session);
    if (existingRecipe) {
      return res.status(400).json({
        success: false,
        message: 'Resep untuk menu ini sudah ada, gunakan update endpoint'
      });
    }

    const newRecipe = new Recipe({
      menuItemId,
      baseIngredients,
      toppingOptions: toppingOptions || [],
      addonOptions: addonOptions || []
    });

    await newRecipe.save({ session });

    // Update status menu
    if (!menuItem.isActive) {
      menuItem.isActive = true;
    }

    // Hitung HPP
    const newCostPrice = await calculateCostPrice(menuItemId, newRecipe);
    menuItem.costPrice = newCostPrice;

    // Jika ada workstation, hitung initial stock untuk semua warehouse
    if (menuItem.workstation) {
      const warehouses = await getWorkstationWarehouseMapping(menuItem.workstation);
      const warehouseStocksUpdate = [];
      let totalAvailableStock = 0;

      for (const [warehouseType, whId] of Object.entries(warehouses)) {
        const defaultIngredients = newRecipe.baseIngredients.filter(ing => ing.isDefault);
        let calculatedStock = 0;

        if (defaultIngredients.length) {
          calculatedStock = await calculateMaxPortionsForWarehouse(defaultIngredients, whId);
        }

        // Buat MenuStock untuk setiap warehouse
        await MenuStock.create([{
          menuItemId,
          warehouseId: whId,
          calculatedStock,
          currentStock: calculatedStock,
          lastCalculatedAt: new Date()
        }], { session });

        totalAvailableStock += calculatedStock;
        warehouseStocksUpdate.push({
          warehouseId: whId,
          stock: calculatedStock,
          workstation: menuItem.workstation
        });
      }

      // Update MenuItem dengan warehouse stocks
      menuItem.warehouseStocks = warehouseStocksUpdate;
      menuItem.availableStock = totalAvailableStock;
      menuItem.isActive = totalAvailableStock > 0;
    }

    await menuItem.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: newRecipe,
      menuItem: {
        _id: menuItem._id,
        name: menuItem.name,
        costPrice: menuItem.costPrice,
        availableStock: menuItem.availableStock,
        warehouseStocks: menuItem.warehouseStocks,
        isActive: menuItem.isActive
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating recipe:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat resep',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};


// 🔹 Lihat semua resep
export const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('menuItemId', 'name price category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes
    });

  } catch (error) {
    console.error('Error fetching recipes:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar resep'
    });
  }
};

// 🔹 Lihat detail resep
export const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID Resep tidak valid' });
    }

    const recipe = await Recipe.findById(id)
      .populate('menuItemId', 'name price category');

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      data: recipe
    });

  } catch (error) {
    console.error('Error fetching recipe by ID:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail resep'
    });
  }
};

// 🔹 Edit resep
export const updateRecipe = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { baseIngredients, toppingOptions, addonOptions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID Resep tidak valid' });
    }

    const recipe = await Recipe.findById(id).session(session);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    // Update field
    if (baseIngredients) recipe.baseIngredients = baseIngredients;
    if (toppingOptions !== undefined) recipe.toppingOptions = toppingOptions;
    if (addonOptions !== undefined) recipe.addonOptions = addonOptions;

    await recipe.save({ session });

    // Hitung ulang HPP setelah update bahan
    const newCostPrice = await calculateCostPrice(recipe.menuItemId);
    await MenuItem.findByIdAndUpdate(recipe.menuItemId, { costPrice: newCostPrice }, { session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Resep berhasil diupdate dan HPP diperbarui',
      data: recipe
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating recipe:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate resep'
    });
  } finally {
    session.endSession();
  }
};

// 🔹 Hapus resep
export const deleteRecipe = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID Resep tidak valid' });
    }

    const recipe = await Recipe.findByIdAndDelete(id).session(session);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Resep berhasil dihapus'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting recipe:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus resep'
    });
  } finally {
    session.endSession();
  }
};

// 🔹 Cari resep berdasarkan ID menu
export const getRecipeByMenuId = async (req, res) => {
  try {
    const { menuId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(menuId)) {
      return res.status(400).json({ success: false, message: 'ID Menu tidak valid' });
    }

    const recipe = await Recipe.findOne({ menuItemId: menuId })
      .populate('menuItemId', 'name price category');

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      data: recipe
    });

  } catch (error) {
    console.error('Error fetching recipe by menu ID:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil resep'
    });
  }
};

/**
 * Controller untuk mengambil recipe yang menggunakan produk tertentu
 * GET /api/recipes/by-product/:productId
 */
export const getRecipesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID Produk tidak valid'
      });
    }

    // Cari semua recipe yang menggunakan produk ini di baseIngredients
    const recipesWithProduct = await Recipe.find({
      $or: [
        { 'baseIngredients.productId': productId },
        { 'toppingOptions.ingredients.productId': productId },
        { 'addonOptions.ingredients.productId': productId }
      ]
    })
      .populate('menuItemId', 'name price category availableStock isActive')
      .populate('baseIngredients.productId', 'name sku unit suppliers')
      .populate('toppingOptions.ingredients.productId', 'name sku unit suppliers')
      .populate('addonOptions.ingredients.productId', 'name sku unit suppliers')
      .sort({ createdAt: -1 });

    if (!recipesWithProduct.length) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada recipe yang menggunakan produk ini',
        data: []
      });
    }

    // Format response dengan detail penggunaan produk
    const formattedRecipes = recipesWithProduct.map(recipe => {
      const recipeObj = recipe.toObject();

      // Cari di baseIngredients
      const inBaseIngredients = recipe.baseIngredients.filter(
        ing => ing.productId && ing.productId._id.toString() === productId
      );

      // Cari di toppingOptions
      const inToppingOptions = [];
      recipe.toppingOptions.forEach(topping => {
        topping.ingredients.forEach(ing => {
          if (ing.productId && ing.productId._id.toString() === productId) {
            inToppingOptions.push({
              toppingName: topping.toppingName,
              quantity: ing.quantity,
              unit: ing.unit
            });
          }
        });
      });

      // Cari di addonOptions
      const inAddonOptions = [];
      recipe.addonOptions.forEach(addon => {
        addon.ingredients.forEach(ing => {
          if (ing.productId && ing.productId._id.toString() === productId) {
            inAddonOptions.push({
              addonName: addon.addonName,
              optionLabel: addon.optionLabel,
              quantity: ing.quantity,
              unit: ing.unit
            });
          }
        });
      });

      return {
        _id: recipeObj._id,
        menuItem: recipeObj.menuItemId ? {
          _id: recipeObj.menuItemId._id,
          name: recipeObj.menuItemId.name,
          price: recipeObj.menuItemId.price,
          category: recipeObj.menuItemId.category,
          availableStock: recipeObj.menuItemId.availableStock,
          isActive: recipeObj.menuItemId.isActive
        } : null,
        productUsage: {
          inBaseIngredients: inBaseIngredients.map(ing => ({
            quantity: ing.quantity,
            unit: ing.unit,
            isDefault: ing.isDefault || false
          })),
          inToppingOptions,
          inAddonOptions
        },
        totalUsageLocations: inBaseIngredients.length + inToppingOptions.length + inAddonOptions.length,
        createdAt: recipeObj.createdAt,
        updatedAt: recipeObj.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      message: `Ditemukan ${formattedRecipes.length} recipe yang menggunakan produk ini`,
      data: formattedRecipes
    });

  } catch (error) {
    console.error('Error fetching recipes by product:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data recipe berdasarkan produk'
    });
  }
};

/**
 * Controller untuk mengambil recipe dengan detail stok bahan
 * GET /api/recipes/by-product/:productId/with-stock
 */
export const getRecipesByProductWithStock = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID Produk tidak valid'
      });
    }

    // Cari produk terlebih dahulu untuk mendapatkan informasi stok
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    // Cari stok produk
    const productStock = await ProductStock.findOne({ productId });

    // Cari semua recipe yang menggunakan produk ini
    const recipesWithProduct = await Recipe.find({
      $or: [
        { 'baseIngredients.productId': productId },
        { 'toppingOptions.ingredients.productId': productId },
        { 'addonOptions.ingredients.productId': productId }
      ]
    })
      .populate('menuItemId', 'name price category availableStock isActive')
      .populate('baseIngredients.productId', 'name sku unit suppliers')
      .populate('toppingOptions.ingredients.productId', 'name sku unit suppliers')
      .populate('addonOptions.ingredients.productId', 'name sku unit suppliers')
      .sort({ createdAt: -1 });

    if (!recipesWithProduct.length) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada recipe yang menggunakan produk ini',
        data: []
      });
    }

    // Format response dengan informasi stok
    const formattedRecipes = await Promise.all(
      recipesWithProduct.map(async (recipe) => {
        const recipeObj = recipe.toObject();

        // Hitung total penggunaan produk dalam recipe
        let totalUsage = 0;
        const usageDetails = [];

        // Base ingredients
        recipe.baseIngredients.forEach(ing => {
          if (ing.productId && ing.productId._id.toString() === productId) {
            totalUsage += ing.quantity;
            usageDetails.push({
              type: 'base',
              location: 'Bahan Utama',
              quantity: ing.quantity,
              unit: ing.unit,
              isDefault: ing.isDefault || false
            });
          }
        });

        // Topping options
        recipe.toppingOptions.forEach(topping => {
          topping.ingredients.forEach(ing => {
            if (ing.productId && ing.productId._id.toString() === productId) {
              totalUsage += ing.quantity;
              usageDetails.push({
                type: 'topping',
                location: `Topping: ${topping.toppingName}`,
                quantity: ing.quantity,
                unit: ing.unit
              });
            }
          });
        });

        // Addon options
        recipe.addonOptions.forEach(addon => {
          addon.ingredients.forEach(ing => {
            if (ing.productId && ing.productId._id.toString() === productId) {
              totalUsage += ing.quantity;
              usageDetails.push({
                type: 'addon',
                location: `Addon: ${addon.addonName} - ${addon.optionLabel}`,
                quantity: ing.quantity,
                unit: ing.unit
              });
            }
          });
        });

        // Hitung estimasi porsi yang bisa dibuat berdasarkan stok produk ini
        const estimatedPortions = productStock?.currentStock
          ? Math.floor(productStock.currentStock / totalUsage)
          : 0;

        return {
          _id: recipeObj._id,
          menuItem: recipeObj.menuItemId ? {
            _id: recipeObj.menuItemId._id,
            name: recipeObj.menuItemId.name,
            price: recipeObj.menuItemId.price,
            category: recipeObj.menuItemId.category,
            availableStock: recipeObj.menuItemId.availableStock,
            isActive: recipeObj.menuItemId.isActive
          } : null,
          productInfo: {
            productId: product._id,
            productName: product.name,
            productSku: product.sku,
            currentStock: productStock?.currentStock || 0,
            unit: product.unit
          },
          usageDetails,
          totalUsage,
          estimatedPortions,
          stockStatus: estimatedPortions > 0 ? 'available' : 'out_of_stock',
          createdAt: recipeObj.createdAt,
          updatedAt: recipeObj.updatedAt
        };
      })
    );

    res.status(200).json({
      success: true,
      message: `Ditemukan ${formattedRecipes.length} recipe yang menggunakan produk ini`,
      productInfo: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        currentStock: productStock?.currentStock || 0,
        unit: product.unit
      },
      data: formattedRecipes
    });

  } catch (error) {
    console.error('Error fetching recipes by product with stock:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data recipe berdasarkan produk dengan informasi stok'
    });
  }
};

/**
 * Controller untuk mencari recipe berdasarkan nama produk
 * GET /api/recipes/by-product-name?productName=...
 */
export const getRecipesByProductName = async (req, res) => {
  try {
    const { productName } = req.query;

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: 'Nama produk harus diisi'
      });
    }

    // Cari produk berdasarkan nama (case insensitive)
    const products = await Product.find({
      name: { $regex: productName, $options: 'i' }
    });

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: `Tidak ditemukan produk dengan nama mengandung '${productName}'`,
        data: []
      });
    }

    const productIds = products.map(p => p._id);

    // Cari recipe yang menggunakan produk-produk tersebut
    const recipesWithProducts = await Recipe.find({
      $or: [
        { 'baseIngredients.productId': { $in: productIds } },
        { 'toppingOptions.ingredients.productId': { $in: productIds } },
        { 'addonOptions.ingredients.productId': { $in: productIds } }
      ]
    })
      .populate('menuItemId', 'name price category availableStock isActive')
      .populate('baseIngredients.productId', 'name sku unit suppliers')
      .populate('toppingOptions.ingredients.productId', 'name sku unit suppliers')
      .populate('addonOptions.ingredients.productId', 'name sku unit suppliers')
      .sort({ createdAt: -1 });

    if (!recipesWithProducts.length) {
      return res.status(404).json({
        success: false,
        message: `Tidak ada recipe yang menggunakan produk dengan nama '${productName}'`,
        data: []
      });
    }

    // Format response
    const formattedRecipes = recipesWithProducts.map(recipe => {
      const recipeObj = recipe.toObject();

      // Cari semua produk yang match dalam recipe ini
      const matchedProducts = [];

      // Base ingredients
      recipe.baseIngredients.forEach(ing => {
        if (ing.productId && productIds.includes(ing.productId._id)) {
          matchedProducts.push({
            productId: ing.productId._id,
            productName: ing.productId.name,
            type: 'base',
            location: 'Bahan Utama',
            quantity: ing.quantity,
            unit: ing.unit,
            isDefault: ing.isDefault || false
          });
        }
      });

      // Topping options
      recipe.toppingOptions.forEach(topping => {
        topping.ingredients.forEach(ing => {
          if (ing.productId && productIds.includes(ing.productId._id)) {
            matchedProducts.push({
              productId: ing.productId._id,
              productName: ing.productId.name,
              type: 'topping',
              location: `Topping: ${topping.toppingName}`,
              quantity: ing.quantity,
              unit: ing.unit
            });
          }
        });
      });

      // Addon options
      recipe.addonOptions.forEach(addon => {
        addon.ingredients.forEach(ing => {
          if (ing.productId && productIds.includes(ing.productId._id)) {
            matchedProducts.push({
              productId: ing.productId._id,
              productName: ing.productId.name,
              type: 'addon',
              location: `Addon: ${addon.addonName} - ${addon.optionLabel}`,
              quantity: ing.quantity,
              unit: ing.unit
            });
          }
        });
      });

      return {
        _id: recipeObj._id,
        menuItem: recipeObj.menuItemId ? {
          _id: recipeObj.menuItemId._id,
          name: recipeObj.menuItemId.name,
          price: recipeObj.menuItemId.price,
          category: recipeObj.menuItemId.category,
          availableStock: recipeObj.menuItemId.availableStock,
          isActive: recipeObj.menuItemId.isActive
        } : null,
        matchedProducts,
        totalMatchedProducts: matchedProducts.length,
        createdAt: recipeObj.createdAt,
        updatedAt: recipeObj.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      message: `Ditemukan ${formattedRecipes.length} recipe yang menggunakan produk dengan nama '${productName}'`,
      searchQuery: productName,
      matchedProducts: products.map(p => ({
        _id: p._id,
        name: p.name,
        sku: p.sku,
        unit: p.unit
      })),
      data: formattedRecipes
    });

  } catch (error) {
    console.error('Error fetching recipes by product name:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mencari recipe berdasarkan nama produk'
    });
  }
};

/**
 * Controller untuk mendapatkan ringkasan penggunaan produk di semua recipe
 * GET /api/products/:productId/recipe-usage-summary
 */
export const getProductRecipeUsageSummary = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID Produk tidak valid'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    // Cari semua recipe yang menggunakan produk ini
    const recipes = await Recipe.find({
      $or: [
        { 'baseIngredients.productId': productId },
        { 'toppingOptions.ingredients.productId': productId },
        { 'addonOptions.ingredients.productId': productId }
      ]
    })
      .populate('menuItemId', 'name price category availableStock isActive');

    const productStock = await ProductStock.findOne({ productId });

    // Hitung statistik
    let totalRecipes = recipes.length;
    let totalUsageInBase = 0;
    let totalUsageInToppings = 0;
    let totalUsageInAddons = 0;
    let activeMenuItems = 0;

    recipes.forEach(recipe => {
      // Base ingredients
      recipe.baseIngredients.forEach(ing => {
        if (ing.productId && ing.productId.toString() === productId) {
          totalUsageInBase += ing.quantity;
        }
      });

      // Topping options
      recipe.toppingOptions.forEach(topping => {
        topping.ingredients.forEach(ing => {
          if (ing.productId && ing.productId.toString() === productId) {
            totalUsageInToppings += ing.quantity;
          }
        });
      });

      // Addon options
      recipe.addonOptions.forEach(addon => {
        addon.ingredients.forEach(ing => {
          if (ing.productId && ing.productId.toString() === productId) {
            totalUsageInAddons += ing.quantity;
          }
        });
      });

      // Hitung menu item aktif
      if (recipe.menuItemId && recipe.menuItemId.isActive) {
        activeMenuItems++;
      }
    });

    const totalUsage = totalUsageInBase + totalUsageInToppings + totalUsageInAddons;

    res.status(200).json({
      success: true,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          currentStock: productStock?.currentStock || 0
        },
        usageSummary: {
          totalRecipes,
          activeMenuItems,
          inactiveMenuItems: totalRecipes - activeMenuItems,
          totalUsage,
          usageByType: {
            baseIngredients: totalUsageInBase,
            toppings: totalUsageInToppings,
            addons: totalUsageInAddons
          },
          averageUsagePerRecipe: totalRecipes > 0 ? totalUsage / totalRecipes : 0
        },
        stockAnalysis: {
          estimatedPortions: productStock?.currentStock
            ? Math.floor(productStock.currentStock / totalUsage)
            : 0,
          stockStatus: productStock?.currentStock > 0 ? 'in_stock' : 'out_of_stock',
          requiresRestock: (productStock?.currentStock || 0) < totalUsage
        }
      }
    });

  } catch (error) {
    console.error('Error generating product usage summary:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat ringkasan penggunaan produk'
    });
  }
};