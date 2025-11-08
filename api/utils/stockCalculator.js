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

    // Find central warehouse to exclude it from calculations
    const centralWarehouse = await Warehouse.findOne({ code: 'gudang-pusat' }).session(session);
    const centralWarehouseId = centralWarehouse?._id?.toString();

    // Get recipe for menu item
    const recipe = await Recipe.findOne({ menuItemId }).session(session);
    if (!recipe) {
      console.log(`No recipe found for menu item: ${menuItemId}`);
      return 0;
    }

    let maxPossiblePortions = Infinity;

    // Calculate based on base ingredients
    for (const ingredient of recipe.baseIngredients) {
      // Get product stock from ALL warehouses EXCEPT central warehouse
      const productStocks = await ProductStock.find({
        productId: ingredient.productId,
        warehouse: { $ne: centralWarehouseId }
      })
        .populate('warehouse')
        .session(session);

      // Calculate total stock from all non-central warehouses
      const totalStock = productStocks.reduce((sum, stock) => {
        // Only count stock from active warehouses
        if (stock.warehouse?.is_active !== false) {
          return sum + (stock.currentStock || 0);
        }
        return sum;
      }, 0);

      console.log(`Product ${ingredient.productId} total stock from non-central warehouses: ${totalStock}`);

      // Calculate how many portions can be made with available stock
      const requiredQuantity = ingredient.quantity || 1;
      if (requiredQuantity <= 0) continue;

      const portions = Math.floor(totalStock / requiredQuantity);

      maxPossiblePortions = Math.min(maxPossiblePortions, portions);

      console.log(`Ingredient ${ingredient.productId}: ${totalStock} stock / ${requiredQuantity} required = ${portions} portions`);
    }

    // Consider toppings if they are required in recipe
    if (recipe.toppings && recipe.toppings.length > 0) {
      for (const topping of recipe.toppings) {
        if (topping.isRequired) {
          const toppingStocks = await ProductStock.find({
            productId: topping.productId,
            warehouse: { $ne: centralWarehouseId }
          })
            .populate('warehouse')
            .session(session);

          const totalToppingStock = toppingStocks.reduce((sum, stock) => {
            if (stock.warehouse?.is_active !== false) {
              return sum + (stock.currentStock || 0);
            }
            return sum;
          }, 0);

          const requiredToppingQty = topping.quantity || 1;
          if (requiredToppingQty <= 0) continue;

          const toppingPortions = Math.floor(totalToppingStock / requiredToppingQty);
          maxPossiblePortions = Math.min(maxPossiblePortions, toppingPortions);

          console.log(`Topping ${topping.productId}: ${totalToppingStock} stock / ${requiredToppingQty} required = ${toppingPortions} portions`);
        }
      }
    }

    // Consider addons if they affect stock calculation
    if (recipe.addons && recipe.addons.length > 0) {
      for (const addon of recipe.addons) {
        if (addon.affectsStock) {
          const addonStocks = await ProductStock.find({
            productId: addon.productId,
            warehouse: { $ne: centralWarehouseId }
          })
            .populate('warehouse')
            .session(session);

          const totalAddonStock = addonStocks.reduce((sum, stock) => {
            if (stock.warehouse?.is_active !== false) {
              return sum + (stock.currentStock || 0);
            }
            return sum;
          }, 0);

          const requiredAddonQty = addon.quantity || 1;
          if (requiredAddonQty <= 0) continue;

          const addonPortions = Math.floor(totalAddonStock / requiredAddonQty);
          maxPossiblePortions = Math.min(maxPossiblePortions, addonPortions);

          console.log(`Addon ${addon.productId}: ${totalAddonStock} stock / ${requiredAddonQty} required = ${addonPortions} portions`);
        }
      }
    }

    const finalStock = Math.max(0, maxPossiblePortions === Infinity ? 0 : maxPossiblePortions);

    console.log(`Final calculated stock for menu item ${menuItemId}: ${finalStock}`);

    await session.commitTransaction();
    return finalStock;

  } catch (error) {
    await session.abortTransaction();
    console.error('Error calculating menu item stock:', error);
    return 0;
  } finally {
    await session.endSession();
  }
}

/**
 * Calculate max portions for specific ingredients (standalone function)
 * @param {Array} ingredients - Array of ingredients with productId and quantity
 * @returns {number} maximum portions possible
 */
// utils/stockCalculator.js - Perbaikan calculateMaxPortions
export const calculateMaxPortions = async (ingredients) => {
  try {
    // console.log(`🔍 DEBUG calculateMaxPortions: Processing ${ingredients.length} ingredients`);

    // Find central warehouse to exclude
    const centralWarehouse = await Warehouse.findOne({ code: 'gudang-pusat' });
    const centralWarehouseId = centralWarehouse?._id?.toString();

    // console.log(`🔍 DEBUG: Central warehouse ID: ${centralWarehouseId}`);

    let maxPortion = Infinity;

    for (const ing of ingredients) {
      // console.log(`🔍 DEBUG: Processing ingredient - Product: ${ing.productId}, Quantity: ${ing.quantity}, isDefault: ${ing.isDefault}`);

      // Get stocks from all warehouses except central
      const stockDocs = await ProductStock.find({
        productId: ing.productId,
        warehouse: { $ne: centralWarehouseId }
      }).populate('warehouse');

      // console.log(`🔍 DEBUG: Found ${stockDocs.length} stock records for product ${ing.productId}`);

      if (!stockDocs || stockDocs.length === 0) {
        // console.log(`❌ DEBUG: No stock found for product ${ing.productId} in non-central warehouses`);
        return 0;
      }

      // Calculate total available stock from all non-central warehouses
      const availableQty = stockDocs.reduce((sum, stock) => {
        if (stock.warehouse?.is_active !== false) {
          const stockQty = stock.currentStock || 0;
          // console.log(`🔍 DEBUG: Warehouse ${stock.warehouse?.name}: ${stockQty} stock`);
          return sum + stockQty;
        }
        return sum;
      }, 0);

      // console.log(`🔍 DEBUG: Total available quantity for ${ing.productId}: ${availableQty}`);

      const requiredPerPortion = ing.quantity || 1;

      if (requiredPerPortion <= 0) {
        // console.log(`⚠️ DEBUG: Required quantity is 0 or negative for ${ing.productId}`);
        continue;
      }

      const possiblePortion = Math.floor(availableQty / requiredPerPortion);
      console.log(`🔍 DEBUG: Possible portions for ${ing.productId}: ${availableQty} / ${requiredPerPortion} = ${possiblePortion}`);

      maxPortion = Math.min(maxPortion, possiblePortion);

      // console.log(`🔍 DEBUG: Current max portion: ${maxPortion}`);
    }

    const result = isNaN(maxPortion) || maxPortion < 0 || maxPortion === Infinity ? 0 : maxPortion;
    // console.log(`🔍 DEBUG: Final calculated portions: ${result}`);

    return result;

  } catch (error) {
    console.error('❌ Error in calculateMaxPortions:', error);
    return 0;
  }
};
/**
 * Get detailed stock information for a menu item
 * @param {string} menuItemId - ID of the menu item
 * @returns {Object} detailed stock information
 */
export async function getDetailedMenuItemStock(menuItemId) {
  try {
    const centralWarehouse = await Warehouse.findOne({ code: 'gudang-pusat' });
    const centralWarehouseId = centralWarehouse?._id?.toString();

    const recipe = await Recipe.findOne({ menuItemId });
    if (!recipe) {
      return { availableStock: 0, ingredients: [] };
    }

    const ingredientDetails = [];

    for (const ingredient of recipe.baseIngredients) {
      const productStocks = await ProductStock.find({
        productId: ingredient.productId,
        warehouse: { $ne: centralWarehouseId }
      }).populate('warehouse');

      const warehouseStocks = productStocks.map(stock => ({
        warehouseName: stock.warehouse?.name || 'Unknown',
        stock: stock.currentStock || 0,
        isActive: stock.warehouse?.is_active !== false
      }));

      const totalStock = warehouseStocks.reduce((sum, ws) => ws.isActive ? sum + ws.stock : sum, 0);

      ingredientDetails.push({
        productId: ingredient.productId,
        productName: ingredient.productName,
        requiredQuantity: ingredient.quantity,
        totalAvailable: totalStock,
        maxPortions: Math.floor(totalStock / (ingredient.quantity || 1)),
        warehouseStocks
      });
    }

    const availableStock = Math.min(...ingredientDetails.map(ing => ing.maxPortions));

    return {
      availableStock: Math.max(0, availableStock),
      ingredients: ingredientDetails,
      calculatedAt: new Date()
    };

  } catch (error) {
    console.error('Error getting detailed menu item stock:', error);
    return { availableStock: 0, ingredients: [] };
  }
}

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
    console.log(`Updated stock for ${bulkOps.length} menu items`);
  }
}

/**
 * Recalculate stock for all menu items with recipes
 */
export async function recalculateAllMenuStocks() {
  try {
    const recipes = await Recipe.find().select('menuItemId');
    const menuItemIds = recipes.map(recipe => recipe.menuItemId);

    console.log(`Recalculating stock for ${menuItemIds.length} menu items`);

    await recalculateMultipleMenuStocks(menuItemIds);

    console.log('Completed recalculating all menu stocks');
  } catch (error) {
    console.error('Error recalculating all menu stocks:', error);
  }
}