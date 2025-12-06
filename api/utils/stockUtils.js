// utils/stockUtils.js
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem.model.js';
import Recipe from '../models/modul_menu/Recipe.model.js';

export const updateStock = async (productId, quantity, type, referenceId, notes = '') => {
  await ProductStock.findOneAndUpdate(
    { productId },
    {
      $push: {
        movements: {
          quantity,
          type,
          referenceId,
          notes
        }
      }
    },
    { upsert: true, new: true }
  );
};

export const getCurrentStock = async (productId) => {
  const stock = await ProductStock.findOne({ productId });
  return stock?.currentStock || 0;
};


export const produceMenuItem = async (menuItemId, quantity, options = {}) => {
  const [menuItem, recipe] = await Promise.all([
    MenuItem.findById(menuItemId),
    Recipe.findOne({ menuItemId })
  ]);

  // 1. Kurangi bahan dasar
  for (const ing of recipe.baseIngredients) {
    await updateStock(
      ing.productId, 
      ing.quantity * quantity, 
      'out',
      menuItemId,
      `Produksi ${menuItem.name}`
    );
  }

  // 2. Kurangi bahan topping jika ada
  if (options.toppings) {
    for (const topping of options.toppings) {
      const toppingRecipe = recipe.toppingOptions.find(t => t.toppingName === topping);
      if (toppingRecipe) {
        for (const ing of toppingRecipe.ingredients) {
          await updateStock(ing.productId, ing.quantity * quantity, 'out', menuItemId);
        }
      }
    }
  }

  // 3. Kurangi bahan addon jika ada
  if (options.addons) {
    for (const addon of options.addons) {
      const addonRecipe = recipe.addonOptions.find(a => 
        a.addonName === addon.name && a.optionLabel === addon.option
      );
      if (addonRecipe) {
        for (const ing of addonRecipe.ingredients) {
          await updateStock(ing.productId, ing.quantity * quantity, 'out', menuItemId);
        }
      }
    }
  }

  // 4. Update stok menu
  menuItem.availableStock += quantity;
  await menuItem.save();
};