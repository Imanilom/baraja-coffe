// jobs/stockCalibration.job.js
import cron from 'node-cron';
import mongoose from 'mongoose';
import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import { calculateMaxPortions } from '../utils/stockCalculator.js';

/**
 * ✅ OPTIMISTIC LOCKING CONSTANTS
 */
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

/**
 * ✅ Database Health Check
 */
const checkDatabaseHealth = async () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
};

/**
 * ✅ Safe Database Operation Wrapper
 */
const safeDbOperation = async (operation, operationName) => {
  try {
    if (!await checkDatabaseHealth()) {
      throw new Error(`Database not available for operation: ${operationName}`);
    }
    return await operation();
  } catch (error) {
    console.error(`❌ ${operationName} failed:`, error.message);
    throw error;
  }
};

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
      if (!error.message?.includes('version') &&
        !error.message?.includes('No matching document found')) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`⚠️ Version conflict detected, retry ${attempt}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
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
  const batchSize = 25;
  const startTime = Date.now();

  try {
    console.log('🔄 Memulai kalibrasi stok semua menu items...');

    // ✅ CHECK DATABASE CONNECTION FIRST
    if (!await checkDatabaseHealth()) {
      throw new Error('Cannot start calibration: Database not connected');
    }

    const menuItems = await safeDbOperation(
      () => MenuItem.find().select('_id name').lean(),
      'Fetch menu items'
    );

    console.log(`📊 Total menu items: ${menuItems.length}`);

    for (let i = 0; i < menuItems.length; i += batchSize) {
      const batch = menuItems.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(menuItems.length / batchSize)}`);

      for (const menuItem of batch) {
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
        } catch (error) {
          errorCount++;
          console.error(`❌ Gagal mengkalibrasi ${menuItem.name}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (i + batchSize < menuItems.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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
 * ✅ Kalibrasi stok untuk menu item tertentu DENGAN OPTIMISTIC LOCKING
 * @param {string} menuItemId - ID menu item
 * @param {Session} existingSession - Mongoose session jika dalam transaction
 */
export const calibrateSingleMenuStock = async (menuItemId, existingSession = null) => {
  return await retryWithBackoff(async () => {
    const useSession = existingSession !== null;

    // ✅ CRITICAL: Baca MenuItem dengan version
    const menuItem = useSession
      ? await MenuItem.findById(menuItemId).session(existingSession)
      : await MenuItem.findById(menuItemId);

    if (!menuItem) {
      throw new Error('Menu item tidak ditemukan');
    }
    const menuItemVersion = menuItem.__v;

    const recipeQuery = useSession
      ? Recipe.findOne({ menuItemId: menuItem._id }).session(existingSession)
      : Recipe.findOne({ menuItemId: menuItem._id });

    const recipe = await recipeQuery;
    let calculatedStock = 0;

    // Hitung stok berdasarkan resep
    if (recipe?.baseIngredients?.length > 0) {
      const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
      if (defaultIngredients.length > 0) {
        calculatedStock = await calculateMaxPortions(defaultIngredients);
      }
    }

    // ✅ CRITICAL: Baca MenuStock dengan version
    const menuStockQuery = useSession
      ? MenuStock.findOne({ menuItemId: menuItem._id }).session(existingSession)
      : MenuStock.findOne({ menuItemId: menuItem._id });

    let menuStock = await menuStockQuery;
    const menuStockVersion = menuStock?.__v;

    let manualStockReset = false;
    let previousManualStock = null;

    if (menuStock) {
      const previousStock = menuStock.currentStock;

      // ✅ CEK: Jika manualStock baru saja diubah (version berbeda), SKIP update
      if (menuStock.manualStock !== null &&
        menuStock.manualStock !== undefined &&
        menuStock.lastAdjustedAt) {

        const manualUpdateAge = Date.now() - new Date(menuStock.lastAdjustedAt).getTime();

        // Jika manual adjustment dalam 5 menit terakhir, SKIP kalkulasi otomatis
        if (manualUpdateAge < 5 * 60 * 1000) {
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
      // Hanya update calculatedStock jika tidak ada manualStock
      if (menuStock.manualStock === null || menuStock.manualStock === undefined) {
        menuStock.calculatedStock = calculatedStock;
        menuStock.currentStock = calculatedStock;
        menuStock.quantity = calculatedStock - previousStock;
      } else {
        menuStock.currentStock = menuStock.manualStock;
        menuStock.quantity = 0;
      }

      menuStock.lastCalculatedAt = new Date();

      // ✅ CRITICAL: Save dengan version check
      const updateQuery = {
        _id: menuStock._id,
        __v: menuStockVersion
      };

      const updateData = {
        $set: {
          calculatedStock: menuStock.calculatedStock,
          currentStock: menuStock.currentStock,
          quantity: menuStock.quantity,
          manualStock: menuStock.manualStock,
          lastCalculatedAt: menuStock.lastCalculatedAt
        },
        $inc: { __v: 1 }
      };

      const updateOptions = { new: true };
      if (useSession) {
        updateOptions.session = existingSession;
      }

      const updateResult = await MenuStock.findOneAndUpdate(
        updateQuery,
        updateData,
        updateOptions
      );

      if (!updateResult) {
        throw new Error('Version conflict: MenuStock was modified by another process');
      }

      menuStock = updateResult;

    } else {
      // Buat MenuStock baru
      const newStockData = {
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
      };

      if (useSession) {
        menuStock = await MenuStock.create([newStockData], { session: existingSession });
        menuStock = menuStock[0];
      } else {
        menuStock = await MenuStock.create(newStockData);
      }
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

    // ✅ OPTIMISTIC LOCKING: Update MenuItem dengan version check
    const menuItemUpdateQuery = {
      _id: menuItem._id,
      __v: menuItemVersion
    };

    const menuItemUpdateData = {
      $set: {
        availableStock: effectiveStock,
        isActive: menuItem.isActive
      },
      $inc: { __v: 1 }
    };

    const menuItemUpdateOptions = { new: true };
    if (useSession) {
      menuItemUpdateOptions.session = existingSession;
    }

    const menuItemUpdateResult = await MenuItem.findOneAndUpdate(
      menuItemUpdateQuery,
      menuItemUpdateData,
      menuItemUpdateOptions
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

  }); // End of retryWithBackoff
};

/**
 * ✅ Reset manual stock yang minus dengan CONNECTION SAFETY
 */
export const resetMinusManualStock = async (menuItemId) => {
  return await retryWithBackoff(async () => {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        if (!await checkDatabaseHealth()) {
          throw new Error('Database not available for transaction');
        }

        const menuStock = await safeDbOperation(
          () => MenuStock.findOne({
            menuItemId: new mongoose.Types.ObjectId(menuItemId)
          })
            .populate('menuItemId', 'name')
            .session(session),
          `Find menu stock for reset ${menuItemId}`
        );

        if (!menuStock) {
          throw new Error('MenuStock tidak ditemukan');
        }

        const menuName = menuStock.menuItemId?.name || 'Unknown Menu';
        const version = menuStock.__v;

        // ✅ OPTIMISTIC LOCKING: Update dengan version check
        const result = await safeDbOperation(
          () => MenuStock.findOneAndUpdate(
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
              session
            }
          ),
          `Reset menu stock for ${menuName}`
        );

        if (!result) {
          throw new Error('Version conflict: MenuStock was modified during reset');
        }

        console.log(`✅ Berhasil reset manual stock ${menuName}: ${menuStock.manualStock} → 0`);

        // Update MenuItem
        await safeDbOperation(
          () => MenuItem.findByIdAndUpdate(
            menuItemId,
            {
              $set: {
                availableStock: 0,
                isActive: false
              }
            },
            { session }
          ),
          `Update menu item after reset for ${menuName}`
        );
      });

      return { success: true, reset: true };

    } catch (error) {
      throw error;
    } finally {
      session.endSession();
    }
  });
};

/**
 * ✅ Bulk reset semua manual stock yang minus dengan RATE LIMITING
 */
export const bulkResetMinusManualStocks = async () => {
  try {
    console.log('🔄 Memulai bulk reset manual stock yang minus...');

    // ✅ CHECK CONNECTION FIRST
    if (!await checkDatabaseHealth()) {
      console.warn('⚠️ Database not connected, skipping bulk reset');
      return { success: true, totalMinus: 0, resetCount: 0, errorCount: 0 };
    }

    const minusStocks = await safeDbOperation(
      () => MenuStock.find({
        manualStock: { $lt: 0 }
      }).populate('menuItemId', 'name'),
      'Fetch minus stocks'
    );

    console.log(`📊 Ditemukan ${minusStocks.length} menu dengan manual stock minus`);

    let resetCount = 0;
    let errorCount = 0;

    // ✅ PROCESS SEQUENTIALLY TO AVOID CONNECTION OVERLOAD
    for (const stock of minusStocks) {
      try {
        await resetMinusManualStock(stock.menuItemId._id.toString());
        resetCount++;
        console.log(`✅ Reset ${stock.menuItemId?.name || 'Unknown'}: ${stock.manualStock} → 0`);

        // ✅ DELAY BETWEEN EACH RESET
        await new Promise(resolve => setTimeout(resolve, 300));
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
 * ✅ Kalibrasi stok untuk menu items tertentu saja dengan CONNECTION SAFETY
 */
export const calibrateSelectedMenuStocks = async (menuItemIds) => {
  let successCount = 0;
  let errorCount = 0;
  let activatedCount = 0;
  let deactivatedCount = 0;
  let resetMinusCount = 0;

  try {
    console.log(`🔄 Memulai kalibrasi ${menuItemIds.length} menu items terpilih...`);
    try {
      console.log(`🔄 Memulai kalibrasi ${menuItemIds.length} menu items terpilih...`);

      if (!Array.isArray(menuItemIds) || menuItemIds.length === 0) {
        throw new Error('menuItemIds harus berupa array yang tidak kosong');
      }
      if (!Array.isArray(menuItemIds) || menuItemIds.length === 0) {
        throw new Error('menuItemIds harus berupa array yang tidak kosong');
      }

      // ✅ CHECK CONNECTION FIRST
      if (!await checkDatabaseHealth()) {
        throw new Error('Database not available for selected calibration');
      }
      // ✅ CHECK CONNECTION FIRST
      if (!await checkDatabaseHealth()) {
        throw new Error('Database not available for selected calibration');
      }

      // ✅ PROCESS SEQUENTIALLY TO AVOID CONNECTION OVERLOAD
      for (let i = 0; i < menuItemIds.length; i++) {
        try {
          const result = await calibrateSingleMenuStock(menuItemIds[i]);
          // ✅ PROCESS SEQUENTIALLY TO AVOID CONNECTION OVERLOAD
          for (let i = 0; i < menuItemIds.length; i++) {
            try {
              const result = await calibrateSingleMenuStock(menuItemIds[i]);

              if (result.statusChange) {
                if (result.statusChange === 'activated') activatedCount++;
                if (result.statusChange === 'deactivated') deactivatedCount++;
              }
              if (result.manualStockReset) {
                resetMinusCount++;
              }
              if (result.statusChange) {
                if (result.statusChange === 'activated') activatedCount++;
                if (result.statusChange === 'deactivated') deactivatedCount++;
              }
              if (result.manualStockReset) {
                resetMinusCount++;
              }

              successCount++;
              successCount++;

              // ✅ DELAY BETWEEN ITEMS
              if (i < menuItemIds.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
              }
            } catch (error) {
              console.error(`❌ Gagal mengkalibrasi menu item ${menuItemIds[i]}:`, error.message);
              errorCount++;
            }
          }
          // ✅ DELAY BETWEEN ITEMS
          if (i < menuItemIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          console.error(`❌ Gagal mengkalibrasi menu item ${menuItemIds[i]}:`, error.message);
          errorCount++;
        }
      }

      console.log(`✅ Kalibrasi terpilih selesai: ${successCount} berhasil, ${errorCount} gagal`);
      console.log(`🔄 Status changes: ${activatedCount} diaktifkan, ${deactivatedCount} dinonaktifkan`);
      console.log(`🔄 Manual stock reset: ${resetMinusCount} direset dari minus ke 0`);
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
 * ✅ Kalibrasi manual via API dengan connection safety
 */
export const manualStockCalibration = async (req, res) => {
  try {
    console.log('🎛️ Manual stock calibration requested');

    // ✅ CHECK CONNECTION FIRST
    if (!await checkDatabaseHealth()) {
      return res.status(500).json({
        success: false,
        message: 'Database tidak tersedia, coba lagi beberapa saat',
        error: 'Database connection unavailable'
      });
    }
    // ✅ CHECK CONNECTION FIRST
    if (!await checkDatabaseHealth()) {
      return res.status(500).json({
        success: false,
        message: 'Database tidak tersedia, coba lagi beberapa saat',
        error: 'Database connection unavailable'
      });
    }

    const { type, menuItemIds, includeStatusFix = true, resetMinusFirst = true } = req.body;
    const { type, menuItemIds, includeStatusFix = true, resetMinusFirst = true } = req.body;

    let result;
    let result;

    if (resetMinusFirst) {
      const resetResult = await bulkResetMinusManualStocks();
      console.log(`🔄 Pre-reset: ${resetResult.resetCount || 0} manual stock direset`);
    }
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

/**
 * ✅ Setup cron job untuk kalibrasi stok dengan optimasi
 */
export const setupStockCalibrationCron = () => {
  // Jalankan setiap 3 jam pada menit 5
  cron.schedule('5 */3 * * *', async () => {
    console.log('⏰ Menjalankan scheduled stock calibration...');

    try {
      if (!await checkDatabaseHealth()) {
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

  console.log('✅ Stock calibration cron job setup completed');
};

export default {
  calibrateSingleMenuStock,
  calibrateAllMenuStocks,
  calibrateSelectedMenuStocks,
  resetMinusManualStock,
  bulkResetMinusManualStocks,
  setupStockCalibrationCron,
  manualStockCalibration
};