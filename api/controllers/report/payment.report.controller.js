import { Order } from '../../models/order.model.js';
import Payment from '../../models/Payment.model.js';

export const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, outletId, groupBy = 'daily' } = req.query;

    // Validasi tanggal
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date dan end date harus diisi'
      });
    }

    // Parse tanggal
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get all successful payments dalam periode
    const payments = await Payment.find({
      createdAt: { $gte: start, $lte: end },
      status: { $in: ['settlement', 'paid', 'capture'] }
    });

    // Get order_ids from payments
    const orderIds = payments.map(p => p.order_id).filter(id => id);

    // Find orders separately since order_id is string, not ObjectId
    // const orders = await Order.find({
    //   order_id: { $in: orderIds },
    //   status: { $in: ['Completed', 'OnProcess', 'Waiting'] },
    //   ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) })
    // });

    const orders = await Order.find({
      order_id: { $in: orderIds },
      status: { $in: ['Completed'] },
      ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) })
    });

    // Create a map for quick order lookup
    const orderMap = new Map();
    orders.forEach(order => {
      orderMap.set(order.order_id, order);
    });

    // Combine payments with their orders
    const validPayments = payments.map(payment => {
      const order = orderMap.get(payment.order_id);
      return {
        ...payment.toObject(),
        order_data: order // Attach order data
      };
    }).filter(payment => payment.order_data); // Only include payments with valid orders

    // Group by payment method secara dinamis
    const paymentMethodSummary = generateDynamicPaymentSummary(validPayments);

    // Group by period (daily/weekly/monthly)
    const periodSummary = generatePeriodSummary(validPayments, groupBy);

    // Final report
    const finalReport = {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        timezone: 'Asia/Jakarta',
        groupBy
      },
      summary: {
        totalRevenue: validPayments.reduce((sum, payment) => sum + payment.amount, 0),
        totalTransactions: validPayments.length,
        totalOrders: [...new Set(validPayments.map(p => p.order_id))].length,
        averageTransaction: validPayments.length > 0 ?
          validPayments.reduce((sum, payment) => sum + payment.amount, 0) / validPayments.length : 0
      },
      paymentMethods: paymentMethodSummary,
      periodBreakdown: periodSummary,
      rawDataCount: validPayments.length
    };

    return res.status(200).json({
      success: true,
      data: finalReport
    });

  } catch (error) {
    console.error('Error generating sales report:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function untuk generate summary payment method yang dinamis
const generateDynamicPaymentSummary = (payments) => {
  const methodMap = new Map();

  payments.forEach(payment => {
    const method = normalizePaymentMethod(payment);
    const key = method.category;

    if (!methodMap.has(key)) {
      methodMap.set(key, {
        category: method.category,
        method: method.method,
        displayName: method.displayName,
        totalAmount: 0,
        totalTransactions: 0,
        orders: new Set(),
        details: []
      });
    }

    const existing = methodMap.get(key);
    existing.totalAmount += payment.amount;
    existing.totalTransactions += 1;
    existing.orders.add(payment.order_id);

    // Tambahkan detail untuk method tertentu
    if (method.details) {
      existing.details.push({
        order_id: payment.order_id,
        amount: payment.amount,
        ...method.details
      });
    }
  });

  // Convert to array dan process details
  const result = Array.from(methodMap.values()).map(item => ({
    ...item,
    totalOrders: item.orders.size,
    orders: Array.from(item.orders),
    // Untuk QRIS, group by issuer/acquirer
    ...(item.category === 'qris' && {
      issuerBreakdown: generateQRISBreakdown(item.details)
    }),
    // Untuk bank transfer, group by bank
    ...(item.category === 'bank_transfer' && {
      bankBreakdown: generateBankBreakdown(item.details)
    })
  }));

  return result.sort((a, b) => b.totalAmount - a.totalAmount);
};

// Generate summary berdasarkan periode
const generatePeriodSummary = (payments, groupBy) => {
  const periodMap = new Map();

  payments.forEach(payment => {
    const periodKey = getPeriodKey(payment.createdAt, groupBy);

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        period: periodKey,
        totalAmount: 0,
        totalTransactions: 0,
        orders: new Set(),
        paymentMethods: new Map()
      });
    }

    const periodData = periodMap.get(periodKey);
    periodData.totalAmount += payment.amount;
    periodData.totalTransactions += 1;
    periodData.orders.add(payment.order_id);

    // Group by payment method dalam periode
    const method = normalizePaymentMethod(payment);
    const methodKey = method.category;

    if (!periodData.paymentMethods.has(methodKey)) {
      periodData.paymentMethods.set(methodKey, {
        category: method.category,
        displayName: method.displayName,
        totalAmount: 0,
        count: 0
      });
    }

    const methodData = periodData.paymentMethods.get(methodKey);
    methodData.totalAmount += payment.amount;
    methodData.count += 1;
  });

  // Convert to array
  return Array.from(periodMap.values()).map(period => ({
    ...period,
    totalOrders: period.orders.size,
    paymentMethods: Array.from(period.paymentMethods.values()),
    date: period.period
  })).sort((a, b) => a.date.localeCompare(b.date));
};

// Controller untuk mendapatkan detail transaksi - FIXED
export const getPaymentDetails = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      outletId,
      paymentMethod,
      limit = 50,
      page = 1
    } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const skip = (page - 1) * limit;

    // Build match stage
    const matchStage = {
      createdAt: { $gte: start, $lte: end },
      status: { $in: ['settlement', 'paid', 'capture'] }
    };

    if (paymentMethod && paymentMethod !== 'all') {
      matchStage.method = new RegExp(paymentMethod, 'i');
    }

    const payments = await Payment.find(matchStage)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get order_ids from payments
    const orderIds = payments.map(p => p.order_id).filter(id => id);

    // Find orders separately
    const orderMatch = outletId ? {
      order_id: { $in: orderIds },
      outlet: new mongoose.Types.ObjectId(outletId)
    } : { order_id: { $in: orderIds } };

    const orders = await Order.find(orderMatch)
      .select('order_id user tableNumber orderType grandTotal outletName')
      .lean();

    // Create order map
    const orderMap = new Map();
    orders.forEach(order => {
      orderMap.set(order.order_id, order);
    });

    // Combine payments with order data
    const validPayments = payments.map(payment => {
      const order = orderMap.get(payment.order_id);
      return {
        ...payment,
        order_data: order
      };
    }).filter(payment => payment.order_data);

    // Transform data untuk response
    const transformedPayments = validPayments.map(payment => ({
      id: payment._id,
      order_id: payment.order_id,
      transaction_id: payment.transaction_id,
      method: payment.method,
      paymentType: payment.paymentType,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.createdAt,
      orderDetails: {
        user: payment.order_data?.user,
        tableNumber: payment.order_data?.tableNumber,
        orderType: payment.order_data?.orderType,
        grandTotal: payment.order_data?.grandTotal,
        outletName: payment.order_data?.outletName
      },
      paymentDetails: getPaymentSpecificDetails(payment)
    }));

    const total = await Payment.countDocuments(matchStage);

    return res.status(200).json({
      success: true,
      data: {
        payments: transformedPayments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting payment details:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Normalize payment method berdasarkan data yang ada
const normalizePaymentMethod = (payment) => {
  const method = payment.method?.toLowerCase() || 'unknown';

  // Cek berdasarkan berbagai kemungkinan field
  switch (method) {
    case 'cash':
      return {
        category: 'cash',
        method: 'cash',
        displayName: 'Cash'
      };

    case 'debit':
    case 'credit_card':
    case 'card':
      return {
        category: 'card',
        method: method,
        displayName: method === 'debit' ? 'Debit Card' : 'Credit Card'
      };

    case 'qris':
      const issuer = payment.raw_response?.issuer || 'Unknown';
      const acquirer = payment.raw_response?.acquirer || 'Unknown';
      return {
        category: 'qris',
        method: 'qris',
        displayName: 'QRIS',
        details: {
          issuer,
          acquirer,
          paymentType: payment.raw_response?.payment_type || 'qris'
        }
      };

    case 'bank_transfer':
    case 'transfer':
      const bank = detectBankFromPayment(payment);
      return {
        category: 'bank_transfer',
        method: 'bank_transfer',
        displayName: 'Bank Transfer',
        details: {
          bank,
          vaNumber: getVANumber(payment)
        }
      };

    case 'gopay':
      return {
        category: 'ewallet',
        method: 'gopay',
        displayName: 'GoPay'
      };

    case 'shopeepay':
      return {
        category: 'ewallet',
        method: 'shopeepay',
        displayName: 'ShopeePay'
      };

    case 'ovo':
    case 'dana':
    case 'linkaja':
      return {
        category: 'ewallet',
        method: method,
        displayName: method.toUpperCase()
      };

    default:
      // Coba deteksi dari field lain
      if (payment.va_numbers && payment.va_numbers.length > 0) {
        const bank = payment.va_numbers[0].bank;
        return {
          category: 'bank_transfer',
          method: 'bank_transfer',
          displayName: `Bank Transfer (${bank})`,
          details: {
            bank: bank,
            vaNumber: payment.va_numbers[0].va_number
          }
        };
      }

      if (payment.permata_va_number) {
        return {
          category: 'bank_transfer',
          method: 'bank_transfer',
          displayName: 'Bank Transfer (Permata)',
          details: {
            bank: 'permata',
            vaNumber: payment.permata_va_number
          }
        };
      }

      return {
        category: 'other',
        method: method,
        displayName: method.charAt(0).toUpperCase() + method.slice(1)
      };
  }
};

// Deteksi bank dari payment data
const detectBankFromPayment = (payment) => {
  // Cek dari va_numbers
  if (payment.va_numbers && payment.va_numbers.length > 0) {
    return payment.va_numbers[0].bank;
  }

  // Cek dari permata_va_number
  if (payment.permata_va_number) {
    return 'permata';
  }

  // Cek dari biller_code (untuk BSI, Mandiri Bill, dll)
  if (payment.biller_code) {
    const billerMap = {
      '70012': 'bsi',
      '88888': 'mandiri'
    };
    return billerMap[payment.biller_code] || payment.biller_code;
  }

  // Cek dari raw_response
  if (payment.raw_response?.bank) {
    return payment.raw_response.bank;
  }

  return 'unknown';
};

// Get VA number dari berbagai kemungkinan field
const getVANumber = (payment) => {
  if (payment.va_numbers && payment.va_numbers.length > 0) {
    return payment.va_numbers[0].va_number;
  }
  if (payment.permata_va_number) {
    return payment.permata_va_number;
  }
  if (payment.bill_key) {
    return payment.bill_key;
  }
  return null;
};

// Generate breakdown untuk QRIS
const generateQRISBreakdown = (details) => {
  const issuerMap = new Map();
  const acquirerMap = new Map();

  details.forEach(detail => {
    // By Issuer
    const issuer = detail.issuer || 'Unknown';
    if (!issuerMap.has(issuer)) {
      issuerMap.set(issuer, { issuer, totalAmount: 0, count: 0 });
    }
    issuerMap.get(issuer).totalAmount += detail.amount;
    issuerMap.get(issuer).count += 1;

    // By Acquirer
    const acquirer = detail.acquirer || 'Unknown';
    if (!acquirerMap.has(acquirer)) {
      acquirerMap.set(acquirer, { acquirer, totalAmount: 0, count: 0 });
    }
    acquirerMap.get(acquirer).totalAmount += detail.amount;
    acquirerMap.get(acquirer).count += 1;
  });

  return {
    byIssuer: Array.from(issuerMap.values()).sort((a, b) => b.totalAmount - a.totalAmount),
    byAcquirer: Array.from(acquirerMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)
  };
};

// Generate breakdown untuk bank transfer
const generateBankBreakdown = (details) => {
  const bankMap = new Map();

  details.forEach(detail => {
    const bank = detail.bank || 'unknown';
    if (!bankMap.has(bank)) {
      bankMap.set(bank, {
        bank,
        displayName: getBankDisplayName(bank),
        totalAmount: 0,
        count: 0
      });
    }
    bankMap.get(bank).totalAmount += detail.amount;
    bankMap.get(bank).count += 1;
  });

  return Array.from(bankMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
};

// Get display name untuk bank
const getBankDisplayName = (bankCode) => {
  const bankNames = {
    'bca': 'BCA',
    'mandiri': 'Mandiri',
    'bni': 'BNI',
    'bri': 'BRI',
    'bsi': 'BSI',
    'cimb': 'CIMB',
    'permata': 'Permata',
    'danamon': 'Danamon',
    'maybank': 'Maybank',
    'ocbc': 'OCBC'
  };

  return bankNames[bankCode] || bankCode.toUpperCase();
};


// Get period key berdasarkan grouping
const getPeriodKey = (date, groupBy) => {
  const d = new Date(date);

  switch (groupBy) {
    case 'daily':
      return d.toISOString().split('T')[0]; // YYYY-MM-DD

    case 'weekly':
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return weekStart.toISOString().split('T')[0];

    case 'monthly':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    default:
      return d.toISOString().split('T')[0];
  }
};


// Get payment-specific details berdasarkan method
const getPaymentSpecificDetails = (payment) => {
  const details = {
    method: payment.method,
    rawMethod: payment.method
  };

  switch (payment.method?.toLowerCase()) {
    case 'qris':
      details.issuer = payment.raw_response?.issuer;
      details.acquirer = payment.raw_response?.acquirer;
      details.paymentType = payment.raw_response?.payment_type;
      break;

    case 'bank_transfer':
      details.bank = payment.va_numbers?.[0]?.bank ||
        (payment.permata_va_number ? 'permata' : 'unknown');
      details.vaNumber = payment.va_numbers?.[0]?.va_number || payment.permata_va_number;
      break;

    case 'gopay':
    case 'shopeepay':
    case 'ovo':
    case 'dana':
      details.ewalletType = payment.method;
      break;

    case 'cash':
      details.tendered = payment.tendered_amount;
      details.change = payment.change_amount;
      break;
  }

  return details;
};

// Controller untuk mendapatkan available payment methods
export const getAvailablePaymentMethods = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {
      status: { $in: ['settlement', 'paid', 'capture'] }
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.createdAt = { $gte: start, $lte: end };
    }

    const methods = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: methods.map(method => ({
        method: method._id,
        displayName: method._id ? method._id.charAt(0).toUpperCase() + method._id.slice(1) : 'Unknown',
        count: method.count,
        totalAmount: method.totalAmount
      }))
    });

  } catch (error) {
    console.error('Error getting available methods:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};