import { reservationPaymentQueue } from '../queues/reservationPaymentQueue.js';
import { snap, coreApi } from '../utils/MidtransConfig.js';
import Reservation from '../models/Reservation.model.js';

export const startReservationPayment = async (req, res) => {
  try {
    const { reservationId, paymentType, paymentMethod } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ message: 'Invalid reservation ID' });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    let amount = reservation.totalPrice;
    if (paymentType === 'partial') {
      amount = reservation.downPayment;
    }

    // Enqueue ke queue untuk diproses
    const jobId = await reservationPaymentQueue.add({
      reservationId,
      paymentType,
      paymentMethod,
      amount,
      userId: reservation.user
    });

    // Buat parameter pembayaran
    const transactionData = {
      transaction_details: {
        order_id: reservation._id.toString(),
        gross_amount: amount
      },
      customer_details: {
        first_name: reservation.user?.name || 'Guest'
      }
    };

    // Jika metode pembayaran via Snap
    if (paymentMethod === 'snap') {
      const snapToken = await snap.createTransaction(transactionData);
      res.json({
        status: 'queued',
        jobId: jobId.id,
        snapToken: snapToken.redirect_url
      });
    } else {
      // Untuk metode lain seperti QRIS / EDC
      const chargeResponse = await coreApi.charge({
        ...transactionData,
        payment_type: paymentMethod
      });
      res.json({
        status: 'queued',
        jobId: jobId.id,
        transaction: chargeResponse
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};