// Simulate flutter payload
const orderItems = [
  { subtotal: 50000, customDiscount: { isActive: true, discountAmount: 10000 } }, // Item 1: 50k, 10k discount
  { subtotal: 50000, customDiscount: null } // Item 2: 50k, no discount
];
// totalBeforeDiscount = 100000
const combinedTotalBeforeDiscount = 100000;

// Order level custom discount (e.g. 10% on afterItemDiscount)
// afterItemDiscount would be 90000. 10% is 9000.
const customDiscountDetails = { isActive: true, discountAmount: 9000 };

// 1. Calculate item custom discounts (createOrderHandler.js line 1032)
const itemCustomDiscounts = orderItems.reduce((total, item) => {
  if (item.customDiscount?.isActive && item.customDiscount?.discountAmount) {
    return total + item.customDiscount.discountAmount; // 10000
  }
  return total;
}, 0);

// 2. totalAllDiscounts
const totalAllDiscounts = itemCustomDiscounts; // 10000
const totals_afterDiscount = Math.max(0, combinedTotalBeforeDiscount - totalAllDiscounts); // 90000

const totals = {
  afterDiscount: totals_afterDiscount, // 90000
  totalTax: 9900, // 11% on 90000
  totalServiceFee: 4500, // 5% on 90000
  grandTotal: 104400 // 90k + 9.9k + 4.5k
};

// 3. Extract orderLevelCustomDiscount
const orderLevelCustomDiscount = customDiscountDetails?.isActive 
  ? (customDiscountDetails.discountAmount || 0) // 9000
  : 0; 
  // Wait, if cleanOrderData.discounts.customDiscount is used, it uses itemCustomDiscounts!

// Simulate what createUnifiedOrder does!
// In createUnifiedOrder, validationData includes `discounts` AND `customDiscountDetails`.
// Flutter sets discounts.customDiscount = 0
// BUT what if order.controller.js maps customDiscountDetails poorly? Let's assume orderLevelCustomDiscount = 9000.

let adjustedTotalAfterDiscount = totals.afterDiscount;
let adjustedGrandTotal = totals.grandTotal;

if (orderLevelCustomDiscount > 0) {
  adjustedTotalAfterDiscount = Math.max(0, totals.afterDiscount - orderLevelCustomDiscount); // 90000 - 9000 = 81000
  
  // Tax Recalculation
  // For simplicity assuming tax applies to whole amount
  const adjustedTaxAmount = adjustedTotalAfterDiscount * 0.11; // 8910
  const adjustedServiceFee = adjustedTotalAfterDiscount * 0.05; // 4050
  
  adjustedGrandTotal = adjustedTotalAfterDiscount + adjustedTaxAmount + adjustedServiceFee; // 81000 + 8910 + 4050 = 93960
}

console.log({
  totals_grandTotal: totals.grandTotal,
  adjustedGrandTotal: adjustedGrandTotal,
  difference: adjustedGrandTotal - totals.grandTotal // -10440
});

