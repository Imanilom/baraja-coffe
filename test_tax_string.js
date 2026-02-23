let applicableAmount = 0;
applicableAmount += "10000" || 0;
console.log("applicableAmount type:", typeof applicableAmount, applicableAmount); // string "010000"

let taxAmount = (11 / 100) * applicableAmount;
console.log("taxAmount type:", typeof taxAmount, taxAmount); // number 1100

// If taxAmount is number, adjustedGrandTotal will still be a number!
// UNLESS totalTax is a string somehow? 
