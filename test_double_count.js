// Imagine an order with total 100000.
const totals_afterDiscount = 100000;
const totals_grandTotal = 110000;

// orderLevelCustomDiscount is fetched like this:
// const orderLevelCustomDiscount = orderData.customDiscountDetails?.isActive
//   ? (orderData.customDiscountDetails.discountAmount || 0)
//   : (cleanOrderData.discounts?.customDiscount || 0);

// IF customDiscountDetails.discountAmount is 0 but cleanOrderData.discounts.customDiscount IS NOT 0...
const cleanOrderData_discounts_customDiscount = 10000; // item custom discounts!
const orderLevelCustomDiscount = cleanOrderData_discounts_customDiscount;

let adjustedTotalAfterDiscount = totals_afterDiscount;
let adjustedGrandTotal = totals_grandTotal;

if (orderLevelCustomDiscount > 0) {
  // 100000 - 10000 = 90000
  adjustedTotalAfterDiscount = Math.max(0, totals_afterDiscount - orderLevelCustomDiscount);
  // Tax recalculation... for simplicity, say it drops.
  const adjustedTaxAmount = 9000; // was 10000
  const adjustedServiceFee = 0; 
  
  // Wait, if it subtracts 10k, it drops to 99000. It STILL DROPS.
  // Unless... the orderLevelCustomDiscount was subtracted initially, but now it's treated as a POSITIVE ADDITION?
  adjustedGrandTotal = adjustedTotalAfterDiscount + adjustedTaxAmount + adjustedServiceFee;
}
console.log(adjustedGrandTotal);
