// utils/stockCalculator.js
import mongoose from 'mongoose';
import Recipe from '../models/modul_menu/Recipe.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import Warehouse from '../models/modul_market/Warehouse.model.js';
import { MenuItem } from '../models/MenuItem.model.js';

/**
 * Get Workstation-Warehouse Mapping
 */
export async function getWorkstationWarehouseMapping(workstation, outlet = 'amphi') {
  const warehouseCodes = {
    'kitchen': `kitchen-${outlet}`,
    'bar': {
      'bar-depan': `bar-depan-${outlet}`,
      'bar-belakang': `bar-belakang-${outlet}`
    }
  };

  const warehouses = {};

  if (workstation === 'kitchen') {
    const kitchenWarehouse = await Warehouse.findOne({ 
      code: warehouseCodes.kitchen 
    });
    if (kitchenWarehouse) {
      warehouses.kitchen = kitchenWarehouse._id;
    }
  } else if (workstation === 'bar') {
    const barDepan = await Warehouse.findOne({ 
      code: warehouseCodes.bar['bar-depan'] 
    });
    const barBelakang = await Warehouse.findOne({ 
      code: warehouseCodes.bar['bar-belakang'] 
    });
    
    if (barDepan) warehouses.barDepan = barDepan._id;
    if (barBelakang) warehouses.barBelakang = barBelakang._id;
  }

  return warehouses;
}

/**
 * Recalculate available stock for a menu item in specific warehouse
 * @param {string} menuItemId - ID of the menu item
 * @param {string} warehouseId - ID of the warehouse
 * @returns {number} calculated stock quantity for the warehouse
 */
export async function calculateMenuItemStockForWarehouse(menuItemId, warehouseId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Get menu item to determine workstation
    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (!menuItem) {
      console.log(`Menu item not found: ${menuItemId}`);
      return 0;
    }

    // Get recipe for menu item
    const recipe = await Recipe.findOne({ menuItemId }).session(session);
    if (!recipe) {
      console.log(`No recipe found for menu item: ${menuItemId}`);
      return 0;
    }

    let maxPossiblePortions = Infinity;

    // Calculate based on base ingredients in specific warehouse
    for (const ingredient of recipe.baseIngredients) {
      // Get product stock from specific warehouse
      const productStock = await ProductStock.findOne({
        productId: ingredient.productId,
        warehouse: warehouseId
      }).session(session);

      const warehouseStock = productStock?.currentStock || 0;
      
      console.log(`Product ${ingredient.productId} stock in warehouse ${warehouseId}: ${warehouseStock}`);

      // Calculate how many portions can be made with available stock
      const requiredQuantity = ingredient.quantity || 1;
      if (requiredQuantity <= 0) continue;

      const portions = Math.floor(warehouseStock / requiredQuantity);
      maxPossiblePortions = Math.min(maxPossiblePortions, portions);

      console.log(`Ingredient ${ingredient.productId}: ${warehouseStock} stock / ${requiredQuantity} required = ${portions} portions`);
    }

    // Consider toppings if they are required in recipe
    if (recipe.toppings && recipe.toppings.length > 0) {
      for (const topping of recipe.toppings) {
        if (topping.isRequired) {
          const toppingStock = await ProductStock.findOne({
            productId: topping.productId,
            warehouse: warehouseId
          }).session(session);

          const toppingQty = toppingStock?.currentStock || 0;
          const requiredToppingQty = topping.quantity || 1;
          
          if (requiredToppingQty <= 0) continue;

          const toppingPortions = Math.floor(toppingQty / requiredToppingQty);
          maxPossiblePortions = Math.min(maxPossiblePortions, toppingPortions);
        }
      }
    }

    const finalStock = Math.max(0, maxPossiblePortions === Infinity ? 0 : maxPossiblePortions);

    console.log(`Final calculated stock for menu item ${menuItemId} in warehouse ${warehouseId}: ${finalStock}`);

    await session.commitTransaction();
    return finalStock;

  } catch (error) {
    await session.abortTransaction();
    console.error('Error calculating menu item stock for warehouse:', error);
    return 0;
  } finally {
    await session.endSession();
  }
}

/**
 * Calculate max portions for specific ingredients in specific warehouse
 */
export const calculateMaxPortionsForWarehouse = async (ingredients, warehouseId) => {
  try {
    let maxPortion = Infinity;

    for (const ing of ingredients) {
      const stockDoc = await ProductStock.findOne({
        productId: ing.productId,
        warehouse: warehouseId
      });

      const availableQty = stockDoc?.currentStock || 0;
      const requiredPerPortion = ing.quantity || 1;

      if (requiredPerPortion <= 0) continue;
      if (availableQty === 0) return 0;

      const possiblePortion = Math.floor(availableQty / requiredPerPortion);
      maxPortion = Math.min(maxPortion, possiblePortion);
    }

    return isNaN(maxPortion) || maxPortion < 0 || maxPortion === Infinity ? 0 : maxPortion;
  } catch (error) {
    console.error('Error in calculateMaxPortionsForWarehouse:', error);
    return 0;
  }
};

/**
 * Recalculate stock for menu item across all relevant warehouses
 */
export async function recalculateMenuItemStocks(menuItemId) {
  try {
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      console.log(`Menu item not found: ${menuItemId}`);
      return;
    }

    // Get relevant warehouses based on workstation
    const workstation = menuItem.workstation;
    const warehouses = await getWorkstationWarehouseMapping(workstation);
    
    const bulkOps = [];
    const warehouseStockUpdates = [];

    // Calculate stock for each warehouse
    for (const [warehouseType, warehouseId] of Object.entries(warehouses)) {
      const calculatedStock = await calculateMenuItemStockForWarehouse(menuItemId, warehouseId);
      
      // Update MenuStock collection
      bulkOps.push({
        updateOne: {
          filter: { menuItemId, warehouseId },
          update: {
            $set: {
              calculatedStock,
              currentStock: calculatedStock,
              lastCalculatedAt: new Date()
            }
          },
          upsert: true
        }
      });

      // Track for MenuItem update
      warehouseStockUpdates.push({
        warehouseId,
        stock: calculatedStock,
        workstation: workstation
      });
    }

    // Update MenuStock collection
    if (bulkOps.length > 0) {
      await MenuStock.bulkWrite(bulkOps);
    }

    // Update MenuItem warehouse stocks
    await MenuItem.findByIdAndUpdate(menuItemId, {
      $set: {
        warehouseStocks: warehouseStockUpdates,
        availableStock: warehouseStockUpdates.reduce((sum, ws) => sum + ws.stock, 0)
      }
    });

    console.log(`Updated stocks for menu item ${menuItemId} across ${warehouseStockUpdates.length} warehouses`);
    return warehouseStockUpdates;

  } catch (error) {
    console.error('Error recalculating menu item stocks:', error);
    throw error;
  }
}

/**
 * Get detailed stock information for a menu item per warehouse
 */
export async function getDetailedMenuItemStockPerWarehouse(menuItemId) {
  try {
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return { availableStock: 0, warehouses: [] };
    }

    const recipe = await Recipe.findOne({ menuItemId });
    if (!recipe) {
      return { availableStock: 0, warehouses: [] };
    }

    // Get workstation and relevant warehouses
    const workstation = menuItem.workstation;
    const warehouses = await getWorkstationWarehouseMapping(workstation);
    
    const warehouseDetails = [];

    for (const [warehouseType, warehouseId] of Object.entries(warehouses)) {
      const warehouse = await Warehouse.findById(warehouseId);
      
      const ingredientDetails = [];

      // Calculate stock for each ingredient in this warehouse
      for (const ingredient of recipe.baseIngredients) {
        const productStock = await ProductStock.findOne({
          productId: ingredient.productId,
          warehouse: warehouseId
        });

        const stockQty = productStock?.currentStock || 0;
        const requiredQty = ingredient.quantity || 1;
        
        ingredientDetails.push({
          productId: ingredient.productId,
          productName: ingredient.productName,
          requiredQuantity: requiredQty,
          available: stockQty,
          maxPortions: Math.floor(stockQty / requiredQty)
        });
      }

      // Calculate total portions possible in this warehouse
      const maxPortions = Math.min(...ingredientDetails.map(ing => ing.maxPortions));
      const availableStock = Math.max(0, maxPortions);

      warehouseDetails.push({
        warehouseId,
        warehouseName: warehouse?.name || warehouseType,
        warehouseCode: warehouse?.code,
        stock: availableStock,
        ingredients: ingredientDetails
      });
    }

    return {
      menuItemId,
      menuItemName: menuItem.name,
      workstation: menuItem.workstation,
      totalStock: warehouseDetails.reduce((sum, wd) => sum + wd.stock, 0),
      warehouses: warehouseDetails
    };

  } catch (error) {
    console.error('Error getting detailed menu item stock per warehouse:', error);
    return { availableStock: 0, warehouses: [] };
  }
}

/**
 * Transfer stock between warehouses
 */
export async function transferMenuStock(menuItemId, fromWarehouseId, toWarehouseId, quantity, reason, handledBy) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check source stock
    const sourceStock = await MenuStock.findOne({
      menuItemId,
      warehouseId: fromWarehouseId
    }).session(session);

    if (!sourceStock || sourceStock.currentStock < quantity) {
      throw new Error('Insufficient stock in source warehouse');
    }

    // Update source warehouse stock (out)
    await MenuStock.findOneAndUpdate(
      { menuItemId, warehouseId: fromWarehouseId },
      {
        $inc: { currentStock: -quantity, calculatedStock: -quantity },
        $set: { lastAdjustedAt: new Date() }
      },
      { session }
    );

    // Create transfer out record
    await new MenuStock({
      menuItemId,
      warehouseId: fromWarehouseId,
      type: 'transfer',
      quantity: -quantity,
      reason: 'transfer_out',
      previousStock: sourceStock.currentStock,
      currentStock: sourceStock.currentStock - quantity,
      handledBy,
      notes: `Transfer to ${toWarehouseId}: ${reason}`
    }).save({ session });

    // Update destination warehouse stock (in)
    const destStock = await MenuStock.findOneAndUpdate(
      { menuItemId, warehouseId: toWarehouseId },
      {
        $inc: { currentStock: quantity, calculatedStock: quantity },
        $setOnInsert: { 
          menuItemId, 
          warehouseId: toWarehouseId 
        },
        $set: { lastAdjustedAt: new Date() }
      },
      { upsert: true, new: true, session }
    );

    // Create transfer in record
    await new MenuStock({
      menuItemId,
      warehouseId: toWarehouseId,
      type: 'transfer',
      quantity: quantity,
      reason: 'transfer_in',
      previousStock: destStock.currentStock - quantity,
      currentStock: destStock.currentStock,
      handledBy,
      notes: `Transfer from ${fromWarehouseId}: ${reason}`
    }).save({ session });

    // Update MenuItem warehouse stocks
    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (menuItem) {
      // Update source warehouse stock
      const sourceIndex = menuItem.warehouseStocks.findIndex(ws => 
        ws.warehouseId.toString() === fromWarehouseId.toString()
      );
      if (sourceIndex >= 0) {
        menuItem.warehouseStocks[sourceIndex].stock -= quantity;
      }

      // Update destination warehouse stock
      const destIndex = menuItem.warehouseStocks.findIndex(ws => 
        ws.warehouseId.toString() === toWarehouseId.toString()
      );
      if (destIndex >= 0) {
        menuItem.warehouseStocks[destIndex].stock += quantity;
      } else {
        menuItem.warehouseStocks.push({
          warehouseId: toWarehouseId,
          stock: quantity
        });
      }

      // Update total available stock
      menuItem.availableStock = menuItem.warehouseStocks.reduce((sum, ws) => sum + ws.stock, 0);
      await menuItem.save({ session });
    }

    await session.commitTransaction();
    console.log(`Transferred ${quantity} of menu item ${menuItemId} from ${fromWarehouseId} to ${toWarehouseId}`);

    return {
      success: true,
      message: 'Transfer completed successfully'
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Error transferring menu stock:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Get stock summary for POS
 */
export async function getMenuStockForPOS(menuItemId, workstation) {
  try {
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return { available: false, stock: 0, message: 'Menu item not found' };
    }

    // Get primary warehouse for this workstation
    const workstationWarehouses = await getWorkstationWarehouseMapping(workstation);
    
    if (Object.keys(workstationWarehouses).length === 0) {
      return { available: false, stock: 0, message: 'No warehouse configured for this workstation' };
    }

    // For kitchen, use kitchen warehouse
    // For bar, use both bar depan and belakang
    let totalStock = 0;
    const warehouseStocks = [];

    for (const [type, warehouseId] of Object.entries(workstationWarehouses)) {
      const stock = await MenuStock.findOne({
        menuItemId,
        warehouseId
      });

      const currentStock = stock?.currentStock || 0;
      totalStock += currentStock;
      
      warehouseStocks.push({
        warehouse: type,
        warehouseId,
        stock: currentStock
      });
    }

    return {
      available: totalStock > 0,
      stock: totalStock,
      warehouseStocks,
      menuItem: {
        id: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        workstation: menuItem.workstation
      }
    };

  } catch (error) {
    console.error('Error getting menu stock for POS:', error);
    return { available: false, stock: 0, message: 'Error checking stock' };
  }
}