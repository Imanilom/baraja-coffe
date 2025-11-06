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
  customAmountItems
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
        price: itemPrice,
        subtotal,
        addons,
        toppings,
        notes: item.notes || '',
        isPrinted: false,
        dineType: item.dineType || 'Dine-In',
      });
    }
  }

  // Process custom amount items
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
  }

  // Gabungkan total menu items dan custom amount
  const combinedTotalBeforeDiscount = totalBeforeDiscount + totalCustomAmount;

  // LOYALTY PROGRAM (opsional)
  let loyaltyDiscount = 0;
  let loyaltyPointsUsed = 0;
  let loyaltyPointsEarned = 0;
  let loyaltyDetails = null;

  const isEligibleForLoyalty = customerId &&
    mongoose.Types.ObjectId.isValid(customerId) &&
    (source === 'app' || source === 'cashier' || source === 'Cashier');

  if (isEligibleForLoyalty && loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
    try {
      const redemptionResult = await redeemLoyaltyPoints(
        customerId,
        loyaltyPointsToRedeem,
        outlet,
        session
      );
      loyaltyDiscount = redemptionResult.discountAmount;
      loyaltyPointsUsed = redemptionResult.pointsUsed;
    } catch (redemptionError) {
      console.error('Loyalty points redemption failed:', redemptionError);
      loyaltyDiscount = 0;
      loyaltyPointsUsed = 0;
    }
  }

  // PERBAIKAN: Semua diskon diterapkan SEBELUM tax
  const totalAfterLoyaltyDiscount = Math.max(0, combinedTotalBeforeDiscount - loyaltyDiscount);

  console.log('🎯 PRE-PROMO CALCULATION:', {
    combinedTotalBeforeDiscount,
    loyaltyDiscount,
    totalAfterLoyaltyDiscount
  });

  // PROSES SEMUA DISKON SEBELUM TAX
  const promotionResults = await processAllDiscountsBeforeTax({
    orderItems,
    outlet,
    orderType,
    voucherCode,
    customerType,
    totalBeforeDiscount: totalAfterLoyaltyDiscount,
    source,
    customAmountItems: customAmountItemsData
  });

  // PERBAIKAN: Hitung proporsi diskon untuk custom amount
  let customAmountDiscount = 0;
  let menuItemsDiscount = promotionResults.totalAllDiscounts;

  if (totalCustomAmount > 0 && promotionResults.totalAllDiscounts > 0) {
    const totalEligibleAmount = totalBeforeDiscount + totalCustomAmount;
    const customAmountRatio = totalCustomAmount / totalEligibleAmount;
    customAmountDiscount = promotionResults.totalAllDiscounts * customAmountRatio;
    menuItemsDiscount = promotionResults.totalAllDiscounts - customAmountDiscount;
  }

  // PERBAIKAN: Loyalty points dihitung berdasarkan total setelah semua diskon
  if (isEligibleForLoyalty) {
    try {
      const eligibleAmountForLoyalty = promotionResults.totalAfterAllDiscounts;
      const pointsResult = await calculateLoyaltyPoints(
        eligibleAmountForLoyalty,
        customerId,
        outlet,
        session
      );
      loyaltyPointsEarned = pointsResult.pointsEarned;
      loyaltyDetails = pointsResult.loyaltyDetails;
    } catch (pointsError) {
      console.error('Loyalty points calculation failed:', pointsError);
      loyaltyPointsEarned = 0;
    }
  }

  // APPLY TAX SETELAH SEMUA DISKON
  const taxResult = await calculateTaxesAndServices(
    outlet, 
    promotionResults.totalAfterAllDiscounts, 
    orderItems, 
    customAmountItemsData
  );

  // FINAL GRAND TOTAL dengan tax
  const grandTotal = promotionResults.totalAfterAllDiscounts + taxResult.totalTax + taxResult.totalServiceFee;

  console.log('🎯 ORDER PROCESSING FINAL SUMMARY:', {
    // Sebelum diskon
    menuItemsTotal: totalBeforeDiscount,
    customAmountTotal: totalCustomAmount,
    combinedTotalBeforeDiscount,
    
    // Diskon
    loyaltyDiscount,
    autoPromoDiscount: promotionResults.autoPromoDiscount,
    manualDiscount: promotionResults.manualDiscount,
    voucherDiscount: promotionResults.voucherDiscount,
    totalAllDiscounts: promotionResults.totalAllDiscounts,
    
    // Setelah diskon
    totalAfterAllDiscounts: promotionResults.totalAfterAllDiscounts,
    
    // Pajak (setelah semua diskon)
    totalTax: taxResult.totalTax,
    totalServiceFee: taxResult.totalServiceFee,
    
    // Final
    grandTotal,
    
    // Breakdown
    taxCalculationMethod: 'ALL_DISCOUNTS_BEFORE_TAX',
    note: 'Semua diskon (auto promo, manual promo, voucher) diterapkan sebelum tax'
  });

  return {
    orderItems,
    customAmountItems: customAmountItemsData,
    totals: {
      beforeDiscount: combinedTotalBeforeDiscount,
      afterDiscount: promotionResults.totalAfterAllDiscounts,
      totalCustomAmount: totalCustomAmount,
      totalTax: taxResult.totalTax,
      totalServiceFee: taxResult.totalServiceFee,
      grandTotal
    },
    discounts: {
      autoPromoDiscount: promotionResults.autoPromoDiscount,
      manualDiscount: promotionResults.manualDiscount,
      voucherDiscount: promotionResults.voucherDiscount,
      loyaltyDiscount: loyaltyDiscount,
      customAmountDiscount: customAmountDiscount,
      total: promotionResults.totalAllDiscounts + loyaltyDiscount
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
      isApplied: false
    },
    taxesAndFees: taxResult.taxAndServiceDetails,
    taxCalculationMethod: 'ALL_DISCOUNTS_BEFORE_TAX'
  };
}

/**
 * PROSES BARU: Semua diskon diterapkan SEBELUM tax
 */
async function processAllDiscountsBeforeTax({ orderItems, outlet, orderType, voucherCode, customerType, totalBeforeDiscount, source, customAmountItems }) {
  const canUsePromo = source === 'app' || source === 'cashier' || source === 'Cashier';
  
  console.log('🎯 ALL DISCOUNTS BEFORE TAX STRATEGY:', {
    source,
    canUsePromo,
    hasVoucher: !!voucherCode,
    totalBeforeDiscount
  });

  // 1. APPLY AUTO PROMO
  const autoPromoResult = await checkAutoPromos(orderItems, outlet, orderType);
  const autoPromoDiscount = autoPromoResult.totalDiscount;

  // 2. APPLY MANUAL PROMO
  const manualPromoResult = canUsePromo ? 
    await checkManualPromo(totalBeforeDiscount, outlet, customerType) : 
    { discount: 0, appliedPromo: null };
  const manualDiscount = manualPromoResult.discount;

  // 3. APPLY VOUCHER (setelah auto & manual promo)
  const subtotalAfterAutoManual = Math.max(0, totalBeforeDiscount - autoPromoDiscount - manualDiscount);
  
  const voucherResult = canUsePromo ? 
    await checkVoucher(voucherCode, subtotalAfterAutoManual, outlet) : 
    { discount: 0, voucher: null };
  const voucherDiscount = voucherResult.voucher ? voucherResult.discount : 0;

  // 4. TOTAL SEMUA DISKON
  const totalAllDiscounts = autoPromoDiscount + manualDiscount + voucherDiscount;
  const totalAfterAllDiscounts = Math.max(0, totalBeforeDiscount - totalAllDiscounts);

  console.log('📊 ALL DISCOUNTS APPLICATION:', {
    // Sebelum diskon
    totalBeforeDiscount,
    
    // Breakdown diskon
    autoPromoDiscount,
    manualDiscount,
    voucherDiscount,
    totalAllDiscounts,
    
    // Setelah semua diskon
    totalAfterAllDiscounts,
    
    // Urutan aplikasi
    calculationSteps: [
      `1. Harga awal: ${totalBeforeDiscount}`,
      `2. Setelah auto promo: ${totalBeforeDiscount - autoPromoDiscount}`,
      `3. Setelah manual promo: ${totalBeforeDiscount - autoPromoDiscount - manualDiscount}`,
      `4. Setelah voucher: ${totalAfterAllDiscounts}`
    ]
  });

  return {
    // Discount amounts
    autoPromoDiscount,
    manualDiscount,
    voucherDiscount,
    totalAllDiscounts,
    
    // Total setelah semua diskon
    totalAfterAllDiscounts,
    
    // Promotion details
    appliedPromos: autoPromoResult.appliedPromos,
    appliedPromo: manualPromoResult.appliedPromo,
    voucher: voucherResult.voucher
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
      id: topping.id,
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
    console.log('addon options asdasdasda', addon.options);

    if (addon.options?.length > 0) {
      for (const option of addon.options) {
        console.log('option asdasdasd', option);
        const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
        if (!optionInfo) {
          console.warn(`Addon option ${option.id} not found in addon ${addonInfo.name}`);
          continue;
        }

        console.log('optionsss asdasdasd', optionInfo);
        addons.push({
          id: addon.id,
          name: `${addonInfo.name}`,
          price: optionInfo.price || 0,
          options: [{
            id: option.id,
            label: optionInfo.label,
            price: optionInfo.price
          }]
        });

        console.log('asdasda addons asdasdasd', addons);

        addPriceCallback(optionInfo.price || 0);
      }
    }
  }
}

/**
 * Calculates taxes and service fees for an order (SEKARANG termasuk custom amount)
 */
export async function calculateTaxesAndServices(outlet, taxableAmount, orderItems, customAmountItems = []) {
  const taxesAndServices = await TaxAndService.find({
    isActive: true,
    appliesToOutlets: new mongoose.Types.ObjectId(outlet)
  });

  const taxAndServiceDetails = [];
  let totalTax = 0;
  let totalServiceFee = 0;

  console.log('🧮 TAX CALCULATION:', {
    taxableAmount,
    orderItemsCount: orderItems.length,
    customAmountItemsCount: customAmountItems.length,
    taxRulesCount: taxesAndServices.length
  });

  for (const charge of taxesAndServices) {
    let applicableAmount = taxableAmount;

    // Jika ada specific menu items, hitung berdasarkan items tersebut
    if (charge.appliesToMenuItems?.length > 0) {
      applicableAmount = 0;
      
      // Hitung dari regular items
      for (const item of orderItems) {
        if (charge.appliesToMenuItems.some(menuId => 
          menuId.equals(new mongoose.Types.ObjectId(item.menuItem))
        )) {
          applicableAmount += item.subtotal || 0;
        }
      }
      
      // Hitung dari custom amount items (jika applicable)
      for (const customItem of customAmountItems) {
        // Asumsikan custom amount items applicable untuk semua tax rules
        applicableAmount += customItem.amount || 0;
      }
    }

    if (charge.type === 'tax') {
      const taxAmount = (charge.percentage / 100) * applicableAmount;
      totalTax += taxAmount;

      taxAndServiceDetails.push({
        id: charge._id,
        name: charge.name,
        type: 'tax',
        amount: taxAmount,
        percentage: charge.percentage,
        appliesTo: charge.appliesToMenuItems?.length > 0 ? 'specific_items' : 'all_items',
        applicableAmount
      });
    } else if (charge.type === 'service') {
      const feeAmount = charge.fixedFee
        ? charge.fixedFee
        : (charge.percentage / 100) * applicableAmount;

      totalServiceFee += feeAmount;

      taxAndServiceDetails.push({
        id: charge._id,
        name: charge.name,
        type: 'service',
        amount: feeAmount,
        ...(charge.fixedFee
          ? { fixedFee: charge.fixedFee }
          : { percentage: charge.percentage }),
        appliesTo: charge.appliesToMenuItems?.length > 0 ? 'specific_items' : 'all_items',
        applicableAmount
      });
    }
  }

  console.log('🧮 TAX CALCULATION RESULT:', {
    totalTax,
    totalServiceFee,
    taxAndServiceDetailsCount: taxAndServiceDetails.length,
    taxableAmount
  });

  return {
    taxAndServiceDetails,
    totalTax,
    totalServiceFee
  };
}

/**
 * Utility function untuk calculate custom amount automatically
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