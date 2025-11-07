// services/stockCalibration.service.js
import cron from 'node-cron';
import mongoose from 'mongoose';
import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import { calculateMaxPortions, calculateMenuItemStock } from '../utils/stockCalculator.js';

/**
 * ✅ OPTIMISTIC LOCKING CONSTANTS
 */
const MAX_RETRY_ATTEMPTS = 5; // Increased from 3
const RETRY_DELAY_MS = 200; // Increased from 100
const BATCH_SIZE = 10; // Reduced from 25
const BATCH_DELAY_MS = 1000; // Increased from 500
const CONCURRENCY_LIMIT = 3; // Reduced from 5/8
const CONNECTION_CHECK_INTERVAL = 5000; // 5 seconds

/**
 * ✅ Helper untuk memeriksa status koneksi database
 */
const ensureConnection = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (mongoose.connection.readyState === 1) {
      return true;
    }

    console.warn(`⚠️ Menunggu koneksi database... (attempt ${attempt}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, CONNECTION_CHECK_INTERVAL));
  }

  throw new Error('Database connection not available');
};

/**
 * ✅ Helper function untuk retry dengan exponential backoff + connection check
 */
const retryWithBackoff = async (fn, maxRetries = MAX_RETRY_ATTEMPTS) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check connection before attempting
      await ensureConnection(2);
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if it's a connection error
      const isConnectionError =
        error.message?.includes('Connection pool') ||
        error.message?.includes('connection') ||
        error.message?.includes('EAI_AGAIN') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT') ||
        error.code === 'ECONNRESET';

      // Check if it's a version conflict
      const isVersionConflict =
        error.message?.includes('version') ||
        error.message?.includes('No matching document found') ||
        error.name?.includes('WriteConflict');

      // If it's neither connection nor version error, throw immediately
      if (!isConnectionError && !isVersionConflict) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);

        if (isConnectionError) {
          console.log(`⚠️ Connection error detected, retry ${attempt}/${maxRetries} after ${delay}ms...`);
          // Wait longer for connection errors
          await new Promise(resolve => setTimeout(resolve, delay * 2));
        } else {
          console.log(`⚠️ Version conflict detected, retry ${attempt}/${maxRetries} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError;
};

/**
 * ✅ Safe session handler dengan connection check
 */
const withSafeSession = async (operation) => {
  let session = null;
  try {
    await ensureConnection();
    session = await mongoose.startSession();
    session.startTransaction();

    const result = await operation(session);

    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

/**
 * Kalibrasi stok semua menu items dengan optimasi + auto activate/deactivate + reset minus stock
 */
export const calibrateAllMenuStocks = async () => {
  let successCount = 0;
  let errorCount = 0;
  let activatedCount = 0;
  let deactivatedCount = 0;
  let resetMinusCount = 0;
  const startTime = Date.now();

  try {
    console.log('🔄 Memulai kalibrasi stok semua menu items...');

    // Check connection first
    await ensureConnection();

    const menuItems = await MenuItem.find()
      .select('_id name')
      .lean()
      .maxTimeMS(30000); // Add timeout

    console.log(`📊 Total menu items: ${menuItems.length}`);

    for (let i = 0; i < menuItems.length; i += BATCH_SIZE) {
      const batch = menuItems.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(menuItems.length / BATCH_SIZE);

      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

      // Process batch with limited concurrency
      for (let j = 0; j < batch.length; j += CONCURRENCY_LIMIT) {
        const concurrentBatch = batch.slice(j, j + CONCURRENCY_LIMIT);

        const batchPromises = concurrentBatch.map(async (menuItem) => {
          try {
            const result = await calibrateSingleMenuStock(menuItem._id.toString());

            if (result.statusChange) {
              if (result.statusChange === 'activated') activatedCount++;
              if (result.statusChange === 'deactivated') deactivatedCount++;
            }
            if (result.manualStockReset) {
              resetMinusCount++;
            }

            successCount++;
            return result;
          } catch (error) {
            errorCount++;
            console.error(`❌ Gagal mengkalibrasi ${menuItem.name}:`, error.message);
            return null;
          }
        });

        // Wait for concurrent batch to complete
        await Promise.allSettled(batchPromises);

        // Small delay between concurrent batches
        if (j + CONCURRENCY_LIMIT < batch.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Delay between main batches
      if (i + BATCH_SIZE < menuItems.length) {
        console.log(`⏳ Cooling down...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));

        // Re-check connection between batches
        await ensureConnection();
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`✅ Kalibrasi selesai: ${successCount} berhasil, ${errorCount} gagal (${duration}s)`);
    console.log(`🔄 Status changes: ${activatedCount} diaktifkan, ${deactivatedCount} dinonaktifkan`);
    console.log(`🔄 Manual stock reset: ${resetMinusCount} direset dari minus ke 0`);

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
 * ✅ Kalibrasi stok untuk menu item tertentu DENGAN OPTIMISTIC LOCKING & SESSION MANAGEMENT
 */
export const calibrateSingleMenuStock = async (menuItemId, existingSession = null) => {
  return await retryWithBackoff(async () => {
    const shouldManageSession = !existingSession;

    if (shouldManageSession) {
      return await withSafeSession(async (session) => {
        return await performCalibration(menuItemId, session);
      });
    } else {
      return await performCalibration(menuItemId, existingSession);
    }
  });
};

/**
 * ✅ Core calibration logic (extracted for reusability)
 */
const performCalibration = async (menuItemId, session) => {
  // ✅ CRITICAL: Baca MenuItem dengan version DAN session
  const menuItem = await MenuItem.findById(menuItemId)
    .session(session)
    .maxTimeMS(10000);

  if (!menuItem) {
    throw new Error('Menu item tidak ditemukan');
  }
  const menuItemVersion = menuItem.__v;

  const recipe = await Recipe.findOne({ menuItemId: menuItem._id })
    .session(session)
    .maxTimeMS(10000);

  let calculatedStock = 0;

  // Hitung stok berdasarkan resep menggunakan fungsi dari stockCalculator
  if (recipe?.baseIngredients?.length > 0) {
    const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
    if (defaultIngredients.length > 0) {
      try {
        calculatedStock = await calculateMaxPortions(defaultIngredients);
      } catch (calcError) {
        console.error(`❌ Error calculating stock for ${menuItem.name}:`, calcError);
        calculatedStock = 0;
      }
    }
  }

  // ✅ CRITICAL: Baca MenuStock dengan version DAN session
  let menuStock = await MenuStock.findOne({ menuItemId: menuItem._id })
    .session(session)
    .maxTimeMS(10000);

  const menuStockVersion = menuStock?.__v;

  let manualStockReset = false;
  let previousManualStock = null;

  if (menuStock) {
    const previousStock = menuStock.currentStock;

    // ✅ CEK: Jika manualStock baru saja diubah (dalam 2 menit terakhir), SKIP update
    if (menuStock.manualStock !== null &&
      menuStock.manualStock !== undefined &&
      menuStock.lastAdjustedAt) {

      const manualUpdateAge = Date.now() - new Date(menuStock.lastAdjustedAt).getTime();

      if (manualUpdateAge < 2 * 60 * 1000) {
        console.log(`⏭️ Skip kalibrasi ${menuItem.name} - manual adjustment baru (${Math.round(manualUpdateAge / 1000)}s ago)`);

        return {
          success: true,
          menuItemId: menuItem._id.toString(),
          menuItemName: menuItem.name,
          skipped: true,
          reason: 'recent_manual_adjustment',
          timestamp: new Date()
        };
      }
    }

    // Reset manual stock yang minus
    if (menuStock.manualStock !== null &&
      menuStock.manualStock !== undefined &&
      menuStock.manualStock < 0) {
      previousManualStock = menuStock.manualStock;
      menuStock.manualStock = 0;
      manualStockReset = true;
      console.log(`🔄 Reset manual stock ${menuItem.name}: ${previousManualStock} → 0`);
    }

    // ✅ OPTIMISTIC LOCKING: Update hanya jika version match
    if (menuStock.manualStock === null || menuStock.manualStock === undefined) {
      menuStock.calculatedStock = calculatedStock;
      menuStock.currentStock = calculatedStock;
      menuStock.quantity = calculatedStock - previousStock;
    } else {
      menuStock.currentStock = menuStock.manualStock;
      menuStock.quantity = 0;
    }

    menuStock.lastCalculatedAt = new Date();

    // ✅ CRITICAL: Save dengan version check DAN session
    const updateResult = await MenuStock.findOneAndUpdate(
      {
        _id: menuStock._id,
        __v: menuStockVersion
      },
      {
        $set: {
          calculatedStock: menuStock.calculatedStock,
          currentStock: menuStock.currentStock,
          quantity: menuStock.quantity,
          manualStock: menuStock.manualStock,
          lastCalculatedAt: menuStock.lastCalculatedAt
        },
        $inc: { __v: 1 }
      },
      {
        new: true,
        session,
        maxTimeMS: 10000
      }
    );

    if (!updateResult) {
      throw new Error('Version conflict: MenuStock was modified by another process');
    }

    menuStock = updateResult;

  } else {
    // Buat MenuStock baru dengan session
    menuStock = new MenuStock({
      menuItemId: menuItem._id,
      type: 'adjustment',
      quantity: 0,
      reason: 'manual_adjustment',
      previousStock: 0,
      currentStock: calculatedStock,
      calculatedStock: calculatedStock,
      manualStock: null,
      handledBy: 'system',
      notes: 'Initial stock calibration by system',
      lastCalculatedAt: new Date(),
      lastAdjustedAt: new Date()
    });
    await menuStock.save({ session });
  }

  // Hitung effective stock
  const effectiveStock = menuStock.manualStock !== null ? menuStock.manualStock : menuStock.calculatedStock;

  // Auto activate/deactivate berdasarkan stok
  let statusChange = null;
  const previousStatus = menuItem.isActive;

  if (menuStock.manualStock !== null && menuStock.manualStock !== undefined) {
    if (menuStock.manualStock < 1) {
      if (menuItem.isActive) {
        menuItem.isActive = false;
        statusChange = 'deactivated';
        console.log(`🔴 Nonaktifkan ${menuItem.name} - stok manual di bawah 1 (${menuStock.manualStock})`);
      }
    } else {
      if (!menuItem.isActive) {
        menuItem.isActive = true;
        statusChange = 'activated';
        console.log(`🟢 Aktifkan ${menuItem.name} - stok manual mencukupi (${menuStock.manualStock})`);
      }
    }
  } else {
    if (effectiveStock <= 0) {
      if (menuItem.isActive) {
        menuItem.isActive = false;
        statusChange = 'deactivated';
        console.log(`🔴 Nonaktifkan ${menuItem.name} - stok habis (${effectiveStock})`);
      }
    } else {
      if (!menuItem.isActive) {
        menuItem.isActive = true;
        statusChange = 'activated';
        console.log(`🟢 Aktifkan ${menuItem.name} - stok tersedia (${effectiveStock})`);
      }
    }
  }

  // ✅ OPTIMISTIC LOCKING: Update MenuItem dengan version check DAN session
  const menuItemUpdateResult = await MenuItem.findOneAndUpdate(
    {
      _id: menuItem._id,
      __v: menuItemVersion
    },
    {
      $set: {
        availableStock: effectiveStock,
        isActive: menuItem.isActive
      },
      $inc: { __v: 1 }
    },
    {
      new: true,
      session,
      maxTimeMS: 10000
    }
  );

  if (!menuItemUpdateResult) {
    throw new Error('Version conflict: MenuItem was modified by another process');
  }

  return {
    success: true,
    menuItemId: menuItem._id.toString(),
    menuItemName: menuItem.name,
    calculatedStock,
    manualStock: menuStock.manualStock,
    previousManualStock,
    effectiveStock,
    previousStatus,
    currentStatus: menuItemUpdateResult.isActive,
    statusChange,
    manualStockReset,
    timestamp: new Date()
  };
};

/**
 * ✅ Reset manual stock yang minus dengan OPTIMISTIC LOCKING
 */
export const resetMinusManualStock = async (menuItemId) => {
  return await retryWithBackoff(async () => {
    return await withSafeSession(async (session) => {
      const menuStock = await MenuStock.findOne({
        menuItemId: new mongoose.Types.ObjectId(menuItemId)
      })
        .populate('menuItemId', 'name')
        .session(session)
        .maxTimeMS(10000);

      if (!menuStock) {
        throw new Error('MenuStock tidak ditemukan');
      }

      const menuName = menuStock.menuItemId?.name || 'Unknown Menu';
      const version = menuStock.__v;

      // ✅ OPTIMISTIC LOCKING: Update dengan version check
      const result = await MenuStock.findOneAndUpdate(
        {
          _id: menuStock._id,
          __v: version
        },
        {
          $set: {
            manualStock: 0,
            currentStock: 0,
            lastAdjustedAt: new Date(),
            adjustedBy: 'system',
            notes: 'Auto-reset minus manual stock to 0'
          },
          $inc: { __v: 1 }
        },
        {
          new: true,
          session,
          maxTimeMS: 10000
        }
      );

      if (!result) {
        throw new Error('Version conflict: MenuStock was modified during reset');
      }

      console.log(`✅ Berhasil reset manual stock ${menuName}: ${menuStock.manualStock} → 0`);

      // Update MenuItem
      await MenuItem.findByIdAndUpdate(
        menuItemId,
        {
          $set: {
            availableStock: 0,
            isActive: false
          }
        },
        { session, maxTimeMS: 10000 }
      );

      return { success: true, reset: true };
    });
  });
};

/**
 * ✅ Bulk reset semua manual stock yang minus
 */
export const bulkResetMinusManualStocks = async () => {
  try {
    console.log('🔄 Memulai bulk reset manual stock yang minus...');

    await ensureConnection();

    const minusStocks = await MenuStock.find({
      manualStock: { $lt: 0 }
    })
      .populate('menuItemId', 'name')
      .maxTimeMS(30000);

    console.log(`📊 Ditemukan ${minusStocks.length} menu dengan manual stock minus`);

    let resetCount = 0;
    let errorCount = 0;

    // Process dengan concurrency limit untuk menghindari overload
    for (let i = 0; i < minusStocks.length; i += CONCURRENCY_LIMIT) {
      const batch = minusStocks.slice(i, i + CONCURRENCY_LIMIT);

      const batchPromises = batch.map(async (stock) => {
        try {
          await resetMinusManualStock(stock.menuItemId._id.toString());
          resetCount++;
          console.log(`✅ Reset ${stock.menuItemId?.name || 'Unknown'}: ${stock.manualStock} → 0`);
          return true;
        } catch (error) {
          errorCount++;
          console.error(`❌ Gagal reset ${stock.menuItemId?.name || 'Unknown'}:`, error.message);
          return false;
        }
      });

      await Promise.allSettled(batchPromises);

      // Delay antar batch
      if (i + CONCURRENCY_LIMIT < minusStocks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await ensureConnection();
      }
    }

    console.log(`✅ Bulk reset selesai: ${resetCount} berhasil, ${errorCount} gagal`);

    return {
      success: true,
      totalMinus: minusStocks.length,
      resetCount,
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
 * Setup cron job untuk kalibrasi stok dengan optimasi
 */
export const setupStockCalibrationCron = () => {
  // Jalankan setiap 3 jam pada menit 5
  cron.schedule('5 */3 * * *', async () => {
    console.log('⏰ Menjalankan scheduled stock calibration...');

    try {
      if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database tidak terkoneksi, skip scheduled calibration');
        return;
      }

      const resetResult = await bulkResetMinusManualStocks();
      if (resetResult.success && resetResult.resetCount > 0) {
        console.log(`🔄 Sebelum kalibrasi: ${resetResult.resetCount} manual stock direset dari minus`);
      }

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
    console.log('🚀 Menjalankan initial stock calibration...');
    try {
      await bulkResetMinusManualStocks();
      await calibrateAllMenuStocks();
    } catch (error) {
      console.error('Initial calibration failed:', error);
    }
  }, 30000);
};

/**
 * Kalibrasi stok untuk menu items tertentu saja dengan auto activate/deactivate
 */
export const calibrateSelectedMenuStocks = async (menuItemIds) => {
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

    await ensureConnection();

    for (let i = 0; i < menuItemIds.length; i += BATCH_SIZE) {
      const batch = menuItemIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(menuItemIds.length / BATCH_SIZE);

      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches}`);

      // Process with limited concurrency
      for (let j = 0; j < batch.length; j += CONCURRENCY_LIMIT) {
        const concurrentBatch = batch.slice(j, j + CONCURRENCY_LIMIT);

        const batchPromises = concurrentBatch.map(async (menuItemId) => {
          try {
            const result = await calibrateSingleMenuStock(menuItemId);

            if (result.statusChange) {
              if (result.statusChange === 'activated') activatedCount++;
              if (result.statusChange === 'deactivated') deactivatedCount++;
            }
            if (result.manualStockReset) {
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

        if (j + CONCURRENCY_LIMIT < batch.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      if (i + BATCH_SIZE < menuItemIds.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        await ensureConnection();
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
 * Kalibrasi manual via API
 */
export const manualStockCalibration = async (req, res) => {
  try {
    console.log('🎛️ Manual stock calibration requested');

    const { type, menuItemIds, includeStatusFix = true, resetMinusFirst = true } = req.body;

    let result;

    if (resetMinusFirst) {
      const resetResult = await bulkResetMinusManualStocks();
      console.log(`🔄 Pre-reset: ${resetResult.resetCount || 0} manual stock direset`);
    }

    if (type === 'selected' && menuItemIds && Array.isArray(menuItemIds)) {
      if (menuItemIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'menuItemIds tidak boleh kosong'
        });
      }
      result = await calibrateSelectedMenuStocks(menuItemIds);
    } else {
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

export default {
  calibrateAllMenuStocks,
  calibrateSingleMenuStock,
  calibrateSelectedMenuStocks,
  resetMinusManualStock,
  bulkResetMinusManualStocks,
  setupStockCalibrationCron,
  manualStockCalibration
};