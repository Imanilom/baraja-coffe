// payment.utils.js
/**
 * Validate and normalize payment details for backward compatibility
 */
export function validateAndNormalizePaymentDetails(paymentDetails, isSplitPayment = false, source = 'Cashier') {
  // Jika paymentDetails tidak ada, return null
  if (!paymentDetails) {
    return null;
  }

  // Jika sudah array, validasi dan return
  if (Array.isArray(paymentDetails)) {
    if (paymentDetails.length === 0) {
      throw new Error('Payment details array cannot be empty');
    }

    // Validasi: Total amount harus positif
    const totalAmount = paymentDetails.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    if (totalAmount <= 0) {
      throw new Error('Total payment amount must be greater than 0');
    }

    const validatedPayments = paymentDetails.map((payment, index) => {
      if (!payment.method) {
        throw new Error(`Payment method is required for payment ${index + 1}`);
      }

      if (!payment.amount || payment.amount <= 0) {
        throw new Error(`Payment amount must be greater than 0 for payment ${index + 1}`);
      }

      return {
        method: payment.method,
        amount: Number(payment.amount),
        status: payment.status || 'pending',
        tenderedAmount: payment.tenderedAmount || payment.amount,
        changeAmount: payment.changeAmount || 0,
        transactionId: payment.transactionId || null,
        notes: payment.notes || `Payment ${index + 1}`,
        index: index
      };
    });

    console.log('Normalized split payment details:', {
      paymentCount: validatedPayments.length,
      totalAmount: validatedPayments.reduce((sum, p) => sum + p.amount, 0),
      methods: validatedPayments.map(p => p.method),
      isSplitPayment
    });

    return validatedPayments;
  }

  // Jika object (backward compatibility)
  if (typeof paymentDetails === 'object') {
    console.log('Converting legacy payment details to array format:', {
      method: paymentDetails.method,
      amount: paymentDetails.amount,
      source,
      isSplitPayment
    });

    const singlePayment = {
      method: paymentDetails.method || 'Cash',
      amount: Number(paymentDetails.amount || 0),
      status: paymentDetails.status || 'pending',
      tenderedAmount: paymentDetails.tenderedAmount || paymentDetails.amount || 0,
      changeAmount: paymentDetails.changeAmount || 0,
      transactionId: paymentDetails.transactionId || null,
      notes: paymentDetails.notes || 'Single payment',
      index: 0
    };

    return [singlePayment];
  }

  throw new Error('Invalid payment details format. Must be array or object.');
}

/**
 * Calculate total payment amount from payment details
 */
export function calculateTotalPaymentAmount(paymentDetails) {
  if (!paymentDetails) return 0;
  
  if (Array.isArray(paymentDetails)) {
    return paymentDetails.reduce((total, payment) => total + (payment.amount || 0), 0);
  }
  
  return paymentDetails.amount || 0;
}

/**
 * Check if payment is completed based on payment details
 */
export function isPaymentCompleted(paymentDetails, grandTotal) {
  if (!paymentDetails) return false;
  
  const totalPaid = calculateTotalPaymentAmount(paymentDetails);
  return totalPaid >= grandTotal;
}

/**
 * Validates payment details against order total
 */
export function validatePaymentAgainstOrder(paymentDetails, orderTotal, customAmountItems = []) {
  if (!paymentDetails) {
    return { isValid: false, error: 'Payment details required' };
  }

  const totalPayment = calculateTotalPaymentAmount(paymentDetails);
  const totalCustomAmount = customAmountItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const effectiveOrderTotal = orderTotal + totalCustomAmount;

  console.log('Payment Validation:', {
    totalPayment,
    orderTotal,
    totalCustomAmount,
    effectiveOrderTotal,
    difference: totalPayment - effectiveOrderTotal
  });

  // Toleransi untuk rounding errors
  const tolerance = 1000;
  
  if (Math.abs(totalPayment - effectiveOrderTotal) > tolerance) {
    return {
      isValid: false,
      error: `Payment total (${totalPayment}) doesn't match order total (${effectiveOrderTotal})`,
      totalPayment,
      effectiveOrderTotal,
      difference: totalPayment - effectiveOrderTotal
    };
  }

  return {
    isValid: true,
    totalPayment,
    effectiveOrderTotal
  };
}