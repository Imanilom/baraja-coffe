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
      return {
        items: data.items,
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
    const { payment_type, transaction_details, bank_transfer } = req.body;
    const { order_id, gross_amount } = transaction_details;
    if (payment_type == 'cash') {
      const transaction_id = uuidv4();
      const transaction_time = new Date();
      const expiry_time = new Date(transaction_time.getTime() + 15 * 60000);
      // const qr_string = ORDER:${order_id}|AMOUNT:${gross_amount}|TXN_ID:${transaction_id};
      const qr_code_url = await QRCode.toDataURL(order_id)
      // Generate QR code string
      const customResponse = {
        status_code: "201",
        status_message: "Cash transaction is created",
        transaction_id,
        order_id,
        merchant_id: "G711879663", // ubah sesuai kebutuhan
        gross_amount: gross_amount.toFixed(2),
        currency: "IDR",
        payment_type: "cash",
        transaction_time: transaction_time.toISOString().replace('T', ' ').slice(0, 19),
        transaction_status: "pending",
        fraud_status: "accept",
        actions: [
          {
            name: "generate-qr-code",
            method: "GET",
            url: qr_code_url
          }
        ],
        acquirer: "manual",
        // qr_string,
        expiry_time: expiry_time.toISOString().replace('T', ' ').slice(0, 19)
      };

      return res.status(200).json(customResponse);
    }

    // Menyiapkan chargeParams dasar
    let chargeParams = {
      "payment_type": payment_type,
      "transaction_details": {
        "gross_amount": gross_amount,
        "order_id": order_id,
      },
    };

    const bankValue = payment_type === 'bank_transfer'
      ? bank_transfer?.bank || null
      : payment_type;


    // Kondisikan chargeParams berdasarkan payment_type
    if (payment_type === 'bank_transfer') {
      const { bank } = bank_transfer;
      chargeParams['bank_transfer'] = {
        "bank": bank
      };
    } else if (payment_type === 'gopay') {
      // Untuk Gopay, tidak perlu menambahkan 'bank_transfer'
      // Anda bisa menambahkan parameter lain jika diperlukan
      chargeParams['gopay'] = {
        // misalnya, menambahkan enable_callback untuk Gopay
        // "enable_callback": true,
        // "callback_url": "https://yourdomain.com/callback"
      };
    } else if (payment_type === 'qris') {
      // Untuk QRIS, juga bisa diatur di sini
      chargeParams['qris'] = {
        // misalnya parameter tambahan untuk QRIS
        // "enable_callback": true,
        // "callback_url": "https://yourdomain.com/callback"
      };
    }


    // Lakukan permintaan API untuk memproses pembayaran
    const response = await coreApi.charge(chargeParams);
    const payment = new Payment({
      transaction_id: response.transaction_id,
      order_id: order_id,
      amount: gross_amount,
      method: payment_type,
      status: 'pending',
      fraud_status: response.fraud_status,
      transaction_time: response.transaction_time,
      expiry_time: response.expiry_time,
      bank: bankValue
    });

    await payment.save();
    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      message: 'Payment failed',
      error: error.message || error
    });
  }
};
