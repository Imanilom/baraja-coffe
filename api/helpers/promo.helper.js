import Voucher from "../models/voucher.model.js";
import AutoPromo from '../models/AutoPromo.model.js';
import Promo from '../models/Promo.model.js';
import mongoose from 'mongoose';

export async function checkAutoPromos(orderItems, outlet, orderType) {
  const now = new Date();
  
  console.log('🔍 Auto Promos - Searching for active promos:', {
    outlet,
    orderType,
    now: now.toISOString(),
    orderItemsCount: orderItems.length
  });

  // Cari semua promo yang aktif berdasarkan tanggal
  const autoPromos = await AutoPromo.find({
    outlet,
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now }
  })
  .populate('conditions.buyProduct')
  .populate('conditions.getProduct')
  .populate('conditions.bundleProducts.product')
  .populate('conditions.products');

  console.log('🔍 Auto Promos - Found promos before active hours check:', {
    count: autoPromos.length,
    promos: autoPromos.map(p => ({
      name: p.name,
      promoType: p.promoType,
      discountType: p.discountType,
      discount: p.discount,
      activeHours: p.activeHours,
      isWithinActiveHours: p.isWithinActiveHours ? p.isWithinActiveHours(now) : 'method_not_available'
    }))
  });

  // Filter promo berdasarkan jam aktif
  const activePromos = autoPromos.filter(promo => {
    if (!promo.activeHours || !promo.activeHours.isEnabled) {
      // Jika jam aktif tidak diaktifkan, promo tetap aktif
      console.log(`✅ ${promo.name}: Active hours not enabled, promo is active`);
      return true;
    }

    // Periksa apakah promo aktif berdasarkan jam
    const isActiveNow = promo.isWithinActiveHours(now);
    console.log(`⏰ ${promo.name}: Active hours check - ${isActiveNow ? 'ACTIVE' : 'INACTIVE'}`);
    
    if (isActiveNow) {
      console.log(`🎯 ${promo.name}: Currently within active hours`);
    } else {
      console.log(`⏸️ ${promo.name}: Currently outside active hours`);
    }
    
    return isActiveNow;
  });

  console.log('🔍 Auto Promos - After active hours filtering:', {
    totalFound: autoPromos.length,
    activeAfterHoursCheck: activePromos.length,
    activePromos: activePromos.map(p => ({
      name: p.name,
      promoType: p.promoType,
      discountType: p.discountType,
      discount: p.discount,
      activeHours: p.activeHours
    }))
  });

  let totalDiscount = 0;
  let appliedPromos = [];

  for (const promo of activePromos) {
    console.log('🔍 Processing promo:', {
      name: promo.name,
      type: promo.promoType,
      discountType: promo.discountType,
      discountValue: promo.discount
    });
    
    // Log detail active hours jika diaktifkan
    if (promo.activeHours && promo.activeHours.isEnabled) {
      const currentSchedule = promo.getCurrentSchedule ? promo.getCurrentSchedule() : null;
      console.log('⏰ Active Hours Details:', {
        promo: promo.name,
        isEnabled: promo.activeHours.isEnabled,
        currentSchedule: currentSchedule,
        currentTime: now.toLocaleTimeString(),
        dayOfWeek: now.getDay()
      });
    }

    const promoResult = await applyAutoPromo(promo, orderItems, orderType);
    
    if (promoResult.applied && promoResult.discount > 0) {
      // Format applied promo dengan structure yang benar
      const appliedPromo = {
        promoId: promo._id,
        promoName: promo.name,
        promoType: promo.promoType,
        discountType: promo.discountType,
        discountValue: promo.discount,
        discount: promoResult.discount,
        hasActiveHours: !!(promo.activeHours && promo.activeHours.isEnabled),
        activeHoursInfo: promo.activeHours && promo.activeHours.isEnabled ? {
          isEnabled: true,
          currentSchedule: promo.getCurrentSchedule ? promo.getCurrentSchedule() : null
        } : { isEnabled: false },
        affectedItems: (promoResult.affectedItems || []).map(item => ({
          menuItem: item.menuItem,
          menuItemName: item.menuItemName,
          quantity: item.quantity,
          originalSubtotal: item.originalSubtotal,
          discountAmount: item.discountAmount || item.discountShare || 0,
          discountedSubtotal: item.discountedSubtotal,
          discountPercentage: item.discountPercentage || (promo.discountType === 'percentage' ? promo.discount : undefined)
        })),
        freeItems: (promoResult.freeItems || []).map(freeItem => ({
          menuItem: freeItem.menuItem,
          menuItemName: freeItem.menuItemName,
          quantity: freeItem.quantity,
          price: freeItem.price,
          isFree: freeItem.isFree || true
        }))
      };

      totalDiscount += promoResult.discount;
      appliedPromos.push(appliedPromo);
      
      console.log('✅ Promo applied successfully:', {
        name: promo.name,
        discount: promoResult.discount,
        discountType: promo.discountType,
        discountValue: promo.discount,
        hasActiveHours: appliedPromo.hasActiveHours
      });
    } else {
      console.log('❌ Promo not applied:', {
        name: promo.name,
        reason: promoResult.applied ? 'No discount' : 'Conditions not met',
        hasActiveHours: !!(promo.activeHours && promo.activeHours.isEnabled)
      });
    }
  }

  console.log('🎯 FINAL AUTO PROMO RESULT:', {
    totalDiscount,
    appliedPromosCount: appliedPromos.length,
    promosWithActiveHours: appliedPromos.filter(p => p.hasActiveHours).length,
    appliedPromos: appliedPromos.map(p => ({
      name: p.promoName,
      discount: p.discount,
      type: p.promoType,
      discountType: p.discountType,
      hasActiveHours: p.hasActiveHours
    }))
  });

  return {
    totalDiscount: Number(totalDiscount) || 0,
    appliedPromos: appliedPromos || []
  };
}

// Fungsi untuk apply berbagai jenis auto promo
async function applyAutoPromo(promo, orderItems, orderType) {
  console.log('🔍 APPLY AUTO PROMO - Detailed Check:', {
    promoName: promo.name,
    promoType: promo.promoType,
    discountType: promo.discountType,
    discountValue: promo.discount,
    consumerType: promo.consumerType,
    orderType: orderType,
    hasActiveHours: !!(promo.activeHours && promo.activeHours.isEnabled),
    conditions: promo.conditions
  });

  // Cek consumer type
  if (promo.consumerType && promo.consumerType !== '' && promo.consumerType !== 'all' && promo.consumerType !== orderType) {
    console.log('❌ PROMO SKIPPED - Consumer type mismatch:', {
      required: promo.consumerType,
      actual: orderType
    });
    return { applied: false, discount: 0, affectedItems: [] };
  }

  console.log('✅ PROMO PASSED CONSUMER TYPE CHECK');

  switch (promo.promoType) {
    case 'discount_on_quantity':
      return applyDiscountOnQuantity(promo, orderItems);
    case 'discount_on_total':
      return applyDiscountOnTotal(promo, orderItems);
    case 'buy_x_get_y':
      return applyBuyXGetY(promo, orderItems);
    case 'bundling':
      return applyBundling(promo, orderItems);
    case 'product_specific':
      return applyProductSpecific(promo, orderItems, orderType);
    default:
      console.log('❌ UNKNOWN PROMO TYPE:', promo.promoType);
      return { applied: false, discount: 0, affectedItems: [] };
  }
}

// 1. Discount on Quantity - PERBAIKAN UNTUK discountType
function applyDiscountOnQuantity(promo, orderItems) {
  let totalDiscount = 0;
  let affectedItems = [];

  console.log('🛒 Discount on Quantity Promo:', {
    name: promo.name,
    discountType: promo.discountType,
    discountValue: promo.discount,
    minQuantity: promo.conditions.minQuantity
  });

  for (const orderItem of orderItems) {
    // Cek apakah item memenuhi minimum quantity
    const minQuantity = promo.conditions.minQuantity || 1;
    
    if (orderItem.quantity >= minQuantity) {
      let itemTotalDiscount = 0;
      
      if (promo.discountType === 'percentage') {
        // Calculate percentage discount per unit
        const pricePerUnit = orderItem.subtotal / orderItem.quantity;
        const discountPerUnit = (pricePerUnit * promo.discount) / 100;
        itemTotalDiscount = discountPerUnit * orderItem.quantity;
      } else if (promo.discountType === 'fixed') {
        // Fixed discount per unit
        const discountPerUnit = promo.discount;
        itemTotalDiscount = discountPerUnit * orderItem.quantity;
      }
      
      totalDiscount += itemTotalDiscount;
      
      affectedItems.push({
        menuItem: orderItem.menuItem,
        menuItemName: orderItem.menuItemName,
        quantity: orderItem.quantity,
        discountType: promo.discountType,
        discountPerUnit: promo.discountType === 'percentage' ? 
          `${promo.discount}%` : promo.discount,
        totalDiscount: itemTotalDiscount,
        originalSubtotal: orderItem.subtotal,
        discountedSubtotal: orderItem.subtotal - itemTotalDiscount,
        discountPercentage: promo.discountType === 'percentage' ? promo.discount : undefined
      });

      console.log('✅ Discount on Quantity applied:', {
        item: orderItem.menuItemName,
        quantity: orderItem.quantity,
        minRequired: minQuantity,
        discountType: promo.discountType,
        discountValue: promo.discount,
        totalDiscount: itemTotalDiscount
      });
    }
  }

  return {
    applied: totalDiscount > 0,
    discount: totalDiscount,
    affectedItems: affectedItems
  };
}

// 2. Discount on Total - PERBAIKAN UNTUK discountType
function applyDiscountOnTotal(promo, orderItems) {
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const minTotal = promo.conditions.minTotal || 0;
  
  console.log('💰 Discount on Total Promo:', {
    name: promo.name,
    discountType: promo.discountType,
    discountValue: promo.discount,
    minTotal: minTotal,
    orderSubtotal: subtotal
  });

  if (subtotal >= minTotal) {
    let discount = 0;
    
    if (promo.discountType === 'percentage') {
      discount = (subtotal * promo.discount) / 100;
    } else if (promo.discountType === 'fixed') {
      discount = Math.min(promo.discount, subtotal);
    }
    
    const affectedItems = orderItems.map(item => {
      const itemDiscountShare = (item.subtotal / subtotal) * discount;
      
      return {
        menuItem: item.menuItem,
        menuItemName: item.menuItemName,
        quantity: item.quantity,
        discountType: promo.discountType,
        discountShare: itemDiscountShare,
        originalSubtotal: item.subtotal,
        discountedSubtotal: item.subtotal - itemDiscountShare,
        discountPercentage: promo.discountType === 'percentage' ? promo.discount : undefined
      };
    });

    console.log('✅ Discount on Total applied:', {
      subtotal: subtotal,
      minTotal: minTotal,
      discountType: promo.discountType,
      discountValue: promo.discount,
      totalDiscount: discount
    });

    return {
      applied: true,
      discount: discount,
      affectedItems: affectedItems
    };
  }

  console.log('❌ Discount on Total not applied:', {
    subtotal: subtotal,
    minTotal: minTotal,
    reason: 'Subtotal less than minimum required'
  });

  return { applied: false, discount: 0, affectedItems: [] };
}

// 3. Buy X Get Y - TIDAK BUTUH discountType
function applyBuyXGetY(promo, orderItems) {
  const buyProduct = promo.conditions.buyProduct;
  const getProduct = promo.conditions.getProduct;
  
  if (!buyProduct || !getProduct) {
    return { applied: false, discount: 0, affectedItems: [] };
  }

  console.log('🎁 Buy X Get Y Promo:', {
    name: promo.name,
    buyProduct: buyProduct.name,
    getProduct: getProduct.name,
    minQuantity: promo.conditions.minQuantity
  });

  // Cari item yang dibeli (buy product)
  const buyItem = orderItems.find(item => item.menuItem.toString() === buyProduct._id.toString());
  
  if (!buyItem || buyItem.quantity < (promo.conditions.minQuantity || 1)) {
    console.log('❌ Buy X Get Y not applied:', {
      reason: !buyItem ? 'Buy product not found' : 'Insufficient quantity',
      requiredQuantity: promo.conditions.minQuantity || 1,
      availableQuantity: buyItem?.quantity || 0
    });
    return { applied: false, discount: 0, affectedItems: [] };
  }

  // Hitung berapa banyak free item yang didapat
  const freeQuantity = Math.floor(buyItem.quantity / (promo.conditions.minQuantity || 1));
  
  if (freeQuantity === 0) {
    return { applied: false, discount: 0, affectedItems: [] };
  }

  // Cari harga free item
  const freeItemPrice = getProduct.price || 0;
  const discount = freeItemPrice * freeQuantity;

  const affectedItems = [{
    menuItem: buyItem.menuItem,
    menuItemName: buyProduct.name,
    quantity: buyItem.quantity,
    triggeredPromo: true,
    originalSubtotal: buyItem.subtotal,
    discountedSubtotal: buyItem.subtotal
  }];

  console.log('✅ Buy X Get Y applied:', {
    buyProduct: buyProduct.name,
    buyQuantity: buyItem.quantity,
    getProduct: getProduct.name,
    freeQuantity: freeQuantity,
    totalDiscount: discount
  });

  return {
    applied: true,
    discount: discount,
    affectedItems: affectedItems,
    freeItems: [{
      menuItem: getProduct._id,
      menuItemName: getProduct.name,
      quantity: freeQuantity,
      price: freeItemPrice,
      isFree: true
    }]
  };
}

// 4. Bundling - TIDAK BUTUH discountType
function applyBundling(promo, orderItems) {
  const bundleProducts = promo.conditions.bundleProducts;
  
  if (!bundleProducts || bundleProducts.length === 0) {
    return { applied: false, discount: 0, affectedItems: [] };
  }

  console.log('📦 Bundling Promo:', {
    name: promo.name,
    bundlePrice: promo.bundlePrice,
    products: bundleProducts.map(bp => ({
      name: bp.product.name,
      quantity: bp.quantity
    }))
  });

  // Hitung berapa set bundle yang bisa dibentuk
  let maxBundleSets = Infinity;
  
  for (const bundleProduct of bundleProducts) {
    const orderItem = orderItems.find(item => 
      item.menuItem.toString() === bundleProduct.product._id.toString()
    );
    
    if (!orderItem) {
      console.log('❌ Bundling not applied: Missing product', bundleProduct.product.name);
      return { applied: false, discount: 0, affectedItems: [] };
    }
    
    const setsForThisProduct = Math.floor(orderItem.quantity / bundleProduct.quantity);
    maxBundleSets = Math.min(maxBundleSets, setsForThisProduct);
    
    console.log('📊 Bundle product availability:', {
      product: bundleProduct.product.name,
      required: bundleProduct.quantity,
      available: orderItem.quantity,
      setsPossible: setsForThisProduct
    });
  }

  if (maxBundleSets === 0) {
    console.log('❌ Bundling not applied: No complete sets available');
    return { applied: false, discount: 0, affectedItems: [] };
  }

  // Hitung total discount
  const originalBundlePrice = bundleProducts.reduce((total, bundleProduct) => {
    return total + (bundleProduct.product.price * bundleProduct.quantity * maxBundleSets);
  }, 0);
  
  const discountedBundlePrice = promo.bundlePrice * maxBundleSets;
  const discount = originalBundlePrice - discountedBundlePrice;

  const affectedItems = bundleProducts.map(bundleProduct => {
    const orderItem = orderItems.find(item => 
      item.menuItem.toString() === bundleProduct.product._id.toString()
    );
    
    const itemQuantityInBundle = bundleProduct.quantity * maxBundleSets;
    const itemOriginalSubtotal = bundleProduct.product.price * itemQuantityInBundle;
    const itemDiscountShare = (bundleProduct.product.price * itemQuantityInBundle) - 
                             (discountedBundlePrice * (bundleProduct.product.price * bundleProduct.quantity) / originalBundlePrice);

    return {
      menuItem: bundleProduct.product._id,
      menuItemName: bundleProduct.product.name,
      quantity: itemQuantityInBundle,
      discountShare: itemDiscountShare,
      originalSubtotal: itemOriginalSubtotal,
      discountedSubtotal: itemOriginalSubtotal - itemDiscountShare,
      isPartOfBundle: true
    };
  });

  console.log('✅ Bundling applied:', {
    sets: maxBundleSets,
    originalPrice: originalBundlePrice,
    bundlePrice: discountedBundlePrice,
    totalDiscount: discount
  });

  return {
    applied: true,
    discount: discount,
    affectedItems: affectedItems
  };
}

// 5. Product Specific Discount - PERBAIKAN UNTUK discountType
function applyProductSpecific(promo, orderItems, orderType) {
  const { conditions, discount, discountType, consumerType } = promo;
  
  // Cek consumer type
  if (consumerType && consumerType !== '' && consumerType !== 'all' && consumerType !== orderType) {
    console.log('❌ Promo skipped - consumer type mismatch:', {
      promoConsumerType: consumerType,
      orderType: orderType
    });
    return { applied: false, discount: 0, affectedItems: [] };
  }

  // Normalize promo products dengan berbagai format
  const promoProducts = (conditions.products || []).map(p => {
    console.log('🔍 Raw promo product:', p);
    
    // Handle berbagai format
    if (typeof p === 'object') {
      if (p.$oid) return p.$oid.toString();
      if (p._id) return p._id.toString();
      if (p.id) return p.id.toString();
      return p.toString();
    }
    return p.toString();
  });

  console.log('🔍 Product Specific Promo Detailed Check:', {
    promoName: promo.name,
    promoType: promo.promoType,
    discountType: discountType,
    discountValue: discount,
    consumerType: consumerType,
    orderType: orderType,
    promoProducts: promoProducts,
    orderItems: orderItems.map(item => ({
      rawMenuItem: item.menuItem,
      menuItemType: typeof item.menuItem,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      subtotal: item.subtotal
    }))
  });

  let totalDiscount = 0;
  const affectedItems = [];

  for (const item of orderItems) {
    // Normalize item ID dengan comprehensive approach
    let itemId;
    
    if (item.menuItem === null || item.menuItem === undefined) {
      console.log('❌ Item has no menuItem:', item);
      continue;
    }
    
    if (typeof item.menuItem === 'object') {
      itemId = item.menuItem._id?.toString() || 
               item.menuItem.id?.toString() || 
               item.menuItem.toString();
    } else {
      itemId = item.menuItem.toString();
    }

    // Bersihkan ID dari berbagai prefix
    const cleanItemId = itemId
      .replace('$oid:', '')
      .replace('ObjectId(', '')
      .replace(')', '');

    console.log('🔍 Detailed Item Check:', {
      menuItemName: item.menuItemName,
      rawItemId: item.menuItem,
      normalizedItemId: itemId,
      cleanItemId: cleanItemId,
      promoProducts: promoProducts,
      isExactMatch: promoProducts.includes(itemId),
      isCleanMatch: promoProducts.includes(cleanItemId),
      isAnyMatch: promoProducts.some(promoId => 
        promoId.includes(itemId) || itemId.includes(promoId) ||
        promoId.includes(cleanItemId) || cleanItemId.includes(promoId)
      )
    });

    // Gunakan matching yang lebih flexible
    const isMatch = promoProducts.some(promoId => {
      const cleanPromoId = promoId
        .replace('$oid:', '')
        .replace('ObjectId(', '')
        .replace(')', '');
      
      return cleanPromoId === cleanItemId;
    });

    if (isMatch) {
      // Hitung discount berdasarkan discountType
      let itemDiscount = 0;
      
      if (discountType === 'percentage') {
        itemDiscount = (discount / 100) * item.subtotal;
      } else if (discountType === 'fixed') {
        itemDiscount = Math.min(discount, item.subtotal);
      }
      
      totalDiscount += itemDiscount;
      affectedItems.push({
        menuItem: item.menuItem,
        menuItemName: item.menuItemName,
        quantity: item.quantity,
        originalSubtotal: item.subtotal,
        discountAmount: itemDiscount,
        discountedSubtotal: item.subtotal - itemDiscount,
        discountType: discountType,
        discountValue: discount,
        discountPercentage: discountType === 'percentage' ? discount : undefined
      });

      console.log('✅ PROMO APPLIED SUCCESSFULLY:', {
        itemName: item.menuItemName,
        originalPrice: item.subtotal,
        discountType: discountType,
        discountValue: discount,
        discountAmount: itemDiscount,
        finalPrice: item.subtotal - itemDiscount
      });
    } else {
      console.log('❌ ITEM NOT IN PROMO - Detailed comparison:', {
        itemName: item.menuItemName,
        itemId: cleanItemId,
        promoProductIds: promoProducts.map(id => id.replace('$oid:', '').replace('ObjectId(', '').replace(')', '')),
        matchAttempt: 'No matching ID found'
      });
    }
  }

  const result = {
    applied: affectedItems.length > 0,
    discount: totalDiscount,
    affectedItems
  };

  console.log('📊 PRODUCT SPECIFIC PROMO FINAL RESULT:', {
    promoName: promo.name,
    applied: result.applied,
    totalDiscount: result.discount,
    discountType: discountType,
    discountValue: discount,
    affectedItemsCount: result.affectedItems.length,
    affectedItems: result.affectedItems
  });

  return result;
}

// Fungsi helper tambahan untuk debugging active hours
export function debugActiveHours(promo, currentTime = new Date()) {
  if (!promo.activeHours || !promo.activeHours.isEnabled) {
    return {
      hasActiveHours: false,
      message: 'Active hours not enabled for this promo'
    };
  }

  const isActive = promo.isWithinActiveHours(currentTime);
  const currentSchedule = promo.getCurrentSchedule ? promo.getCurrentSchedule() : null;
  
  return {
    hasActiveHours: true,
    isCurrentlyActive: isActive,
    currentTime: currentTime.toLocaleString(),
    currentSchedule,
    allSchedules: promo.activeHours.schedule,
    dayOfWeek: currentTime.getDay(),
    currentTimeFormatted: currentTime.toTimeString().slice(0, 5)
  };
}

export async function checkVoucher(voucherCode, totalAmount, outlet) {
  let discount = 0;
  let voucher = null;

  if (voucherCode) {
    voucher = await Voucher.findOne({ code: voucherCode });
    if (voucher && voucher.isActive) {
      const isValidDate = new Date() >= voucher.validFrom && new Date() <= voucher.validTo;
      const isValidOutlet = voucher.applicableOutlets.length === 0 ||
        voucher.applicableOutlets.some(outletId => outletId.equals(outlet));

      if (isValidDate && isValidOutlet && voucher.quota > 0) {
        // PERBAIKAN: Voucher dihitung dari amount SETELAH diskon lain
        if (voucher.discountType === 'percentage') {
          discount = (totalAmount * voucher.discountAmount) / 100;
        } else if (voucher.discountType === 'fixed') {
          discount = Math.min(voucher.discountAmount, totalAmount);
        }

        console.log('🎫 VOUCHER APPLICATION:', {
          code: voucherCode,
          discountType: voucher.discountType,
          discountAmount: voucher.discountAmount,
          calculatedDiscount: discount,
          applicableAmount: totalAmount,
          remainingAfterDiscount: totalAmount - discount
        });

        // Update kuota voucher
        voucher.quota -= 1;
        if (voucher.quota === 0) voucher.isActive = false;
        await voucher.save();
      } else {
        console.log('❌ VOUCHER NOT VALID:', {
          code: voucherCode,
          isValidDate,
          isValidOutlet,
          quota: voucher?.quota
        });
      }
    } else {
      console.log('❌ VOUCHER NOT FOUND OR INACTIVE:', voucherCode);
    }
  }

  return {
    discount: Number(discount) || 0,
    voucher
  };
}

export async function checkManualPromo(totalAmount, outletId, customerType = 'all') {
  if (!totalAmount || !outletId) {
    return { discount: 0, appliedPromo: null };
  }

  const now = new Date();

  // Cari promo aktif di outlet ini yang cocok dengan customer type
  const promo = await Promo.findOne({
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now },
    outlet: outletId,
    $or: [
      { customerType: 'all' },
      { customerType }
    ]
  });

  if (!promo) {
    return { discount: 0, appliedPromo: null };
  }

  let discount = 0;

  if (promo.discountType === 'percentage') {
    discount = totalAmount * (promo.discountAmount / 100);
  } else if (promo.discountType === 'fixed') {
    discount = Math.min(promo.discountAmount, totalAmount);
  }

  return {
    discount: Number(discount) || 0,
    appliedPromo: {
      promoId: promo._id,
      name: promo.name,
      discountAmount: discount,
      discountType: promo.discountType,
      discountValue: promo.discountAmount
    }
  };
}