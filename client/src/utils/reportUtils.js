/**
 * Utility functions for reporting modules to ensure consistency in 
 * calculations, normalization, and data processing.
 */

/**
 * Normalizes payment method names to a consistent display format.
 * @param {string} name - The raw payment method name from the API.
 * @returns {string} - The normalized display name.
 */
export const normalizePaymentMethodName = (name) => {
    if (!name) return 'Unknown';
    const rawName = name.trim();
    const lowerName = rawName.toLowerCase();

    if (lowerName === 'cash' || lowerName === 'cash cash') {
        return 'Cash';
    }
    
    const upperName = rawName.toUpperCase();
    if (upperName === 'BNI QRIS' || upperName === 'QRIS BNI') {
        return 'QRIS BNI';
    }
    if (upperName === 'BRI QRIS' || upperName === 'QRIS BRI') {
        return 'QRIS BRI';
    }
    if (upperName === 'QRIS' || lowerName === 'qris') {
        return 'QRIS';
    }

    return rawName;
};

/**
 * Calculates report totals based on the inclusion of tax and service fees.
 * @param {Object} summary - The summary data from the API.
 * @param {boolean} includeTax - Whether to include tax and service fees in the total.
 * @returns {Object} - Calculated totals including totalPenjualan and penjualanBersih.
 */
export const calculateReportTotals = (summary = {}, includeTax = true) => {
    const totalSalesAPI = summary.totalSales || summary.total_sales || 0;
    const totalTaxAPI = summary.totalTax || summary.total_tax || 0;
    const totalServiceAPI = summary.totalServiceFee || summary.total_service_fee || 0;
    const totalDiscountAPI = summary.totalDiscount || summary.total_discount || 0;
    
    // penjualanBersih (Nett) = Always without Tax and Service
    const penjualanBersih = totalSalesAPI - totalTaxAPI - totalServiceAPI;
    
    // totalPenjualan = Depending on toggle
    const totalPenjualan = includeTax ? totalSalesAPI : penjualanBersih;
    
    // penjualanKotor = Penjualan Bersih + Diskon
    const penjualanKotor = penjualanBersih + totalDiscountAPI;

    return {
        totalPenjualan,
        penjualanBersih,
        penjualanKotor,
        tax: totalTaxAPI,
        service: totalServiceAPI,
        discount: totalDiscountAPI,
        totalTransactions: summary.totalTransactions || summary.total_transactions || 0,
        totalItems: summary.totalItems || 0,
        avgOrderValue: (summary.totalTransactions || 0) > 0 ? totalPenjualan / summary.totalTransactions : 0
    };
};

/**
 * Allocated a proportional share of a total pool to an item.
 * @param {number} itemAmount - The specific amount for the item.
 * @param {number} totalAmount - The total collected amount.
 * @param {number} poolValue - The value to be distributed (e.g., total tax).
 * @returns {number} - The allocated share.
 */
export const allocateProportional = (itemAmount, totalAmount, poolValue) => {
    if (totalAmount <= 0) return 0;
    const share = itemAmount / totalAmount;
    return share * poolValue;
};

/**
 * Formats a number as IDR currency.
 * @param {number} amount - The amount to format.
 * @returns {string} - Formatted IDR string.
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

