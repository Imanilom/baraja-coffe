/**
 * Update inventory based on order items
 * @param {Object} data - payload from BullMQ job
 * @param {string} data.orderId - order ID
 * @param {Array} data.items - order items with menuItem references
 * @returns {Object} result including success status
 */
import mongoose from 'mongoose';
import ProductStock from '../../models/modul_menu/ProductStock.model.js';
import Recipe from '../../models/modul_menu/Recipe.model.js';

export async function updateInventoryHandler({ orderId, items }) {
  console.log('Processing inventory update for order:', orderId);

  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // Get all recipes for these menu items
    const menuItemIds = items.map(item => item.menuItem);
    const recipes = await Recipe.find({ 
      menuItemId: { $in: menuItemIds } 
    }).session(session);

    // Prepare bulk operations
    const bulkOps = [];
    
    for (const item of items) {
      const recipe = recipes.find(r => r.menuItemId.equals(item.menuItem));
      if (!recipe) continue;

      // Process base ingredients
      for (const ingredient of recipe.baseIngredients) {
        bulkOps.push({
          updateOne: {
            filter: { productId: ingredient.productId },
            update: {
              $inc: { currentStock: -ingredient.quantity * item.quantity },
              $push: {
                movements: {
                  quantity: ingredient.quantity * item.quantity,
                  type: 'out',
                  referenceId: orderId,
                  notes: `Order ${orderId} - base ingredient for ${item.quantity}x ${recipe.menuItemId}`
                }
              }
            }
          }
        });
      }

      // Process topping ingredients if item has toppings
      if (item.toppings && item.toppings.length > 0) {
        for (const topping of item.toppings) {
          const toppingRecipe = recipe.toppingOptions.find(
            t => t.toppingName === topping.name
          );
          
          if (toppingRecipe) {
            for (const ingredient of toppingRecipe.ingredients) {
              bulkOps.push({
                updateOne: {
                  filter: { productId: ingredient.productId },
                  update: {
                    $inc: { currentStock: -ingredient.quantity * item.quantity },
                    $push: {
                      movements: {
                        quantity: ingredient.quantity * item.quantity,
                        type: 'out',
                        referenceId: orderId,
                        notes: `Order ${orderId} - topping ${topping.name} for ${item.quantity}x ${recipe.menuItemId}`
                      }
                    }
                  }
                }
              });
            }
          }
        }
      }

      // Process addon ingredients if item has addons
      if (item.addons && item.addons.length > 0) {
        for (const addon of item.addons) {
          const addonRecipe = recipe.addonOptions.find(
            a => a.addonName === addon.name && a.optionLabel === addon.option
          );
          
          if (addonRecipe) {
            for (const ingredient of addonRecipe.ingredients) {
              bulkOps.push({
                updateOne: {
                  filter: { productId: ingredient.productId },
                  update: {
                    $inc: { currentStock: -ingredient.quantity * item.quantity },
                    $push: {
                      movements: {
                        quantity: ingredient.quantity * item.quantity,
                        type: 'out',
                        referenceId: orderId,
                        notes: `Order ${orderId} - addon ${addon.name}:${addon.option} for ${item.quantity}x ${recipe.menuItemId}`
                      }
                    }
                  }
                }
              });
            }
          }
        }
      }
    }

    // Execute all inventory updates in a single bulk operation
    if (bulkOps.length > 0) {
      const bulkWriteResult = await ProductStock.bulkWrite(bulkOps, { session });
      console.log(`Inventory updated for order ${orderId}:`, bulkWriteResult);
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