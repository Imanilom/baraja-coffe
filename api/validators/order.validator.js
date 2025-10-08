import mongoose from 'mongoose';
import QRCode from 'qrcode';
import Payment from '../models/Payment.model.js';
import { Order } from "../models/order.model.js";
import { snap, coreApi } from '../utils/MidtransConfig.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates and normalizes order data based on source
 * @param {Object} data - order data
 * @param {string} source - 'App' | 'Cashier' | 'Web'
 * @returns {Object} normalized order data
 */
export function validateOrderData(data, source) {

  const { items, outlet, orderType, customerId, loyaltyPointsToRedeem } = data;

  // Basic validations
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid order data');
  }
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }
  if (!data.orderType) {
    throw new Error('Order type is required');
  }

   // Validasi dasar
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Order items cannot be empty');
  }

  if (!outlet) {
    throw new Error('Outlet is required');
  }



  // Normalize orderType
  const formattedOrderType = formatOrderType(data.orderType);

  switch (source) {
    case 'App': {
      if (!data.userId) throw new Error('User ID is required for App orders');
      if (!data.paymentDetails?.method) throw new Error('Payment method is required for App orders');

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
        formattedOrderType
      };
    }

    case 'Cashier': {
      if (!data.cashierId) throw new Error('Cashier ID is required for Cashier orders');
      if (!data.paymentMethod) throw new Error('Payment method is required for Cashier orders');

      return {
        items: data.items,
        user: data.user || null,
        cashierId: data.cashierId,
        paymentMethod: data.paymentMethod,
        orderType: formattedOrderType,
        tableNumber: data.tableNumber || null,
        outlet: data.outlet || null,
        isOpenBill: Boolean(data.isOpenBill)
      };
    }

    case 'Web': {
      if (!data.user) throw new Error('User information is required for Web orders');
      if (!data.paymentMethod) throw new Error('Payment method is required for Web orders');

      return {
        ...data,
        formattedOrderType
      };
    }

    default:
      throw new Error(`Invalid order source: ${source}`);
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
export async function createMidtransSnapTransaction(orderId, amount, customer, paymentMethod) {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    customer_details: {
      first_name: customer.name || 'Customer',
      email: customer.email || 'example@mail.com',
      phone: customer.phone || '081234567890'
    },
    credit_card: {
      secure: true
    },
    // ✅ PERBAIKAN: Konfigurasi untuk menampilkan QR Code
    enabled_payments: getMidtransPaymentMethods(paymentMethod),

    // ✅ TAMBAHAN: Konfigurasi khusus untuk QRIS/GoPay/OVO
    gopay: {
      enable_callback: true,
      callback_url: `${process.env.BASE_URL}/api/payment/callback`
    },

    // ✅ TAMBAHAN: Custom expiry untuk QR Code
    custom_expiry: {
      order_time: new Date().toISOString(),
      expiry_duration: 30, // 30 menit
      unit: "minute"
    },

    // ✅ TAMBAHAN: Callbacks untuk update status
    callbacks: {
      finish: `${process.env.BASE_URL}/payment-success`,
      error: `${process.env.BASE_URL}/payment-error`,
      pending: `${process.env.BASE_URL}/payment-pending`
    }
  };

  try {
    const snapResponse = await snap.createTransaction(parameter);
    console.log('✅ Midtrans SNAP created:', snapResponse);
    return snapResponse; // HARUS mengandung: { token, redirect_url }
  } catch (error) {
    console.error('❌ Midtrans SNAP Error:', error);
    throw new Error('Failed to create Midtrans payment');
  }
}

// ✅ PERBAIKAN: Function untuk mapping payment methods
function getMidtransPaymentMethods(paymentMethod) {
  switch (paymentMethod) {
    case 'qris':
      return [
        'qris', // QRIS universal
        'gopay', // GoPay (termasuk QR)
        'shopeepay' // ShopeePay (termasuk QR)
      ];

    case 'ewallet':
      return [
        'gopay',
        'shopeepay',
        'dana',
        'linkaja',
        'qris'
      ];

  }
}

// ✅ TAMBAHAN: Function untuk handle QRIS khusus
export async function createQRISTransaction(orderId, amount, customer) {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    customer_details: {
      first_name: customer.name || 'Customer',
      email: customer.email || 'example@mail.com',
      phone: customer.phone || '081234567890'
    },

    // ✅ KONFIGURASI KHUSUS QRIS
    enabled_payments: ['qris'],

    // ✅ CUSTOM FIELD untuk QRIS
    custom_field1: "qris_payment",
    custom_field2: orderId,

    // ✅ Callback URLs
    callbacks: {
      finish: `${process.env.BASE_URL}/payment-success?order_id=${orderId}`,
      error: `${process.env.BASE_URL}/payment-error?order_id=${orderId}`,
      pending: `${process.env.BASE_URL}/payment-pending?order_id=${orderId}`
    },

    // ✅ Expiry time untuk QR Code
    custom_expiry: {
      order_time: new Date().toISOString(),
      expiry_duration: 30,
      unit: "minute"
    }
  };

  try {
    const snapResponse = await snap.createTransaction(parameter);

    // ✅ Log untuk debugging
    console.log('✅ QRIS SNAP Response:', {
      token: snapResponse.token,
      redirect_url: snapResponse.redirect_url
    });

    return snapResponse;
  } catch (error) {
    console.error('❌ QRIS SNAP Error:', error);
    throw new Error('Failed to create QRIS payment: ' + error.message);
  }
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
      is_down_payment,
      down_payment_amount,
      remaining_payment,
      transaction_details,
      bank_transfer,
      total_order_amount
    } = req.body;

    const payment_code = generatePaymentCode();
    let order_id, gross_amount;

    // === Ambil order_id & gross_amount sesuai tipe ===
    if (payment_type === 'cash') {
      order_id = req.body.order_id;
      gross_amount = req.body.gross_amount;
    } else {
      order_id = transaction_details?.order_id;
      gross_amount = transaction_details?.gross_amount;
    }

    // === Validasi order ===
    const order = await Order.findOne({ order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // === Cek apakah ada down payment yang masih pending ===
    const existingDownPayment = await Payment.findOne({
      order_id: order_id,
      paymentType: 'Down Payment',
      status: { $in: ['pending', 'expire'] } // belum dibayar
    }).sort({ createdAt: -1 });

    // === PERBAIKAN: Jika ada down payment pending, SELALU update (tidak perlu cek is_down_payment) ===
    if (existingDownPayment) {
      // Tambahkan ke total amount dulu
      const newTotalAmount = existingDownPayment.totalAmount + (total_order_amount || gross_amount);

      // Hitung proporsi amount dan remaining amount (50:50 dari total)
      const newDownPaymentAmount = newTotalAmount / 2;
      const newRemainingAmount = newTotalAmount - newDownPaymentAmount;

      console.log("Updating existing down payment:");
      console.log("Previous total amount:", existingDownPayment.totalAmount);
      console.log("Added total amount:", total_order_amount || gross_amount);
      console.log("New total amount:", newTotalAmount);
      console.log("New down payment amount (50%):", newDownPaymentAmount);
      console.log("New remaining amount (50%):", newRemainingAmount);

      // === Update untuk CASH ===
      if (payment_type === 'cash') {
        const transactionId = generateTransactionId();
        const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

        const qrData = { order_id: order._id.toString() };
        const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

        const actions = [{
          name: "generate-qr-code",
          method: "GET",
          url: qrCodeBase64,
        }];

        const rawResponse = {
          status_code: "200",
          status_message: "Down payment amount updated successfully",
          transaction_id: transactionId,
          payment_code: payment_code,
          order_id: order_id,
          gross_amount: newDownPaymentAmount.toString() + ".00",
          currency: "IDR",
          payment_type: "cash",
          transaction_time: currentTime,
          transaction_status: "pending",
          fraud_status: "accept",
          actions: actions,
          acquirer: "cash",
          qr_string: JSON.stringify(qrData),
          expiry_time: expiryTime,
        };

        // Update existing down payment
        await Payment.updateOne(
          { _id: existingDownPayment._id },
          {
            $set: {
              transaction_id: transactionId,
              payment_code: payment_code,
              amount: newDownPaymentAmount,
              totalAmount: newTotalAmount,
              remainingAmount: newRemainingAmount,
              method: payment_type,
              status: 'pending',
              fraud_status: 'accept',
              transaction_time: currentTime,
              expiry_time: expiryTime,
              actions: actions,
              raw_response: rawResponse,
              updatedAt: new Date()
            }
          }
        );

        const updatedPayment = await Payment.findById(existingDownPayment._id);

        return res.status(200).json({
          ...rawResponse,
          paymentType: 'Down Payment',
          totalAmount: newTotalAmount,
          remainingAmount: newRemainingAmount,
          is_down_payment: true,
          relatedPaymentId: null,
          createdAt: updatedPayment.createdAt,
          updatedAt: updatedPayment.updatedAt,
          isUpdated: true,
          previousAmount: existingDownPayment.amount,
          previousTotalAmount: existingDownPayment.totalAmount,
          addedTotalAmount: total_order_amount || gross_amount,
          newAmount: newDownPaymentAmount,
          newTotalAmount: newTotalAmount,
          message: "Down payment updated with 50:50 split due to additional order items"
        });

      } else {
        // === Update untuk NON-CASH ===
        let chargeParams = {
          payment_type: payment_type,
          transaction_details: {
            gross_amount: parseInt(newDownPaymentAmount),
            order_id: payment_code,
          },
        };

        // Setup payment method specific params
        if (payment_type === 'bank_transfer') {
          if (!bank_transfer?.bank) {
            return res.status(400).json({ success: false, message: 'Bank is required' });
          }
          chargeParams.bank_transfer = { bank: bank_transfer.bank };
        } else if (payment_type === 'gopay') {
          chargeParams.gopay = {};
        } else if (payment_type === 'qris') {
          chargeParams.qris = {};
        } else if (payment_type === 'shopeepay') {
          chargeParams.shopeepay = {};
        } else if (payment_type === 'credit_card') {
          chargeParams.credit_card = { secure: true };
        }

        const response = await coreApi.charge(chargeParams);

        // Update existing down payment
        await Payment.updateOne(
          { _id: existingDownPayment._id },
          {
            $set: {
              transaction_id: response.transaction_id,
              payment_code: payment_code,
              amount: newDownPaymentAmount,
              totalAmount: newTotalAmount,
              remainingAmount: newRemainingAmount,
              method: payment_type,
              status: response.transaction_status || 'pending',
              fraud_status: response.fraud_status,
              transaction_time: response.transaction_time,
              expiry_time: response.expiry_time,
              settlement_time: response.settlement_time || null,
              va_numbers: response.va_numbers || [],
              permata_va_number: response.permata_va_number || null,
              bill_key: response.bill_key || null,
              biller_code: response.biller_code || null,
              pdf_url: response.pdf_url || null,
              currency: response.currency || 'IDR',
              merchant_id: response.merchant_id || null,
              signature_key: response.signature_key || null,
              actions: response.actions || [],
              raw_response: response,
              updatedAt: new Date()
            }
          }
        );

        return res.status(200).json({
          ...response,
          paymentType: 'Down Payment',
          totalAmount: newTotalAmount,
          remainingAmount: newRemainingAmount,
          is_down_payment: true,
          relatedPaymentId: null,
          isUpdated: true,
          previousAmount: existingDownPayment.amount,
          previousTotalAmount: existingDownPayment.totalAmount,
          addedTotalAmount: total_order_amount || gross_amount,
          newAmount: newDownPaymentAmount,
          newTotalAmount: newTotalAmount,
          message: "Down payment updated with 50:50 split due to additional order items"
        });
      }
    }

    // === NEW: Cek apakah ada full payment yang masih pending ===
    const existingFullPayment = await Payment.findOne({
      order_id: order_id,
      paymentType: 'Full',
      status: { $in: ['pending', 'expire'] } // belum dibayar
    }).sort({ createdAt: -1 });

    // === NEW: Jika ada full payment pending, update dengan pesanan baru ===
    if (existingFullPayment) {
      // Hitung total full payment baru
      const additionalAmount = total_order_amount || gross_amount;
      const newFullPaymentAmount = existingFullPayment.amount + additionalAmount;

      console.log("Updating existing full payment:");
      console.log("Previous full payment amount:", existingFullPayment.amount);
      console.log("Added order amount:", additionalAmount);
      console.log("New full payment amount:", newFullPaymentAmount);

      // === Update untuk CASH ===
      if (payment_type === 'cash') {
        const transactionId = generateTransactionId();
        const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

        const qrData = { order_id: order._id.toString() };
        const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

        const actions = [{
          name: "generate-qr-code",
          method: "GET",
          url: qrCodeBase64,
        }];

        const rawResponse = {
          status_code: "200",
          status_message: "Full payment amount updated successfully",
          transaction_id: transactionId,
          payment_code: payment_code,
          order_id: order_id,
          gross_amount: newFullPaymentAmount.toString() + ".00",
          currency: "IDR",
          payment_type: "cash",
          transaction_time: currentTime,
          transaction_status: "pending",
          fraud_status: "accept",
          actions: actions,
          acquirer: "cash",
          qr_string: JSON.stringify(qrData),
          expiry_time: expiryTime,
        };

        // Update existing full payment
        await Payment.updateOne(
          { _id: existingFullPayment._id },
          {
            $set: {
              transaction_id: transactionId,
              payment_code: payment_code,
              amount: newFullPaymentAmount,
              totalAmount: newFullPaymentAmount,
              method: payment_type,
              status: 'pending',
              fraud_status: 'accept',
              transaction_time: currentTime,
              expiry_time: expiryTime,
              actions: actions,
              raw_response: rawResponse,
              updatedAt: new Date()
            }
          }
        );

        const updatedPayment = await Payment.findById(existingFullPayment._id);

        return res.status(200).json({
          ...rawResponse,
          paymentType: 'Full',
          totalAmount: newFullPaymentAmount,
          remainingAmount: 0,
          is_down_payment: false,
          relatedPaymentId: null,
          createdAt: updatedPayment.createdAt,
          updatedAt: updatedPayment.updatedAt,
          isUpdated: true,
          previousAmount: existingFullPayment.amount,
          addedTotalAmount: additionalAmount,
          newAmount: newFullPaymentAmount,
          message: "Full payment updated due to additional order items"
        });

      } else {
        // === Update untuk NON-CASH ===
        let chargeParams = {
          payment_type: payment_type,
          transaction_details: {
            gross_amount: parseInt(newFullPaymentAmount),
            order_id: payment_code,
          },
        };

        // Setup payment method specific params
        if (payment_type === 'bank_transfer') {
          if (!bank_transfer?.bank) {
            return res.status(400).json({ success: false, message: 'Bank is required' });
          }
          chargeParams.bank_transfer = { bank: bank_transfer.bank };
        } else if (payment_type === 'gopay') {
          chargeParams.gopay = {};
        } else if (payment_type === 'qris') {
          chargeParams.qris = {};
        } else if (payment_type === 'shopeepay') {
          chargeParams.shopeepay = {};
        } else if (payment_type === 'credit_card') {
          chargeParams.credit_card = { secure: true };
        }

        const response = await coreApi.charge(chargeParams);

        // Update existing full payment
        await Payment.updateOne(
          { _id: existingFullPayment._id },
          {
            $set: {
              transaction_id: response.transaction_id,
              payment_code: payment_code,
              amount: newFullPaymentAmount,
              totalAmount: newFullPaymentAmount,
              method: payment_type,
              status: response.transaction_status || 'pending',
              fraud_status: response.fraud_status,
              transaction_time: response.transaction_time,
              expiry_time: response.expiry_time,
              settlement_time: response.settlement_time || null,
              va_numbers: response.va_numbers || [],
              permata_va_number: response.permata_va_number || null,
              bill_key: response.bill_key || null,
              biller_code: response.biller_code || null,
              pdf_url: response.pdf_url || null,
              currency: response.currency || 'IDR',
              merchant_id: response.merchant_id || null,
              signature_key: response.signature_key || null,
              actions: response.actions || [],
              raw_response: response,
              updatedAt: new Date()
            }
          }
        );

        return res.status(200).json({
          ...response,
          paymentType: 'Full',
          totalAmount: newFullPaymentAmount,
          remainingAmount: 0,
          is_down_payment: false,
          relatedPaymentId: null,
          isUpdated: true,
          previousAmount: existingFullPayment.amount,
          addedTotalAmount: additionalAmount,
          newAmount: newFullPaymentAmount,
          message: "Full payment updated due to additional order items"
        });
      }
    }

    // === NEW: Cek apakah ada final payment yang masih pending ===
    const existingFinalPayment = await Payment.findOne({
      order_id: order_id,
      paymentType: 'Final Payment',
      status: { $in: ['pending', 'expire'] } // belum dibayar
    }).sort({ createdAt: -1 });

    // === NEW: Jika ada final payment pending, update dengan pesanan baru ===
    if (existingFinalPayment) {
      // Ambil down payment yang sudah settlement untuk kalkulasi
      const settledDownPayment = await Payment.findOne({
        order_id: order_id,
        paymentType: 'Down Payment',
        status: 'settlement'
      });

      if (settledDownPayment) {
        // Hitung total final payment baru
        const additionalAmount = total_order_amount || gross_amount;
        const newFinalPaymentAmount = existingFinalPayment.amount + additionalAmount;

        console.log("Updating existing final payment:");
        console.log("Previous final payment amount:", existingFinalPayment.amount);
        console.log("Added order amount:", additionalAmount);
        console.log("New final payment amount:", newFinalPaymentAmount);

        // === Update untuk CASH ===
        if (payment_type === 'cash') {
          const transactionId = generateTransactionId();
          const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
          const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

          const qrData = { order_id: order._id.toString() };
          const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

          const actions = [{
            name: "generate-qr-code",
            method: "GET",
            url: qrCodeBase64,
          }];

          const rawResponse = {
            status_code: "200",
            status_message: "Final payment amount updated successfully",
            transaction_id: transactionId,
            payment_code: payment_code,
            order_id: order_id,
            gross_amount: newFinalPaymentAmount.toString() + ".00",
            currency: "IDR",
            payment_type: "cash",
            transaction_time: currentTime,
            transaction_status: "pending",
            fraud_status: "accept",
            actions: actions,
            acquirer: "cash",
            qr_string: JSON.stringify(qrData),
            expiry_time: expiryTime,
          };

          // Update existing final payment
          await Payment.updateOne(
            { _id: existingFinalPayment._id },
            {
              $set: {
                transaction_id: transactionId,
                payment_code: payment_code,
                amount: newFinalPaymentAmount,
                totalAmount: newFinalPaymentAmount,
                method: payment_type,
                status: 'pending',
                fraud_status: 'accept',
                transaction_time: currentTime,
                expiry_time: expiryTime,
                actions: actions,
                raw_response: rawResponse,
                updatedAt: new Date()
              }
            }
          );

          const updatedPayment = await Payment.findById(existingFinalPayment._id);

          return res.status(200).json({
            ...rawResponse,
            paymentType: 'Final Payment',
            totalAmount: newFinalPaymentAmount,
            remainingAmount: 0,
            is_down_payment: false,
            relatedPaymentId: settledDownPayment._id,
            createdAt: updatedPayment.createdAt,
            updatedAt: updatedPayment.updatedAt,
            isUpdated: true,
            previousAmount: existingFinalPayment.amount,
            addedTotalAmount: additionalAmount,
            newAmount: newFinalPaymentAmount,
            message: "Final payment updated due to additional order items"
          });

        } else {
          // === Update untuk NON-CASH ===
          let chargeParams = {
            payment_type: payment_type,
            transaction_details: {
              gross_amount: parseInt(newFinalPaymentAmount),
              order_id: payment_code,
            },
          };

          // Setup payment method specific params
          if (payment_type === 'bank_transfer') {
            if (!bank_transfer?.bank) {
              return res.status(400).json({ success: false, message: 'Bank is required' });
            }
            chargeParams.bank_transfer = { bank: bank_transfer.bank };
          } else if (payment_type === 'gopay') {
            chargeParams.gopay = {};
          } else if (payment_type === 'qris') {
            chargeParams.qris = {};
          } else if (payment_type === 'shopeepay') {
            chargeParams.shopeepay = {};
          } else if (payment_type === 'credit_card') {
            chargeParams.credit_card = { secure: true };
          }

          const response = await coreApi.charge(chargeParams);

          // Update existing final payment
          await Payment.updateOne(
            { _id: existingFinalPayment._id },
            {
              $set: {
                transaction_id: response.transaction_id,
                payment_code: response_code,
                amount: newFinalPaymentAmount,
                totalAmount: newFinalPaymentAmount,
                method: payment_type,
                status: response.transaction_status || 'pending',
                fraud_status: response.fraud_status,
                transaction_time: response.transaction_time,
                expiry_time: response.expiry_time,
                settlement_time: response.settlement_time || null,
                va_numbers: response.va_numbers || [],
                permata_va_number: response.permata_va_number || null,
                bill_key: response.bill_key || null,
                biller_code: response.biller_code || null,
                pdf_url: response.pdf_url || null,
                currency: response.currency || 'IDR',
                merchant_id: response.merchant_id || null,
                signature_key: response.signature_key || null,
                actions: response.actions || [],
                raw_response: response,
                updatedAt: new Date()
              }
            }
          );

          return res.status(200).json({
            ...response,
            paymentType: 'Final Payment',
            totalAmount: newFinalPaymentAmount,
            remainingAmount: 0,
            is_down_payment: false,
            relatedPaymentId: settledDownPayment._id,
            isUpdated: true,
            previousAmount: existingFinalPayment.amount,
            addedTotalAmount: additionalAmount,
            newAmount: newFinalPaymentAmount,
            message: "Final payment updated due to additional order items"
          });
        }
      }
    }

    // === Lanjutkan dengan logika create baru HANYA jika tidak ada existing payment pending ===

    // === Cari pembayaran terakhir ===
    const lastPayment = await Payment.findOne({ order_id }).sort({ createdAt: -1 });
    let relatedPaymentId = lastPayment ? lastPayment._id : null;

    // === Tentukan payment type ===
    let paymentType, amount, remainingAmount, totalAmount;

    if (is_down_payment === true) {
      paymentType = 'Down Payment';
      amount = down_payment_amount || gross_amount;
      totalAmount = total_order_amount || gross_amount;
      remainingAmount = totalAmount - amount;
    } else {
      // Cek untuk final payment logic - HANYA yang sudah settlement
      const settledDownPayment = await Payment.findOne({
        order_id: order_id,
        paymentType: 'Down Payment',
        status: 'settlement' // HANYA yang sudah dibayar
      });

      if (settledDownPayment) {
        // Cek apakah ada Final Payment yang sudah settlement juga
        const settledFinalPayment = await Payment.findOne({
          order_id: order_id,
          paymentType: 'Final Payment',
          status: 'settlement'
        });

        if (settledFinalPayment) {
          // Jika DP dan Final Payment sudah settlement, buat payment baru sebagai Full Payment
          paymentType = 'Full';
          amount = gross_amount; // Hanya amount pesanan baru
          totalAmount = gross_amount; // Tidak tambahkan data lama yang sudah settlement
          remainingAmount = 0;

          console.log("Creating new full payment (previous payments already settled):");
          console.log("New order amount:", gross_amount);

          // Tetap reference ke Final Payment terakhir untuk pemetaan
          relatedPaymentId = settledFinalPayment._id;
        } else {
          // Jika hanya DP yang settlement, lanjutkan logic Final Payment seperti biasa
          paymentType = 'Final Payment';
          amount = gross_amount; // Gunakan amount yang dikirim user
          totalAmount = settledDownPayment.amount + gross_amount; // DP amount + final payment amount
          remainingAmount = 0;

          console.log("Creating final payment:");
          console.log("Down payment amount:", settledDownPayment.amount);
          console.log("Final payment amount:", gross_amount);
          console.log("Total amount:", totalAmount);

          // Final payment → selalu link ke DP utama
          relatedPaymentId = settledDownPayment._id;
        }
      } else {
        // Jika tidak ada settled down payment, berarti full payment
        paymentType = 'Full';
        amount = gross_amount;
        totalAmount = gross_amount;
        remainingAmount = 0;
      }
    }

    // === Sisanya sama seperti kode sebelumnya untuk create payment baru ===

    // === CASE 1: CASH ===
    if (payment_type === 'cash') {
      const transactionId = generateTransactionId();
      const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

      const qrData = { order_id: order._id.toString() };
      const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

      const actions = [{
        name: "generate-qr-code",
        method: "GET",
        url: qrCodeBase64,
      }];

      const rawResponse = {
        status_code: "201",
        status_message: `Cash ${paymentType.toLowerCase()} transaction is created`,
        transaction_id: transactionId,
        payment_code: payment_code,
        order_id: order_id,
        gross_amount: amount.toString() + ".00",
        currency: "IDR",
        payment_type: "cash",
        transaction_time: currentTime,
        transaction_status: "pending",
        fraud_status: "accept",
        actions: actions,
        acquirer: "cash",
        qr_string: JSON.stringify(qrData),
        expiry_time: expiryTime,
      };

      const payment = new Payment({
        transaction_id: transactionId,
        order_id: order_id,
        payment_code: payment_code,
        amount: amount,
        totalAmount: totalAmount,
        method: payment_type,
        status: 'pending',
        fraud_status: 'accept',
        transaction_time: currentTime,
        expiry_time: expiryTime,
        settlement_time: null,
        currency: 'IDR',
        merchant_id: 'G055993835',
        paymentType: paymentType,
        remainingAmount: remainingAmount,
        relatedPaymentId: relatedPaymentId,
        actions: actions,
        raw_response: rawResponse
      });

      const savedPayment = await payment.save();

      await Order.updateOne(
        { order_id: order_id },
        { $addToSet: { payment_ids: savedPayment._id } }
      );

      return res.status(200).json({
        ...rawResponse,
        paymentType,
        totalAmount,
        remainingAmount,
        is_down_payment: is_down_payment || false,
        relatedPaymentId,
        createdAt: savedPayment.createdAt,
        updatedAt: savedPayment.updatedAt,
      });
    }

    // === CASE 2: NON-CASH ===
    if (!order_id || !gross_amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and gross amount are required'
      });
    }

    let chargeParams = {
      payment_type: payment_type,
      transaction_details: {
        gross_amount: parseInt(amount),
        order_id: payment_code,
      },
    };

    if (payment_type === 'bank_transfer') {
      if (!bank_transfer?.bank) {
        return res.status(400).json({ success: false, message: 'Bank is required' });
      }
      chargeParams.bank_transfer = { bank: bank_transfer.bank };
    } else if (payment_type === 'gopay') {
      chargeParams.gopay = {};
    } else if (payment_type === 'qris') {
      chargeParams.qris = {};
    } else if (payment_type === 'shopeepay') {
      chargeParams.shopeepay = {};
    } else if (payment_type === 'credit_card') {
      chargeParams.credit_card = { secure: true };
    }

    const response = await coreApi.charge(chargeParams);

    const payment = new Payment({
      transaction_id: response.transaction_id,
      order_id: order_id,
      payment_code: payment_code,
      amount: parseInt(amount),
      totalAmount: totalAmount,
      method: payment_type,
      status: response.transaction_status || 'pending',
      fraud_status: response.fraud_status,
      transaction_time: response.transaction_time,
      expiry_time: response.expiry_time,
      settlement_time: response.settlement_time || null,
      va_numbers: response.va_numbers || [],
      permata_va_number: response.permata_va_number || null,
      bill_key: response.bill_key || null,
      biller_code: response.biller_code || null,
      pdf_url: response.pdf_url || null,
      currency: response.currency || 'IDR',
      merchant_id: response.merchant_id || null,
      signature_key: response.signature_key || null,
      actions: response.actions || [],
      paymentType: paymentType,
      remainingAmount: remainingAmount,
      relatedPaymentId: relatedPaymentId,
      raw_response: response
    });

    const savedPayment = await payment.save();

    await Order.updateOne(
      { order_id: order_id },
      { $addToSet: { payment_ids: savedPayment._id } }
    );

    return res.status(200).json({
      ...response,
      paymentType,
      totalAmount,
      remainingAmount,
      is_down_payment: is_down_payment || false,
      relatedPaymentId,
      down_payment_amount: is_down_payment ? down_payment_amount : null,
    });

  } catch (error) {
    console.error('Payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment failed',
      error: error.message || error
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