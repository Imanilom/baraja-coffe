import { MenuItem } from '../models/MenuItem.model.js';
import Product from '../models/modul_market/Product.model.js';
import Recipe from '../models/modul_menu/Recipe.model.js';
import ProductStock  from '../models/modul_menu/ProductStock.model.js';
import { checkAutoPromos, checkManualPromo, checkVoucher } from '../helpers/promo.helper.js';
import { TaxAndService } from '../models/TaxAndService.model.js';

export async function processOrderItems({ items, outletId, orderType, voucherCode, customerType = 'all' }, session) {
  const orderItems = [];
  let totalBeforeDiscount = 0;

  await Promise.all(items.map(async (item) => {
    const [menuItem, recipe] = await Promise.all([
      MenuItem.findById(item.id).session(session),
      Recipe.findOne({ menuItemId: item.id }).session(session),
    ]);

    if (!menuItem) throw new Error(`Menu item ${item.id} tidak ditemukan`);
    if (!recipe) throw new Error(`Resep untuk menu ${menuItem.name} tidak ditemukan`);

    let itemPrice = menuItem.price;
    let addons = [];
    let toppings = [];
    const bulkOps = [];

    // Bahan dasar
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
                referenceId: menuItem._id,
                notes: `Pembuatan ${menuItem.name}`
              }
            }
          }
        }
      });
    }

    // Topping
    if (item.selectedToppings?.length > 0) {
      for (const topping of item.selectedToppings) {
        const toppingInfo = menuItem.toppings.find(t => t._id.toString() === topping.id);
        if (!toppingInfo) continue;

        const toppingRecipe = recipe.toppingOptions.find(t => t.toppingName === toppingInfo.name);
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
                      referenceId: menuItem._id,
                      notes: `Topping ${toppingInfo.name} untuk ${menuItem.name}`
                    }
                  }
                }
              }
            });
          }
        }

        toppings.push({
          name: toppingInfo.name,
          price: toppingInfo.price || 0
        });
        itemPrice += toppingInfo.price || 0;
      }
    }

    // Addon
    if (item.selectedAddons?.length > 0) {
      for (const addon of item.selectedAddons) {
        const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
        if (!addonInfo) continue;

        if (addon.options?.length > 0) {
          for (const option of addon.options) {
            const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
            if (!optionInfo) continue;

            const addonRecipe = recipe.addonOptions.find(a =>
              a.addonName === addonInfo.name && a.optionLabel === optionInfo.label
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
                          referenceId: menuItem._id,
                          notes: `Addon ${addonInfo.name}:${optionInfo.label} untuk ${menuItem.name}`
                        }
                      }
                    }
                  }
                });
              }
            }

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

    // Eksekusi pengurangan stok
    if (bulkOps.length > 0) {
      await ProductStock.bulkWrite(bulkOps, { session });
    }
  }));

  // === PROMO SECTION ===
  const { discount: autoPromoDiscount = 0, appliedPromos } = await checkAutoPromos(orderItems, outletId, orderType);
  const { discount: manualDiscount = 0, appliedPromo } = await checkManualPromo(totalBeforeDiscount, outletId, customerType);
  const { discount: voucherDiscount = 0, voucher } = await checkVoucher(voucherCode, totalBeforeDiscount, outletId);

  const totalDiscount = autoPromoDiscount + manualDiscount + voucherDiscount;
  const totalAfterDiscount = totalBeforeDiscount - totalDiscount;

  if (isNaN(totalAfterDiscount)) throw new Error("Calculated totalAfterDiscount is NaN");

  // === TAX & SERVICE SECTION ===
  const taxesAndServices = await TaxAndService.find({
    isActive: true,
    appliesToOutlets: outletId,
    $or: [
      { appliesToCustomerTypes: 'all' },
      { appliesToCustomerTypes: customerType }
    ]
  }).session(session);

  let taxAndServiceDetails = [];
  let totalTax = 0;
  let totalServiceFee = 0;

  for (const charge of taxesAndServices) {
    const applicableItems = charge.appliesToMenuItems?.length > 0
      ? orderItems.filter(item => charge.appliesToMenuItems.some(menuId => menuId.equals(item.menuItem)))
      : orderItems;

    const applicableSubtotal = applicableItems.reduce((sum, item) => sum + item.subtotal, 0);

    if (charge.type === 'tax') {
      const taxAmount = (charge.percentage / 100) * applicableSubtotal;
      totalTax += taxAmount;
      taxAndServiceDetails.push({
        name: charge.name,
        type: 'tax',
        amount: taxAmount
      });
    } else if (charge.type === 'service') {
      let fee = charge.fixedFee || 0;
      if (!fee && charge.percentage) {
        fee = (charge.percentage / 100) * applicableSubtotal;
      }
      totalServiceFee += fee;
      taxAndServiceDetails.push({
        name: charge.name,
        type: 'service',
        amount: fee
      });
    }
  }

  const grandTotal = totalAfterDiscount + totalTax + totalServiceFee;

  if (isNaN(grandTotal)) throw new Error("Calculated grandTotal is NaN");

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
    appliedVoucher: voucher,
    taxAndServiceDetails,
    totalTax,
    totalServiceFee,
    grandTotal
  };
}
