import mongoose from 'mongoose';
import Payment from '../models/Payment.model.js';
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


export const charge = async (req, res) => {
  try {
    const { payment_type, is_down_payment, down_payment_amount, remaining_payment } = req.body;

    console.log('Received payment type:', payment_type);

    if (payment_type === 'cash') {
      // Handle cash payment
      const { order_id, gross_amount } = req.body;
      console.log('Payment type:', payment_type, 'Order ID:', order_id, 'Gross Amount:', gross_amount);

      // Check if payment already exists for this order
      const existingPayment = await Payment.findOne({ order_id: order_id });
      if (existingPayment) {
        console.log('Payment already exists for order:', order_id);

        // Generate QR code data for existing payment
        const qrData = {
          payment_id: existingPayment._id.toString(),
        };

        const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

        return res.status(200).json({
          order_id: existingPayment.order_id,
          transaction_id: existingPayment.transaction_id || existingPayment._id.toString(),
          method: existingPayment.method,
          status: existingPayment.status,
          paymentType: existingPayment.paymentType,
          amount: existingPayment.amount,
          remainingAmount: existingPayment.remainingAmount,
          discount: 0,
          fraud_status: "accept",
          transaction_time: existingPayment.transaction_time || existingPayment.createdAt,
          expiry_time: existingPayment.expiry_time || null,
          settlement_time: existingPayment.settlement_time || null,
          va_numbers: existingPayment.va_numbers || [],
          permata_va_number: existingPayment.permata_va_number || null,
          bill_key: existingPayment.bill_key || null,
          biller_code: existingPayment.biller_code || null,
          pdf_url: existingPayment.pdf_url || null,
          currency: existingPayment.currency || "IDR",
          merchant_id: existingPayment.merchant_id || "G711879663",
          signature_key: existingPayment.signature_key || null,
          actions: [
            {
              name: "generate-qr-code",
              method: "GET",
              url: qrCodeBase64,
            }
          ],
          raw_response: existingPayment.raw_response || {
            status_code: "201",
            status_message: "Cash transaction is created",
            transaction_id: existingPayment.transaction_id || existingPayment._id.toString(),
            order_id: existingPayment.order_id,
            merchant_id: "G711879663",
            gross_amount: existingPayment.amount.toString() + ".00",
            currency: "IDR",
            payment_type: "cash",
            transaction_time: existingPayment.transaction_time || existingPayment.createdAt,
            transaction_status: existingPayment.status,
            fraud_status: "accept",
            actions: [
              {
                name: "generate-qr-code",
                method: "GET",
                url: qrCodeBase64,
              }
            ],
            acquirer: "cash",
            qr_string: JSON.stringify(qrData),
            expiry_time: existingPayment.expiry_time || null
          },
          createdAt: existingPayment.createdAt,
          updatedAt: existingPayment.updatedAt,
          __v: 0
        });
      }

      // Log reservation payment details if present
      if (is_down_payment !== undefined) {
        console.log('Is Down Payment:', is_down_payment);
        console.log('Down Payment Amount:', down_payment_amount);
        console.log('Remaining Payment:', remaining_payment);
      }

      // Determine payment type and amounts based on reservation payment
      let paymentType = 'Full';
      let amount = gross_amount;
      let remainingAmount = 0;

      if (is_down_payment === true) {
        paymentType = 'Down Payment';
        amount = down_payment_amount || gross_amount;
        remainingAmount = remaining_payment || 0;
      }

      // Generate transaction_id with UUID-like format
      const generateTransactionId = () => {
        const chars = '0123456789abcdef';
        const sections = [8, 4, 4, 4, 12];
        return sections.map(len =>
          Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        ).join('-');
      };

      const transactionId = generateTransactionId();
      const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

      // ✅ PERBAIKAN 1: Buat payment object dengan actions dan raw_response dari awal
      const payment = new Payment({
        transaction_id: transactionId,
        order_id: order_id,
        amount: amount,
        method: payment_type,
        status: 'pending',
        fraud_status: 'accept',
        transaction_time: currentTime,
        expiry_time: expiryTime,
        settlement_time: null,
        va_numbers: [],
        permata_va_number: null,
        bill_key: null,
        biller_code: null,
        pdf_url: null,
        currency: 'IDR',
        merchant_id: 'G711879663',
        signature_key: null,
        paymentType: paymentType,
        remainingAmount: remainingAmount,
        is_down_payment: is_down_payment || false,
        actions: [], // Initialize sebagai array kosong
        raw_response: {} // Initialize sebagai object kosong
      });

      // ✅ PERBAIKAN 2: Simpan payment dulu untuk mendapatkan _id
      const savedPayment = await payment.save();
      console.log('Payment saved with ID:', savedPayment._id);

      // ✅ PERBAIKAN 3: Generate QR code menggunakan savedPayment._id
      const qrData = {
        payment_id: savedPayment._id.toString(),
      };

      const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

      // Create actions array with QR code
      const actions = [
        {
          name: "generate-qr-code",
          method: "GET",
          url: qrCodeBase64,
        }
      ];

      // Create raw_response object
      const rawResponse = {
        status_code: "201",
        status_message: "Cash transaction is created",
        transaction_id: transactionId,
        order_id: order_id,
        merchant_id: "G711879663",
        gross_amount: amount.toString() + ".00",
        currency: "IDR",
        payment_type: "cash",
        transaction_time: currentTime,
        transaction_status: "pending",
        fraud_status: "accept",
        actions: actions,
        acquirer: "cash",
        qr_string: JSON.stringify(qrData),
        expiry_time: expiryTime
      };

      // ✅ PERBAIKAN 4: Update menggunakan findByIdAndUpdate untuk memastikan tersimpan
      const updatedPayment = await Payment.findByIdAndUpdate(
        savedPayment._id,
        {
          $set: {
            actions: actions,
            raw_response: rawResponse
          }
        },
        { new: true } // Return updated document
      );

      console.log('Payment updated with actions and raw_response:', updatedPayment._id);

      // ✅ PERBAIKAN 5: Verify bahwa data benar-benar tersimpan
      const verifyPayment = await Payment.findById(savedPayment._id);
      console.log('Verification - Actions saved:', verifyPayment.actions ? 'YES' : 'NO');
      console.log('Verification - Raw response saved:', verifyPayment.raw_response ? 'YES' : 'NO');

      // Kirim response yang proper untuk cash payment dengan format yang diminta
      return res.status(200).json({
        order_id: order_id,
        transaction_id: transactionId,
        method: payment_type,
        status: 'pending',
        paymentType: paymentType,
        amount: amount,
        remainingAmount: remainingAmount,
        discount: 0,
        fraud_status: 'accept',
        transaction_time: currentTime,
        expiry_time: expiryTime,
        settlement_time: null,
        va_numbers: [],
        permata_va_number: null,
        bill_key: null,
        biller_code: null,
        pdf_url: null,
        currency: 'IDR',
        merchant_id: 'G711879663',
        signature_key: null,
        actions: actions,
        raw_response: rawResponse,
        createdAt: updatedPayment.createdAt,
        updatedAt: updatedPayment.updatedAt,
        __v: 0
      });
    } else {
      // Handle payment lainnya (bank_transfer, gopay, qris, dll)
      const { transaction_details, bank_transfer } = req.body;
      const { order_id, gross_amount } = transaction_details;

      // Check if payment already exists for this order
      const existingPayment = await Payment.findOne({ order_id: order_id });
      if (existingPayment) {
        console.log('Payment already exists for order:', order_id);
        return res.status(200).json({
          success: true,
          message: 'Payment already processed',
          data: existingPayment.raw_response || {
            payment_id: existingPayment._id,
            order_id: order_id,
            amount: existingPayment.amount,
            method: existingPayment.method,
            status: existingPayment.status,
            transaction_id: existingPayment.transaction_id,
            paymentType: existingPayment.paymentType,
            remainingAmount: existingPayment.remainingAmount,
            is_down_payment: existingPayment.is_down_payment || false,
          }
        });
      }

      // Log reservation payment details if present
      if (is_down_payment !== undefined) {
        console.log('Is Down Payment:', is_down_payment);
        console.log('Down Payment Amount:', down_payment_amount);
        console.log('Remaining Payment:', remaining_payment);
      }

      // Validasi input
      if (!order_id || !gross_amount) {
        return res.status(400).json({
          success: false,
          message: 'Order ID and gross amount are required'
        });
      }

      const id_order = await Order.findOne({ order_id: order_id });
      if (!id_order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      // Determine payment type and amounts based on reservation payment
      let paymentType = 'Full';
      let amount = gross_amount;
      let remainingAmount = 0;

      if (is_down_payment === true) {
        paymentType = 'Down Payment';
        amount = down_payment_amount || gross_amount;
        remainingAmount = remaining_payment || 0;
      }

      // Menyiapkan chargeParams dasar
      let chargeParams = {
        "payment_type": payment_type,
        "transaction_details": {
          "gross_amount": parseInt(amount),
          "order_id": order_id,
        },
      };

      // Kondisikan chargeParams berdasarkan payment_type
      if (payment_type === 'bank_transfer') {
        if (!bank_transfer || !bank_transfer.bank) {
          return res.status(400).json({
            success: false,
            message: 'Bank information is required for bank transfer'
          });
        }
        const { bank } = bank_transfer;
        chargeParams['bank_transfer'] = {
          "bank": bank
        };
      } else if (payment_type === 'gopay') {
        chargeParams['gopay'] = {
          // enable_callback: true,
          // callback_url: "https://yourdomain.com/callback"
        };
      } else if (payment_type === 'qris') {
        chargeParams['qris'] = {
          // enable_callback: true,
          // callback_url: "https://yourdomain.com/callback"
        };
      } else if (payment_type === 'shopeepay') {
        chargeParams['shopeepay'] = {};
      } else if (payment_type === 'credit_card') {
        chargeParams['credit_card'] = { secure: true };
      }

      // Lakukan permintaan API untuk memproses pembayaran
      const response = await coreApi.charge(chargeParams);

      console.log('Midtrans response:', response);

      const payment = new Payment({
        transaction_id: response.transaction_id,
        order_id: order_id.toString(),
        amount: parseInt(amount),
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
        is_down_payment: is_down_payment || false,
        raw_response: response
      });

      await payment.save();

      // Enhance response with reservation payment info
      const enhancedResponse = {
        ...response,
        paymentType: paymentType,
        remainingAmount: remainingAmount,
        is_down_payment: is_down_payment || false,
        down_payment_amount: is_down_payment === true ? down_payment_amount : null,
      };

      return res.status(200).json(enhancedResponse);
    }
  } catch (error) {
    console.error('Payment processing error:', error);

    // Enhanced error logging for reservation payments
    if (req.body.is_down_payment !== undefined) {
      console.error('Reservation payment error details:', {
        is_down_payment: req.body.is_down_payment,
        down_payment_amount: req.body.down_payment_amount,
        remaining_payment: req.body.remaining_payment,
      });
    }

    return res.status(500).json({
      success: false,
      message: payment_type === 'cash' ? 'Cash payment failed' : 'Payment failed',
      error: error.message || error
    });
  }
};
