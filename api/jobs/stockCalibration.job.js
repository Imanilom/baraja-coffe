// services/stockCalibration.service.js
import cron from 'node-cron';
import mongoose from 'mongoose';
import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import { calculateMaxPortions } from '../utils/stockCalculator.js';

/**
 * Kalibrasi stok semua menu items dengan optimasi
 */
export const calibrateAllMenuStocks = async () => {
  let successCount = 0;
  let errorCount = 0;
  const batchSize = 50;
  const startTime = Date.now();

  try {
    console.log('🔄 Memulai kalibrasi stok menu...');

    // Ambil semua menu items yang aktif
    const menuItems = await MenuItem.find({ isActive: true })
      .select('_id name')
      .lean(); // Gunakan lean() untuk performa lebih baik

    console.log(`📊 Menemukan ${menuItems.length} menu items aktif`);

    // Process in batches dengan concurrency control
    for (let i = 0; i < menuItems.length; i += batchSize) {
      const batch = menuItems.slice(i, i + batchSize);
      console.log(`🔧 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(menuItems.length / batchSize)}`);

      // Process batch dengan concurrency terbatas
      const batchPromises = batch.map(async (menuItem) => {
        try {
          await calibrateSingleMenuStock(menuItem._id.toString());
          successCount++;
        } catch (error) {
          console.error(`❌ Gagal mengkalibrasi menu item ${menuItem.name}:`, error.message);
          errorCount++;
        }
      });

      await Promise.allSettled(batchPromises);

      // Delay antara batch untuk menghindari overload database
      if (i + batchSize < menuItems.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ Kalibrasi selesai: ${successCount} berhasil, ${errorCount} gagal, durasi: ${duration}s`);

    return {
      success: true,
      processed: menuItems.length,
      successCount,
      errorCount,
      duration: `${duration} seconds`,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ Kalibrasi stok gagal:', error);
    return {
      success: false,
      error: error.message,
      processed: successCount + errorCount,
      successCount,
      errorCount,
      timestamp: new Date()
    };
  }
};

/**
 * Kalibrasi stok untuk menu item tertentu dengan optimasi
 */

export const calibrateSingleMenuStock = async (menuItemId) => {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();

    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (!menuItem) {
      throw new Error('Menu item tidak ditemukan');
    }

    const recipe = await Recipe.findOne({ menuItemId: menuItem._id }).session(session);
    let calculatedStock = 0;

    // Hitung stok berdasarkan resep
    if (recipe?.baseIngredients?.length > 0) {
      const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
      if (defaultIngredients.length > 0) {
        calculatedStock = await calculateMaxPortions(defaultIngredients);
      }
    }

    // Cari atau buat MenuStock
    let menuStock = await MenuStock.findOne({ menuItemId: menuItem._id }).session(session);

    if (menuStock) {
      // Simpan previousStock sebelum update
      const previousStock = menuStock.currentStock;
      
      // Only update calculatedStock if manualStock is not set
      if (menuStock.manualStock === null || menuStock.manualStock === undefined) {
        menuStock.calculatedStock = calculatedStock;
        menuStock.currentStock = calculatedStock;
        menuStock.quantity = calculatedStock - previousStock; // Hitung perubahan quantity
        console.log(`📦 Menu ${menuItem.name}: calculatedStock updated to ${calculatedStock}`);
      } else {
        menuStock.currentStock = menuStock.manualStock;
        menuStock.quantity = 0; // Tidak ada perubahan untuk manual stock
        console.log(`📦 Menu ${menuItem.name}: using manualStock ${menuStock.manualStock}`);
      }
      
      menuStock.lastCalculatedAt = new Date();
      await menuStock.save({ session });
    } else {
      // Buat MenuStock baru dengan semua field required
      menuStock = await MenuStock.create([{
        menuItemId: menuItem._id,
        type: 'adjustment', // Required field
        quantity: 0, // Required field - no change for initial creation
        reason: 'manual_adjustment', // Required for adjustment type
        previousStock: 0, // Required field
        currentStock: calculatedStock, // Required field
        calculatedStock: calculatedStock,
        manualStock: null,
        handledBy: 'system', // Required field
        notes: 'Initial stock calibration by system',
        lastCalculatedAt: new Date(),
        lastAdjustedAt: new Date()
      }], { session });
      console.log(`📦 Menu ${menuItem.name}: new stock record created with ${calculatedStock}`);
    }

    // Update availableStock di MenuItem
    const effectiveStock = menuStock.manualStock !== null ? menuStock.manualStock : menuStock.calculatedStock;
    menuItem.availableStock = effectiveStock;
    await menuItem.save({ session });

    await session.commitTransaction();
    console.log(`✅ ${menuItem.name}: stock updated to ${effectiveStock}`);

    return {
      success: true,
      menuItemId: menuItem._id.toString(),
      menuItemName: menuItem.name,
      calculatedStock,
      manualStock: menuStock.manualStock,
      effectiveStock,
      timestamp: new Date()
    };

  } catch (error) {
    await session.abortTransaction();
    console.error(`❌ Kalibrasi single menu stock gagal untuk ${menuItemId}:`, error.message);
    throw error;
  } finally {
    await session.endSession();
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
        console.error('❌ Database not connected, skipping calibration');
        return;
      }

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
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  });

  // Jalankan sekali saat startup dengan delay
  setTimeout(async () => {
    console.log('🚀 Running initial stock calibration on startup...');
    try {
      await calibrateAllMenuStocks();
    } catch (error) {
      console.error('Initial calibration failed:', error);
    }
  }, 30000); // Delay 30 detik setelah startup

  console.log('✅ Stock calibration cron job setup: Setiap 3 jam pada menit 5');
};

/**
 * Kalibrasi stok untuk menu items tertentu saja
 */
export const calibrateSelectedMenuStocks = async (menuItemIds) => {
  let successCount = 0;
  let errorCount = 0;

  try {
    console.log(`🔄 Memulai kalibrasi stok untuk ${menuItemIds.length} menu items...`);

    // Validasi input
    if (!Array.isArray(menuItemIds) || menuItemIds.length === 0) {
      throw new Error('menuItemIds harus berupa array yang tidak kosong');
    }

    // Process dengan concurrency terbatas
    const concurrencyLimit = 10;
    for (let i = 0; i < menuItemIds.length; i += concurrencyLimit) {
      const batch = menuItemIds.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(async (menuItemId) => {
        try {
          await calibrateSingleMenuStock(menuItemId);
          successCount++;
        } catch (error) {
          console.error(`❌ Gagal mengkalibrasi menu item ${menuItemId}:`, error.message);
          errorCount++;
        }
      });

      await Promise.allSettled(batchPromises);

      // Delay antara batch
      if (i + concurrencyLimit < menuItemIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`✅ Kalibrasi selected selesai: ${successCount} berhasil, ${errorCount} gagal`);

    return {
      success: true,
      processed: menuItemIds.length,
      successCount,
      errorCount,
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
    console.log('🔧 Manual stock calibration triggered via API');

    const { type, menuItemIds } = req.body;

    let result;

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