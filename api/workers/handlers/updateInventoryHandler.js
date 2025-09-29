import mongoose from 'mongoose';
import ProductStock from '../../models/modul_menu/ProductStock.model.js';
import Recipe from '../../models/modul_menu/Recipe.model.js';
import Warehouse from '../../models/modul_market/Warehouse.model.js';

/**
 * Update inventory based on order items with multi-category & multi-warehouse support
 * @param {Object} data - payload from BullMQ job
 * @param {string} data.orderId - order ID
 * @param {Array} data.items - order items with menuItem references
 * @returns {Object} result including success status
 */
export async function updateInventoryHandler({ orderId, items, handledBy }) {
  console.log('Processing inventory update for order:', orderId);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Cari ID gudang pusat
    const centralWarehouse = await Warehouse.findOne({ code: 'gudang-pusat' }).session(session);
    const centralWarehouseId = centralWarehouse?._id?.toString();

    const menuItemIds = items.map(item => item.menuItem);
    const recipes = await Recipe.find({ menuItemId: { $in: menuItemIds } }).session(session);

    const bulkOps = [];

    const processIngredient = async (ingredient, itemQty, type, noteSuffix) => {
      // Cari semua stok produk ini di warehouse selain gudang pusat
      const productStocks = await ProductStock.find({
        productId: ingredient.productId,
        warehouse: { $ne: centralWarehouseId }
      }).session(session);

      for (const stock of productStocks) {
        bulkOps.push({
          updateOne: {
            filter: { productId: ingredient.productId, warehouse: stock.warehouse },
            update: {
              $inc: { currentStock: type === 'out' ? -ingredient.quantity * itemQty : ingredient.quantity * itemQty },
              $push: {
                movements: {
                  quantity: ingredient.quantity * itemQty,
                  category: ingredient.category,
                  type: type,
                  referenceId: orderId,
                  notes: `${noteSuffix} | warehouse: ${stock.warehouse}`,
                  handledBy: handledBy || 'system',
                  date: new Date(),
                  sourceWarehouse: type === 'out' ? stock.warehouse : null,
                  destinationWarehouse: type === 'in' ? stock.warehouse : null
                }
              }
            },
            upsert: true
          }
        });
      }
    };

    // Loop semua item order
    for (const item of items) {
      const recipe = recipes.find(r => r.menuItemId.equals(item.menuItem));
      if (!recipe) continue;

      // Base ingredients
      for (const ing of recipe.baseIngredients) {
        await processIngredient(ing, item.quantity, 'out', `Order ${orderId} - base ingredient`);
      }

      // Toppings
      if (item.toppings?.length > 0) {
        for (const topping of item.toppings) {
          const toppingRecipe = recipe.toppingOptions.find(t => t.toppingName === topping.name);
          if (!toppingRecipe) continue;
          for (const ing of toppingRecipe.ingredients) {
            await processIngredient(ing, item.quantity, 'out', `Order ${orderId} - topping ${topping.name}`);
          }
        }
      }

      // Addons
      if (item.addons?.length > 0) {
        for (const addon of item.addons) {
          const addonRecipe = recipe.addonOptions.find(a => a.addonName === addon.name && a.optionLabel === addon.option);
          if (!addonRecipe) continue;
          for (const ing of addonRecipe.ingredients) {
            await processIngredient(ing, item.quantity, 'out', `Order ${orderId} - addon ${addon.name}:${addon.option}`);
          }
        }
      }
    }

    if (bulkOps.length > 0) {
      const result = await ProductStock.bulkWrite(bulkOps, { session });
      console.log(`Inventory updated for order ${orderId}:`, result);
    } else {
      console.log(`No inventory updates (all ingredients only in Gudang Pusat) for order ${orderId}`);
    }

    await session.commitTransaction();

    return {
      success: true,
      updated: items.length,
      orderId,
      timestamp: new Date()
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Inventory update failed for order', orderId, ':', error);
    throw new Error(`Inventory update failed: ${error.message}`);
  } finally {
    await session.endSession();
  }
}
