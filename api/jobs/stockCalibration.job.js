import cron from 'node-cron';
import mongoose from 'mongoose';
import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import { calculateMaxPortions } from '../utils/stockCalculator.js';
import Warehouse from '../models/modul_market/Warehouse.model.js';

/**
 * Kalibrasi stok semua menu items dengan optimasi
 */
export const calibrateAllMenuStocks = async () => {
  let successCount = 0;
  let errorCount = 0;
  const batchSize = 50; // Process in batches to avoid memory issues
  const startTime = Date.now();

  try {
    console.log('🔄 Memulai kalibrasi stok menu...');

    // Ambil semua menu items yang aktif tanpa session dulu
    const menuItems = await MenuItem.find({ isActive: true }).select('_id name');
    console.log(`📊 Menemukan ${menuItems.length} menu items aktif`);

    // Process in batches
    for (let i = 0; i < menuItems.length; i += batchSize) {
      const batch = menuItems.slice(i, i + batchSize);
      console.log(`🔧 Processing batch ${i / batchSize + 1}/${Math.ceil(menuItems.length / batchSize)}`);

      // Process each batch in parallel with limited concurrency
      const batchPromises = batch.map(menuItem => 
        calibrateSingleMenuStock(menuItem._id.toString())
          .then(() => successCount++)
          .catch(error => {
            console.error(`❌ Gagal mengkalibrasi menu item ${menuItem.name}:`, error.message);
            errorCount++;
          })
      );

      await Promise.allSettled(batchPromises);
      
      // Small delay between batches to prevent database overload
      if (i + batchSize < menuItems.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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
    session.startTransaction();

    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (!menuItem) {
      throw new Error('Menu item tidak ditemukan');
    }

    const recipe = await Recipe.findOne({ menuItemId: menuItem._id }).session(session);
    let calculatedStock = 0;

    if (recipe?.baseIngredients?.length) {
      const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
      if (defaultIngredients.length) {
        // ✅ TAMBAHKAN AWAIT di sini
        calculatedStock = await calculateMaxPortions(defaultIngredients);
      }
    }

    // Update MenuStock
    const menuStock = await MenuStock.findOne({ menuItemId: menuItem._id }).session(session);
    
    if (menuStock) {
      // Only update calculatedStock if manualStock is not set
      if (menuStock.manualStock === null || menuStock.manualStock === undefined) {
        menuStock.calculatedStock = calculatedStock;
        console.log(`📦 Menu ${menuItem.name}: calculatedStock updated to ${calculatedStock}`);
      } else {
        console.log(`📦 Menu ${menuItem.name}: using manualStock ${menuStock.manualStock}`);
      }
      menuStock.lastCalculatedAt = new Date();
      await menuStock.save({ session });
    } else {
      await MenuStock.create([{
        menuItemId: menuItem._id,
        calculatedStock,
        lastCalculatedAt: new Date()
      }], { session });
      console.log(`📦 Menu ${menuItem.name}: new stock record created with ${calculatedStock}`);
    }

    // Update availableStock di MenuItem
    const updatedMenuStock = await MenuStock.findOne({ menuItemId: menuItem._id }).session(session);
    menuItem.availableStock = updatedMenuStock.effectiveStock;
    await menuItem.save({ session });

    await session.commitTransaction();
    
    console.log(`✅ ${menuItem.name}: stock updated to ${updatedMenuStock.effectiveStock}`);

    return {
      success: true,
      menuItemId,
      menuItemName: menuItem.name,
      calculatedStock,
      effectiveStock: updatedMenuStock.effectiveStock,
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
  // Jalankan setiap jam pada menit 5 (05:00, 06:00, 07:00, dst)
  // Memberi waktu 5 menit setelah jam tepat untuk hindari peak load
  cron.schedule('5 * * * *', async () => {
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
      
      // Log error lebih detail untuk debugging
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  });

  // Tambahan: Jalankan sekali saat startup untuk memastikan stok terkini
  setTimeout(async () => {
    console.log('🚀 Running initial stock calibration on startup...');
    try {
      await calibrateAllMenuStocks();
    } catch (error) {
      console.error('Initial calibration failed:', error);
    }
  }, 30000); // Delay 30 detik setelah startup

  console.log('✅ Stock calibration cron job setup: Setiap jam pada menit 5');
};

/**
 * Kalibrasi stok untuk menu items tertentu saja
 */
export const calibrateSelectedMenuStocks = async (menuItemIds) => {
  let successCount = 0;
  let errorCount = 0;

  try {
    console.log(`🔄 Memulai kalibrasi stok untuk ${menuItemIds.length} menu items...`);

    for (const menuItemId of menuItemIds) {
      try {
        await calibrateSingleMenuStock(menuItemId);
        successCount++;
      } catch (error) {
        console.error(`❌ Gagal mengkalibrasi menu item ${menuItemId}:`, error.message);
        errorCount++;
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

// Jalankan kalibrasi manual via API
export const manualStockCalibration = async (req, res) => {
  try {
    console.log('🔧 Manual stock calibration triggered via API');
    
    // Optional: parameter untuk memilih jenis kalibrasi
    const { type, menuItemIds } = req.body;
    
    let result;
    
    if (type === 'selected' && menuItemIds && Array.isArray(menuItemIds)) {
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