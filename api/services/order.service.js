import { MenuItem } from '../models/MenuItem.model.js';
import { RawMaterial } from '../models/RawMaterial.model.js';
import { checkAutoPromos, checkManualPromo, checkVoucher } from '../helpers/promo.helper.js';
import mongoose from 'mongoose';

export async function processOrderItems({ items, outletId, orderType, voucherCode, customerType = 'all' }, session) {
  const orderItems = [];
  let totalBeforeDiscount = 0;

  for (const item of items) {
    const menuItem = await MenuItem.findById(item.id).session(session);
    if (!menuItem) throw new Error(`Menu item ${item.id} tidak ditemukan`);

    let itemPrice = menuItem.price;
    let addons = [];
    let toppings = [];

    // Kurangi bahan baku utama menu
    if (menuItem.rawMaterials?.length > 0) {
      for (const material of menuItem.rawMaterials) {
        const totalQty = material.quantityRequired * item.quantity;
        await RawMaterial.findByIdAndUpdate(
          material.materialId,
          { $inc: { quantity: -totalQty } },
          { session }
        );
      }
    }

    // Proses topping
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      for (const topping of item.selectedToppings) {
        const toppingInfo = menuItem.toppings.find(t => t._id.toString() === topping.id);
        if (!toppingInfo) continue;

        toppings.push({
          name: toppingInfo.name,
          price: toppingInfo.price || 0
        });
        itemPrice += toppingInfo.price || 0;

        if (toppingInfo.rawMaterials?.length > 0) {
          for (const mat of toppingInfo.rawMaterials) {
            const totalQty = mat.quantityRequired * item.quantity;
            await RawMaterial.findByIdAndUpdate(
              mat.materialId,
              { $inc: { quantity: -totalQty } },
              { session }
            );
          }
        }
      }
    }

    // Proses addon
    if (item.selectedAddons && item.selectedAddons.length > 0) {
      for (const addon of item.selectedAddons) {
        const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
        if (!addonInfo) continue;

        if (addon.options && addon.options.length > 0) {
          for (const option of addon.options) {
            const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
            if (!optionInfo) continue;

            addons.push({
              name: `${addonInfo.name}: ${optionInfo.label}`,
              price: optionInfo.price || 0
            });
            itemPrice += optionInfo.price || 0;

            if (addonInfo.rawMaterials?.length > 0) {
              for (const mat of addonInfo.rawMaterials) {
                const totalQty = mat.quantityRequired * item.quantity;
                await RawMaterial.findByIdAndUpdate(
                  mat.materialId,
                  { $inc: { quantity: -totalQty } },
                  { session }
                );
              }
            }
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
      isPrinted: false
    });
  }

  // === PROMO SECTION ===
  const { discount: autoPromoDiscount, appliedPromos } = await checkAutoPromos(orderItems, outletId, orderType);
  const { discount: manualDiscount, appliedPromo } = await checkManualPromo(totalBeforeDiscount, outletId, customerType);
  const { discount: voucherDiscount, voucher } = await checkVoucher(voucherCode, totalBeforeDiscount, outletId);

  const totalDiscount = autoPromoDiscount + manualDiscount + voucherDiscount;
  const totalAfterDiscount = totalBeforeDiscount - totalDiscount;

  return {
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
}
