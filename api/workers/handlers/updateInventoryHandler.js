import mongoose from 'mongoose';
import { MenuItem } from '../../models/MenuItem.model.js';
import { RawMaterial } from '../../models/RawMaterial.model.js';

/**
 * Validasi dan kurangi bahan baku dengan pengecekan stok dulu
 * @param {Object} data - payload dari BullMQ job
 * @returns {Object} hasil proses termasuk orderItems dan total harga
 */
export async function updateInventoryHandler(data) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items } = data;

    const orderItems = [];
    let totalBeforeDiscount = 0;

    // 1. KUMPULKAN kebutuhan bahan baku secara agregat
    const materialNeeds = new Map(); // key: materialId, value: total qty needed

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.id).session(session);
      if (!menuItem) throw new Error(`Menu item ${item.id} tidak ditemukan`);

      // bahan baku utama
      for (const material of menuItem.rawMaterials || []) {
        const key = material.materialId.toString();
        const qty = material.quantityRequired * item.quantity;
        materialNeeds.set(key, (materialNeeds.get(key) || 0) + qty);
      }

      // topping
      for (const topping of item.selectedToppings || []) {
        const info = menuItem.toppings.find(t => t._id.toString() === topping.id);
        if (!info) continue;
        for (const mat of info.rawMaterials || []) {
          const key = mat.materialId.toString();
          const qty = mat.quantityRequired * item.quantity;
          materialNeeds.set(key, (materialNeeds.get(key) || 0) + qty);
        }
      }

      // addon
      for (const addon of item.selectedAddons || []) {
        const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
        if (!addonInfo) continue;
        for (const mat of addonInfo.rawMaterials || []) {
          const key = mat.materialId.toString();
          const qty = mat.quantityRequired * item.quantity;
          materialNeeds.set(key, (materialNeeds.get(key) || 0) + qty);
        }
      }
    }

    // 2. CEK ketersediaan bahan baku
    for (const [matId, needed] of materialNeeds.entries()) {
      const material = await RawMaterial.findById(matId).session(session);
      if (!material) throw new Error(`Bahan baku ${matId} tidak ditemukan`);
      if (material.quantity < needed) {
        throw new Error(
          `Stok tidak cukup untuk bahan "${material.name}", dibutuhkan ${needed}, tersedia ${material.quantity}`
        );
      }
    }

    // 3. Kurangi bahan baku
    for (const [matId, needed] of materialNeeds.entries()) {
      await RawMaterial.findByIdAndUpdate(
        matId,
        { $inc: { quantity: -needed } },
        { session }
      );
    }

    // 4. Hitung orderItems & subtotal
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.id).session(session);
      let itemPrice = menuItem.price;
      const addons = [];
      const toppings = [];

      // toppings
      for (const topping of item.selectedToppings || []) {
        const info = menuItem.toppings.find(t => t._id.toString() === topping.id);
        if (!info) continue;
        toppings.push({ name: info.name, price: info.price || 0 });
        itemPrice += info.price || 0;
      }

      // addons
      for (const addon of item.selectedAddons || []) {
        const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
        if (!addonInfo) continue;
        // pilih opsi
        const option = addon.options?.find(o => o.id === addon.selectedOptionId);
        if (option) {
          addons.push({ name: `${addonInfo.name}: ${option.label}`, price: option.price });
          itemPrice += option.price;
        }
      }

      const subtotal = itemPrice * item.quantity;
      totalBeforeDiscount += subtotal;

      orderItems.push({
        menuItem: item.id,
        quantity: item.quantity,
        subtotal,
        addons,
        toppings,
        notes: item.notes || '',
        isPrinted: false
      });
    }

    await session.commitTransaction();

    return {
      success: true,
      orderItems,
      totalBeforeDiscount
    };
  } catch (err) {
    await session.abortTransaction();
    console.error('❌ updateInventoryHandler error:', err.message);
    throw err;
  } finally {
    session.endSession();
  }
}
