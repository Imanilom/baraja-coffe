function adjustSplitPaymentAmounts(paymentDetails, grandTotal) {
  const totalOriginal = paymentDetails.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (totalOriginal === 0) {
    throw new Error('Total original payment cannot be zero');
  }

  if (Math.abs(totalOriginal - grandTotal) < 1) {
    return paymentDetails;
  }

  const ratio = grandTotal / totalOriginal;

  const adjustedPayments = paymentDetails.map((payment, index) => {
    const adjustedAmount = Math.round(payment.amount * ratio);

    return {
      ...payment,
      amount: adjustedAmount,
      tenderedAmount: payment.tenderedAmount ? Math.round(payment.tenderedAmount * ratio) : adjustedAmount,
      changeAmount: payment.changeAmount ? Math.round(payment.changeAmount * ratio) : 0
    };
  });

  const totalAdjusted = adjustedPayments.reduce((sum, p) => sum + p.amount, 0);
  const difference = Math.abs(totalAdjusted - grandTotal);

  if (difference > 0 && adjustedPayments.length > 0) {
    const lastIndex = adjustedPayments.length - 1;
    adjustedPayments[lastIndex].amount += (grandTotal - totalAdjusted);
  }

  return adjustedPayments;
}

console.log(adjustSplitPaymentAmounts([{ amount: 100000 }], 90000));
