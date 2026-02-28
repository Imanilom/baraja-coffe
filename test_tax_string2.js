let applicableAmount = 0;
const customAmountItems = [{ amount: "10000" }]; // Passed from flutter/frontend
for (const customItem of customAmountItems) {
  applicableAmount += customItem.amount || 0; // 0 + "10000" = "010000"
}
const taxAmount = (11 / 100) * applicableAmount; // 1100

// In the loop it does this:
let totalTax = 0;
totalTax += taxAmount; // 0 + 1100 = 1100 (Number)

let adjustedTotalAfterDiscount = 90000;
let adjustedTaxAmount = totalTax;

let adjustedGrandTotal = adjustedTotalAfterDiscount + adjustedTaxAmount;
console.log(adjustedGrandTotal); // 91100 
// Still mathematically sound. No crazy additions.
