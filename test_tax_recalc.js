// Simulate totals object returned by processOrderItems
const totals = {
  beforeDiscount: 100000,
  afterDiscount: 100000,
  totalTax: 10000, // Original Tax
  totalServiceFee: 5000,
  grandTotal: 115000 
};

// Simulate orderLevelCustomDiscount
const orderLevelCustomDiscount = 10000;

let adjustedTotalAfterDiscount = totals.afterDiscount;
let adjustedGrandTotal = totals.grandTotal;

if (orderLevelCustomDiscount > 0) {
  adjustedTotalAfterDiscount = Math.max(0, totals.afterDiscount - orderLevelCustomDiscount);
  
  // Fake recalculateTaxesAndServices 
  const recalculatedTax = {
      totalTax: adjustedTotalAfterDiscount * 0.1, // 9000
      totalServiceFee: adjustedTotalAfterDiscount * 0.05 // 4500
  };

  const adjustedTaxAmount = recalculatedTax.totalTax;
  const adjustedServiceFee = recalculatedTax.totalServiceFee;
  
  // HERE IS THE EXACT FORMULA IN createOrderHandler.js:481
  adjustedGrandTotal = adjustedTotalAfterDiscount + adjustedTaxAmount + adjustedServiceFee;

  console.log('Original grandTotal:', totals.grandTotal);
  console.log('Adjusted grandTotal:', adjustedGrandTotal);
  console.log('Difference:', adjustedGrandTotal - totals.grandTotal);
}
