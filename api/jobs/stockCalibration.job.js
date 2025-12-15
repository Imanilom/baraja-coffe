// services/stockCalibration.service.js
import cron from 'node-cron';
import mongoose from 'mongoose';
import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import Warehouse from '../models/modul_market/Warehouse.model.js';
import { calculateMaxPortionsForWarehouse } from '../utils/stockCalculator.js';
import { getWorkstationWarehouseMapping } from '../utils/workstationConfig.js';

/**
 * ✅ OPTIMISTIC LOCKING CONSTANTS
 */
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 200;
const BATCH_SIZE = 20;
const CONCURRENCY_LIMIT = 10;

/**
 * ✅ Helper function untuk retry dengan exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = MAX_RETRY_ATTEMPTS) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Jika bukan version conflict, langsung throw
      const isVersionConflict = error.message?.includes('version') ||
        error.message?.includes('_v') ||
        error.message?.includes('conflict') ||
        error.code === 11000; // Duplicate key error

      if (!isVersionConflict) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`⚠️ Version conflict detected (${error.message}), retry ${attempt}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

/**
 * ✅ Helper untuk memastikan manual stock tidak null dan minimal 0
 */
const ensureValidManualStock = (manualStock) => {
  // Jika null atau undefined, set ke null (akan dihitung dari calculatedStock)
  if (manualStock === null || manualStock === undefined) {
    return null;
  }

  // Jika bukan number, konversi ke number
  const numStock = Number(manualStock);

  // Jika NaN atau minus, set ke 0
  if (isNaN(numStock) || numStock < 0) {
    return 0;
  }

  // Bulatkan ke integer
  return Math.floor(numStock);
};

/**
 * ✅ Helper untuk memastikan semua field MenuStock terisi dengan benar
 */
const ensureCompleteMenuStockData = (menuStockData, warehouseId, menuItemId) => {
  // Pastikan semua required field ada
  const completeData = {
    menuItemId: menuItemId || menuStockData.menuItemId,
    warehouseId: warehouseId || menuStockData.warehouseId,
    type: menuStockData.type || 'adjustment',
    quantity: menuStockData.quantity || 0,
    reason: menuStockData.reason || 'manual_adjustment',
    previousStock: menuStockData.previousStock || 0,
    currentStock: menuStockData.currentStock || 0,
    calculatedStock: menuStockData.calculatedStock || 0,
    manualStock: ensureValidManualStock(menuStockData.manualStock),
    adjustedBy: menuStockData.adjustedBy || 'system',
    handledBy: menuStockData.handledBy || 'system',
    notes: menuStockData.notes || '',
    relatedWarehouse: menuStockData.relatedWarehouse || null,
    transferId: menuStockData.transferId || null,
    lastCalculatedAt: menuStockData.lastCalculatedAt || new Date(),
    lastAdjustedAt: menuStockData.lastAdjustedAt || new Date()
  };

  return completeData;
};

/**
 * ✅ Safe update MenuStock tanpa konflik __v
 */
const safeUpdateMenuStock = async (menuStockId, updateData, version) => {
  try {
    // Jika tidak ada version, update tanpa version check
    if (version === undefined) {
      return await MenuStock.findByIdAndUpdate(
        menuStockId,
        updateData,
        { new: true }
      );
    }

    // Update dengan version check
    return await MenuStock.findOneAndUpdate(
      {
        _id: menuStockId,
        __v: version
      },
      updateData,
      { new: true }
    );
  } catch (error) {
    // Jika version conflict, coba update tanpa version check
    if (error.message?.includes('_v') || error.message?.includes('version')) {
      console.log(`🔄 Version conflict, retrying without version check for ${menuStockId}`);
      return await MenuStock.findByIdAndUpdate(
        menuStockId,
        updateData,
        { new: true }
      );
    }
    throw error;
  }
};

/**
 * ✅ Safe update MenuItem tanpa konflik __v
 */
const safeUpdateMenuItem = async (menuItemId, updateData, version) => {
  try {
    // Jika tidak ada version, update tanpa version check
    if (version === undefined) {
      return await MenuItem.findByIdAndUpdate(
        menuItemId,
        updateData,
        { new: true }
      );
    }

    // Update dengan version check
    return await MenuItem.findOneAndUpdate(
      {
        _id: menuItemId,
        __v: version
      },
      updateData,
      { new: true }
    );
  } catch (error) {
    // Jika version conflict, coba update tanpa version check
    if (error.message?.includes('_v') || error.message?.includes('version')) {
      console.log(`🔄 Version conflict, retrying without version check for menu item ${menuItemId}`);
      return await MenuItem.findByIdAndUpdate(
        menuItemId,
        updateData,
        { new: true }
      );
    }
    throw error;
  }
};

/**
 * Kalibrasi stok semua menu items di semua warehouse
 */
export const calibrateAllMenuStocks = async () => {
  let successCount = 0;
  let errorCount = 0;
  let activatedCount = 0;
  let deactivatedCount = 0;
  let resetMinusCount = 0;
  const startTime = Date.now();

  try {
    console.log('🔄 Memulai kalibrasi stok semua menu items untuk semua warehouse...');

    // Get all menu items with workstation info
    const menuItems = await MenuItem.find()
      .select('_id name workstation isActive warehouseStocks')
      .lean();

    console.log(`📊 Total menu items: ${menuItems.length}`);

    // Process in batches
    for (let i = 0; i < menuItems.length; i += BATCH_SIZE) {
      const batch = menuItems.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(menuItems.length / BATCH_SIZE);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches}`);

      // Process each menu item in batch with limited concurrency
      const batchPromises = batch.map(async (menuItem) => {
        try {
          // Calibrate for all relevant warehouses
          const result = await calibrateSingleMenuStockForAllWarehouses(menuItem._id.toString());

          if (result.statusChange) {
            if (result.statusChange === 'activated') activatedCount++;
            if (result.statusChange === 'deactivated') deactivatedCount++;
          }

          if (result.manualStockResets && result.manualStockResets > 0) {
            resetMinusCount += result.manualStockResets;
          }

          successCount++;
          return { success: true, menuItemId: menuItem._id.toString() };
        } catch (error) {
          errorCount++;
          console.error(`❌ Gagal mengkalibrasi ${menuItem.name}:`, error.message);
          return { success: false, menuItemId: menuItem._id.toString(), error: error.message };
        }
      });

      // Wait for batch to complete with timeout
      await Promise.allSettled(batchPromises);

      // Delay between batches if not last batch
      if (i + BATCH_SIZE < menuItems.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`✅ Kalibrasi selesai: ${successCount} berhasil, ${errorCount} gagal`);
    console.log(`🔄 Status changes: ${activatedCount} diaktifkan, ${deactivatedCount} dinonaktifkan`);
    console.log(`🔄 Manual stock reset: ${resetMinusCount} direset dari minus ke 0`);
    console.log(`⏱️ Durasi: ${duration} detik`);

    return {
      success: true,
      processed: menuItems.length,
      successCount,
      errorCount,
      activatedCount,
      deactivatedCount,
      resetMinusCount,
      duration: `${duration} seconds`,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ Kalibrasi semua menu items gagal:', error);
    return {
      success: false,
      error: error.message,
      processed: successCount + errorCount,
      successCount,
      errorCount,
      activatedCount,
      deactivatedCount,
      resetMinusCount,
      timestamp: new Date()
    };
  }
};

/**
 * ✅ Kalibrasi stok untuk menu item di semua warehouse terkait
 */
export const calibrateSingleMenuStockForAllWarehouses = async (menuItemId) => {
  return await retryWithBackoff(async () => {
    // Baca MenuItem
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      throw new Error('Menu item tidak ditemukan');
    }
    const menuItemVersion = menuItem.__v;

    // Get recipe
    const recipe = await Recipe.findOne({ menuItemId: menuItem._id });
    if (!recipe || !recipe.baseIngredients?.length) {
      console.log(`⚠️ Tidak ada resep untuk ${menuItem.name}`);
      return {
        success: true,
        menuItemId: menuItem._id.toString(),
        menuItemName: menuItem.name,
        warehouses: [],
        totalEffectiveStock: 0,
        statusChange: menuItem.isActive ? 'deactivated' : null,
        timestamp: new Date()
      };
    }

    // Get warehouses based on workstation
    const workstation = menuItem.workstation;
    if (!workstation) {
      console.log(`⚠️ Menu ${menuItem.name} tidak memiliki workstation`);
      return {
        success: true,
        menuItemId: menuItem._id.toString(),
        menuItemName: menuItem.name,
        warehouses: [],
        totalEffectiveStock: 0,
        statusChange: menuItem.isActive ? 'deactivated' : null,
        timestamp: new Date()
      };
    }

    const warehouses = await getWorkstationWarehouseMapping(workstation);
    if (Object.keys(warehouses).length === 0) {
      console.log(`⚠️ Tidak ada warehouse untuk workstation ${workstation}`);
      return {
        success: true,
        menuItemId: menuItem._id.toString(),
        menuItemName: menuItem.name,
        warehouses: [],
        totalEffectiveStock: 0,
        statusChange: menuItem.isActive ? 'deactivated' : null,
        timestamp: new Date()
      };
    }

    const warehouseCalibrationResults = [];
    let totalEffectiveStock = 0;
    let manualStockResets = 0;
    let previousStatus = menuItem.isActive;

    // Calibrate for each warehouse sequentially
    for (const [warehouseType, warehouseId] of Object.entries(warehouses)) {
      try {
        const result = await calibrateSingleMenuStockForWarehouse(
          menuItemId,
          warehouseId.toString(),
          recipe
        );

        warehouseCalibrationResults.push({
          warehouseType,
          warehouseId,
          ...result
        });

        totalEffectiveStock += result.effectiveStock;

        if (result.manualStockReset) {
          manualStockResets++;
        }

        // Small delay between warehouses
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`❌ Gagal kalibrasi ${menuItem.name} di warehouse ${warehouseType}:`, error.message);
        warehouseCalibrationResults.push({
          warehouseType,
          warehouseId,
          error: error.message,
          success: false
        });
      }
    }

    // ✅ Update MenuItem dengan warehouse stocks menggunakan safe update
    let statusChange = null;
    let currentStatus = menuItem.isActive;

    // Tentukan status baru berdasarkan total stok
    if (totalEffectiveStock > 0 && !menuItem.isActive) {
      currentStatus = true;
      statusChange = 'activated';
      console.log(`🟢 Aktifkan ${menuItem.name} - total stok tersedia (${totalEffectiveStock})`);
    } else if (totalEffectiveStock <= 0 && menuItem.isActive) {
      currentStatus = false;
      statusChange = 'deactivated';
      console.log(`🔴 Nonaktifkan ${menuItem.name} - total stok habis (${totalEffectiveStock})`);
    }

    // Update warehouseStocks
    const warehouseStocksUpdate = warehouseCalibrationResults
      .filter(r => r.success && r.effectiveStock !== undefined)
      .map(r => ({
        warehouseId: r.warehouseId,
        stock: r.effectiveStock,
        workstation: workstation
      }));

    // Update MenuItem
    const updateData = {
      warehouseStocks: warehouseStocksUpdate,
      availableStock: totalEffectiveStock,
      isActive: currentStatus
    };

    // ✅ Gunakan safe update untuk menghindari version conflict
    const menuItemUpdateResult = await safeUpdateMenuItem(
      menuItem._id,
      {
        $set: updateData,
        $inc: { __v: 1 }
      },
      menuItemVersion
    );

    if (!menuItemUpdateResult) {
      console.warn(`⚠️ MenuItem ${menuItem._id} tidak ditemukan saat update, kemungkinan sudah dihapus`);
    }

    return {
      success: true,
      menuItemId: menuItem._id.toString(),
      menuItemName: menuItem.name,
      workstation: workstation,
      warehouses: warehouseCalibrationResults,
      totalEffectiveStock,
      previousStatus,
      currentStatus,
      statusChange,
      manualStockResets,
      timestamp: new Date()
    };
  });
};

/**
 * ✅ Kalibrasi stok untuk menu item di warehouse tertentu
 */
export const calibrateSingleMenuStockForWarehouse = async (menuItemId, warehouseId, recipe = null) => {
  return await retryWithBackoff(async () => {
    // Get warehouse info
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      throw new Error(`Warehouse ${warehouseId} tidak ditemukan`);
    }

    // Get menu item info
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      throw new Error('Menu item tidak ditemukan');
    }

    // Get recipe if not provided
    if (!recipe) {
      recipe = await Recipe.findOne({ menuItemId: menuItem._id });
    }

    let calculatedStock = 0;

    // Calculate stock based on recipe
    if (recipe?.baseIngredients?.length > 0) {
      const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
      if (defaultIngredients.length > 0) {
        calculatedStock = await calculateMaxPortionsForWarehouse(defaultIngredients, warehouseId);
      }
    }

    // ✅ Cari atau buat MenuStock untuk warehouse ini
    let menuStock = await MenuStock.findOne({
      menuItemId: menuItem._id,
      warehouseId: warehouseId
    });

    const menuStockVersion = menuStock?.__v || 0;
    let manualStockReset = false;
    let previousManualStock = null;

    // ✅ Normalisasi manualStock jika ada
    let normalizedManualStock = null;
    if (menuStock?.manualStock !== null && menuStock?.manualStock !== undefined) {
      previousManualStock = menuStock.manualStock;
      normalizedManualStock = ensureValidManualStock(menuStock.manualStock);

      // Cek apakah perlu reset jika berbeda dari yang sebelumnya
      if (normalizedManualStock !== previousManualStock) {
        manualStockReset = true;
        console.log(`🔄 Normalisasi manual stock ${menuItem.name} di ${warehouse.name}: ${previousManualStock} → ${normalizedManualStock}`);
      }
    }

    // ✅ Hitung effective stock
    const effectiveStock = normalizedManualStock !== null
      ? normalizedManualStock
      : calculatedStock;

    // ✅ CEK: Skip kalibrasi DETAIL jika manual adjustment baru
    if (normalizedManualStock !== null && menuStock?.lastAdjustedAt) {
      const manualUpdateAge = Date.now() - new Date(menuStock.lastAdjustedAt).getTime();

      // Jika manual adjustment dalam 5 menit terakhir, skip kalibrasi detail
      if (manualUpdateAge < 5 * 60 * 1000) {
        console.log(`⏭️ Skip kalibrasi detail ${menuItem.name} di ${warehouse.name} - manual adjustment baru (${Math.round(manualUpdateAge / 1000)}s ago)`);

        return {
          success: true,
          menuItemId: menuItem._id.toString(),
          menuItemName: menuItem.name,
          warehouseId: warehouseId.toString(),
          warehouseName: warehouse.name,
          calculatedStock,
          manualStock: normalizedManualStock,
          effectiveStock,
          manualStockReset,
          skipped: true,
          reason: 'recent_manual_adjustment',
          timestamp: new Date()
        };
      }
    }

    // ✅ Lanjutkan kalibrasi penuh jika tidak di-skip
    const updateData = ensureCompleteMenuStockData({
      calculatedStock: calculatedStock,
      currentStock: effectiveStock,
      quantity: menuStock ? effectiveStock - (menuStock.currentStock || 0) : effectiveStock,
      manualStock: normalizedManualStock,
      lastCalculatedAt: new Date(),
      lastAdjustedAt: menuStock?.lastAdjustedAt || new Date(),
      adjustedBy: menuStock?.adjustedBy || 'system',
      relatedWarehouse: menuStock?.relatedWarehouse || null,
      transferId: menuStock?.transferId || null
    }, warehouseId, menuItem._id);

    // ✅ Gunakan safe update untuk menghindari version conflict
    let updatedMenuStock;
    if (menuStock) {
      updatedMenuStock = await safeUpdateMenuStock(
        menuStock._id,
        {
          $set: updateData,
          $inc: { __v: 1 }
        },
        menuStockVersion
      );
    } else {
      // Buat baru jika tidak ada
      updatedMenuStock = await MenuStock.create(updateData);
    }

    if (!updatedMenuStock) {
      throw new Error(`Gagal update MenuStock untuk ${menuItem.name} di ${warehouse.name}`);
    }

    return {
      success: true,
      menuItemId: menuItem._id.toString(),
      menuItemName: menuItem.name,
      warehouseId: warehouseId.toString(),
      warehouseName: warehouse.name,
      calculatedStock,
      manualStock: updatedMenuStock.manualStock,
      previousManualStock,
      effectiveStock,
      manualStockReset,
      timestamp: new Date()
    };
  });
};

/**
 * ✅ Reset manual stock yang minus/null di warehouse tertentu
 */
export const resetManualStockForWarehouse = async (menuItemId, warehouseId) => {
  return await retryWithBackoff(async () => {
    const menuStock = await MenuStock.findOne({
      menuItemId: new mongoose.Types.ObjectId(menuItemId),
      warehouseId: new mongoose.Types.ObjectId(warehouseId)
    });

    if (!menuStock) {
      throw new Error('MenuStock tidak ditemukan untuk warehouse ini');
    }

    const version = menuStock.__v;
    const previousManualStock = menuStock.manualStock;

    // ✅ Normalisasi manual stock
    let newManualStock = ensureValidManualStock(menuStock.manualStock);

    // Jika tidak ada perubahan, return
    if (newManualStock === menuStock.manualStock) {
      return {
        success: true,
        reset: false,
        menuItemId,
        warehouseId,
        message: 'manualStock sudah valid, tidak perlu reset'
      };
    }

    // Update data
    const updateData = {
      manualStock: newManualStock,
      currentStock: newManualStock !== null ? newManualStock : (menuStock.calculatedStock || 0),
      lastAdjustedAt: new Date(),
      adjustedBy: 'system',
      notes: `Auto-normalize manual stock: ${menuStock.manualStock} → ${newManualStock}`
    };

    // ✅ Gunakan safe update untuk menghindari version conflict
    const result = await safeUpdateMenuStock(
      menuStock._id,
      {
        $set: updateData,
        $inc: { __v: 1 }
      },
      version
    );

    if (!result) {
      throw new Error('Gagal update MenuStock selama reset');
    }

    console.log(`✅ Berhasil normalize manual stock ${menuItemId} di warehouse ${warehouseId}: ${previousManualStock} → ${newManualStock}`);

    // Update MenuItem warehouse stock
    const menuItem = await MenuItem.findById(menuItemId);
    if (menuItem) {
      const warehouseIndex = menuItem.warehouseStocks.findIndex(ws =>
        ws.warehouseId.toString() === warehouseId.toString()
      );

      if (warehouseIndex >= 0) {
        menuItem.warehouseStocks[warehouseIndex].stock = result.currentStock || 0;
      }

      menuItem.availableStock = menuItem.warehouseStocks.reduce((sum, ws) => sum + ws.stock, 0);

      // Deactivate if total stock is 0
      if (menuItem.availableStock <= 0 && menuItem.isActive) {
        menuItem.isActive = false;
      }

      await safeUpdateMenuItem(menuItem._id, {
        $set: {
          warehouseStocks: menuItem.warehouseStocks,
          availableStock: menuItem.availableStock,
          isActive: menuItem.isActive
        },
        $inc: { __v: 1 }
      }, menuItem.__v);
    }

    return {
      success: true,
      reset: true,
      menuItemId,
      warehouseId,
      previousManualStock,
      newManualStock
    };
  });
};

/**
 * ✅ Bulk reset semua manual stock yang invalid di semua warehouse
 */
export const bulkResetInvalidManualStocks = async () => {
  try {
    console.log('🔄 Memulai bulk reset manual stock yang invalid di semua warehouse...');

    // Cari manualStock yang invalid: minus, bukan number, atau undefined (bukan null)
    const invalidStocks = await MenuStock.find({
      $or: [
        { manualStock: { $lt: 0 } },
        { manualStock: { $type: 'string' } },
        { manualStock: { $exists: false } }
      ]
    })
      .populate('menuItemId', 'name')
      .populate('warehouseId', 'name code');

    console.log(`📊 Ditemukan ${invalidStocks.length} stock dengan manual stock invalid`);

    let resetCount = 0;
    let errorCount = 0;
    let normalizedCount = 0;

    // Process with limited concurrency
    for (let i = 0; i < invalidStocks.length; i += CONCURRENCY_LIMIT) {
      const batch = invalidStocks.slice(i, i + CONCURRENCY_LIMIT);
      
      const batchPromises = batch.map(async (stock) => {
        try {
          const result = await resetManualStockForWarehouse(
            stock.menuItemId?._id?.toString() || stock.menuItemId?.toString(),
            stock.warehouseId?._id?.toString() || stock.warehouseId?.toString()
          );

          if (result.reset) {
            resetCount++;
            const menuItemName = stock.menuItemId?.name || 'Unknown';
            const warehouseName = stock.warehouseId?.name || 'Unknown';
            console.log(`✅ Normalize ${menuItemName} di ${warehouseName}: ${result.previousManualStock} → ${result.newManualStock}`);
          } else {
            normalizedCount++;
          }

          return { success: true };
        } catch (error) {
          errorCount++;
          const menuItemName = stock.menuItemId?.name || 'Unknown';
          const warehouseName = stock.warehouseId?.name || 'Unknown';
          console.error(`❌ Gagal normalize ${menuItemName} di ${warehouseName}:`, error.message);
          return { success: false, error: error.message };
        }
      });

      await Promise.allSettled(batchPromises);
      
      // Delay between batches
      if (i + CONCURRENCY_LIMIT < invalidStocks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`✅ Bulk reset selesai: ${resetCount} direset, ${normalizedCount} sudah valid, ${errorCount} gagal`);

    return {
      success: true,
      totalInvalid: invalidStocks.length,
      resetCount,
      normalizedCount,
      errorCount,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ Bulk reset manual stock gagal:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * ✅ Fungsi untuk memperbaiki semua MenuStock dengan data yang tidak lengkap
 */
export const fixAllIncompleteMenuStocks = async () => {
  try {
    console.log('🔧 Memperbaiki semua MenuStock dengan data tidak lengkap...');

    // Cari semua MenuStock yang missing required fields
    const incompleteStocks = await MenuStock.find({
      $or: [
        { relatedWarehouse: { $exists: false } },
        { transferId: { $exists: false } },
        { adjustedBy: { $exists: false } },
        { manualStock: { $exists: false } }
      ]
    });

    console.log(`📊 Ditemukan ${incompleteStocks.length} MenuStock dengan data tidak lengkap`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const stock of incompleteStocks) {
      try {
        // Buat data lengkap tanpa menyentuh __v
        const completeData = ensureCompleteMenuStockData(
          stock.toObject(),
          stock.warehouseId,
          stock.menuItemId
        );

        // Update hanya field yang dibutuhkan tanpa mengubah __v secara eksplisit
        await MenuStock.updateOne(
          { _id: stock._id },
          { $set: completeData }
          // Tidak include $inc: { __v: 1 } untuk menghindari conflict
        );

        fixedCount++;
        console.log(`✅ Diperbaiki MenuStock ${stock._id}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Gagal memperbaiki MenuStock ${stock._id}:`, error.message);
      }
    }

    console.log(`✅ Perbaikan selesai: ${fixedCount} diperbaiki, ${errorCount} gagal`);

    return {
      success: true,
      totalIncomplete: incompleteStocks.length,
      fixedCount,
      errorCount,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ Perbaikan MenuStock gagal:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Setup cron job untuk kalibrasi stok dengan optimasi
 */
export const setupStockCalibrationCron = () => {
  // Jalankan setiap 3 jam pada menit 5
  cron.schedule('5 */3 * * *', async () => {
    console.log('⏰ Menjalankan scheduled stock calibration untuk semua warehouse...');

    try {
      if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database tidak terkoneksi, skip scheduled calibration');
        return;
      }

      console.log('🚀 Memulai scheduled calibration sequence...');

      // 1. Perbaiki data yang tidak lengkap terlebih dahulu
      console.log('🔧 Step 1: Memperbaiki data MenuStock yang tidak lengkap...');
      const fixResult = await fixAllIncompleteMenuStocks();
      if (fixResult.success && fixResult.fixedCount > 0) {
        console.log(`🔧 Sebelum kalibrasi: ${fixResult.fixedCount} MenuStock diperbaiki`);
      }

      // 2. Reset manual stock yang invalid
      console.log('🔄 Step 2: Normalisasi manual stock yang invalid...');
      const resetResult = await bulkResetInvalidManualStocks();
      if (resetResult.success && resetResult.resetCount > 0) {
        console.log(`🔄 Sebelum kalibrasi: ${resetResult.resetCount} manual stock dinormalisasi`);
      }

      // 3. Jalankan kalibrasi utama
      console.log('📊 Step 3: Menjalankan kalibrasi stok utama...');
      const result = await calibrateAllMenuStocks();

      if (result.success) {
        console.log('📈 Scheduled stock calibration completed successfully:', {
          processed: result.processed,
          successCount: result.successCount,
          errorCount: result.errorCount,
          activatedCount: result.activatedCount,
          deactivatedCount: result.deactivatedCount,
          resetMinusCount: result.resetMinusCount,
          duration: result.duration
        });
      } else {
        console.error('❌ Scheduled stock calibration failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Scheduled stock calibration failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  });

  // Jalankan sekali saat startup dengan delay
  setTimeout(async () => {
    console.log('🚀 Menjalankan initial stock calibration untuk semua warehouse...');
    try {
      console.log('🔧 Initial: Memperbaiki data MenuStock...');
      await fixAllIncompleteMenuStocks();
      
      console.log('🔄 Initial: Normalisasi manual stock...');
      await bulkResetInvalidManualStocks();
      
      console.log('📊 Initial: Kalibrasi stok utama...');
      await calibrateAllMenuStocks();
      
      console.log('✅ Initial calibration completed');
    } catch (error) {
      console.error('❌ Initial calibration failed:', error);
    }
  }, 30000);
};

/**
 * Kalibrasi stok untuk menu items tertentu di warehouse tertentu
 */
export const calibrateSelectedMenuStocks = async (menuItemIds, warehouseId = null) => {
  let successCount = 0;
  let errorCount = 0;
  let activatedCount = 0;
  let deactivatedCount = 0;
  let resetMinusCount = 0;

  try {
    console.log(`🔄 Memulai kalibrasi ${menuItemIds.length} menu items terpilih...`);

    if (!Array.isArray(menuItemIds) || menuItemIds.length === 0) {
      throw new Error('menuItemIds harus berupa array yang tidak kosong');
    }

    // Process with limited concurrency
    for (let i = 0; i < menuItemIds.length; i += CONCURRENCY_LIMIT) {
      const batch = menuItemIds.slice(i, i + CONCURRENCY_LIMIT);
      console.log(`🔄 Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}/${Math.ceil(menuItemIds.length / CONCURRENCY_LIMIT)}`);

      const batchPromises = batch.map(async (menuItemId) => {
        try {
          let result;

          if (warehouseId) {
            // Calibrate for specific warehouse
            result = await calibrateSingleMenuStockForWarehouse(menuItemId, warehouseId);
          } else {
            // Calibrate for all relevant warehouses
            result = await calibrateSingleMenuStockForAllWarehouses(menuItemId);
          }

          if (result.statusChange) {
            if (result.statusChange === 'activated') activatedCount++;
            if (result.statusChange === 'deactivated') deactivatedCount++;
          }

          if (result.manualStockResets && result.manualStockResets > 0) {
            resetMinusCount += result.manualStockResets;
          } else if (result.manualStockReset) {
            resetMinusCount++;
          }

          successCount++;
          return result;
        } catch (error) {
          console.error(`❌ Gagal mengkalibrasi menu item ${menuItemId}:`, error.message);
          errorCount++;
          return null;
        }
      });

      await Promise.allSettled(batchPromises);

      // Delay between batches
      if (i + CONCURRENCY_LIMIT < menuItemIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`✅ Kalibrasi terpilih selesai: ${successCount} berhasil, ${errorCount} gagal`);
    console.log(`🔄 Status changes: ${activatedCount} diaktifkan, ${deactivatedCount} dinonaktifkan`);
    console.log(`🔄 Manual stock reset: ${resetMinusCount} direset dari minus ke 0`);

    return {
      success: true,
      processed: menuItemIds.length,
      successCount,
      errorCount,
      activatedCount,
      deactivatedCount,
      resetMinusCount,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ Kalibrasi selected menu stocks gagal:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Kalibrasi manual via API dengan support multi-warehouse
 */
export const manualStockCalibration = async (req, res) => {
  try {
    console.log('🎛️ Manual stock calibration requested');

    const {
      type,
      menuItemIds,
      warehouseId,
      includeStatusFix = true,
      resetInvalidFirst = true,
      fixIncompleteFirst = true
    } = req.body;

    let result;

    if (fixIncompleteFirst) {
      const fixResult = await fixAllIncompleteMenuStocks();
      console.log(`🔧 Pre-fix: ${fixResult.fixedCount || 0} MenuStock diperbaiki`);
    }

    if (resetInvalidFirst) {
      const resetResult = await bulkResetInvalidManualStocks();
      console.log(`🔄 Pre-reset: ${resetResult.resetCount || 0} manual stock dinormalisasi`);
    }

    if (type === 'selected' && menuItemIds && Array.isArray(menuItemIds)) {
      if (menuItemIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'menuItemIds tidak boleh kosong'
        });
      }

      result = await calibrateSelectedMenuStocks(menuItemIds, warehouseId);

    } else if (type === 'warehouse' && warehouseId) {
      // Calibrate all menu items for specific warehouse
      const menuItems = await MenuItem.find({ workstation: { $exists: true } })
        .select('_id')
        .lean();

      const menuItemIds = menuItems.map(m => m._id.toString());
      result = await calibrateSelectedMenuStocks(menuItemIds, warehouseId);

    } else {
      // Calibrate all
      result = await calibrateAllMenuStocks();
    }

    res.status(200).json({
      success: result.success,
      message: 'Kalibrasi stok manual selesai',
      data: result
    });
  } catch (error) {
    console.error('Manual stock calibration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Kalibrasi stok manual gagal',
      error: error.message
    });
  }
};

/**
 * Kalibrasi stok untuk menu item berdasarkan workstation
 */
export const calibrateMenuStocksByWorkstation = async (workstation) => {
  try {
    console.log(`🔄 Memulai kalibrasi stok untuk workstation: ${workstation}`);

    // Get menu items for this workstation
    const menuItems = await MenuItem.find({
      workstation,
      isActive: true
    }).select('_id name');

    console.log(`📊 Found ${menuItems.length} menu items for workstation ${workstation}`);

    const menuItemIds = menuItems.map(m => m._id.toString());

    const result = await calibrateSelectedMenuStocks(menuItemIds);

    return {
      success: true,
      workstation,
      ...result
    };

  } catch (error) {
    console.error(`❌ Kalibrasi untuk workstation ${workstation} gagal:`, error);
    return {
      success: false,
      workstation,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Get calibration status for menu item
 */
export const getMenuCalibrationStatus = async (menuItemId) => {
  try {
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      throw new Error('Menu item tidak ditemukan');
    }

    // Get stock records for all warehouses
    const menuStocks = await MenuStock.find({ menuItemId })
      .populate('warehouseId', 'name code')
      .sort({ warehouseId: 1 });

    const recipe = await Recipe.findOne({ menuItemId });

    const warehouses = await getWorkstationWarehouseMapping(menuItem.workstation);

    const calibrationStatus = [];

    for (const [warehouseType, warehouseId] of Object.entries(warehouses)) {
      const menuStock = menuStocks.find(ms =>
        ms.warehouseId?._id.toString() === warehouseId.toString()
      );

      const warehouse = await Warehouse.findById(warehouseId);

      let calculatedStock = 0;
      if (recipe?.baseIngredients?.length > 0) {
        const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
        if (defaultIngredients.length > 0) {
          calculatedStock = await calculateMaxPortionsForWarehouse(defaultIngredients, warehouseId);
        }
      }

      // Normalisasi manualStock untuk ditampilkan
      const manualStock = menuStock?.manualStock !== undefined
        ? ensureValidManualStock(menuStock.manualStock)
        : null;

      calibrationStatus.push({
        warehouseId,
        warehouseName: warehouse?.name || warehouseType,
        warehouseType,
        hasStockRecord: !!menuStock,
        calculatedStock,
        manualStock,
        currentStock: menuStock?.currentStock || 0,
        effectiveStock: manualStock !== null ? manualStock : calculatedStock,
        lastCalculatedAt: menuStock?.lastCalculatedAt,
        lastAdjustedAt: menuStock?.lastAdjustedAt,
        relatedWarehouse: menuStock?.relatedWarehouse || null,
        transferId: menuStock?.transferId || null,
        isValid: manualStock === null || manualStock >= 0
      });
    }

    return {
      success: true,
      menuItemId: menuItem._id.toString(),
      menuItemName: menuItem.name,
      workstation: menuItem.workstation,
      totalAvailableStock: menuItem.availableStock,
      isActive: menuItem.isActive,
      warehouses: calibrationStatus,
      lastCalibration: new Date(),
      needsCalibration: calibrationStatus.some(cs =>
        !cs.hasStockRecord ||
        !cs.isValid ||
        Date.now() - new Date(cs.lastCalculatedAt).getTime() > 3600000 // 1 hour
      )
    };

  } catch (error) {
    console.error('Error getting calibration status:', error);
    throw error;
  }
};

/**
 * ✅ API untuk memaksa set manual stock ke 0 (bukan null)
 */
export const forceSetManualStockToZero = async (req, res) => {
  try {
    const { menuItemId, warehouseId } = req.body;

    if (!menuItemId || !warehouseId) {
      return res.status(400).json({
        success: false,
        message: 'menuItemId dan warehouseId diperlukan'
      });
    }

    const result = await MenuStock.findOneAndUpdate(
      {
        menuItemId: new mongoose.Types.ObjectId(menuItemId),
        warehouseId: new mongoose.Types.ObjectId(warehouseId)
      },
      {
        $set: {
          manualStock: 0,
          currentStock: 0,
          lastAdjustedAt: new Date(),
          adjustedBy: 'manual',
          notes: 'Forced manual stock to 0 via API',
          relatedWarehouse: null,
          transferId: null
        }
      },
      { new: true, upsert: true }
    );

    // Update MenuItem
    const menuItem = await MenuItem.findById(menuItemId);
    if (menuItem) {
      const warehouseIndex = menuItem.warehouseStocks.findIndex(ws =>
        ws.warehouseId.toString() === warehouseId.toString()
      );

      if (warehouseIndex >= 0) {
        menuItem.warehouseStocks[warehouseIndex].stock = 0;
      } else {
        menuItem.warehouseStocks.push({
          warehouseId: warehouseId,
          stock: 0
        });
      }

      menuItem.availableStock = menuItem.warehouseStocks.reduce((sum, ws) => sum + ws.stock, 0);

      if (menuItem.availableStock <= 0 && menuItem.isActive) {
        menuItem.isActive = false;
      }

      await menuItem.save();
    }

    res.status(200).json({
      success: true,
      message: 'Manual stock berhasil di-set ke 0',
      data: {
        menuItemId,
        warehouseId,
        manualStock: result.manualStock,
        currentStock: result.currentStock,
        relatedWarehouse: result.relatedWarehouse,
        transferId: result.transferId
      }
    });
  } catch (error) {
    console.error('Error forcing manual stock to zero:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal set manual stock ke 0',
      error: error.message
    });
  }
};

/**
 * ✅ API untuk mendapatkan semua manual stock yang invalid
 */
export const getInvalidManualStocks = async (req, res) => {
  try {
    const invalidStocks = await MenuStock.find({
      $or: [
        { manualStock: { $lt: 0 } },
        { manualStock: { $type: 'string' } },
        { manualStock: { $exists: false } }
      ]
    })
      .populate('menuItemId', 'name')
      .populate('warehouseId', 'name code')
      .sort({ lastAdjustedAt: -1 });

    res.status(200).json({
      success: true,
      count: invalidStocks.length,
      data: invalidStocks.map(stock => ({
        _id: stock._id,
        menuItemId: stock.menuItemId?._id || stock.menuItemId,
        menuItemName: stock.menuItemId?.name || 'Unknown',
        warehouseId: stock.warehouseId?._id || stock.warehouseId,
        warehouseName: stock.warehouseId?.name || 'Unknown',
        manualStock: stock.manualStock,
        currentStock: stock.currentStock,
        lastAdjustedAt: stock.lastAdjustedAt,
        relatedWarehouse: stock.relatedWarehouse,
        transferId: stock.transferId,
        issue: getStockIssue(stock.manualStock)
      }))
    });
  } catch (error) {
    console.error('Error getting invalid manual stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendapatkan invalid manual stocks',
      error: error.message
    });
  }
};

/**
 * ✅ API untuk mendapatkan semua MenuStock dengan data tidak lengkap
 */
export const getIncompleteMenuStocks = async (req, res) => {
  try {
    const incompleteStocks = await MenuStock.find({
      $or: [
        { relatedWarehouse: { $exists: false } },
        { transferId: { $exists: false } },
        { adjustedBy: { $exists: false } },
        { manualStock: { $exists: false } }
      ]
    })
      .populate('menuItemId', 'name')
      .populate('warehouseId', 'name code')
      .sort({ lastAdjustedAt: -1 });

    res.status(200).json({
      success: true,
      count: incompleteStocks.length,
      data: incompleteStocks.map(stock => ({
        _id: stock._id,
        menuItemId: stock.menuItemId?._id || stock.menuItemId,
        menuItemName: stock.menuItemId?.name || 'Unknown',
        warehouseId: stock.warehouseId?._id || stock.warehouseId,
        warehouseName: stock.warehouseId?.name || 'Unknown',
        manualStock: stock.manualStock,
        currentStock: stock.currentStock,
        relatedWarehouse: stock.relatedWarehouse,
        transferId: stock.transferId,
        adjustedBy: stock.adjustedBy,
        missingFields: getMissingFields(stock)
      }))
    });
  } catch (error) {
    console.error('Error getting incomplete menu stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendapatkan incomplete menu stocks',
      error: error.message
    });
  }
};

/**
 * ✅ Helper untuk mendapatkan jenis issue pada manual stock
 */
const getStockIssue = (manualStock) => {
  if (manualStock === undefined) return 'undefined';
  if (manualStock === null) return 'null (valid)';
  if (typeof manualStock === 'string') return 'string not number';
  if (manualStock < 0) return 'negative';
  return 'valid';
};

/**
 * ✅ Helper untuk mendapatkan field yang missing
 */
const getMissingFields = (stock) => {
  const missing = [];

  if (stock.relatedWarehouse === undefined) missing.push('relatedWarehouse');
  if (stock.transferId === undefined) missing.push('transferId');
  if (stock.adjustedBy === undefined) missing.push('adjustedBy');
  if (stock.manualStock === undefined) missing.push('manualStock');

  return missing;
};

/**
 * ✅ Fungsi untuk cleanup version conflicts
 */
export const cleanupVersionConflicts = async () => {
  try {
    console.log('🧹 Memulai cleanup version conflicts...');

    // Reset __v untuk semua MenuStock yang memiliki konflik
    const result = await MenuStock.updateMany(
      {},
      { $set: { __v: 0 } }
    );

    // Reset __v untuk semua MenuItem yang memiliki konflik
    const menuItemResult = await MenuItem.updateMany(
      {},
      { $set: { __v: 0 } }
    );

    console.log(`✅ Cleanup completed: ${result.modifiedCount} MenuStock reset, ${menuItemResult.modifiedCount} MenuItem reset`);

    return {
      success: true,
      menuStockReset: result.modifiedCount,
      menuItemReset: menuItemResult.modifiedCount,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('❌ Cleanup version conflicts failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};