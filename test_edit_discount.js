const totalBeforeDiscount = 100000;
const orderLevelCustomDiscount = 10000; 

// What happens in createOrderHandler
let originalGrandTotal = (100000 - 10000) * 1.11; // 99900

// What happens in replaceOrderItemsAndAllocate 
let autoPromoDiscount=0, manualDiscount=0, voucherDiscount=0, itemCustomDiscounts=0;
let totalAllDiscounts = autoPromoDiscount + manualDiscount + voucherDiscount + itemCustomDiscounts;
let totalAfterAllDiscounts = Math.max(0, totalBeforeDiscount - totalAllDiscounts);

let taxableAmount = totalAfterAllDiscounts; // 100000
let totalTax = taxableAmount * 0.11; // 11000

let editedGrandTotal = totalAfterAllDiscounts + totalTax; // 111000

console.log("Original Grand Total:", originalGrandTotal);
console.log("Edited Grand Total:", editedGrandTotal);
console.log("Difference (ANOMALY):", editedGrandTotal - originalGrandTotal); // +11100
