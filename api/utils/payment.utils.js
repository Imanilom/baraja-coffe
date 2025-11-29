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

    // Validasi setiap payment
    const validatedPayments = paymentDetails.map((payment, index) => {
      if (!payment.method) {
        throw new Error(`Payment method is required for payment ${index + 1}`);
      }

      if (!payment.amount || payment.amount <= 0) {
        throw new Error(`Payment amount must be greater than 0 for payment ${index + 1}`);
      }

      // Set default values
      return {
        method: payment.method,
        amount: Number(payment.amount),
        status: payment.status || 'pending',
        tenderedAmount: payment.tenderedAmount || payment.amount,
        changeAmount: payment.changeAmount || 0,
        transactionId: payment.transactionId || null,
        notes: payment.notes || `Payment ${index + 1}`
      };
    });

    console.log('Normalized split payment details:', {
      paymentCount: validatedPayments.length,
      totalAmount: validatedPayments.reduce((sum, p) => sum + p.amount, 0),
      methods: validatedPayments.map(p => p.method)
    });

    return validatedPayments;
  }

  // Jika object (backward compatibility), konversi ke array dengan satu element
  if (typeof paymentDetails === 'object') {
    console.log('Converting legacy payment details to array format:', {
      method: paymentDetails.method,
      amount: paymentDetails.amount,
      source
    });

    const singlePayment = {
      method: paymentDetails.method || 'Cash',
      amount: Number(paymentDetails.amount || 0),
      status: paymentDetails.status || 'pending',
      tenderedAmount: paymentDetails.tenderedAmount || paymentDetails.amount || 0,
      changeAmount: paymentDetails.changeAmount || 0,
      transactionId: paymentDetails.transactionId || null,
      notes: paymentDetails.notes || 'Single payment'
    };

    // Untuk backward compatibility, jika isSplitPayment true tapi formatnya object,
    // kita anggap sebagai single payment dan log warning
    if (isSplitPayment) {
      console.warn('isSplitPayment is true but paymentDetails is object format. Converting to single payment array.');
    }

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