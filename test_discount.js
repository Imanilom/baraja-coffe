const totalBeforeDiscount = 100000;
const itemCustomDiscounts = 0;
const orderLevelCustomDiscount = 10000; // 10%
const loyaltyDiscount = 0;
const autoPromoDiscount = 0;

const totalAllDiscounts = itemCustomDiscounts + loyaltyDiscount + autoPromoDiscount;
const totals_afterDiscount = Math.max(0, totalBeforeDiscount - totalAllDiscounts);

const adjustedTotalAfterDiscount = Math.max(0, totals_afterDiscount - orderLevelCustomDiscount);
const taxRate = 0.11;
const serviceRate = 0.05;

const adjustedTaxAmount = adjustedTotalAfterDiscount * taxRate;
const adjustedServiceFee = adjustedTotalAfterDiscount * serviceRate;

const adjustedGrandTotal = adjustedTotalAfterDiscount + adjustedTaxAmount + adjustedServiceFee;

console.log({
  totalBeforeDiscount,
  orderLevelCustomDiscount,
  totals_afterDiscount,
  adjustedTotalAfterDiscount,
  adjustedTaxAmount,
  adjustedServiceFee,
  adjustedGrandTotal
});
