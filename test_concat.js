let totals = { afterDiscount: 100000 };
let orderLevelCustomDiscountStr = "10000";

// Subtraction coerces both to Number!
let adjustedTotalAfterDiscount = Math.max(0, totals.afterDiscount - orderLevelCustomDiscountStr);
console.log("type of adjustedTotalAfterDiscount after subtraction:", typeof adjustedTotalAfterDiscount, adjustedTotalAfterDiscount);

// 90000 + 8910 + 4050
let adjustedTaxAmount = 8910;
let adjustedServiceFee = 4050;

let adjustedGrandTotal = adjustedTotalAfterDiscount + adjustedTaxAmount + adjustedServiceFee;
console.log("adjustedGrandTotal:", adjustedGrandTotal);

// So it's NOT string concatenation. Math.max always returns a Number.
