import mongoose from 'mongoose';
import ProductStock from '../../models/modul_menu/ProductStock.model.js';
import Recipe from '../../models/modul_menu/Recipe.model.js';
import Warehouse from '../../models/modul_market/Warehouse.model.js';
import MenuStock from '../../models/modul_menu/MenuStock.model.js';

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
    
    // Ambil data recipes dan menuStocks sekaligus
    const [recipes, menuStocks] = await Promise.all([
      Recipe.find({ menuItemId: { $in: menuItemIds } }).session(session),
      MenuStock.find({ menuItemId: { $in: menuItemIds } }).session(session)
    ]);

    const bulkProductOps = [];
    const bulkMenuStockOps = [];
    const failedItems = [];

    const processIngredient = async (ingredient, itemQty, type, noteSuffix, menuItemId) => {
      // Cari semua stok produk ini di warehouse selain gudang pusat
      const productStocks = await ProductStock.find({
        productId: ingredient.productId,
        warehouse: { $ne: centralWarehouseId }
      }).session(session);

      let totalAvailable = 0;
      const warehouseUpdates = [];

      // Hitung total stok yang tersedia di semua warehouse
      for (const stock of productStocks) {
        const availableStock = stock.currentStock || 0;
        const requiredStock = ingredient.quantity * itemQty;
        
        if (type === 'out') {
          if (availableStock >= requiredStock) {
            totalAvailable += requiredStock;
            warehouseUpdates.push({
              warehouse: stock.warehouse,
              quantity: requiredStock,
              available: availableStock
            });
          } else {
            totalAvailable += availableStock;
            warehouseUpdates.push({
              warehouse: stock.warehouse,
              quantity: availableStock,
              available: availableStock
            });
          }
        }
      }

      // Jika stok tidak cukup untuk pengurangan
      if (type === 'out' && totalAvailable < (ingredient.quantity * itemQty)) {
        throw new Error(`Insufficient stock for product ${ingredient.productId}. Required: ${ingredient.quantity * itemQty}, Available: ${totalAvailable}`);
      }

      // Proses update stok produk per warehouse
      for (const stock of productStocks) {
        const update = warehouseUpdates.find(w => w.warehouse.toString() === stock.warehouse.toString());
        if (update) {
          bulkProductOps.push({
            updateOne: {
              filter: { productId: ingredient.productId, warehouse: stock.warehouse },
              update: {
                $inc: { currentStock: type === 'out' ? -update.quantity : update.quantity },
                $push: {
                  movements: {
                    quantity: update.quantity,
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
      }

      return true;
    };

    // Loop semua item order
    for (const item of items) {
      try {
        const recipe = recipes.find(r => r.menuItemId.equals(item.menuItem));
        if (!recipe) {
          console.warn(`Recipe not found for menuItem: ${item.menuItem}`);
          continue;
        }

        // Cek stok menu item terlebih dahulu
        const menuStock = menuStocks.find(ms => ms.menuItemId.equals(item.menuItem));
        const effectiveStock = menuStock ? menuStock.effectiveStock : 0;

        // Jika stok manual ada dan tidak cukup, skip item ini
        if (menuStock && menuStock.manualStock !== null && effectiveStock < item.quantity) {
          failedItems.push({
            menuItem: item.menuItem,
            quantity: item.quantity,
            available: effectiveStock,
            reason: 'Insufficient manual stock'
          });
          continue;
        }

        // Jika stok calculated tidak cukup, skip item ini
        if (!menuStock || effectiveStock < item.quantity) {
          failedItems.push({
            menuItem: item.menuItem,
            quantity: item.quantity,
            available: effectiveStock,
            reason: 'Insufficient calculated stock'
          });
          continue;
        }

        // Base ingredients
        for (const ing of recipe.baseIngredients) {
          await processIngredient(ing, item.quantity, 'out', `Order ${orderId} - base ingredient`, item.menuItem);
        }

        // Toppings
        if (item.toppings?.length > 0) {
          for (const topping of item.toppings) {
            const toppingRecipe = recipe.toppingOptions.find(t => t.toppingName === topping.name);
            if (!toppingRecipe) continue;
            for (const ing of toppingRecipe.ingredients) {
              await processIngredient(ing, item.quantity, 'out', `Order ${orderId} - topping ${topping.name}`, item.menuItem);
            }
          }
        }

        // Addons
        if (item.addons?.length > 0) {
          for (const addon of item.addons) {
            const addonRecipe = recipe.addonOptions.find(a => a.addonName === addon.name && a.optionLabel === addon.option);
            if (!addonRecipe) continue;
            for (const ing of addonRecipe.ingredients) {
              await processIngredient(ing, item.quantity, 'out', `Order ${orderId} - addon ${addon.name}:${addon.option}`, item.menuItem);
            }
          }
        }

        // Update stok menu item (hanya jika semua bahan tersedia)
        bulkMenuStockOps.push({
          updateOne: {
            filter: { menuItemId: item.menuItem },
            update: {
              $inc: { 
                calculatedStock: -item.quantity 
              },
              $set: { 
                lastCalculatedAt: new Date() 
              }
            },
            upsert: true
          }
        });

      } catch (error) {
        console.error(`Failed to process item ${item.menuItem}:`, error);
        failedItems.push({
          menuItem: item.menuItem,
          quantity: item.quantity,
          reason: error.message
        });
      }
    }

    // Eksekusi bulk operations
    let productUpdateResult = null;
    let menuStockUpdateResult = null;

    if (bulkProductOps.length > 0) {
      productUpdateResult = await ProductStock.bulkWrite(bulkProductOps, { session });
      console.log(`Product inventory updated for order ${orderId}:`, productUpdateResult);
    } else {
      console.log(`No product inventory updates for order ${orderId}`);
    }

    if (bulkMenuStockOps.length > 0) {
      menuStockUpdateResult = await MenuStock.bulkWrite(bulkMenuStockOps, { session });
      console.log(`Menu stock updated for order ${orderId}:`, menuStockUpdateResult);
    } else {
      console.log(`No menu stock updates for order ${orderId}`);
    }

    await session.commitTransaction();

    return {
      success: true,
      updated: items.length - failedItems.length,
      failed: failedItems.length,
      failedItems,
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