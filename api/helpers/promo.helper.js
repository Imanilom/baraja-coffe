import Voucher from "../models/voucher.model.js";
import AutoPromo from '../models/AutoPromo.model.js';
import Promo from '../models/Promo.model.js';
import mongoose from 'mongoose';

export async function checkAutoPromos(orderItems, outlet, orderType) {
  const now = new Date();
  const autoPromos = await AutoPromo.find({
    outlet,
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now }
  })
  .populate('conditions.buyProduct')
  .populate('conditions.getProduct')
  .populate('conditions.bundleProducts.product')
  .populate('conditions.products'); // <-- Tambahkan ini untuk product_specific

  let totalDiscount = 0;
  let appliedPromos = [];

  for (const promo of autoPromos) {
    const promoResult = await applyAutoPromo(promo, orderItems, orderType);
    
    if (promoResult.applied && promoResult.discount > 0) {
      totalDiscount += promoResult.discount;
      appliedPromos.push({
        promoId: promo._id,
        promoName: promo.name,
        promoType: promo.promoType,
        discount: promoResult.discount,
        affectedItems: promoResult.affectedItems,
        freeItems: promoResult.freeItems || []
      });
    }
  }

  return {
    totalDiscount: Number(totalDiscount) || 0,
    appliedPromos: appliedPromos || []
  };
}

// Fungsi untuk apply berbagai jenis auto promo
async function applyAutoPromo(promo, orderItems, orderType) {
  // Cek consumer type
  if (promo.consumerType !== 'all' && promo.consumerType !== orderType) {
    return { applied: false, discount: 0, affectedItems: [] };
  }

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
      return applyProductSpecific(promo, orderItems);
      
    default:
      return { applied: false, discount: 0, affectedItems: [] };
  }
}

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
        menuItemName: orderItem.menuItemName, // Anda perlu menambahkan ini di orderItems
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
function applyProductSpecific(promo, orderItems) {
  const { conditions, discount } = promo;
  const promoProducts = (conditions.products || []).map(p => p._id?.toString() || p.toString());
  let totalDiscount = 0;
  const affectedItems = [];

  for (const item of orderItems) {
    const itemId = item.menuItem?._id?.toString() || item.menuItem?.toString() || '';
    
    if (promoProducts.includes(itemId)) {
      // Asumsi: discount adalah persentase (misal: 20 = 20%)
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      const itemDiscount = (discount / 100) * itemTotal;
      
      totalDiscount += itemDiscount;
      affectedItems.push({
        menuItemId: itemId,
        quantity: item.quantity,
        originalPrice: item.price,
        discountAmount: itemDiscount
      });
    }
  }

  return {
    applied: affectedItems.length > 0,
    discount: totalDiscount,
    affectedItems
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
        // Hitung diskon
        if (voucher.discountType === 'percentage') {
          discount = (totalAmount * voucher.discountAmount) / 100;
        } else if (voucher.discountType === 'fixed') {
          discount = voucher.discountAmount;
        }

        // Update kuota voucher
        voucher.quota -= 1;
        if (voucher.quota === 0) voucher.isActive = false;
        await voucher.save();
      }
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