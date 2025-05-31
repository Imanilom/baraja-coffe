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
  }).populate('conditions.buyProduct conditions.getProduct conditions.bundleProducts.product');

  let totalDiscount = 0;
  let appliedPromos = [];

  for (const promo of autoPromos) {
    // Logika cek promo otomatis
  }

  return { totalDiscount, appliedPromos };
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

  return { discount, voucher };
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
    discount,
    appliedPromo: {
      promoId: promo._id,
      name: promo.name,
      discountAmount: discount,
      discountType: promo.discountType
    }
  };
}