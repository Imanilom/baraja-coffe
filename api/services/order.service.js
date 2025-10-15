import { MenuItem } from '../models/MenuItem.model.js';
import Product from '../models/modul_market/Product.model.js';
import Recipe from '../models/modul_menu/Recipe.model.js';
import { checkAutoPromos, checkManualPromo, checkVoucher } from '../helpers/promo.helper.js';
import { TaxAndService } from '../models/TaxAndService.model.js';
import { calculateLoyaltyPoints, redeemLoyaltyPoints } from '../helpers/loyalty.helper.js';
import mongoose from 'mongoose';

/**
 * Processes order items including pricing calculations and promotions
 */
export async function processOrderItems({ items, outlet, orderType, voucherCode, customerType, source, customerId, loyaltyPointsToRedeem }, session) {

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Order items cannot be empty');
  }

  

  const orderItems = [];
  let totalBeforeDiscount = 0;

  for (const item of items) {
    if (!item.id || !item.quantity || item.quantity <= 0) {
      throw new Error(`Invalid item quantity (${item.quantity}) or missing ID for item`);
    }

    const [menuItem, recipe] = await Promise.all([
      MenuItem.findById(item.id).session(session),
      Recipe.findOne({ menuItemId: item.id }).session(session),
    ]);

    if (!menuItem) {
      throw new Error(`Menu item ${item.id} not found`);
    }
    if (!recipe) {
      throw new Error(`Recipe for menu item ${menuItem.name} (${item.id}) not found`);
    }

    let itemPrice = menuItem.price;
    const addons = [];
    const toppings = [];

    // Process toppings
    if (item.selectedToppings?.length > 0) {
      await processToppings(item, menuItem, recipe, toppings, (added) => {
        itemPrice += added;
      });
    }

    // Process addons
    if (item.selectedAddons?.length > 0) {
      await processAddons(item, menuItem, recipe, addons, (added) => {
        itemPrice += added;
      });
    }

    const subtotal = itemPrice * item.quantity;
    totalBeforeDiscount += subtotal;

    orderItems.push({
      menuItem: item.id,
      menuItemName: menuItem.name,
      quantity: item.quantity,
      subtotal,
      addons,
      toppings,
      notes: item.notes || '',
      isPrinted: false,
      dineType: item.dineType,
    });
  }

  // LOYALTY PROGRAM: OPSIONAL - hanya jika ada customerId yang valid
  let loyaltyDiscount = 0;
  let loyaltyPointsUsed = 0;
  let loyaltyPointsEarned = 0;
  let loyaltyDetails = null;

  const isEligibleForLoyalty = customerId &&
    mongoose.Types.ObjectId.isValid(customerId) &&
    (source === 'app' || source === 'cashier');

  console.log('Loyalty Program Optional Check:', {
    hasCustomerId: !!customerId,
    isValidCustomerId: customerId ? mongoose.Types.ObjectId.isValid(customerId) : false,
    source,
    isEligibleForLoyalty,
    loyaltyPointsToRedeem
  });

  if (isEligibleForLoyalty) {
    // Process loyalty points redemption hanya jika ada points yang akan ditukar
    if (loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
      try {
        const redemptionResult = await redeemLoyaltyPoints(
          customerId,
          loyaltyPointsToRedeem,
          outlet,
          session
        );

        loyaltyDiscount = redemptionResult.discountAmount;
        loyaltyPointsUsed = redemptionResult.pointsUsed;

        console.log('Loyalty Points Redeemed Successfully:', {
          pointsToRedeem: loyaltyPointsToRedeem,
          discountAmount: loyaltyDiscount,
          pointsUsed: loyaltyPointsUsed
        });
      } catch (redemptionError) {
        console.error('Loyalty points redemption failed:', redemptionError);
        // Tetap lanjut proses order meski redemption gagal
        loyaltyDiscount = 0;
        loyaltyPointsUsed = 0;
      }
    }
  } else {
    console.log('Loyalty Program Skipped - No valid customer ID provided');
  }

  // Calculate total after loyalty discount
  const totalAfterLoyaltyDiscount = Math.max(0, totalBeforeDiscount - loyaltyDiscount);

  // Promotions and discounts
  const promotionResults = await processPromotions({
    orderItems,
    outlet,
    orderType,
    voucherCode,
    customerType,
    totalBeforeDiscount: totalAfterLoyaltyDiscount,
    source
  });

  // Calculate loyalty points earned hanya untuk yang eligible
  if (isEligibleForLoyalty) {
    try {
      const pointsResult = await calculateLoyaltyPoints(
        promotionResults.totalAfterDiscount,
        customerId,
        outlet,
        session
      );

      loyaltyPointsEarned = pointsResult.pointsEarned;
      loyaltyDetails = pointsResult.loyaltyDetails;

      console.log('Loyalty Points Earned:', {
        pointsEarned: loyaltyPointsEarned,
        transactionAmount: promotionResults.totalAfterDiscount,
        isFirstTransaction: loyaltyDetails?.isFirstTransaction
      });
    } catch (pointsError) {
      console.error('Loyalty points calculation failed:', pointsError);
      // Tetap lanjut proses order meski perhitungan poin gagal
      loyaltyPointsEarned = 0;
    }
  }

  // Taxes and services
  const { taxAndServiceDetails, totalTax, totalServiceFee } = await calculateTaxesAndServices(
    outlet,
    promotionResults.totalAfterDiscount,
    orderItems,
    session
  );

  const grandTotal = promotionResults.totalAfterDiscount + totalTax + totalServiceFee;

  return {
    orderItems,
    totals: {
      beforeDiscount: totalBeforeDiscount,
      afterDiscount: promotionResults.totalAfterDiscount,
      totalTax: totalTax,
      totalServiceFee: totalServiceFee,
      grandTotal
    },
    discounts: {
      autoPromoDiscount: promotionResults.autoPromoDiscount,
      manualDiscount: promotionResults.manualDiscount,
      voucherDiscount: promotionResults.voucherDiscount,
      loyaltyDiscount: loyaltyDiscount,
      total: promotionResults.totalDiscount + loyaltyDiscount
    },
    promotions: {
      appliedPromos: promotionResults.appliedPromos,
      appliedManualPromo: promotionResults.appliedPromo,
      appliedVoucher: promotionResults.voucher
    },
    loyalty: isEligibleForLoyalty ? {
      pointsUsed: loyaltyPointsUsed,
      pointsEarned: loyaltyPointsEarned,
      discountAmount: loyaltyDiscount,
      loyaltyDetails: loyaltyDetails,
      customerId: customerId,
      isApplied: true
    } : {
      pointsUsed: 0,
      pointsEarned: 0,
      discountAmount: 0,
      isApplied: false,
      reason: 'No valid customer ID provided'
    },
    taxesAndFees: taxAndServiceDetails
  };
}

/**
 * Processes all promotions for an order
 */
async function processPromotions({ orderItems, outlet, orderType, voucherCode, customerType, totalBeforeDiscount, source }) {
  const canUsePromo = source === 'app' || source === 'cashier';

  const [
    { discount: autoPromoDiscount = 0, appliedPromos },
    { discount: manualDiscount = 0, appliedPromo },
    { discount: voucherDiscount = 0, voucher }
  ] = await Promise.all([
    checkAutoPromos(orderItems, outlet, orderType),
    canUsePromo ? checkManualPromo(totalBeforeDiscount, outlet, customerType) : { discount: 0, appliedPromo: null },
    canUsePromo ? checkVoucher(voucherCode, totalBeforeDiscount, outlet) : { discount: 0, voucher: null }
  ]);

  const totalDiscount = autoPromoDiscount + manualDiscount + voucherDiscount;
  const totalAfterDiscount = Math.max(0, totalBeforeDiscount - totalDiscount);

  return {
    autoPromoDiscount,
    manualDiscount,
    voucherDiscount,
    totalDiscount,
    totalAfterDiscount,
    appliedPromos,
    appliedPromo,
    voucher
  };
}

/**
 * Processes toppings for a menu item (without stock update)
 */
async function processToppings(item, menuItem, recipe, toppings, addPriceCallback) {
  for (const topping of item.selectedToppings) {
    const toppingInfo = menuItem.toppings.find(t => t._id.toString() === topping.id);
    if (!toppingInfo) {
      console.warn(`Topping ${topping.id} not found in menu item ${menuItem._id}`);
      continue;
    }

    toppings.push({
      _id: topping.id,
      name: toppingInfo.name,
      price: toppingInfo.price || 0
    });

    addPriceCallback(toppingInfo.price || 0);
  }
}

/**
 * Processes addons for a menu item (without stock update)
 */
async function processAddons(item, menuItem, recipe, addons, addPriceCallback) {
  for (const addon of item.selectedAddons) {
    const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
    if (!addonInfo) {
      console.warn(`Addon ${addon.id} not found in menu item ${menuItem._id}`);
      continue;
    }

    if (addon.options?.length > 0) {
      for (const option of addon.options) {
        const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
        if (!optionInfo) {
          console.warn(`Addon option ${option.id} not found in addon ${addonInfo.name}`);
          continue;
        }

        addons.push({
          _id: addon.id,
          name: `${addonInfo.name}`,
          options: [
            {
              _id: option.id,
              label: optionInfo.label,
              price: optionInfo.price || 0
            }
          ]
        });

        addPriceCallback(optionInfo.price || 0);
      }
    }
  }
}

/**
 * Calculates taxes and service fees for an order
 */
export async function calculateTaxesAndServices(outlet, totalAfterDiscount, orderItems, session) {
  const taxesAndServices = await TaxAndService.find({
    isActive: true,
    appliesToOutlets: new mongoose.Types.ObjectId(outlet)
  }).session(session);

  const taxAndServiceDetails = [];
  let totalTax = 0;
  let totalServiceFee = 0;

  for (const charge of taxesAndServices) {
    const applicableItems = charge.appliesToMenuItems?.length > 0
      ? orderItems.filter(item =>
        charge.appliesToMenuItems.some(menuId =>
          menuId.equals(new mongoose.Types.ObjectId(item.menuItem))
        )
      )
      : orderItems;

    const applicableSubtotal = applicableItems.reduce((sum, item) => sum + item.subtotal, 0);

    if (charge.type === 'tax') {
      const taxAmount = (charge.percentage / 100) * applicableSubtotal;
      totalTax += taxAmount;

      taxAndServiceDetails.push({
        id: charge._id,
        name: charge.name,
        type: 'tax',
        amount: taxAmount,
        percentage: charge.percentage,
        appliesTo: charge.appliesToMenuItems?.length > 0 ? 'specific_items' : 'all_items'
      });
    } else if (charge.type === 'service') {
      const feeAmount = charge.fixedFee
        ? charge.fixedFee
        : (charge.percentage / 100) * applicableSubtotal;

      totalServiceFee += feeAmount;

      taxAndServiceDetails.push({
        id: charge._id,
        name: charge.name,
        type: 'service',
        amount: feeAmount,
        ...(charge.fixedFee
          ? { fixedFee: charge.fixedFee }
          : { percentage: charge.percentage }),
        appliesTo: charge.appliesToMenuItems?.length > 0 ? 'specific_items' : 'all_items'
      });
    }
  }

  return {
    taxAndServiceDetails,
    totalTax,
    totalServiceFee
  };
}