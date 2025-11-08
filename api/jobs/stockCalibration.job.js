// services/stockCalibration.service.js
import cron from 'node-cron';
import mongoose from 'mongoose';
import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import { calculateMaxPortions } from '../utils/stockCalculator.js';

// services/stockCalibration.service.js
/**
 * ✅ Circuit Breaker untuk prevent cascade failures
 */
class CircuitBreaker {
  constructor(failureThreshold = 5, resetTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }

  canExecute() {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true;
  }

  onSuccess() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log('🔌 Circuit breaker OPEN - stopping operations temporarily');
    }
  }
}

// Global circuit breaker instance
const calibrationCircuitBreaker = new CircuitBreaker();
/**
 * ✅ ENHANCED OPTIMISTIC LOCKING CONSTANTS
 */
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 150;

/**
 * ✅ Enhanced helper function untuk retry dengan better error detection
 */
const retryWithBackoff = async (fn, context = '', maxRetries = MAX_RETRY_ATTEMPTS) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // ✅ Enhanced conflict detection
      const isConflict =
        error.message?.includes('version') ||
        error.message?.includes('No matching document found') ||
        error.message?.includes('WriteConflict') ||
        error.message?.includes('NoSuchTransaction') ||
        error.code === 112 || // WriteConflict
        error.code === 251;   // NoSuchTransaction

      if (!isConflict) {
        console.error(`❌ Non-retryable error in ${context}:`, error.message);
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 100; // Add jitter untuk avoid thundering herd
        const totalDelay = delay + jitter;

        console.log(`⚠️ ${context} - Conflict detected, retry ${attempt}/${maxRetries} after ${Math.round(totalDelay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }
  }

  console.error(`❌ ${context} - Max retries exceeded after ${maxRetries} attempts:`, lastError.message);
  throw lastError;
};
/**
 * ✅ IMPROVED Kalibrasi semua menu items dengan circuit breaker
 */
export const calibrateAllMenuStocks = async () => {
  // ✅ Check circuit breaker
  if (!calibrationCircuitBreaker.canExecute()) {
    console.log('⏸️ Circuit breaker is OPEN - skipping calibration');
    return {
      success: false,
      error: 'Circuit breaker open - too many failures',
      skipped: true,
      timestamp: new Date()
    };
  }

  let successCount = 0;
  let errorCount = 0;
  let activatedCount = 0;
  let deactivatedCount = 0;
  let resetMinusCount = 0;
  const batchSize = 20; // Reduced batch size
  const startTime = Date.now();

  try {
    console.log('🔄 Memulai kalibrasi stok semua menu items...');

    const menuItems = await MenuItem.find()
      .select('_id name')
      .lean();

    console.log(`📊 Total menu items: ${menuItems.length}`);

    // ✅ Process sequentially untuk reduce contention
    for (let i = 0; i < menuItems.length; i++) {
      const menuItem = menuItems[i];

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
        calibrationCircuitBreaker.onSuccess(); // Reset circuit breaker on success

      } catch (error) {
        errorCount++;
        calibrationCircuitBreaker.onFailure(); // Track failure

        console.error(`❌ Gagal mengkalibrasi ${menuItem.name}:`, error.message);

        // Jika error rate tinggi, stop early
        const errorRate = errorCount / (successCount + errorCount);
        if (errorRate > 0.3) { // 30% error rate
          console.warn(`⚠️ High error rate detected (${(errorRate * 100).toFixed(1)}%) - stopping early`);
          break;
        }
      }

      // ✅ Add delay between processing
      if (i % batchSize === 0 && i > 0) {
        console.log(`🔄 Processed ${i}/${menuItems.length} items...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`✅ Kalibrasi selesai: ${successCount} berhasil, ${errorCount} gagal`);
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
    calibrationCircuitBreaker.onFailure();
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
 * ✅ IMPROVED Kalibrasi stok untuk menu item tertentu dengan better isolation
 */
export const calibrateSingleMenuStock = async (menuItemId) => {
  return await retryWithBackoff(async () => {
    // ✅ Gunakan transaction untuk atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // ✅ CRITICAL: Baca MenuItem dengan session untuk consistency
      const menuItem = await MenuItem.findById(menuItemId).session(session);
      if (!menuItem) {
        throw new Error('Menu item tidak ditemukan');
      }
      const menuItemVersion = menuItem.__v;

      const recipe = await Recipe.findOne({ menuItemId: menuItem._id }).session(session);
      let calculatedStock = 0;

      // Hitung stok berdasarkan resep
      if (recipe?.baseIngredients?.length > 0) {
        const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
        if (defaultIngredients.length > 0) {
          calculatedStock = await calculateMaxPortions(defaultIngredients);
        }
      }

      // ✅ CRITICAL: Baca MenuStock dengan session
      let menuStock = await MenuStock.findOne({ menuItemId: menuItem._id }).session(session);
      const menuStockVersion = menuStock?.__v;

      let manualStockReset = false;
      let previousManualStock = null;

      // ✅ Skip jika ada recent manual adjustment (dalam 10 menit)
      if (menuStock?.lastAdjustedAt) {
        const manualUpdateAge = Date.now() - new Date(menuStock.lastAdjustedAt).getTime();
        if (manualUpdateAge < 10 * 60 * 1000) { // 10 menit
          console.log(`⏭️ Skip kalibrasi ${menuItem.name} - manual adjustment baru (${Math.round(manualUpdateAge / 1000)}s ago)`);
          await session.abortTransaction();
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

      if (menuStock) {
        // Reset manual stock yang minus
        if (menuStock.manualStock !== null && menuStock.manualStock < 0) {
          previousManualStock = menuStock.manualStock;
          menuStock.manualStock = 0;
          manualStockReset = true;
          console.log(`🔄 Reset manual stock ${menuItem.name}: ${previousManualStock} → 0`);
        }

        // Update calculatedStock hanya jika tidak ada manualStock
        if (menuStock.manualStock === null || menuStock.manualStock === undefined) {
          menuStock.calculatedStock = calculatedStock;
          menuStock.currentStock = calculatedStock;
        } else {
          menuStock.currentStock = menuStock.manualStock;
        }

        menuStock.lastCalculatedAt = new Date();

        // ✅ OPTIMISTIC LOCKING dengan session
        const updateResult = await MenuStock.findOneAndUpdate(
          {
            _id: menuStock._id,
            __v: menuStockVersion
          },
          {
            $set: {
              calculatedStock: menuStock.calculatedStock,
              currentStock: menuStock.currentStock,
              manualStock: menuStock.manualStock,
              lastCalculatedAt: menuStock.lastCalculatedAt
            },
            $inc: { __v: 1 }
          },
          {
            new: true,
            session
          }
        );

        if (!updateResult) {
          throw new Error('Version conflict: MenuStock was modified by another process');
        }

        menuStock = updateResult;
      } else {
        // Buat MenuStock baru
        menuStock = await MenuStock.create([{
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
        }], { session });

        menuStock = menuStock[0];
      }

      // Hitung effective stock dan update MenuItem
      const effectiveStock = menuStock.manualStock !== null ? menuStock.manualStock : menuStock.calculatedStock;

      let statusChange = null;
      const previousStatus = menuItem.isActive;

      // Auto activate/deactivate logic
      if (effectiveStock <= 0 && menuItem.isActive) {
        menuItem.isActive = false;
        statusChange = 'deactivated';
        console.log(`🔴 Nonaktifkan ${menuItem.name} - stok habis (${effectiveStock})`);
      } else if (effectiveStock > 0 && !menuItem.isActive) {
        menuItem.isActive = true;
        statusChange = 'activated';
        console.log(`🟢 Aktifkan ${menuItem.name} - stok tersedia (${effectiveStock})`);
      }

      // ✅ Update MenuItem dengan session
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
          session
        }
      );

      if (!menuItemUpdateResult) {
        throw new Error('Version conflict: MenuItem was modified by another process');
      }

      // ✅ Commit transaction
      await session.commitTransaction();

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

    } catch (error) {
      // ✅ Rollback transaction jika ada error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }, `calibrateSingleMenuStock-${menuItemId}`);
};

/**
 * ✅ Reset manual stock yang minus dengan OPTIMISTIC LOCKING
 */
export const resetMinusManualStock = async (menuItemId) => {
  return await retryWithBackoff(async () => {
    const menuStock = await MenuStock.findOne({
      menuItemId: new mongoose.Types.ObjectId(menuItemId)
    });

    if (!menuStock) {
      throw new Error('MenuStock tidak ditemukan');
    }

    const version = menuStock.__v;

    // ✅ OPTIMISTIC LOCKING: Update dengan version check
    const result = await MenuStock.findOneAndUpdate(
      {
        _id: menuStock._id,
        __v: version  // ✅ Version check
      },
      {
        $set: {
          manualStock: 0,
          currentStock: 0,
          lastAdjustedAt: new Date(),
          adjustedBy: 'system',
          notes: 'Auto-reset minus manual stock to 0'
        },
        $inc: { __v: 1 }  // ✅ Increment version
      },
      { new: true }
    );

    if (!result) {
      throw new Error('Version conflict: MenuStock was modified during reset');
    }

    console.log(`✅ Berhasil reset manual stock untuk ${menuItemId}: ${menuStock.manualStock} → 0`);

    // Update MenuItem
    await MenuItem.findByIdAndUpdate(
      menuItemId,
      {
        $set: {
          availableStock: 0,
          isActive: false
        }
      }
    );

    return { success: true, reset: true };
  });
};

/**
 * ✅ Bulk reset semua manual stock yang minus
 */
export const bulkResetMinusManualStocks = async () => {
  try {
    console.log('🔄 Memulai bulk reset manual stock yang minus...');

    const minusStocks = await MenuStock.find({
      manualStock: { $lt: 0 }
    }).populate('menuItemId', 'name');

    console.log(`📊 Ditemukan ${minusStocks.length} menu dengan manual stock minus`);

    let resetCount = 0;
    let errorCount = 0;

    for (const stock of minusStocks) {
      try {
        await resetMinusManualStock(stock.menuItemId._id.toString());
        resetCount++;
        console.log(`✅ Reset ${stock.menuItemId?.name || 'Unknown'}: ${stock.manualStock} → 0`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Gagal reset ${stock.menuItemId?.name || 'Unknown'}:`, error.message);
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
 * ✅ IMPROVED Setup cron job dengan better scheduling
 */
export const setupStockCalibrationCron = () => {
  // ✅ Jalankan setiap 6 jam (kurangi frequency) pada menit 15
  cron.schedule('15 */6 * * *', async () => {
    console.log('⏰ Menjalankan scheduled stock calibration...');

    try {
      if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database tidak terkoneksi, skip scheduled calibration');
        return;
      }

      // ✅ Skip jika circuit breaker open
      if (!calibrationCircuitBreaker.canExecute()) {
        console.log('⏸️ Circuit breaker open - skipping scheduled calibration');
        return;
      }

      console.log('🔄 Running pre-calibration minus stock reset...');
      const resetResult = await bulkResetMinusManualStocks();
      if (resetResult.success && resetResult.resetCount > 0) {
        console.log(`🔄 Sebelum kalibrasi: ${resetResult.resetCount} manual stock direset dari minus`);
      }

      // ✅ Add delay sebelum kalibrasi utama
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('🔄 Starting main stock calibration...');
      const result = await calibrateAllMenuStocks();

      if (result.success) {
        console.log('📈 Scheduled stock calibration completed successfully:', {
          processed: result.processed,
          successCount: result.successCount,
          errorCount: result.errorCount,
          duration: result.duration
        });
      } else {
        console.error('❌ Scheduled stock calibration failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Scheduled stock calibration failed:', error);
    }
  });

  console.log('✅ Stock calibration cron job scheduled: every 6 hours at minute 15');
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

    const concurrencyLimit = 10;
    for (let i = 0; i < menuItemIds.length; i += concurrencyLimit) {
      const batch = menuItemIds.slice(i, i + concurrencyLimit);
      console.log(`🔄 Processing batch ${Math.floor(i / concurrencyLimit) + 1}/${Math.ceil(menuItemIds.length / concurrencyLimit)}`);

      const batchPromises = batch.map(async (menuItemId) => {
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

      if (i + concurrencyLimit < menuItemIds.length) {
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

