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
export async function processOrderItems({ 
  items, 
  outlet, 
  orderType, 
  voucherCode, 
  customerType, 
  source, 
  customerId, 
  loyaltyPointsToRedeem, 
  customAmountItems // UBAH: customAmount menjadi customAmountItems array
}, session) {

  if ((!items || !Array.isArray(items) || items.length === 0) && 
      (!customAmountItems || !Array.isArray(customAmountItems) || customAmountItems.length === 0)) {
    throw new Error('Order items cannot be empty');
  }

  const orderItems = [];
  let totalBeforeDiscount = 0;

  // Process regular menu items
  if (items && Array.isArray(items)) {
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
        dineType: item.dineType || 'Dine-In',
      });
    }
  }

  // Process custom amount items (TERPISAH dari items)
  let customAmountItemsData = [];
  let totalCustomAmount = 0;

  if (customAmountItems && Array.isArray(customAmountItems)) {
    customAmountItemsData = customAmountItems.map(item => ({
      amount: item.amount,
      name: item.name || 'Penyesuaian Pembayaran',
      description: item.description || 'Penyesuaian jumlah pembayaran',
      dineType: item.dineType || 'Dine-In',
      appliedAt: new Date()
    }));

    totalCustomAmount = customAmountItemsData.reduce((total, item) => total + item.amount, 0);

    console.log('Custom amount items processed:', {
      count: customAmountItemsData.length,
      totalCustomAmount,
      items: customAmountItemsData
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
    loyaltyPointsToRedeem,
    totalBeforeDiscount
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

  // Promotions and discounts (HANYA berlaku untuk menu items, bukan custom amount)
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

  // Taxes and services (HANYA berlaku untuk menu items, bukan custom amount)
  const { taxAndServiceDetails, totalTax, totalServiceFee } = await calculateTaxesAndServices(
    outlet,
    promotionResults.totalAfterDiscount,
    orderItems,
    session
  );

  // PERHITUNGAN GRAND TOTAL: totalAfterDiscount + totalCustomAmount + tax + service fee
  const grandTotal = promotionResults.totalAfterDiscount + 
                    totalCustomAmount + 
                    totalTax + 
                    totalServiceFee;

  console.log('Order Processing Summary:', {
    menuItemsTotal: totalBeforeDiscount,
    afterDiscount: promotionResults.totalAfterDiscount,
    totalCustomAmount,
    totalTax,
    totalServiceFee,
    grandTotal,
    regularItemsCount: items ? items.length : 0,
    customAmountItemsCount: customAmountItemsData.length
  });

  return {
    orderItems,
    customAmountItems: customAmountItemsData, // UBAH: Kembalikan sebagai array
    totals: {
      beforeDiscount: totalBeforeDiscount,
      afterDiscount: promotionResults.totalAfterDiscount,
      totalCustomAmount: totalCustomAmount, // UBAH: Tambahkan total custom amount
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
 * Processes all promotions for an order (HANYA untuk menu items)
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

  console.log('Promotion Processing:', {
    autoPromoDiscount,
    manualDiscount,
    voucherDiscount,
    totalDiscount,
    totalBeforeDiscount,
    totalAfterDiscount,
    canUsePromo
  });

  return {
    autoPromoDiscount,
    manualDiscount,
    voucherDiscount,
    totalDiscount,
    totalAfterDiscount,
    appliedPromos,
    appliedPromo, // This is the manual promo
    voucher // This is the voucher
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
 * Calculates taxes and service fees for an order (HANYA untuk menu items)
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

  console.log('Tax and Service Calculation:', {
    totalTax,
    totalServiceFee,
    taxAndServiceDetailsCount: taxAndServiceDetails.length
  });

  return {
    taxAndServiceDetails,
    totalTax,
    totalServiceFee
  };
}

/**
 * Utility function untuk calculate custom amount automatically
 * Kembalikan array dengan satu item untuk kompatibilitas
 */
export function calculateCustomAmount(paidAmount, orderTotal) {
  const difference = paidAmount - orderTotal;
  
  if (difference <= 0) {
    return []; // Tidak perlu custom amount, return empty array
  }

  return [{
    amount: difference,
    name: 'Penyesuaian Pembayaran',
    description: `Kelebihan pembayaran sebesar Rp ${difference.toLocaleString('id-ID')}`,
    dineType: 'Dine-In'
  }];
}
