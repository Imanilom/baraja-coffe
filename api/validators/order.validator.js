import mongoose from 'mongoose';
import QRCode from 'qrcode';
import Payment from '../models/Payment.model.js';
import { Order } from "../models/order.model.js";
import { snap, coreApi } from '../utils/MidtransConfig.js';

export function validateOrderData(data, source) {
  // Common validation for all sources
  if (!data.items || data.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  if (!data.orderType) {
    throw new Error('Order type is required');
  }

  // Source-specific validation
  switch (source) {
    case 'App':
      if (!data.userId) throw new Error('User ID is required');
      if (!data.paymentDetails?.method) throw new Error('Payment method is required');

      // Order type specific validation
      if (data.orderType === 'dineIn' && !data.tableNumber) {
        throw new Error('Table number is required for dine-in orders');
      }
      if (data.orderType === 'delivery' && !data.deliveryAddress) {
        throw new Error('Delivery address is required for delivery orders');
      }
      if (data.orderType === 'pickup' && !data.pickupTime) {
        throw new Error('Pickup time is required for pickup orders');
      }
      if (data.orderType === 'reservation' && !data.reservationData) {
        throw new Error('Reservation data is required for reservation orders');
      }

      return {
        ...data,
        formattedOrderType: formatOrderType(data.orderType)
      };

    case 'Cashier':
      if (!data.items || !data.cashierId || !data.paymentMethod) {
        throw new Error('Field wajib tidak lengkap untuk order kasir');
      }
      console.log("cek outlet :", data.outlet);
      return {
        items: data.items,
        user: data.user,
        cashierId: data.cashierId,
        paymentMethod: data.paymentMethod,
        orderType: data.orderType,
        tableNumber: data.tableNumber,
        outlet: data.outlet
      };

    case 'Web':
      if (!data.user) throw new Error('User information is required');
      if (!data.paymentMethod) throw new Error('Payment method is required');
      return data;

    default:
      throw new Error('Invalid order source');
  }
}

function formatOrderType(orderType) {
  const types = {
    dineIn: 'Dine-In',
    delivery: 'Delivery',
    pickup: 'Pickup',
    reservation: 'Reservation'
  };
  return types[orderType] || orderType;
}



export function sanitizeForRedis(data) {
  const replacer = (key, value) => {
    if (value instanceof mongoose.Types.ObjectId) {
      return value.toString(); // Convert ObjectId ke string
    }
    if (value instanceof Date) {
      return value.toISOString(); // Convert Date ke string
    }
    if (typeof value === 'bigint') {
      return value.toString(); // Convert bigint ke string
    }
    if (value === undefined) {
      return null; // Hilangkan undefined
    }
    if (typeof value === 'object' && value !== null) {
      // Rekursif untuk nested object
      if (Array.isArray(value)) {
        return value.map(v => replacer(key, v));
      }
      const newObj = {};
      for (const k in value) {
        newObj[k] = replacer(k, value[k]);
      }
      return newObj;
    }
    return value;
  };

  return JSON.parse(JSON.stringify(data, replacer));
}

/**
 * Buat transaksi Midtrans untuk App (Core API)
 */

export async function createMidtransCoreTransaction(orderId, amount, paymentMethod) {
  const payload = {
    payment_type: paymentMethod, // atau sesuaikan dengan metode yg dikirim
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    }
  };

  return await coreApi.charge(payload);
}

/**
 * Buat transaksi Midtrans untuk Web (Snap API)
 */
export async function createMidtransSnapTransaction(orderId, amount, customer) {
  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    customer_details: {
      first_name: customer?.name || 'Customer',
      email: customer?.email || 'unknown@example.com'
    }
  };

  return await snap.createTransaction(payload);
}


// Daftar metode pembayaran yang didukung
const SUPPORTED_PAYMENT_METHODS = [
  'cash', 'bank_transfer', 'gopay', 'qris',
  'shopeepay', 'credit_card'
];

// Helper functions
const generateTransactionId = () => {
  const chars = '0123456789abcdef';
  const sections = [8, 4, 4, 4, 12];
  return sections.map(len =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-');
};

const getCurrentTime = () => new Date().toISOString().replace('T', ' ').substring(0, 19);
const getExpiryTime = (minutes = 15) =>
  new Date(Date.now() + minutes * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

/**
 * Generate QR Code untuk pembayaran cash
 */
async function generatePaymentQR(paymentId) {
  const qrData = { payment_id: paymentId.toString() };
  try {
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
    return {
      qrCode,
      qrString: JSON.stringify(qrData)
    };
  } catch (error) {
    console.error('QR Generation Error:', error);
    throw new Error('Failed to generate payment QR code');
  }
}

/**
 * Membuat raw response object untuk pembayaran cash
 */
function createCashPaymentResponse(payment, qrString) {
  return {
    status_code: "201",
    status_message: "Cash transaction is created",
    transaction_id: payment.transaction_id,
    order_id: payment.order_id,
    merchant_id: "G711879663",
    gross_amount: payment.amount.toString() + ".00",
    currency: "IDR",
    payment_type: "cash",
    transaction_time: payment.transaction_time,
    transaction_status: payment.status,
    fraud_status: "accept",
    actions: payment.actions,
    acquirer: "cash",
    qr_string: qrString,
    expiry_time: payment.expiry_time
  };
}

/**
 * Menangani pembayaran cash
 */
async function handleCashPayment({
  order_id,
  gross_amount,
  is_down_payment = false,
  down_payment_amount = 0,
  remaining_payment = 0
}) {
  // Cek apakah pembayaran sudah ada
  const existingPayment = await Payment.findOne({ order_id });
  if (existingPayment) {
    const { qrCode, qrString } = await generatePaymentQR(existingPayment._id);
    return {
      payment: existingPayment,
      qrCode,
      qrString,
      isExisting: true
    };
  }

  // Tentukan jumlah pembayaran
  let paymentType = 'Full';
  let amount = gross_amount;
  let remainingAmount = 0;

  if (is_down_payment) {
    paymentType = 'Down Payment';
    amount = down_payment_amount || gross_amount;
    remainingAmount = remaining_payment || 0;
  }

  // Buat record pembayaran baru
  const newPayment = new Payment({
    transaction_id: generateTransactionId(),
    order_id,
    amount,
    method: 'cash',
    status: 'pending',
    paymentType,
    remainingAmount,
    is_down_payment,
    transaction_time: getCurrentTime(),
    expiry_time: getExpiryTime(),
    currency: 'IDR',
    merchant_id: 'G711879663'
  });

  const savedPayment = await newPayment.save();
  const { qrCode, qrString } = await generatePaymentQR(savedPayment._id);

  // Update payment dengan QR code info
  savedPayment.actions = [{
    name: "generate-qr-code",
    method: "GET",
    url: qrCode,
  }];
  savedPayment.raw_response = createCashPaymentResponse(savedPayment, qrString);

  await savedPayment.save();
  return { payment: savedPayment, qrCode, qrString, isExisting: false };
}

/**
 * Menangani pembayaran online via Midtrans
 */
async function handleOnlinePayment({
  payment_type,
  order_id,
  gross_amount,
  is_down_payment = false,
  down_payment_amount = 0,
  remaining_payment = 0,
  bank_transfer
}) {
  // Validasi input
  if (!order_id || !gross_amount) {
    throw new Error('Order ID and gross amount are required');
  }

  // Cek apakah order ada
  const order = await Order.findOne({ order_id });
  if (!order) {
    throw new Error('Order not found');
  }

  // Tentukan jumlah pembayaran
  let paymentType = 'Full';
  let amount = gross_amount;
  let remainingAmount = 0;

  if (is_down_payment) {
    paymentType = 'Down Payment';
    amount = down_payment_amount || gross_amount;
    remainingAmount = remaining_payment || 0;
  }

  // Siapkan payload untuk Midtrans
  const chargeParams = {
    payment_type,
    transaction_details: {
      order_id,
      gross_amount: parseInt(amount),
    },
  };

  // Tambahkan parameter khusus berdasarkan metode pembayaran
  if (payment_type === 'bank_transfer') {
    if (!bank_transfer?.bank) {
      throw new Error('Bank information is required for bank transfer');
    }
    chargeParams.bank_transfer = { bank: bank_transfer.bank };
  } else if (payment_type === 'gopay') {
    chargeParams.gopay = { enable_callback: true };
  } else if (payment_type === 'qris') {
    chargeParams.qris = { enable_callback: true };
  }

  // Proses pembayaran via Midtrans
  const midtransResponse = await coreApi.charge(chargeParams);

  // Simpan record pembayaran
  const payment = new Payment({
    transaction_id: midtransResponse.transaction_id,
    order_id: order_id.toString(),
    amount: parseInt(amount),
    method: payment_type,
    status: midtransResponse.transaction_status || 'pending',
    paymentType,
    remainingAmount,
    is_down_payment,
    transaction_time: midtransResponse.transaction_time || getCurrentTime(),
    expiry_time: midtransResponse.expiry_time || getExpiryTime(),
    settlement_time: midtransResponse.settlement_time || null,
    va_numbers: midtransResponse.va_numbers || [],
    permata_va_number: midtransResponse.permata_va_number || null,
    bill_key: midtransResponse.bill_key || null,
    biller_code: midtransResponse.biller_code || null,
    pdf_url: midtransResponse.pdf_url || null,
    currency: midtransResponse.currency || 'IDR',
    merchant_id: midtransResponse.merchant_id || null,
    signature_key: midtransResponse.signature_key || null,
    actions: midtransResponse.actions || [],
    raw_response: midtransResponse
  });

  await payment.save();

  return {
    payment,
    midtransResponse,
    paymentType,
    remainingAmount
  };
}

/**
 * Endpoint utama untuk proses pembayaran
 */
export const charge = async (req, res) => {
  try {
    const {
      payment_type,
      order_id,
      gross_amount,
      is_down_payment,
      down_payment_amount,
      remaining_payment,
      bank_transfer
    } = req.body;

    console.log('Payment request:', {
      payment_type,
      order_id,
      amount: gross_amount,
      is_down_payment,
      down_payment_amount,
      remaining_payment
    });

    // Validasi metode pembayaran
    if (!SUPPORTED_PAYMENT_METHODS.includes(payment_type)) {
      return res.status(400).json({
        success: false,
        message: 'Payment method not supported'
      });
    }

    // Pembayaran cash
    if (payment_type === 'cash') {
      const { payment, qrCode, isExisting } = await handleCashPayment({
        order_id,
        gross_amount,
        is_down_payment,
        down_payment_amount,
        remaining_payment
      });

      return res.status(isExisting ? 200 : 201).json({
        success: true,
        payment_type: 'cash',
        status: payment.status,
        order_id: payment.order_id,
        payment_id: payment._id,
        transaction_id: payment.transaction_id,
        amount: payment.amount,
        payment_type: payment.paymentType,
        remaining_amount: payment.remainingAmount,
        qr_code: qrCode,
        expiry_time: payment.expiry_time,
        actions: payment.actions,
        created_at: payment.createdAt
      });
    }

    // Pembayaran online
    const {
      payment,
      midtransResponse,
      paymentType,
      remainingAmount
    } = await handleOnlinePayment({
      payment_type,
      order_id,
      gross_amount,
      is_down_payment,
      down_payment_amount,
      remaining_payment,
      bank_transfer
    });

    // Format response untuk mobile app
    const response = {
      success: true,
      payment_type,
      status: midtransResponse.transaction_status,
      order_id: payment.order_id,
      payment_id: payment._id,
      transaction_id: payment.transaction_id,
      amount: payment.amount,
      payment_type: paymentType,
      remaining_amount: remainingAmount,
      payment_instructions: midtransResponse,
      actions: payment.actions,
      expiry_time: payment.expiry_time,
      created_at: payment.createdAt
    };

    // Tambahkan field khusus berdasarkan metode pembayaran
    if (payment_type === 'bank_transfer') {
      response.va_number = midtransResponse.va_numbers?.[0]?.va_number ||
        midtransResponse.permata_va_number;
    }

    return res.status(201).json(response);

  } catch (error) {
    console.error('Payment processing error:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    return res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
};

/**
 * Endpoint untuk mengecek status pembayaran
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { payment_id } = req.params;

    const payment = await Payment.findById(payment_id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Jika pembayaran online, cek status terbaru di Midtrans
    if (payment.method !== 'cash') {
      try {
        const status = await coreApi.transaction.status(payment.transaction_id);
        payment.status = status.transaction_status;
        payment.raw_response = status;
        await payment.save();
      } catch (midtransError) {
        console.error('Failed to check Midtrans status:', midtransError);
      }
    }

    // Format response
    const response = {
      success: true,
      payment_id: payment._id,
      order_id: payment.order_id,
      transaction_id: payment.transaction_id,
      method: payment.method,
      status: payment.status,
      amount: payment.amount,
      payment_type: payment.paymentType,
      remaining_amount: payment.remainingAmount,
      is_down_payment: payment.is_down_payment,
      expiry_time: payment.expiry_time,
      settlement_time: payment.settlement_time,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt
    };

    // Tambahkan QR code jika cash payment
    if (payment.method === 'cash') {
      const { qrCode } = await generatePaymentQR(payment._id);
      response.qr_code = qrCode;
      response.actions = payment.actions;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Payment status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
};