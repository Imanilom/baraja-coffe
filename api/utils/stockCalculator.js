// utils/stockCalculator.js
import mongoose from 'mongoose';
import Recipe from '../models/modul_menu/Recipe.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import Warehouse from '../models/modul_market/Warehouse.model.js';

/**
 * Recalculate available stock for a menu item based on ingredient availability
 * @param {string} menuItemId - ID of the menu item
 * @returns {number} calculated stock quantity
 */
export async function calculateMenuItemStock(menuItemId) {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // Find central warehouse
    const centralWarehouse = await Warehouse.findOne({ code: 'gudang-pusat' }).session(session);
    const centralWarehouseId = centralWarehouse?._id?.toString();

    // Get recipe for menu item
    const recipe = await Recipe.findOne({ menuItemId }).session(session);
    if (!recipe) {
      return 0;
    }

    let maxPossiblePortions = Infinity;

    // Calculate based on base ingredients
    for (const ingredient of recipe.baseIngredients) {
      // Get product stock from all warehouses except central
      const productStocks = await ProductStock.find({
        productId: ingredient.productId,
        warehouse: { $ne: centralWarehouseId }
      }).session(session);

      const totalStock = productStocks.reduce((sum, stock) => sum + (stock.currentStock || 0), 0);
      const portions = Math.floor(totalStock / ingredient.quantity);
      
      maxPossiblePortions = Math.min(maxPossiblePortions, portions);
    }

    // Consider toppings and addons if needed
    // (You can add similar logic for toppings and addons here)

    await session.commitTransaction();
    return Math.max(0, maxPossiblePortions);

  } catch (error) {
    await session.abortTransaction();
    console.error('Error calculating menu item stock:', error);
    return 0;
  } finally {
    await session.endSession();
  }
}

export const calculateMaxPortions = async (ingredients) => {
  let maxPortion = Infinity;

  for (const ing of ingredients) {
    const stockDoc = await ProductStock.findOne({ productId: ing.productId });

    if (!stockDoc) {
      // Tidak ada stok → tidak bisa buat sama sekali
      return 0;
    }

    const availableQty = stockDoc.currentStock;
    const requiredPerPortion = ing.quantity;

    if (requiredPerPortion <= 0) continue;

    const possiblePortion = Math.floor(availableQty / requiredPerPortion);
    maxPortion = Math.min(maxPortion, possiblePortion);
  }

  return isNaN(maxPortion) || maxPortion < 0 ? 0 : maxPortion;
};

/**
 * Recalculate stock for multiple menu items
 * @param {Array} menuItemIds - Array of menu item IDs
 */
export async function recalculateMultipleMenuStocks(menuItemIds) {
  const bulkOps = [];
  
  for (const menuItemId of menuItemIds) {
    const calculatedStock = await calculateMenuItemStock(menuItemId);
    
    bulkOps.push({
      updateOne: {
        filter: { menuItemId },
        update: {
          $set: {
            calculatedStock,
            lastCalculatedAt: new Date()
          }
        },
        upsert: true
      }
    });
  }

  if (bulkOps.length > 0) {
    await MenuStock.bulkWrite(bulkOps);
  }
}