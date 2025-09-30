import cron from 'node-cron';
import mongoose from 'mongoose';
import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import { calculateMaxPortions } from '../utils/stockCalculator.js';

/**
 * Kalibrasi stok semua menu items
 */
export const calibrateAllMenuStocks = async () => {
  const session = await mongoose.startSession();
  let successCount = 0;
  let errorCount = 0;

  try {
    session.startTransaction();
    console.log('🔄 Memulai kalibrasi stok menu...');

    // Ambil semua menu items yang aktif
    const menuItems = await MenuItem.find({ isActive: true }).session(session);
    console.log(`📊 Menemukan ${menuItems.length} menu items aktif`);

    for (const menuItem of menuItems) {
      try {
        const recipe = await Recipe.findOne({ menuItemId: menuItem._id }).session(session);
        let calculatedStock = 0;

        if (recipe?.baseIngredients?.length) {
          const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
          if (defaultIngredients.length) {
            calculatedStock = await calculateMaxPortions(defaultIngredients);
          }
        }

        // Update MenuStock - hanya update calculatedStock jika manualStock null
        const menuStock = await MenuStock.findOne({ menuItemId: menuItem._id }).session(session);
        
        if (menuStock) {
          // Jika ada manual stock, jangan overwrite calculatedStock
          if (menuStock.manualStock === null) {
            menuStock.calculatedStock = calculatedStock;
            menuStock.lastCalculatedAt = new Date();
            await menuStock.save({ session });
          } else {
            // Jika ada manual stock, hanya update lastCalculatedAt
            menuStock.lastCalculatedAt = new Date();
            await menuStock.save({ session });
          }
        } else {
          // Buat baru jika belum ada
          await MenuStock.create([{
            menuItemId: menuItem._id,
            calculatedStock,
            lastCalculatedAt: new Date()
          }], { session });
        }

        // Update availableStock di MenuItem
        const updatedMenuStock = await MenuStock.findOne({ menuItemId: menuItem._id }).session(session);
        menuItem.availableStock = updatedMenuStock.effectiveStock;
        await menuItem.save({ session });

        successCount++;

      } catch (error) {
        console.error(`❌ Gagal mengkalibrasi menu item ${menuItem.name}:`, error);
        errorCount++;
      }
    }

    await session.commitTransaction();
    console.log(`✅ Kalibrasi selesai: ${successCount} berhasil, ${errorCount} gagal`);

    return {
      success: true,
      processed: menuItems.length,
      successCount,
      errorCount,
      timestamp: new Date()
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Kalibrasi stok gagal:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  } finally {
    session.endSession();
  }
};

/**
 * Kalibrasi stok untuk menu item tertentu
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
        calculatedStock = await calculateMaxPortions(defaultIngredients);
      }
    }

    // Update MenuStock
    const menuStock = await MenuStock.findOne({ menuItemId: menuItem._id }).session(session);
    
    if (menuStock) {
      if (menuStock.manualStock === null) {
        menuStock.calculatedStock = calculatedStock;
      }
      menuStock.lastCalculatedAt = new Date();
      await menuStock.save({ session });
    } else {
      await MenuStock.create([{
        menuItemId: menuItem._id,
        calculatedStock,
        lastCalculatedAt: new Date()
      }], { session });
    }

    // Update availableStock
    const updatedMenuStock = await MenuStock.findOne({ menuItemId: menuItem._id }).session(session);
    menuItem.availableStock = updatedMenuStock.effectiveStock;
    await menuItem.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      menuItemId,
      calculatedStock,
      effectiveStock: updatedMenuStock.effectiveStock,
      timestamp: new Date()
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Kalibrasi single menu stock gagal:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Setup cron job untuk kalibrasi stok setiap 1 jam
 */
export const setupStockCalibrationCron = () => {
  // Jalankan setiap jam pada menit 0 (00:00, 01:00, 02:00, dst)
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Menjalankan scheduled stock calibration...');
    try {
      const result = await calibrateAllMenuStocks();
      console.log('📈 Scheduled stock calibration result:', result);
    } catch (error) {
      console.error('❌ Scheduled stock calibration failed:', error);
    }
  });

  console.log('✅ Stock calibration cron job setup: Setiap 1 jam');
};

// Jalankan kalibrasi manual via API
export const manualStockCalibration = async (req, res) => {
  try {
    console.log('🔧 Manual stock calibration triggered via API');
    const result = await calibrateAllMenuStocks();
    
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