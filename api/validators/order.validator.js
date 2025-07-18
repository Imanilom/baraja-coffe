import mongoose from 'mongoose';
import Payment from '../models/Payment.model.js';
import { snap, coreApi } from '../utils/MidtransConfig.js';

export function validateOrderData(data, source) {
  switch (source) {
    case 'App':
      if (!data.items || !data.userId || !data.paymentDetails || !data.paymentMethod) {
        throw new Error('Field wajib tidak lengkap untuk order mobile');
      }
      return {
        items: data.items,
        userId: data.userId,
        paymentDetails: data.paymentDetails,
        paymentMethod: data.paymentMethod,
        orderType: data.orderType,
        tableNumber: data.tableNumber,
        outlet: data.outlet
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
      if (!data.orders || !data.user || !data.paymentMethod) {
        throw new Error('Field wajib tidak lengkap untuk order web');
      }
      return {
        orders: data.orders,
        user: data.user,
        paymentMethod: data.paymentMethod,
        orderType: data.orderType,
        deliveryAddress: data.deliveryAddress,
        outlet: data.outlet
      };

    default:
      throw new Error('Sumber order tidak valid');
  }
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

    // Deteksi apakah ini cash payment atau payment lainnya
    if (payment_type === 'cash') {
      // Handle cash payment
      const { order_id, gross_amount } = req.body;
      console.log('Payment type:', payment_type, 'Order ID:', order_id, 'Gross Amount:', gross_amount);

      // Check if payment already exists for this order
      const existingPayment = await Payment.findOne({ order_id: order_id });
      if (existingPayment) {
        console.log('Payment already exists for order:', order_id);
        return res.status(200).json({
          success: true,
          message: 'Payment already processed',
          data: {
            payment_id: existingPayment._id,
            order_id: order_id,
            amount: existingPayment.amount,
            method: existingPayment.method,
            status: existingPayment.status,
            transaction_id: existingPayment._id.toString(),
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

      // Determine payment type and amounts based on reservation payment
      let paymentType = 'Full';
      let amount = gross_amount;
      let remainingAmount = 0;

      if (is_down_payment === true) {
        paymentType = 'Down Payment';
        amount = down_payment_amount || gross_amount;
        remainingAmount = remaining_payment || 0;
      }

      const payment = new Payment({
        order_id: order_id,
        amount: amount,
        method: payment_type,
        status: 'pending',
        paymentType: paymentType,
        remainingAmount: remainingAmount,
        is_down_payment: is_down_payment || false,
      });

      await payment.save();

      // Kirim response yang proper untuk cash payment
      return res.status(200).json({
        success: true,
        message: `Cash payment ${paymentType.toLowerCase()} processed successfully`,
        data: {
          payment_id: payment._id,
          order_id: order_id,
          amount: gross_amount,
          method: payment_type,
          status: 'pending',
          transaction_id: payment._id.toString(),
          paymentType: paymentType,
          remainingAmount: remainingAmount,
          is_down_payment: is_down_payment || false,
        }
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
