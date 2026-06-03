import express from 'express';
import Reservation from '../models/Reservation.model.js';
import Payment from '../models/Payment.model.js';
import mongoose from 'mongoose';

const router = express.Router();

router.post('/midtrans-reservation-webhook', async (req, res) => {
  const { order_id, transaction_status, fraud_status } = req.body;

  try {
    const reservation = await Reservation.findOne({ _id: order_id }).exec();
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    // Update status pembayaran
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      reservation.paymentStatus = 'paid';
      reservation.status = 'confirmed';
      reservation.isDownPaymentPaid = true;
      reservation.remainingBalance = 0;
      await reservation.save();
    }

    // Simpan detail pembayaran
    const payment = new Payment({
      orderId: reservation._id,
      transactionId: order_id,
      amount: reservation.totalPrice,
      method: 'Midtrans',
      status: transaction_status,
      fraudStatus: fraud_status
    });

    await payment.save();

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  }
});