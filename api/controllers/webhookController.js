import { io } from '../index.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/Order.model.js'; // Fix import
import { orderQueue } from '../queues/order.queue.js';

export const midtransWebhook = async (req, res) => {
  try {
    const notificationJson = req.body;
    const {
      transaction_status,
      order_id,
      payment_type,
      fraud_status,
      gross_amount,
      bank,
      va_numbers,
      ewallet
    } = notificationJson;

    console.log('Received Midtrans notification:', notificationJson);

    // Simpan/update data pembayaran
    const paymentData = {
      order_id,
      method: payment_type || 'unknown', // Fixed
      status: transaction_status,
      amount: Number(gross_amount),
      bank: bank || (va_numbers?.[0]?.bank) || '',
      phone: ewallet?.phone || '',
      paidAt: ['settlement', 'capture'].includes(transaction_status) ? new Date() : null
    };

    await Payment.findOneAndUpdate({ order_id }, paymentData, { upsert: true, new: true });


    // Cari order berdasarkan _id
    const order = await Order.findById(order_id);
    if (!order) {
      console.warn(`Order dengan _id ${id} tidak ditemukan di DB`);
      return res.status(404).json({ message: 'Order not found' });
    }

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      order.status = 'Completed'; // Atau 'OnProcess' sesuai logika
      await order.save();

      // Masukkan ke antrian untuk diproses (print, kitchen, dll)
      await orderQueue.add('create-order', order.toObject());

      io.to(order_id).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status
      });
    } else if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
      order.status = 'Canceled';
      await order.save();

      io.to(order_id).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status
      });
    } else {
      io.to(order_id).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status
      });
    }

    io.emit('payment_status_update', {
      order_id,
      transaction_status,
      status: order.status
    });

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Failed to handle webhook', error: error.message });
  }
};
