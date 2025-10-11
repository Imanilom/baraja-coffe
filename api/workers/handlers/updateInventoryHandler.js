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
    await session.startTransaction();

    // Cari ID gudang pusat
    const centralWarehouse = await Warehouse.findOne({ code: 'gudang-pusat' }).session(session);
    const centralWarehouseId = centralWarehouse?._id;

    if (!centralWarehouseId) {
      throw new Error('Central warehouse (gudang-pusat) not found');
    }

    const menuItemIds = items.map(item => new mongoose.Types.ObjectId(item.menuItem));
    
    // Ambil data recipes dan menuStocks sekaligus
    const [recipes, menuStocks] = await Promise.all([
      Recipe.find({ menuItemId: { $in: menuItemIds } }).session(session),
      MenuStock.find({ menuItemId: { $in: menuItemIds } }).session(session)
    ]);

    const bulkProductOps = [];
    const bulkMenuStockOps = [];
    const failedItems = [];

    // Function untuk memproses pengurangan stok dengan prioritas warehouse
    const processIngredientStockReduction = async (ingredient, requiredQty, orderId, noteSuffix, menuItemId) => {
      const productId = ingredient.productId;
      const totalRequired = ingredient.quantity * requiredQty;
      
      console.log(`Processing ingredient: ${productId}, required: ${totalRequired}`);

      // Cari semua stok produk ini di warehouse selain gudang pusat, urutkan dari stok terbanyak
      const productStocks = await ProductStock.find({
        productId: productId,
        warehouse: { $ne: centralWarehouseId }
      })
      .sort({ currentStock: -1 }) // Prioritaskan warehouse dengan stok terbanyak
      .session(session);

      if (productStocks.length === 0) {
        throw new Error(`No stock available for product ${productId} in any warehouse`);
      }

      let remainingRequired = totalRequired;
      const warehouseAllocations = [];

      // Alokasi stok dari berbagai warehouse
      for (const stock of productStocks) {
        if (remainingRequired <= 0) break;

        const availableStock = stock.currentStock || 0;
        const allocatedQty = Math.min(availableStock, remainingRequired);

        if (allocatedQty > 0) {
          warehouseAllocations.push({
            warehouseId: stock.warehouse,
            allocatedQty: allocatedQty,
            currentStock: availableStock
          });
          remainingRequired -= allocatedQty;
        }
      }

      // Cek jika stok tidak cukup
      if (remainingRequired > 0) {
        const totalAvailable = warehouseAllocations.reduce((sum, alloc) => sum + alloc.allocatedQty, 0);
        throw new Error(`Insufficient stock for product ${productId}. Required: ${totalRequired}, Available: ${totalAvailable}`);
      }

      // Buat bulk operations untuk setiap alokasi warehouse
      for (const allocation of warehouseAllocations) {
        bulkProductOps.push({
          updateOne: {
            filter: { 
              productId: productId, 
              warehouse: allocation.warehouseId 
            },
            update: {
              $inc: { currentStock: -allocation.allocatedQty },
              $push: {
                movements: {
                  quantity: allocation.allocatedQty,
                  category: ingredient.category,
                  type: 'out',
                  referenceId: orderId,
                  notes: `${noteSuffix} | warehouse: ${allocation.warehouseId}`,
                  handledBy: handledBy || 'system',
                  date: new Date(),
                  sourceWarehouse: allocation.warehouseId,
                  menuItemId: menuItemId
                }
              }
            }
          }
        });
      }

      return true;
    };

    // Loop semua item order
    for (const item of items) {
      try {
        const menuItemObjectId = new mongoose.Types.ObjectId(item.menuItem);
        const recipe = recipes.find(r => r.menuItemId.equals(menuItemObjectId));
        
        if (!recipe) {
          console.warn(`Recipe not found for menuItem: ${item.menuItem}`);
          failedItems.push({
            menuItem: item.menuItem,
            quantity: item.quantity,
            reason: 'Recipe not found'
          });
          continue;
        }

        // Cek stok menu item terlebih dahulu
        const menuStock = menuStocks.find(ms => ms.menuItemId.equals(menuItemObjectId));
        
        // Jika menggunakan stok manual, cek ketersediaan
        if (menuStock && menuStock.manualStock !== null) {
          if (menuStock.manualStock < item.quantity) {
            failedItems.push({
              menuItem: item.menuItem,
              quantity: item.quantity,
              available: menuStock.manualStock,
              reason: 'Insufficient manual stock'
            });
            continue;
          }
        } else {
          // Jika menggunakan calculated stock, cek ketersediaan
          const effectiveStock = menuStock ? menuStock.effectiveStock : 0;
          if (effectiveStock < item.quantity) {
            failedItems.push({
              menuItem: item.menuItem,
              quantity: item.quantity,
              available: effectiveStock,
              reason: 'Insufficient calculated stock'
            });
            continue;
          }
        }

        // Process base ingredients
        for (const ing of recipe.baseIngredients || []) {
          await processIngredientStockReduction(
            ing, 
            item.quantity, 
            orderId, 
            `Order ${orderId} - base ingredient`, 
            menuItemObjectId
          );
        }

        // Process toppings
        if (item.toppings?.length > 0) {
          for (const topping of item.toppings) {
            const toppingRecipe = (recipe.toppingOptions || []).find(t => t.toppingName === topping.name);
            if (!toppingRecipe) {
              console.warn(`Topping recipe not found for: ${topping.name}`);
              continue;
            }
            
            for (const ing of toppingRecipe.ingredients || []) {
              await processIngredientStockReduction(
                ing, 
                item.quantity, 
                orderId, 
                `Order ${orderId} - topping ${topping.name}`, 
                menuItemObjectId
              );
            }
          }
        }

        // Process addons
        if (item.addons?.length > 0) {
          for (const addon of item.addons) {
            const addonRecipe = (recipe.addonOptions || []).find(a => 
              a.addonName === addon.name && a.optionLabel === addon.option
            );
            if (!addonRecipe) {
              console.warn(`Addon recipe not found for: ${addon.name} - ${addon.option}`);
              continue;
            }
            
            for (const ing of addonRecipe.ingredients || []) {
              await processIngredientStockReduction(
                ing, 
                item.quantity, 
                orderId, 
                `Order ${orderId} - addon ${addon.name}:${addon.option}`, 
                menuItemObjectId
              );
            }
          }
        }

        // Update stok menu item (hanya jika semua bahan tersedia)
        if (menuStock && menuStock.manualStock !== null) {
          // Jika menggunakan stok manual, kurangi manualStock
          bulkMenuStockOps.push({
            updateOne: {
              filter: { menuItemId: menuItemObjectId },
              update: {
                $inc: { manualStock: -item.quantity },
                $set: { lastUpdatedAt: new Date() }
              }
            }
          });
        } else {
          // Jika menggunakan calculated stock, kurangi calculatedStock
          bulkMenuStockOps.push({
            updateOne: {
              filter: { menuItemId: menuItemObjectId },
              update: {
                $inc: { calculatedStock: -item.quantity },
                $set: { lastCalculatedAt: new Date() }
              }
            }
          });
        }

        console.log(`Successfully processed item: ${item.menuItem}, quantity: ${item.quantity}`);

      } catch (error) {
        console.error(`Failed to process item ${item.menuItem}:`, error);
        failedItems.push({
          menuItem: item.menuItem,
          quantity: item.quantity,
          reason: error.message
        });
      }
    }

    // Jika ada failed items, rollback seluruh transaction
    if (failedItems.length > 0) {
      throw new Error(`Failed to process ${failedItems.length} items: ${failedItems.map(f => f.menuItem).join(', ')}`);
    }

    // Eksekusi bulk operations hanya jika tidak ada failed items
    let productUpdateResult = null;
    let menuStockUpdateResult = null;

    if (bulkProductOps.length > 0) {
      productUpdateResult = await ProductStock.bulkWrite(bulkProductOps, { session });
      console.log(`Product inventory updated for order ${orderId}:`, productUpdateResult.modifiedCount || 0, 'documents modified');
    }

    if (bulkMenuStockOps.length > 0) {
      menuStockUpdateResult = await MenuStock.bulkWrite(bulkMenuStockOps, { session });
      console.log(`Menu stock updated for order ${orderId}:`, menuStockUpdateResult.modifiedCount || 0, 'documents modified');
    }

    await session.commitTransaction();
    console.log(`Inventory update completed successfully for order ${orderId}`);

    return {
      success: true,
      orderId,
      productUpdates: productUpdateResult?.modifiedCount || 0,
      menuStockUpdates: menuStockUpdateResult?.modifiedCount || 0,
      timestamp: new Date()
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Inventory update failed for order', orderId, ':', error);
    
    // Return detailed error information
    return {
      success: false,
      orderId,
      error: error.message,
      failedItems: failedItems,
      timestamp: new Date()
    };
  } finally {
    await session.endSession();
  }
}