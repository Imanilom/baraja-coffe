import Reservation from '../models/Reservation.model.js';
import Payment from '../models/Payment.model.js';
import mongoose from 'mongoose';

reservationPaymentQueue.process(async (job) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservationId, paymentType, paymentMethod, amount } = job.data;

    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) throw new Error('Reservation not found');

    // Simpan pembayaran
    const payment = new Payment({
      orderId: reservation._id,
      method: paymentMethod,
      amount,
      status: 'Completed',
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    });

    await payment.save({ session });

    // Update status reservasi
    if (paymentType === 'full') {
      reservation.paymentStatus = 'paid';
      reservation.isDownPaymentPaid = true;
      reservation.remainingBalance = 0;
      reservation.status = 'confirmed';
    } else if (paymentType === 'partial') {
      reservation.paymentStatus = 'dp_paid';
      reservation.isDownPaymentPaid = true;
      reservation.status = 'confirmed';
    }

    await reservation.save({ session });
    await session.commitTransaction();

    return {
      success: true,
      payment,
      reservation
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
});