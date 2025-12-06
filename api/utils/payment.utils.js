// utils/payment.utils.js
export const validateAndNormalizePaymentDetails = (paymentDetails, isSplitPayment, source) => {
  console.log('Converting legacy payment details to array format:', {
    paymentDetails,
    source,
    isSplitPayment
  });

  // Jika paymentDetails kosong/null
  if (!paymentDetails) {
    console.warn('Payment details is empty, creating default');
    
    // Default berdasarkan source
    if (source === 'Cashier' && isSplitPayment) {
      return [];
    } else {
      return { 
        method: 'Cash', 
        amount: 0,
        status: source === 'Cashier' ? 'settlement' : 'pending'
      };
    }
  }

  // Jika sudah array dan source Cashier dengan split payment
  if (Array.isArray(paymentDetails) && source === 'Cashier' && isSplitPayment) {
    console.log('Payment details is already array format for split payment');
    return paymentDetails;
  }

  // Jika array tetapi source bukan Cashier atau bukan split payment
  if (Array.isArray(paymentDetails)) {
    // Web tidak boleh array
    if (source === 'Web') {
      console.warn('Array payment details received for Web source, converting to single');
      const firstPayment = paymentDetails[0] || {};
      return {
        method: firstPayment.method || 'Cash',
        amount: firstPayment.amount || 0,
        status: 'pending' // Web selalu pending
      };
    }
    
    // Untuk App atau Cashier tanpa split, ambil pertama
    const firstPayment = paymentDetails[0] || {};
    return {
      method: firstPayment.method || 'Cash',
      amount: firstPayment.amount || 0,
      status: firstPayment.status || 'pending',
      ...firstPayment
    };
  }

  // Jika object single payment (legacy format)
  if (typeof paymentDetails === 'object' && !Array.isArray(paymentDetails)) {
    console.log('Processing single payment object');
    
    // Normalisasi method
    const normalizedMethod = paymentDetails.method ? 
      paymentDetails.method.charAt(0).toUpperCase() + paymentDetails.method.slice(1).toLowerCase() : 
      'Cash';
    
    // Tentukan status berdasarkan source
    let status = paymentDetails.status;
    if (!status) {
      if (source === 'Cashier') {
        status = 'settlement';
      } else if (source === 'App' || source === 'Web') {
        status = normalizedMethod.toLowerCase() === 'cash' ? 'pending' : 'pending';
      }
    }
    
    // Return normalized object
    return {
      method: normalizedMethod,
      amount: Number(paymentDetails.amount) || 0,
      status: status,
      ...paymentDetails
    };
  }

  // Fallback default
  console.warn('Invalid payment details format, using default');
  return { 
    method: 'Cash', 
    amount: 0,
    status: source === 'Cashier' ? 'settlement' : 'pending'
  };
};