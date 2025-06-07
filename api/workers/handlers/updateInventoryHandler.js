import mongoose from 'mongoose';
import { MenuItem } from '../../models/MenuItem.model.js';
import { RawMaterial } from '../../models/RawMaterial.model.js';
import {
  checkAutoPromos,
  checkManualPromo,
  checkVoucher
} from '../../helpers/promo.helper.js';

/**
 * Validasi dan kurangi bahan baku dengan pengecekan stok dulu
 * @param {Object} data - payload dari BullMQ job
 * @returns {Object} hasil proses termasuk orderItems dan total setelah diskon
 */
export async function updateInventoryHandler(data) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      items,
      outletId,
      orderType,
      voucherCode,
      customerType = 'all'
    } = data;

    const orderItems = [];
    let totalBeforeDiscount = 0;

    // === 1. KUMPULKAN kebutuhan bahan baku secara agregat ===
    const materialNeeds = new Map(); // key: materialId, value: total qty needed

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.id).session(session);
      if (!menuItem) throw new Error(`Menu item ${item.id} tidak ditemukan`);

      // bahan baku utama
      if (menuItem.rawMaterials?.length > 0) {
        for (const material of menuItem.rawMaterials) {
          const key = material.materialId.toString();
          const totalQty = material.quantityRequired * item.quantity;
          materialNeeds.set(key, (materialNeeds.get(key) || 0) + totalQty);
        }
      }

      // topping
      if (item.selectedToppings?.length > 0) {
        for (const topping of item.selectedToppings) {
          const toppingInfo = menuItem.toppings.find(t => t._id.toString() === topping.id);
          if (!toppingInfo) continue;

          if (toppingInfo.rawMaterials?.length > 0) {
            for (const mat of toppingInfo.rawMaterials) {
              const key = mat.materialId.toString();
              const totalQty = mat.quantityRequired * item.quantity;
              materialNeeds.set(key, (materialNeeds.get(key) || 0) + totalQty);
            }
          }
        }
      }

      // addon
      if (item.selectedAddons?.length > 0) {
        for (const addon of item.selectedAddons) {
          const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
          if (!addonInfo) continue;

          if (addon.options?.length > 0) {
            for (const option of addon.options) {
              const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
              if (!optionInfo) continue;

              if (addonInfo.rawMaterials?.length > 0) {
                for (const mat of addonInfo.rawMaterials) {
                  const key = mat.materialId.toString();
                  const totalQty = mat.quantityRequired * item.quantity;
                  materialNeeds.set(key, (materialNeeds.get(key) || 0) + totalQty);
                }
              }
            }
          }
        }
      }
    }

    // === 2. CEK ketersediaan bahan baku ===
    for (const [materialId, requiredQty] of materialNeeds.entries()) {
      const material = await RawMaterial.findById(materialId).session(session);
      if (!material) throw new Error(`Bahan baku ${materialId} tidak ditemukan`);
      if (material.quantity < requiredQty) {
        throw new Error(`Stok tidak cukup untuk bahan "${material.name}", dibutuhkan ${requiredQty}, tersedia ${material.quantity}`);
      }
    }

    // === 3. Kurangi bahan baku & hitung order ===
    for (const [materialId, requiredQty] of materialNeeds.entries()) {
      await RawMaterial.findByIdAndUpdate(
        materialId,
        { $inc: { quantity: -requiredQty } },
        { session }
      );
    }

    // === 4. Hitung item, subtotal, dan diskon ===
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.id).session(session);
      let itemPrice = menuItem.price;
      let addons = [];
      let toppings = [];

      // toppings
      if (item.selectedToppings?.length > 0) {
        for (const topping of item.selectedToppings) {
          const toppingInfo = menuItem.toppings.find(t => t._id.toString() === topping.id);
          if (!toppingInfo) continue;
          toppings.push({ name: toppingInfo.name, price: toppingInfo.price || 0 });
          itemPrice += toppingInfo.price || 0;
        }
      }

      // addons
      if (item.selectedAddons?.length > 0) {
        for (const addon of item.selectedAddons) {
          const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
          if (!addonInfo) continue;

          if (addon.options?.length > 0) {
            for (const option of addon.options) {
              const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
              if (!optionInfo) continue;

              addons.push({
                name: `${addonInfo.name}: ${optionInfo.label}`,
                price: optionInfo.price || 0
              });
              itemPrice += optionInfo.price || 0;
            }
          }
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

    // === PROMO SECTION ===
    const { discount: autoPromoDiscount, appliedPromos } =
      await checkAutoPromos(orderItems, outletId, orderType);
    const { discount: manualDiscount, appliedPromo } =
      await checkManualPromo(totalBeforeDiscount, outletId, customerType);
    const { discount: voucherDiscount, voucher } =
      await checkVoucher(voucherCode, totalBeforeDiscount, outletId);

    const totalDiscount = autoPromoDiscount + manualDiscount + voucherDiscount;
    const totalAfterDiscount = totalBeforeDiscount - totalDiscount;

    await session.commitTransaction();

    return {
      success: true,
      orderItems,
      totalBeforeDiscount,
      totalAfterDiscount,
      discounts: {
        autoPromoDiscount,
        manualDiscount,
        voucherDiscount
      },
      appliedPromos,
      appliedManualPromo: appliedPromo,
      appliedVoucher: voucher
    };
  } catch (err) {
    await session.abortTransaction();
    console.error('❌ updateInventoryHandler error:', err.message);
    throw err;
  } finally {
    session.endSession();
  }
}
