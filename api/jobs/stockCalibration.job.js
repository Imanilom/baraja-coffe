// services/stockCalibration.service.js
import cron from 'node-cron';
import mongoose from 'mongoose';
import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import { calculateMaxPortions } from '../utils/stockCalculator.js';

/**
 * Kalibrasi stok semua menu items dengan optimasi + auto activate/deactivate + reset minus stock
 */
// services/stockCalibration.service.js 

export const calibrateAllMenuStocks = async () => {
  let successCount = 0;
  let errorCount = 0;
  let activatedCount = 0;
  let deactivatedCount = 0;
  let resetMinusCount = 0;
  const batchSize = 25; // KECILKAN batch size
  const startTime = Date.now();

  try {
    console.log('🔄 Memulai kalibrasi stok semua menu items...');

    // Ambil hanya ID dan name saja
    const menuItems = await MenuItem.find()
      .select('_id name')
      .lean();

    console.log(`📊 Total menu items: ${menuItems.length}`);

    // Process in batches dengan sequential processing
    for (let i = 0; i < menuItems.length; i += batchSize) {
      const batch = menuItems.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(menuItems.length / batchSize)}`);

      // Process batch secara SEQUENTIAL untuk hindari database overload
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

        // Tambahkan delay kecil antara setiap item
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Delay antara batch
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
 * Kalibrasi stok untuk menu item tertentu TANPA transaction
 */
export const calibrateSingleMenuStock = async (menuItemId) => {
  // HAPUS session dan transaction untuk operasi single
  try {
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      throw new Error('Menu item tidak ditemukan');
    }

    const recipe = await Recipe.findOne({ menuItemId: menuItem._id });
    let calculatedStock = 0;

    // Hitung stok berdasarkan resep
    if (recipe?.baseIngredients?.length > 0) {
      const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
      if (defaultIngredients.length > 0) {
        calculatedStock = await calculateMaxPortions(defaultIngredients);
      }
    }

    // Cari atau buat MenuStock
    let menuStock = await MenuStock.findOne({ menuItemId: menuItem._id });

    // ✅ Reset manualStock yang minus ke 0
    let manualStockReset = false;
    let previousManualStock = null;

    if (menuStock) {
      // Simpan previousStock sebelum update
      const previousStock = menuStock.currentStock;

      // ✅ CEK DAN RESET MANUAL STOCK YANG MINUS
      if (menuStock.manualStock !== null && menuStock.manualStock !== undefined && menuStock.manualStock < 0) {
        previousManualStock = menuStock.manualStock;
        menuStock.manualStock = 0;
        manualStockReset = true;
        console.log(`🔄 Reset manual stock ${menuItem.name}: ${previousManualStock} → 0`);
      }

      // Only update calculatedStock if manualStock is not set
      if (menuStock.manualStock === null || menuStock.manualStock === undefined) {
        menuStock.calculatedStock = calculatedStock;
        menuStock.currentStock = calculatedStock;
        menuStock.quantity = calculatedStock - previousStock;
      } else {
        menuStock.currentStock = menuStock.manualStock;
        menuStock.quantity = 0;
      }

      menuStock.lastCalculatedAt = new Date();
      await menuStock.save();
    } else {
      // Buat MenuStock baru
      menuStock = await MenuStock.create({
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
    }

    // Hitung effective stock
    const effectiveStock = menuStock.manualStock !== null ? menuStock.manualStock : menuStock.calculatedStock;

    // ✅ LOGIC: Auto activate/deactivate berdasarkan stok
    let statusChange = null;
    const previousStatus = menuItem.isActive;

    // 🔴 PERUBAHAN: Nonaktifkan menu jika stok manual di bawah 1
    if (menuStock.manualStock !== null && menuStock.manualStock !== undefined) {
      // Jika menggunakan stok manual
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
      // Jika menggunakan stok kalkulasi (default behavior)
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

    // Update availableStock di MenuItem
    menuItem.availableStock = effectiveStock;
    await menuItem.save();

    return {
      success: true,
      menuItemId: menuItem._id.toString(),
      menuItemName: menuItem.name,
      calculatedStock,
      manualStock: menuStock.manualStock,
      previousManualStock,
      effectiveStock,
      previousStatus,
      currentStatus: menuItem.isActive,
      statusChange,
      manualStockReset,
      timestamp: new Date()
    };

  } catch (error) {
    console.error(`❌ Gagal mengkalibrasi menu item ${menuItemId}:`, error);

    // ✅ FALLBACK: Coba reset manual stock yang minus
    if (error.message.includes('manualStock') && error.message.includes('less than minimum')) {
      console.log(`🔄 Mencoba fallback reset untuk ${menuItemId}...`);
      try {
        await resetMinusManualStock(menuItemId);
        return {
          success: true,
          menuItemId: menuItemId,
          menuItemName: 'Unknown (fallback)',
          manualStockReset: true,
          fallbackUsed: true,
          timestamp: new Date()
        };
      } catch (fallbackError) {
        console.error(`❌ Fallback reset juga gagal untuk ${menuItemId}:`, fallbackError.message);
      }
    }

    throw error;
  }
};

/**
 * ✅ FUNGSI BARU: Reset manual stock yang minus dengan approach langsung ke database
 */
export const resetMinusManualStock = async (menuItemId) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    // Update langsung dengan $set untuk menghindari validation error
    const result = await MenuStock.findOneAndUpdate(
      { menuItemId: new mongoose.Types.ObjectId(menuItemId) },
      {
        $set: {
          manualStock: 0,
          currentStock: 0,
          lastAdjustedAt: new Date(),
          adjustedBy: 'system',
          notes: 'Auto-reset minus manual stock to 0'
        }
      },
      { session, new: true }
    );

    if (result) {
      console.log(`✅ Berhasil reset manual stock untuk ${menuItemId}: ${result.manualStock} → 0`);

      // Update juga MenuItem
      await MenuItem.findByIdAndUpdate(
        menuItemId,
        {
          $set: {
            availableStock: 0,
            isActive: false
          }
        },
        { session }
      );
    }

    await session.commitTransaction();
    return { success: true, reset: true };

  } catch (error) {
    await session.abortTransaction();
    console.error(`❌ Gagal reset manual stock untuk ${menuItemId}:`, error.message);
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * ✅ FUNGSI BARU: Bulk reset semua manual stock yang minus
 */
export const bulkResetMinusManualStocks = async () => {
  try {
    console.log('🔄 Memulai bulk reset manual stock yang minus...');

    // Cari semua MenuStock dengan manualStock < 0
    const minusStocks = await MenuStock.find({
      manualStock: { $lt: 0 }
    }).populate('menuItemId', 'name');

    console.log(`📊 Ditemukan ${minusStocks.length} menu dengan manual stock minus`);

    let resetCount = 0;
    let errorCount = 0;

    for (const stock of minusStocks) {
      try {
        // Update langsung ke 0
        await MenuStock.updateOne(
          { _id: stock._id },
          {
            $set: {
              manualStock: 0,
              currentStock: 0,
              lastAdjustedAt: new Date(),
              adjustedBy: 'system',
              notes: `Bulk reset: ${stock.manualStock} → 0`
            }
          }
        );

        // Update MenuItem status
        await MenuItem.updateOne(
          { _id: stock.menuItemId },
          {
            $set: {
              availableStock: 0,
              isActive: false
            }
          }
        );

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
 * Setup cron job untuk kalibrasi stok dengan optimasi
 */
export const setupStockCalibrationCron = () => {
  // Jalankan setiap 3 jam pada menit 5
  cron.schedule('5 */3 * * *', async () => {
    console.log('⏰ Menjalankan scheduled stock calibration...');

    try {
      // Cek koneksi database sebelum mulai
      if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database tidak terkoneksi, skip scheduled calibration');
        return;
      }

      // ✅ Jalankan bulk reset terlebih dahulu untuk handle minus stocks
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
      // ✅ Reset minus stocks terlebih dahulu
      await bulkResetMinusManualStocks();
      await calibrateAllMenuStocks();
    } catch (error) {
      console.error('Initial calibration failed:', error);
    }
  }, 30000); // Delay 30 detik setelah startup
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

    // Validasi input
    if (!Array.isArray(menuItemIds) || menuItemIds.length === 0) {
      throw new Error('menuItemIds harus berupa array yang tidak kosong');
    }

    // Process dengan concurrency terbatas
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

      // Delay antara batch
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

    // ✅ Reset minus stocks terlebih dahulu jika diminta
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