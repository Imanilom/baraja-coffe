// controllers/menuStockController.js
import { MenuItem } from '../models/MenuItem.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import { 
  recalculateMenuItemStocks,
  getDetailedMenuItemStockPerWarehouse,
  transferMenuStock,
  getMenuStockForPOS
} from '../utils/stockCalculator.js';

export const menuStockController = {
  // Get stock for specific menu item
  async getMenuItemStock(req, res) {
    try {
      const { menuItemId } = req.params;
      
      const result = await getDetailedMenuItemStockPerWarehouse(menuItemId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting menu item stock',
        error: error.message
      });
    }
  },

  // Recalculate stock for menu item
  async recalculateStock(req, res) {
    try {
      const { menuItemId } = req.params;
      
      const updatedStocks = await recalculateMenuItemStocks(menuItemId);
      
      res.json({
        success: true,
        message: 'Stock recalculated successfully',
        data: updatedStocks
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error recalculating stock',
        error: error.message
      });
    }
  },

  // Adjust stock manually
  async adjustStock(req, res) {
    try {
      const { menuItemId, warehouseId } = req.params;
      const { quantity, reason, notes, handledBy } = req.body;

      const menuItem = await MenuItem.findById(menuItemId);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      // Find or create MenuStock record
      let menuStock = await MenuStock.findOne({
        menuItemId,
        warehouseId
      });

      const previousStock = menuStock?.currentStock || 0;
      const newStock = Math.max(0, previousStock + quantity);

      if (menuStock) {
        menuStock.manualStock = newStock;
        menuStock.currentStock = newStock;
        menuStock.type = 'adjustment';
        menuStock.reason = reason || 'manual_adjustment';
        menuStock.notes = notes;
        menuStock.adjustedBy = handledBy;
        menuStock.lastAdjustedAt = new Date();
        await menuStock.save();
      } else {
        menuStock = await MenuStock.create({
          menuItemId,
          warehouseId,
          manualStock: newStock,
          currentStock: newStock,
          calculatedStock: newStock,
          type: 'adjustment',
          reason: reason || 'manual_adjustment',
          quantity: Math.abs(quantity),
          previousStock,
          notes,
          adjustedBy: handledBy
        });
      }

      // Update MenuItem warehouse stock
      await menuItem.updateStockForWarehouse(warehouseId, newStock);

      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: {
          menuItemId,
          warehouseId,
          previousStock,
          newStock,
          adjustment: quantity
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error adjusting stock',
        error: error.message
      });
    }
  },

  // Transfer stock between warehouses
  async transferStock(req, res) {
    try {
      const { menuItemId } = req.params;
      const { fromWarehouseId, toWarehouseId, quantity, reason, handledBy } = req.body;

      if (fromWarehouseId === toWarehouseId) {
        return res.status(400).json({
          success: false,
          message: 'Source and destination warehouses cannot be the same'
        });
      }

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }

      const result = await transferMenuStock(
        menuItemId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        reason,
        handledBy
      );

      res.json({
        success: true,
        message: 'Stock transferred successfully',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error transferring stock',
        error: error.message
      });
    }
  },

  // Get stock for POS
  async getStockForPOS(req, res) {
    try {
      const { menuItemId } = req.params;
      const { workstation } = req.query;

      if (!workstation) {
        return res.status(400).json({
          success: false,
          message: 'Workstation is required'
        });
      }

      const result = await getMenuStockForPOS(menuItemId, workstation);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting stock for POS',
        error: error.message
      });
    }
  },

  // Get all menu items stock summary
  async getAllMenuStocks(req, res) {
    try {
      const { workstation } = req.query;
      const { page = 1, limit = 20 } = req.query;

      const skip = (page - 1) * limit;

      // Build query based on workstation
      let query = { isActive: true };
      if (workstation) {
        query.workstation = workstation;
      }

      const menuItems = await MenuItem.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('warehouseStocks.warehouseId', 'name code')
        .sort({ name: 1 });

      const total = await MenuItem.countDocuments(query);

      const menuItemsWithStock = await Promise.all(
        menuItems.map(async (menuItem) => {
          const stockDetails = await getDetailedMenuItemStockPerWarehouse(menuItem._id);
          
          return {
            ...menuItem.toObject(),
            stockSummary: stockDetails
          };
        })
      );

      res.json({
        success: true,
        data: menuItemsWithStock,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting menu stocks',
        error: error.message
      });
    }
  }
};