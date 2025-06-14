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

    console.log('📥 Received Midtrans notification:', notificationJson);

    // Simpan atau update data pembayaran
    const paymentData = {
      order_id,
      method: payment_type || 'unknown',
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

    // ✅ Cari order berdasarkan field order_id, bukan _id
    const order = await Order.findOne({ order_id });

    if (!order) {
      console.warn(`⚠️ Order dengan order_id ${order_id} tidak ditemukan di database`);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Handle status pembayaran
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      order.status = 'OnProcess';
      await order.save();

      // ✅ Masukkan ke antrian BullMQ dengan job type yang benar: create_order
      await orderQueue.add('create_order', order.toObject(), {
        jobId: order._id.toString(), // Hindari duplikasi
      });

      io.to(order._id.toString()).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status
      });

      console.log(`✅ Order ${order._id} updated to 'OnProcess' and queued`);

    } else if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
      order.status = 'Canceled';
      await order.save();

      io.to(order._id.toString()).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status
      });

      console.log(`❌ Order ${order._id} marked as Canceled`);

    } else {
      // Status lain seperti pending
      io.to(order._id.toString()).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status
      });

      console.log(`ℹ️ Order ${order._id} status updated: ${transaction_status}`);
    }

    // Opsional: Emit global untuk admin panel, dashboard, dll
    io.emit('payment_status_update', {
      order_id,
      transaction_status,
      status: order.status
    });

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ message: 'Failed to handle webhook', error: error.message });
  }
};
