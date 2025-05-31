import { MenuItem } from '../models/MenuItem.model.js';
import { RawMaterial } from '../models/RawMaterial.model.js';
import Promo from '../models/Promo.model.js';
import Voucher from '../models/voucher.model.js';
import mongoose from 'mongoose';

// Fungsi proses item
export async function processOrderItems(items, session) {
  const orderItems = [];
  for (const item of items) {
    const menuItem = await MenuItem.findById(item.id).session(session);
    if (!menuItem) throw new Error(`Menu item ${item.id} tidak ditemukan`);

    let itemPrice = menuItem.price;
    let addons = [];
    let toppings = [];

    // Proses addon
    if (item.selectedAddons && item.selectedAddons.length > 0) {
      for (const addon of item.selectedAddons) {
        const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
        if (!addonInfo) continue;

        if (addon.options && addon.options.length > 0) {
          for (const option of addon.options) {
            const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
            if (optionInfo) {
              addons.push({
                name: `${addonInfo.name}: ${optionInfo.name}`,
                price: optionInfo.price || 0
              });
              itemPrice += optionInfo.price || 0;
            }
          }
        }
      }
    }

    // Proses topping
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      for (const topping of item.selectedToppings) {
        const toppingInfo = menuItem.toppings.find(t => t._id.toString() === topping.id);
        if (toppingInfo) {
          toppings.push({
            name: toppingInfo.name,
            price: toppingInfo.price || 0
          });
          itemPrice += toppingInfo.price || 0;
        }
      }
    }

    const subtotal = itemPrice * item.quantity;
    orderItems.push({
      menuItem: item.id,
      quantity: item.quantity,
      subtotal,
      addons,
      toppings,
      isPrinted: false
    });
  }

  return orderItems;
}