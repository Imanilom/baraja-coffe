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
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

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
 * Kalibrasi stok semua menu items di semua warehouse
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
    console.log('🔄 Memulai kalibrasi stok semua menu items untuk semua warehouse...');

    // Get all menu items with workstation info
    const menuItems = await MenuItem.find()
      .select('_id name workstation')
      .lean();

    console.log(`📊 Total menu items: ${menuItems.length}`);

    for (let i = 0; i < menuItems.length; i += batchSize) {
      const batch = menuItems.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(menuItems.length / batchSize)}`);

      for (const menuItem of batch) {
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
 * ✅ Kalibrasi stok untuk menu item di semua warehouse terkait
 */
export const calibrateSingleMenuStockForAllWarehouses = async (menuItemId) => {
  return await retryWithBackoff(async () => {
    // ✅ Baca MenuItem dengan version
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

    // Calibrate for each warehouse
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

    // ✅ SELALU validasi & sync status aktivasi berdasarkan total stok
    let statusChange = null;

    if (totalEffectiveStock > 0 && !menuItem.isActive) {
      menuItem.isActive = true;
      statusChange = 'activated';
      console.log(`🟢 Aktifkan ${menuItem.name} - total stok tersedia (${totalEffectiveStock})`);
    } else if (totalEffectiveStock <= 0 && menuItem.isActive) {
      menuItem.isActive = false;
      statusChange = 'deactivated';
      console.log(`🔴 Nonaktifkan ${menuItem.name} - total stok habis (${totalEffectiveStock})`);
    }

    // Update MenuItem dengan warehouse stocks
    const warehouseStocksUpdate = warehouseCalibrationResults
      .filter(r => r.success)
      .map(r => ({
        warehouseId: r.warehouseId,
        stock: r.effectiveStock,
        workstation: workstation
      }));

    // ✅ Update MenuItem dengan version check
    const menuItemUpdateResult = await MenuItem.findOneAndUpdate(
      {
        _id: menuItem._id,
        __v: menuItemVersion
      },
      {
        $set: {
          warehouseStocks: warehouseStocksUpdate,
          availableStock: totalEffectiveStock,
          isActive: menuItem.isActive
        },
        $inc: { __v: 1 }
      },
      { new: true }
    );

    if (!menuItemUpdateResult) {
      throw new Error('Version conflict: MenuItem was modified during status sync');
    }

    return {
      success: true,
      menuItemId: menuItem._id.toString(),
      menuItemName: menuItem.name,
      workstation: workstation,
      warehouses: warehouseCalibrationResults,
      totalEffectiveStock,
      previousStatus,
      currentStatus: menuItemUpdateResult.isActive,
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

    // ✅ Baca MenuStock untuk warehouse ini dengan version
    let menuStock = await MenuStock.findOne({ 
      menuItemId: menuItem._id,
      warehouseId: warehouseId
    });
    
    const menuStockVersion = menuStock?.__v;
    let manualStockReset = false;
    let previousManualStock = null;

    // ✅ Hitung effective stock DULU sebelum cek skip
    const effectiveStock = menuStock?.manualStock !== null && menuStock?.manualStock !== undefined
      ? menuStock.manualStock
      : calculatedStock;

    // ✅ CEK: Skip kalibrasi DETAIL jika manual adjustment baru
    if (menuStock?.manualStock !== null &&
      menuStock?.manualStock !== undefined &&
      menuStock?.lastAdjustedAt) {

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
          manualStock: menuStock.manualStock,
          effectiveStock,
          manualStockReset: false,
          skipped: true,
          reason: 'recent_manual_adjustment',
          timestamp: new Date()
        };
      }
    }

    // ✅ Lanjutkan kalibrasi penuh jika tidak di-skip
    if (menuStock) {
      const previousStock = menuStock.currentStock;

      // Reset manual stock yang minus
      if (menuStock.manualStock !== null &&
        menuStock.manualStock !== undefined &&
        menuStock.manualStock < 0) {
        previousManualStock = menuStock.manualStock;
        menuStock.manualStock = 0;
        manualStockReset = true;
        console.log(`🔄 Reset manual stock ${menuItem.name} di ${warehouse.name}: ${previousManualStock} → 0`);
      }

      // Update hanya calculatedStock jika tidak ada manualStock
      if (menuStock.manualStock === null || menuStock.manualStock === undefined) {
        menuStock.calculatedStock = calculatedStock;
        menuStock.currentStock = calculatedStock;
        menuStock.quantity = calculatedStock - previousStock;
      } else {
        menuStock.currentStock = menuStock.manualStock;
        menuStock.quantity = 0;
      }

      menuStock.lastCalculatedAt = new Date();

      // ✅ Save MenuStock dengan version check
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
        { new: true }
      );

      if (!updateResult) {
        throw new Error(`Version conflict: MenuStock untuk ${warehouse.name} was modified by another process`);
      }

      menuStock = updateResult;

    } else {
      // Buat MenuStock baru untuk warehouse ini
      menuStock = await MenuStock.create({
        menuItemId: menuItem._id,
        warehouseId: warehouseId,
        type: 'adjustment',
        quantity: 0,
        reason: 'manual_adjustment',
        previousStock: 0,
        currentStock: calculatedStock,
        calculatedStock: calculatedStock,
        manualStock: null,
        handledBy: 'system',
        notes: `Initial stock calibration by system untuk ${warehouse.name}`,
        lastCalculatedAt: new Date(),
        lastAdjustedAt: new Date()
      });
    }

    return {
      success: true,
      menuItemId: menuItem._id.toString(),
      menuItemName: menuItem.name,
      warehouseId: warehouseId.toString(),
      warehouseName: warehouse.name,
      calculatedStock,
      manualStock: menuStock.manualStock,
      previousManualStock,
      effectiveStock,
      manualStockReset,
      timestamp: new Date()
    };
  });
};

/**
 * ✅ Reset manual stock yang minus di warehouse tertentu
 */
export const resetMinusManualStockForWarehouse = async (menuItemId, warehouseId) => {
  return await retryWithBackoff(async () => {
    const menuStock = await MenuStock.findOne({
      menuItemId: new mongoose.Types.ObjectId(menuItemId),
      warehouseId: new mongoose.Types.ObjectId(warehouseId)
    });

    if (!menuStock) {
      throw new Error('MenuStock tidak ditemukan untuk warehouse ini');
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

    console.log(`✅ Berhasil reset manual stock ${menuItemId} di warehouse ${warehouseId}: ${menuStock.manualStock} → 0`);

    // Update MenuItem warehouse stock
    const menuItem = await MenuItem.findById(menuItemId);
    if (menuItem) {
      const warehouseIndex = menuItem.warehouseStocks.findIndex(ws => 
        ws.warehouseId.toString() === warehouseId.toString()
      );
      
      if (warehouseIndex >= 0) {
        menuItem.warehouseStocks[warehouseIndex].stock = 0;
        menuItem.availableStock = menuItem.warehouseStocks.reduce((sum, ws) => sum + ws.stock, 0);
        
        // Deactivate if total stock is 0
        if (menuItem.availableStock <= 0 && menuItem.isActive) {
          menuItem.isActive = false;
        }
        
        await menuItem.save();
      }
    }

    return { 
      success: true, 
      reset: true,
      menuItemId,
      warehouseId 
    };
  });
};

/**
 * ✅ Bulk reset semua manual stock yang minus di semua warehouse
 */
export const bulkResetMinusManualStocks = async () => {
  try {
    console.log('🔄 Memulai bulk reset manual stock yang minus di semua warehouse...');

    const minusStocks = await MenuStock.find({
      manualStock: { $lt: 0 }
    })
    .populate('menuItemId', 'name')
    .populate('warehouseId', 'name code');

    console.log(`📊 Ditemukan ${minusStocks.length} stock dengan manual stock minus`);

    let resetCount = 0;
    let errorCount = 0;

    for (const stock of minusStocks) {
      try {
        await resetMinusManualStockForWarehouse(
          stock.menuItemId._id.toString(),
          stock.warehouseId._id.toString()
        );
        
        resetCount++;
        console.log(`✅ Reset ${stock.menuItemId?.name || 'Unknown'} di ${stock.warehouseId?.name || 'Unknown'}: ${stock.manualStock} → 0`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Gagal reset ${stock.menuItemId?.name || 'Unknown'} di ${stock.warehouseId?.name || 'Unknown'}:`, error.message);
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
    console.log('⏰ Menjalankan scheduled stock calibration untuk semua warehouse...');

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
    console.log('🚀 Menjalankan initial stock calibration untuk semua warehouse...');
    try {
      await bulkResetMinusManualStocks();
      await calibrateAllMenuStocks();
    } catch (error) {
      console.error('Initial calibration failed:', error);
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

    const concurrencyLimit = 10;
    for (let i = 0; i < menuItemIds.length; i += concurrencyLimit) {
      const batch = menuItemIds.slice(i, i + concurrencyLimit);
      console.log(`🔄 Processing batch ${Math.floor(i / concurrencyLimit) + 1}/${Math.ceil(menuItemIds.length / concurrencyLimit)}`);

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
      resetMinusFirst = true 
    } = req.body;

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

      calibrationStatus.push({
        warehouseId,
        warehouseName: warehouse?.name || warehouseType,
        warehouseType,
        hasStockRecord: !!menuStock,
        calculatedStock,
        manualStock: menuStock?.manualStock || null,
        currentStock: menuStock?.currentStock || 0,
        effectiveStock: menuStock?.effectiveStock || calculatedStock,
        lastCalculatedAt: menuStock?.lastCalculatedAt,
        lastAdjustedAt: menuStock?.lastAdjustedAt
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
        cs.manualStock === null || 
        Date.now() - new Date(cs.lastCalculatedAt).getTime() > 3600000 // 1 hour
      )
    };

  } catch (error) {
    console.error('Error getting calibration status:', error);
    throw error;
  }
};