import { MenuItem } from '../models/MenuItem.model.js';
import Product from '../models/modul_market/Product.model.js';
import Recipe from '../models/modul_menu/Recipe.model.js';
import { checkAutoPromos, checkManualPromo, checkVoucher } from '../helpers/promo.helper.js';
import { TaxAndService } from '../models/TaxAndService.model.js';
import { calculateLoyaltyPoints, redeemLoyaltyPoints } from '../helpers/loyalty.helper.js';
import mongoose from 'mongoose';
import AutoPromo from '../models/AutoPromo.model.js';

/**
 * Processes order items including pricing calculations and promotions
 * NOW SUPPORTS: Multiple selected promo bundles from user
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
  customAmountItems,
  selectedPromoBundles = []  // ✅ NEW: User-selected bundles
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
        MenuItem.findById(item.id).populate('category').session(session),
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

      // Check if item belongs to Bazar category
      const isBazarCategory = await checkBazarCategory(menuItem.category, session);

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
        isBazarCategory
      });
    }
  }

  // Process custom amount items - HANYA YANG DARI REQUEST
  let customAmountItemsData = [];
  let totalCustomAmount = 0;

  if (customAmountItems && Array.isArray(customAmountItems)) {
    customAmountItemsData = customAmountItems.map(item => ({
      amount: Number(item.amount) || 0,
      name: item.name || 'Penyesuaian Pembayaran',
      description: item.description || 'Penyesuaian jumlah pembayaran',
      dineType: item.dineType || 'Dine-In',
      appliedAt: new Date(),
      isAutoCalculated: false
    }));

    totalCustomAmount = customAmountItemsData.reduce((total, item) => total + item.amount, 0);
    
    console.log('Custom Amount Items Processed:', {
      count: customAmountItemsData.length,
      totalCustomAmount,
      items: customAmountItemsData.map(item => ({
        amount: item.amount,
        name: item.name,
        isAutoCalculated: item.isAutoCalculated
      }))
    });
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
    menuItemsTotal: totalBeforeDiscount,
    customAmountTotal: totalCustomAmount,
    combinedTotalBeforeDiscount,
    loyaltyDiscount,
    totalAfterLoyaltyDiscount,
    selectedPromoBundlesCount: selectedPromoBundles.length
  });

  // ✅ PROSES SELECTED PROMO BUNDLES JIKA ADA (PRIORITAS TINGGI)
  let selectedBundleResult = {
    totalDiscount: 0,
    appliedBundles: [],
    usedItems: [] // Track items yang sudah digunakan untuk bundling
  };

  if (selectedPromoBundles && selectedPromoBundles.length > 0) {
    selectedBundleResult = await processSelectedPromoBundles(
      selectedPromoBundles,
      orderItems,
      outlet,
      session
    );
    
    console.log('✅ SELECTED BUNDLES PROCESSED:', {
      totalDiscount: selectedBundleResult.totalDiscount,
      appliedBundlesCount: selectedBundleResult.appliedBundles.length,
      usedItemsCount: selectedBundleResult.usedItems.length,
      appliedBundles: selectedBundleResult.appliedBundles.map(b => ({
        promoName: b.promoName,
        bundleSets: b.bundleSets,
        discount: b.appliedDiscount
      }))
    });
  }

  // HITUNG ITEMS YANG MASIH BISA DIKENAI AUTO PROMO
  // (Items yang belum terpakai di selected bundles)
  let availableItemsForAutoPromo = [];
  if (selectedBundleResult.usedItems.length > 0) {
    // Filter out items that are already used in selected bundles
    const usedItemIds = new Set(selectedBundleResult.usedItems.map(item => 
      item.menuItem.toString()
    ));
    
    availableItemsForAutoPromo = orderItems.map(item => {
      const isUsed = usedItemIds.has(item.menuItem.toString());
      if (isUsed) {
        // Cari berapa quantity yang sudah terpakai
        const usedBundle = selectedBundleResult.usedItems.find(used => 
          used.menuItem.toString() === item.menuItem.toString()
        );
        
        if (usedBundle && usedBundle.quantityUsed) {
          const remainingQuantity = Math.max(0, item.quantity - usedBundle.quantityUsed);
          return {
            ...item,
            quantity: remainingQuantity,
            subtotal: item.price * remainingQuantity
          };
        }
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    console.log('📊 Items available for auto promo after selected bundles:', {
      originalItemsCount: orderItems.length,
      usedItemsCount: selectedBundleResult.usedItems.length,
      availableItemsCount: availableItemsForAutoPromo.length
    });
  } else {
    availableItemsForAutoPromo = [...orderItems];
  }

  // PROSES AUTO PROMO HANYA UNTUK ITEMS YANG BELUM TERPAKAI
  const autoPromoResult = await checkAutoPromos(
    availableItemsForAutoPromo, 
    outlet, 
    orderType
  );

  console.log('🎯 AUTO PROMO AFTER SELECTED BUNDLES:', {
    totalDiscount: autoPromoResult.totalDiscount,
    appliedPromosCount: autoPromoResult.appliedPromos.length,
    itemsUsed: availableItemsForAutoPromo.length
  });

  // MANUAL PROMO & VOUCHER (MASIH TERAPAK KE TOTAL SETELAH DISKON LAIN)
  const promotionResults = await processAllDiscountsBeforeTax({
    orderItems: availableItemsForAutoPromo,
    outlet,
    orderType,
    voucherCode,
    customerType,
    totalBeforeDiscount: totalAfterLoyaltyDiscount - selectedBundleResult.totalDiscount,
    source,
    customAmountItems: customAmountItemsData,
    selectedBundleDiscount: selectedBundleResult.totalDiscount
  });

  // TOTAL SEMUA DISKON
  const totalAllDiscounts = 
    selectedBundleResult.totalDiscount + 
    autoPromoResult.totalDiscount + 
    loyaltyDiscount + 
    promotionResults.autoPromoDiscount + 
    promotionResults.manualDiscount + 
    promotionResults.voucherDiscount;

  const totalAfterAllDiscounts = Math.max(0, combinedTotalBeforeDiscount - totalAllDiscounts);

  console.log('🎯 DISCOUNT BREAKDOWN:', {
    selectedBundleDiscount: selectedBundleResult.totalDiscount,
    autoPromoDiscount: autoPromoResult.totalDiscount + promotionResults.autoPromoDiscount,
    manualDiscount: promotionResults.manualDiscount,
    voucherDiscount: promotionResults.voucherDiscount,
    loyaltyDiscount,
    totalAllDiscounts,
    combinedTotalBeforeDiscount,
    totalAfterAllDiscounts
  });

  // PERBAIKAN: Hitung proporsi diskon untuk custom amount
  let customAmountDiscount = 0;
  let menuItemsDiscount = totalAllDiscounts - loyaltyDiscount; // Exclude loyalty

  if (totalCustomAmount > 0 && menuItemsDiscount > 0) {
    const totalEligibleAmount = totalBeforeDiscount + totalCustomAmount;
    const customAmountRatio = totalCustomAmount / totalEligibleAmount;
    customAmountDiscount = menuItemsDiscount * customAmountRatio;
    menuItemsDiscount = menuItemsDiscount - customAmountDiscount;
  }

  // LOYALTY POINTS EARNED (setelah semua diskon)
  if (isEligibleForLoyalty) {
    try {
      const eligibleAmountForLoyalty = totalAfterAllDiscounts;
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
    totalAfterAllDiscounts,
    orderItems,
    customAmountItemsData
  );

  // FINAL GRAND TOTAL
  const grandTotal = totalAfterAllDiscounts + taxResult.totalTax + taxResult.totalServiceFee;

  console.log('🎯 ORDER PROCESSING FINAL SUMMARY:', {
    // Sebelum diskon
    menuItemsTotal: totalBeforeDiscount,
    customAmountTotal: totalCustomAmount,
    combinedTotalBeforeDiscount,

    // Diskon breakdown
    selectedBundleDiscount: selectedBundleResult.totalDiscount,
    autoPromoDiscount: autoPromoResult.totalDiscount + promotionResults.autoPromoDiscount,
    manualDiscount: promotionResults.manualDiscount,
    voucherDiscount: promotionResults.voucherDiscount,
    loyaltyDiscount,
    totalAllDiscounts,

    // Setelah diskon
    totalAfterAllDiscounts,

    // Pajak
    totalTax: taxResult.totalTax,
    totalServiceFee: taxResult.totalServiceFee,

    // Final
    grandTotal,

    // Info
    taxCalculationMethod: 'ALL_DISCOUNTS_BEFORE_TAX',
    selectedBundlesCount: selectedBundleResult.appliedBundles.length,
    hasCustomAmountItems: customAmountItemsData.length > 0
  });

  return {
    orderItems,
    customAmountItems: customAmountItemsData,
    totals: {
      beforeDiscount: combinedTotalBeforeDiscount,
      afterDiscount: totalAfterAllDiscounts,
      totalCustomAmount: totalCustomAmount,
      totalTax: taxResult.totalTax,
      totalServiceFee: taxResult.totalServiceFee,
      grandTotal
    },
    discounts: {
      selectedBundleDiscount: selectedBundleResult.totalDiscount,
      autoPromoDiscount: autoPromoResult.totalDiscount + promotionResults.autoPromoDiscount,
      manualDiscount: promotionResults.manualDiscount,
      voucherDiscount: promotionResults.voucherDiscount,
      loyaltyDiscount: loyaltyDiscount,
      customAmountDiscount: customAmountDiscount,
      total: totalAllDiscounts
    },
    promotions: {
      appliedPromos: [...promotionResults.appliedPromos, ...autoPromoResult.appliedPromos],
      appliedManualPromo: promotionResults.appliedPromo,
      appliedVoucher: promotionResults.voucher,
      selectedPromoBundles: selectedBundleResult.appliedBundles // ✅ NEW
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
    taxCalculationMethod: 'ALL_DISCOUNTS_BEFORE_TAX',
    bazarItemsExcluded: taxResult.bazarItemsExcluded
  };
}

/**
 * ✅ NEW: Process selected promo bundles from user
 */
async function processSelectedPromoBundles(selectedPromoBundles, orderItems, outlet, session) {
  let totalDiscount = 0;
  const appliedBundles = [];
  const usedItems = []; // Track items used in bundles

  console.log('🔍 PROCESSING SELECTED PROMO BUNDLES:', {
    count: selectedPromoBundles.length,
    bundles: selectedPromoBundles.map(b => ({
      promoId: b.promoId,
      bundleSets: b.bundleSets
    }))
  });

  for (const bundleSelection of selectedPromoBundles) {
    try {
      // Cari promo dari database
      const promo = await AutoPromo.findById(bundleSelection.promoId)
        .populate('conditions.bundleProducts.product')
        .session(session);

      if (!promo) {
        console.warn(`❌ Promo ${bundleSelection.promoId} not found`);
        continue;
      }

      if (promo.promoType !== 'bundling') {
        console.warn(`❌ Promo ${promo.name} is not bundling type`);
        continue;
      }

      console.log(`🎯 Processing bundle: ${promo.name}, sets: ${bundleSelection.bundleSets}`);

      // Validasi apakah items di cart memenuhi syarat bundling
      const bundleResult = await applySelectedBundling(
        promo,
        orderItems,
        bundleSelection.bundleSets,
        usedItems
      );

      if (bundleResult.applied) {
        totalDiscount += bundleResult.discount;
        
        // Record used items untuk mencegah double counting
        bundleResult.usedItems.forEach(usedItem => {
          const existingIndex = usedItems.findIndex(item => 
            item.menuItem.toString() === usedItem.menuItem.toString()
          );
          
          if (existingIndex >= 0) {
            usedItems[existingIndex].quantityUsed += usedItem.quantityUsed;
          } else {
            usedItems.push(usedItem);
          }
        });

        appliedBundles.push({
          promoId: promo._id,
          promoName: promo.name,
          bundleSets: bundleSelection.bundleSets,
          appliedDiscount: bundleResult.discount,
          affectedItems: bundleResult.affectedItems
        });

        console.log(`✅ Bundle applied: ${promo.name}`, {
          sets: bundleSelection.bundleSets,
          discount: bundleResult.discount,
          usedItems: bundleResult.usedItems.map(item => ({
            itemId: item.menuItem,
            quantityUsed: item.quantityUsed
          }))
        });
      } else {
        console.warn(`❌ Bundle ${promo.name} not applied:`, bundleResult.reason);
      }
    } catch (error) {
      console.error(`❌ Error processing bundle ${bundleSelection.promoId}:`, error);
    }
  }

  return {
    totalDiscount,
    appliedBundles,
    usedItems
  };
}

/**
 * ✅ NEW: Apply selected bundling with quantity validation
 */
async function applySelectedBundling(promo, orderItems, bundleSets, alreadyUsedItems = []) {
  const bundleProducts = promo.conditions?.bundleProducts || [];
  
  if (!bundleProducts || bundleProducts.length === 0) {
    return { applied: false, discount: 0, reason: 'No bundle products defined' };
  }

  // Hitung available quantity per item setelah dikurangi yang sudah digunakan di bundle lain
  const itemAvailability = new Map();
  
  for (const orderItem of orderItems) {
    const itemId = orderItem.menuItem.toString();
    let availableQuantity = orderItem.quantity;
    
    // Kurangi quantity yang sudah digunakan di bundles sebelumnya
    const usedInOtherBundles = alreadyUsedItems.find(used => 
      used.menuItem.toString() === itemId
    );
    
    if (usedInOtherBundles) {
      availableQuantity -= usedInOtherBundles.quantityUsed;
    }
    
    itemAvailability.set(itemId, {
      orderItem,
      availableQuantity,
      usedInOtherBundles: usedInOtherBundles?.quantityUsed || 0
    });
  }

  console.log('📦 Item availability for bundling:', {
    promo: promo.name,
    bundleSets,
    itemAvailability: Array.from(itemAvailability.entries()).map(([itemId, data]) => ({
      itemId,
      itemName: data.orderItem.menuItemName,
      totalQuantity: data.orderItem.quantity,
      usedInOtherBundles: data.usedInOtherBundles,
      available: data.availableQuantity
    }))
  });

  // Hitung maksimal bundle sets yang bisa dibuat
  let maxPossibleSets = Infinity;
  
  for (const bundleProduct of bundleProducts) {
    const productId = bundleProduct.product._id.toString();
    const requiredQuantity = bundleProduct.quantity * bundleSets;
    
    const itemData = itemAvailability.get(productId);
    
    if (!itemData) {
      console.log('❌ Missing product:', bundleProduct.product.name);
      return { 
        applied: false, 
        discount: 0, 
        reason: `Missing product: ${bundleProduct.product.name}` 
      };
    }
    
    if (itemData.availableQuantity < requiredQuantity) {
      console.log('❌ Insufficient quantity:', {
        product: bundleProduct.product.name,
        required: requiredQuantity,
        available: itemData.availableQuantity,
        usedInOtherBundles: itemData.usedInOtherBundles
      });
      return { 
        applied: false, 
        discount: 0, 
        reason: `Insufficient quantity for ${bundleProduct.product.name}` 
      };
    }
    
    const setsForThisProduct = Math.floor(itemData.availableQuantity / bundleProduct.quantity);
    maxPossibleSets = Math.min(maxPossibleSets, setsForThisProduct);
  }

  const actualSets = Math.min(maxPossibleSets, bundleSets);
  
  if (actualSets === 0) {
    return { applied: false, discount: 0, reason: 'No complete sets available' };
  }

  // Hitung total discount
  const originalBundlePrice = bundleProducts.reduce((total, bundleProduct) => {
    return total + (bundleProduct.product.price * bundleProduct.quantity * actualSets);
  }, 0);
  
  const discountedBundlePrice = promo.bundlePrice * actualSets;
  const discount = originalBundlePrice - discountedBundlePrice;

  // Track used items dan hitung discount share per item
  const usedItems = [];
  const affectedItems = [];

  for (const bundleProduct of bundleProducts) {
    const productId = bundleProduct.product._id.toString();
    const itemData = itemAvailability.get(productId);
    const quantityUsed = bundleProduct.quantity * actualSets;
    
    usedItems.push({
      menuItem: bundleProduct.product._id,
      menuItemName: bundleProduct.product.name,
      quantityUsed: quantityUsed
    });

    // Hitung discount share untuk item ini
    const itemOriginalTotal = bundleProduct.product.price * quantityUsed;
    const itemDiscountShare = (itemOriginalTotal / originalBundlePrice) * discount;
    
    affectedItems.push({
      menuItem: bundleProduct.product._id,
      menuItemName: bundleProduct.product.name,
      quantityInBundle: quantityUsed,
      discountShare: itemDiscountShare,
      originalSubtotal: itemOriginalTotal,
      discountedSubtotal: itemOriginalTotal - itemDiscountShare
    });
  }

  console.log('✅ Selected bundling applied:', {
    promo: promo.name,
    requestedSets: bundleSets,
    actualSets,
    originalPrice: originalBundlePrice,
    bundlePrice: discountedBundlePrice,
    discount,
    usedItems: usedItems.map(item => ({
      name: item.menuItemName,
      quantityUsed: item.quantityUsed
    }))
  });

  return {
    applied: true,
    discount,
    affectedItems,
    usedItems
  };
}

/**
 * PROSES SEMUA DISKON SEBELUM TAX (Updated)
 */
export async function processAllDiscountsBeforeTax({ 
  orderItems, 
  outlet, 
  orderType, 
  voucherCode, 
  customerType, 
  totalBeforeDiscount, 
  source, 
  customAmountItems,
  selectedBundleDiscount = 0 
}) {
  const canUsePromo = source === 'app' || source === 'cashier' || source === 'Cashier';

  console.log('🎯 ALL DISCOUNTS BEFORE TAX STRATEGY:', {
    source,
    canUsePromo,
    hasVoucher: !!voucherCode,
    totalBeforeDiscount,
    selectedBundleDiscount,
    hasCustomAmountItems: customAmountItems && customAmountItems.length > 0
  });

  // 1. APPLY AUTO PROMO (hanya untuk items yang belum terpakai di selected bundles)
  const autoPromoResult = await checkAutoPromos(orderItems, outlet, orderType);
  const autoPromoDiscount = autoPromoResult.totalDiscount;

  // 2. APPLY MANUAL PROMO
  const manualPromoResult = canUsePromo ?
    await checkManualPromo(totalBeforeDiscount, outlet, customerType) :
    { discount: 0, appliedPromo: null };
  const manualDiscount = manualPromoResult.discount;

  // 3. APPLY VOUCHER (setelah auto & manual promo)
  const subtotalAfterAutoManual = Math.max(0, 
    totalBeforeDiscount - autoPromoDiscount - manualDiscount
  );

  const voucherResult = canUsePromo ?
    await checkVoucher(voucherCode, subtotalAfterAutoManual, outlet) :
    { discount: 0, voucher: null };
  const voucherDiscount = voucherResult.voucher ? voucherResult.discount : 0;

  // 4. TOTAL SEMUA DISKON
  const totalAllDiscounts = selectedBundleDiscount + autoPromoDiscount + manualDiscount + voucherDiscount;
  const totalAfterAllDiscounts = Math.max(0, totalBeforeDiscount - totalAllDiscounts);

  console.log('📊 ALL DISCOUNTS APPLICATION:', {
    totalBeforeDiscount,
    selectedBundleDiscount,
    autoPromoDiscount,
    manualDiscount,
    voucherDiscount,
    totalAllDiscounts,
    totalAfterAllDiscounts,
    calculationSteps: [
      `1. Harga awal: ${totalBeforeDiscount}`,
      `2. Setelah selected bundles: ${totalBeforeDiscount - selectedBundleDiscount}`,
      `3. Setelah auto promo: ${totalBeforeDiscount - selectedBundleDiscount - autoPromoDiscount}`,
      `4. Setelah manual promo: ${totalBeforeDiscount - selectedBundleDiscount - autoPromoDiscount - manualDiscount}`,
      `5. Setelah voucher: ${totalAfterAllDiscounts}`
    ]
  });

  return {
    autoPromoDiscount,
    manualDiscount,
    voucherDiscount,
    totalAllDiscounts,
    totalAfterAllDiscounts,
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

    if (addon.options?.length > 0) {
      for (const option of addon.options) {
        const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
        if (!optionInfo) {
          console.warn(`Addon option ${option.id} not found in addon ${addonInfo.name}`);
          continue;
        }

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

        addPriceCallback(optionInfo.price || 0);
      }
    }
  }
}

/**
 * Check if category is Bazar category
 */
async function checkBazarCategory(categoryId, session) {
  if (!categoryId) return false;

  try {
    const Category = mongoose.model('Category');
    const category = await Category.findById(categoryId).session(session);
    
    return category && (category.name === 'Bazar' || category._id.toString() === '691ab44b8c10cbe7789d7a03');
  } catch (error) {
    console.error('Error checking Bazar category:', error);
    return false;
  }
}

/**
 * Calculates taxes and services for an order dengan pengecualian untuk kategori Bazar
 */
export async function calculateTaxesAndServices(outlet, taxableAmount, orderItems, customAmountItems = []) {
  const taxesAndServices = await TaxAndService.find({
    isActive: true,
    appliesToOutlets: new mongoose.Types.ObjectId(outlet)
  });

  const taxAndServiceDetails = [];
  let totalTax = 0;
  let totalServiceFee = 0;
  let bazarItemsExcluded = 0;
  let bazarItemsAmount = 0;

  console.log('🧮 TAX CALCULATION:', {
    taxableAmount,
    orderItemsCount: orderItems.length,
    customAmountItemsCount: customAmountItems.length,
    taxRulesCount: taxesAndServices.length
  });

  // Hitung total amount untuk items Bazar (tidak kena pajak)
  const nonBazarItems = orderItems.filter(item => !item.isBazarCategory);
  const bazarItems = orderItems.filter(item => item.isBazarCategory);
  
  bazarItemsExcluded = bazarItems.length;
  bazarItemsAmount = bazarItems.reduce((total, item) => total + (item.subtotal || 0), 0);

  console.log('🏪 BAZAR ITEMS EXCLUSION:', {
    totalItems: orderItems.length,
    bazarItemsCount: bazarItemsExcluded,
    bazarItemsAmount,
    nonBazarItemsCount: nonBazarItems.length,
    nonBazarItemsAmount: nonBazarItems.reduce((total, item) => total + (item.subtotal || 0), 0)
  });

  for (const charge of taxesAndServices) {
    let applicableAmount = taxableAmount - bazarItemsAmount; // Exclude Bazar items from tax calculation

    // Jika ada specific menu items, hitung berdasarkan non-Bazar items tersebut
    if (charge.appliesToMenuItems?.length > 0) {
      applicableAmount = 0;

      // Hitung dari regular items (hanya non-Bazar)
      for (const item of nonBazarItems) {
        if (charge.appliesToMenuItems.some(menuId =>
          menuId.equals(new mongoose.Types.ObjectId(item.menuItem))
        )) {
          applicableAmount += item.subtotal || 0;
        }
      }

      // Hitung dari custom amount items (jika applicable)
      for (const customItem of customAmountItems) {
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
        applicableAmount,
        bazarItemsExcluded: bazarItemsExcluded
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
        applicableAmount,
        bazarItemsExcluded: bazarItemsExcluded
      });
    }
  }

  console.log('🧮 TAX CALCULATION RESULT:', {
    totalTax,
    totalServiceFee,
    taxAndServiceDetailsCount: taxAndServiceDetails.length,
    taxableAmount,
    bazarItemsExcluded,
    bazarItemsAmount,
    note: 'Bazar items excluded from tax and service charge calculation'
  });

  return {
    taxAndServiceDetails,
    totalTax,
    totalServiceFee,
    bazarItemsExcluded
  };
}