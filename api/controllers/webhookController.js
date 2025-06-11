import { io } from '../index.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';
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

    console.log('Received Midtrans notification:', {
      order_id,
      transaction_status,
      payment_type
    });

    // Simpan/update data pembayaran
    const paymentData = {
      order_id,
      method: payment_type || 'unknown',
      status: transaction_status,
      amount: Number(gross_amount),
      bank: bank || (va_numbers?.[0]?.bank) || '',
      phone: ewallet?.phone || '',
      paidAt: ['settlement', 'capture'].includes(transaction_status) ? new Date() : null
    };

    await Payment.findOneAndUpdate({ order_id }, paymentData, { upsert: true, new: true });

    // Cari order
    const order = await Order.byId({ order_id });
    if (!order) {
      console.warn(`Order ${order_id} tidak ditemukan di DB`);
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      order.status = 'Completed';
      await order.save();

      // Masukkan ke antrian untuk diproses (print, kitchen, dll)
      await orderQueue.add('create-order', order.toObject());

      // Emit ke customer yang menunggu pembayaran
      io.to(`order_${order_id}`).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status,
        message: 'Payment successful! Your order is being processed.'
      });

      // Emit ke aplikasi kasir untuk menampilkan order baru
      io.to('cashier_room').emit('new_order', {
        order_id,
        order: order.toObject(),
        transaction_status,
        timestamp: new Date().toISOString(),
        message: 'New paid order received!'
      });

      console.log(`Order ${order_id} payment completed - notified customer and cashier`);

    } else if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
      order.status = 'Canceled';
      await order.save();

      // Notifikasi customer bahwa pembayaran gagal
      io.to(`order_${order_id}`).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status,
        message: 'Payment failed or expired. Please try again.'
      });

      console.log(`Order ${order_id} payment failed: ${transaction_status}`);

    } else {
      io.to(`order_${order_id}`).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status,
        message: `Payment status: ${transaction_status}`
      });
    }

    // Log untuk debugging
    console.log(`Order ${order_id} status changed from ${previousStatus} to ${order.status}`);

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Failed to handle webhook', error: error.message });
  }
};