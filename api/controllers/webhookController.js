import { io } from '../index.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/Order.model.js';
import { orderQueue } from '../queues/order.queue.js';

export const midtransWebhook = async (req, res) => {
  try {
    const notificationJson = req.body;
    const { transaction_status, order_id, payment_type, fraud_status, gross_amount, bank, va_numbers, ewallet } = notificationJson;

    console.log('Received Midtrans notification:', notificationJson);

    // Update or insert Payment
    const paymentData = {
      order_id,
      method: paymentMethod || 'unknown',
      status: transaction_status,
      amount: Number(gross_amount),
      bank: bank || (va_numbers?.[0]?.bank) || '',
      phone: ewallet?.phone || '',
      paidAt: ['settlement', 'capture'].includes(transaction_status) ? new Date() : null
    };

    await Payment.findOneAndUpdate(
      { order_id },
      paymentData,
      { upsert: true, new: true }
    );

    // Ambil order untuk update status
    const order = await Order.findOne({ order_id });
    if (!order) {
      console.warn(`Order ${order_id} tidak ditemukan di DB`);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update status order berdasarkan status pembayaran
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      order.status = 'OnProcess'; // atau 'Completed' sesuai logika bisnis
      await order.save();

      // Masukkan order ke queue untuk proses selanjutnya (misal print, persiapan, dsb)
      await orderQueue.add('process-order', order.toObject());

      // Emit event ke client jika ada
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
      // Bisa handle status lain seperti pending, refund, etc sesuai kebutuhan
      io.to(order_id).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status
      });
    }

    // Emit broadcast fallback
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
