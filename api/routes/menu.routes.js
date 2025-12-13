import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import upload from '../utils/middleware/upload.js'; // Multer config
import {
  createMenuItem,
  getMenuItems,
  getMenuItemsByOutletWithRecipes,
  getMenuItemsWithRecipes,
  deleteMenuItem,
  getMenuItemById,
  getMenuItemsByCategory,
  updateMenuItem,
  filterMenuItems,
  getAvailableMenuItems,
  getMenuByOutlet,
  getMenuByRating,
  updateMenuActivated,
  getMenuItemsBackOffice,
} from '../controllers/menu.controller.js';
import { 
  manualStockCalibration,
  calibrateSingleMenuStockForAllWarehouses,
  calibrateSingleMenuStockForWarehouse,
  calibrateMenuStocksByWorkstation,
  getMenuCalibrationStatus,
  resetMinusManualStockForWarehouse
} from '../jobs/stockCalibration.job.js';

import { menuStockController } from '../controllers/menuStock.controller.js';

import { assignMenuItemsToCategory, createCategory, filterMenuByCategory, getCategories, updateCategory, deleteCategory, getCategoryById } from '../controllers/category.controller.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import { PrintLogger } from '../services/print-logger.service.js';

const router = express.Router();

// Middleware for admin and superadmin only
const adminAccess = verifyToken(['admin', 'superadmin', 'marketing', 'operational']);

// MenuItem Routes
router.post('/menu-items', upload.single('images'), createMenuItem); // Create a new MenuItem
router.get('/menu-items', getMenuItemsWithRecipes); // Get all MenuItems with Recipes
router.get('/all-menu-items', getMenuItems); // Get all MenuItems
router.get('/all-menu-items-backoffice', getMenuItemsBackOffice); // Get all MenuItems
router.get('/with-recipes/outlet/:outletId', getMenuItemsByOutletWithRecipes); // Get MenuItems by Outlet ID with Recipes
router.get('/menu-items/category/:categoryId', getMenuItemsByCategory); // Get MenuItems by Category ID
router.get('/menu-items/:id', getMenuItemById); // Get a specific MenuItem by ID
router.put('/menu-items/:id', adminAccess, updateMenuItem); // Update a specific MenuItem
router.put('/menu-items/activated/:id', adminAccess, updateMenuActivated); // Update a specific MenuItem
router.delete('/menu-items/:id', adminAccess, deleteMenuItem); // Delete a specific MenuItem
router.get('/menu-items/filter', filterMenuItems); // Filter MenuItems by name, category, or type
router.get('/menu-items/available', getAvailableMenuItems); // Get available MenuItems
router.get('/menu-items/outlet/:outletId', getMenuByOutlet); // Get MenuItems by Outlet ID
router.get('/menu-items/rating', getMenuByRating); // Get MenuItems by rating

// Category Routes
// router.post('/categories', adminAccess, assignMenuItemsToCategory); // Assign menu items to a category
router.post('/categories', adminAccess, createCategory); // Create a new category
router.get('/categories', getCategories); // Get all categories
router.get('/categories/filter', filterMenuByCategory); // Filter menu items by category
router.get('/categories/:id', getCategoryById); // Get category by ID
router.put('/categories/:id', updateCategory); // Update a category
router.delete('/categories/:id', deleteCategory); // Delete a 

// Get stock for specific menu item
router.get('/:menuItemId/stock', menuStockController.getMenuItemStock);

// Recalculate stock
router.post('/:menuItemId/recalculate', menuStockController.recalculateStock);

// Adjust stock manually
router.post('/:menuItemId/warehouse/:warehouseId/adjust', menuStockController.adjustStock);

// Transfer stock between warehouses
router.post('/:menuItemId/transfer', menuStockController.transferStock);

// Get stock for POS
router.get('/:menuItemId/pos-stock', menuStockController.getStockForPOS);

// Get all menu items stock
router.get('/all/stocks', menuStockController.getAllMenuStocks);

// Manual calibration endpoint
router.post('/calibrate/manual', manualStockCalibration);

// Calibrate specific menu item for all warehouses
router.post('/calibrate/menu/:menuItemId', async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const result = await calibrateSingleMenuStockForAllWarehouses(menuItemId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Calibration failed',
      error: error.message
    });
  }
});

// Calibrate specific menu item for specific warehouse
router.post('/calibrate/menu/:menuItemId/warehouse/:warehouseId', async (req, res) => {
  try {
    const { menuItemId, warehouseId } = req.params;
    const result = await calibrateSingleMenuStockForWarehouse(menuItemId, warehouseId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Calibration failed',
      error: error.message
    });
  }
});

// Calibrate all menu items for specific workstation
router.post('/calibrate/workstation/:workstation', async (req, res) => {
  try {
    const { workstation } = req.params;
    const result = await calibrateMenuStocksByWorkstation(workstation);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Calibration failed',
      error: error.message
    });
  }
});

// Get calibration status for menu item
router.get('/status/menu/:menuItemId', async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const result = await getMenuCalibrationStatus(menuItemId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get status',
      error: error.message
    });
  }
});

// Reset minus stock for specific warehouse
router.post('/reset/minus/menu/:menuItemId/warehouse/:warehouseId', async (req, res) => {
  try {
    const { menuItemId, warehouseId } = req.params;
    const result = await resetMinusManualStockForWarehouse(menuItemId, warehouseId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Reset failed',
      error: error.message
    });
  }
});

router.get('/menu-items/:id/stock-status', async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item ID'
      });
    }

    const menuItemId = new mongoose.Types.ObjectId(id);

    console.log('🔍 [STOCK API] Checking stock for menuItemId:', menuItemId);

    // Cari MenuStock, jika tidak ada buat default
    let menuStock = await MenuStock.findOne({ menuItemId })
      .populate('menuItemId', 'name workstation');

    // Jika tidak ada MenuStock, buat record default
    if (!menuStock) {
      console.log(`⚠️ No MenuStock found for ${menuItemId}, creating default record`);

      // Cek apakah menu item exists
      const menuItem = await mongoose.model('MenuItem').findById(menuItemId);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      // Buat MenuStock default
      menuStock = await MenuStock.create({
        menuItemId: menuItemId,
        calculatedStock: 100, // Default stock
        manualStock: null,
        type: 'initial_setup',
        reason: 'auto_created'
      });

      console.log(`✅ Created default MenuStock for ${menuItem.name}`);
    }

    // Gunakan method getStockInfo() yang sudah didefinisikan di model
    const stockInfo = menuStock.getStockInfo();

    // Tambahkan PrintLogger integration
    const stockStatus = PrintLogger.getStockStatus(stockInfo.effectiveStock);

    console.log('✅ [STOCK API] Stock data returned:', {
      menuItemId: menuItemId,
      effectiveStock: stockInfo.effectiveStock,
      status: stockStatus
    });

    res.status(200).json({
      success: true,
      data: {
        ...stockInfo,
        status: stockStatus,
        menuItemName: menuStock.menuItemId?.name || 'Unknown Menu'
      }
    });

  } catch (error) {
    console.error('❌ Error getting menu item stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu item stock status',
      error: error.message
    });
  }
});

export default router;
