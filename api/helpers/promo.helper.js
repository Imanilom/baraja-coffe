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
      activeHours: p.activeHours
    }))
  });

  let totalDiscount = 0;
  let appliedPromos = [];

  for (const promo of activePromos) {
    console.log('🔍 Processing promo:', promo.name);
    
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
          discountPercentage: item.discountPercentage
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

// [Fungsi-fungsi apply lainnya tetap sama, hanya tambahkan log untuk active hours]

// 1. Discount on Quantity - UNTUK PROMO ROTI ANDA
function applyDiscountOnQuantity(promo, orderItems) {
  let totalDiscount = 0;
  let affectedItems = [];

  for (const orderItem of orderItems) {
    // Cek apakah item memenuhi minimum quantity
    const minQuantity = promo.conditions.minQuantity || 1;
    
    if (orderItem.quantity >= minQuantity) {
      // Untuk promo discount_on_quantity, discount adalah harga spesifik per item
      const itemDiscountPerUnit = promo.discount;
      const itemTotalDiscount = itemDiscountPerUnit * orderItem.quantity;
      
      totalDiscount += itemTotalDiscount;
      
      affectedItems.push({
        menuItem: orderItem.menuItem,
        menuItemName: orderItem.menuItemName,
        quantity: orderItem.quantity,
        discountPerUnit: itemDiscountPerUnit,
        totalDiscount: itemTotalDiscount,
        originalSubtotal: orderItem.subtotal,
        discountedSubtotal: orderItem.subtotal - itemTotalDiscount
      });
    }
  }

  return {
    applied: totalDiscount > 0,
    discount: totalDiscount,
    affectedItems: affectedItems
  };
}

// 2. Discount on Total
function applyDiscountOnTotal(promo, orderItems) {
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const minTotal = promo.conditions.minTotal || 0;
  
  if (subtotal >= minTotal) {
    const discount = promo.discount;
    const discountPerItem = discount / orderItems.length;
    
    const affectedItems = orderItems.map(item => ({
      menuItem: item.menuItem,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      discountShare: (item.subtotal / subtotal) * discount,
      originalSubtotal: item.subtotal,
      discountedSubtotal: item.subtotal - ((item.subtotal / subtotal) * discount)
    }));

    return {
      applied: true,
      discount: discount,
      affectedItems: affectedItems
    };
  }

  return { applied: false, discount: 0, affectedItems: [] };
}

// 3. Buy X Get Y
function applyBuyXGetY(promo, orderItems) {
  const buyProduct = promo.conditions.buyProduct;
  const getProduct = promo.conditions.getProduct;
  
  if (!buyProduct || !getProduct) {
    return { applied: false, discount: 0, affectedItems: [] };
  }

  // Cari item yang dibeli (buy product)
  const buyItem = orderItems.find(item => item.menuItem.toString() === buyProduct._id.toString());
  
  if (!buyItem || buyItem.quantity < (promo.conditions.minQuantity || 1)) {
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

// 4. Bundling
function applyBundling(promo, orderItems) {
  const bundleProducts = promo.conditions.bundleProducts;
  
  if (!bundleProducts || bundleProducts.length === 0) {
    return { applied: false, discount: 0, affectedItems: [] };
  }

  // Hitung berapa set bundle yang bisa dibentuk
  let maxBundleSets = Infinity;
  
  for (const bundleProduct of bundleProducts) {
    const orderItem = orderItems.find(item => 
      item.menuItem.toString() === bundleProduct.product._id.toString()
    );
    
    if (!orderItem) {
      return { applied: false, discount: 0, affectedItems: [] };
    }
    
    const setsForThisProduct = Math.floor(orderItem.quantity / bundleProduct.quantity);
    maxBundleSets = Math.min(maxBundleSets, setsForThisProduct);
  }

  if (maxBundleSets === 0) {
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

  return {
    applied: true,
    discount: discount,
    affectedItems: affectedItems
  };
}

// 5. Product Specific Discount
function applyProductSpecific(promo, orderItems, orderType) {
  const { conditions, discount, consumerType } = promo;
  
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

  console.log('🔍 Normalized promo products:', promoProducts);

  let totalDiscount = 0;
  const affectedItems = [];

  console.log('🔍 Product Specific Promo Detailed Check:', {
    promoName: promo.name,
    promoType: promo.promoType,
    discountPercentage: discount,
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
      // Hitung discount berdasarkan subtotal aktual
      const itemDiscount = (discount / 100) * item.subtotal;
      
      totalDiscount += itemDiscount;
      affectedItems.push({
        menuItem: item.menuItem,
        menuItemName: item.menuItemName,
        quantity: item.quantity,
        originalSubtotal: item.subtotal,
        discountAmount: itemDiscount,
        discountedSubtotal: item.subtotal - itemDiscount,
        discountPercentage: discount
      });

      console.log('✅ PROMO APPLIED SUCCESSFULLY:', {
        itemName: item.menuItemName,
        originalPrice: item.subtotal,
        discountPercentage: discount + '%',
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
      discountType: promo.discountType
    }
  };
}