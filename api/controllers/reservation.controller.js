import Reservation from '../models/Reservation.model.js';
import { TableLayout } from '../models/TableLayout.model.js';
import mongoose from 'mongoose';

const MAX_HOURS = 2;
const OVERTIME_RATE = 20000; 

export const createReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      user,
      outlet,
      tableId,
      peopleCount,
      items,
      totalPrice,
      paymentType,
      downPayment,
      paymentMethod
    } = req.body;

    // Validasi jika ada tableId, maka harus terkait dengan outlet
    if (tableId) {
      const layout = await TableLayout.findOne({ outletId: outlet }).session(session);
      if (!layout) {
        return res.status(404).json({ message: 'Table layout not found for this outlet' });
      }

      let found = false;
      for (const section of layout.sections) {
        const table = section.tables.find(t => t._id.toString() === tableId);
        if (table) {
          if (table.status !== 'available') {
            return res.status(400).json({ message: 'Selected table is not available' });
          }
          table.status = 'reserved';
          found = true;
          break;
        }
      }

      if (!found) {
        return res.status(400).json({ message: 'Table not found in layout' });
      }

      await layout.save({ session });
    }

    // Buat reservasi
    const reservation = new Reservation({
      user,
      outlet,
      tableId,
      peopleCount,
      items,
      totalPrice,
      paymentType,
      downPayment,
      paymentMethod
    });

    await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(reservation);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const cancelReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id).session(session);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.status = 'cancelled';
    await reservation.save({ session });

    if (reservation.tableId) {
      const layout = await TableLayout.findOne({ outlet: reservation.outlet }).session(session);

      for (const section of layout.sections) {
        const table = section.tables.find(t => t._id.toString() === reservation.tableId.toString());
        if (table) {
          table.status = 'available';
          break;
        }
      }

      await layout.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Reservation cancelled and table released' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const payReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservationId, paymentType, paymentMethod, amountPaid } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ message: 'Invalid reservation ID' });
    }

    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot pay for a cancelled reservation' });
    }

    if (paymentType === 'full') {
      reservation.downPayment = amountPaid;
      reservation.isDownPaymentPaid = true;
      reservation.paymentStatus = 'paid';
      reservation.paymentMethod = paymentMethod;
      reservation.status = 'confirmed';
    } else if (paymentType === 'partial') {
      if (amountPaid < reservation.downPayment) {
        return res.status(400).json({ message: 'Amount paid is less than down payment required' });
      }

      reservation.downPayment = amountPaid;
      reservation.isDownPaymentPaid = true;
      reservation.paymentStatus = 'dp_paid';
      reservation.paymentMethod = paymentMethod;
      reservation.status = 'confirmed';
    }

    await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Payment successful', reservation });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const completeReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservationId, checkOutTime } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ message: 'Invalid reservation ID' });
    }

    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed reservations can be completed' });
    }

    const now = new Date();
    const checkoutAt = checkOutTime ? new Date(checkOutTime) : now;

    reservation.checkOutTime = checkoutAt;
    reservation.completedAt = checkoutAt;
    reservation.status = 'completed';

    const timeDiffMs = checkoutAt - reservation.checkInTime;
    const durationHours = Math.floor(timeDiffMs / (1000 * 60 * 60));

    const expectedEnd = new Date(reservation.checkInTime);
    expectedEnd.setHours(expectedEnd.getHours() + MAX_HOURS);
    reservation.expectedCheckOutTime = expectedEnd;

    let overtimeHours = 0;
    if (checkoutAt > expectedEnd) {
      const extraMs = checkoutAt - expectedEnd;
      overtimeHours = Math.ceil(extraMs / (1000 * 60 * 60));
    }

    reservation.extendedHours = overtimeHours;
    reservation.overtimeCharge = overtimeHours * OVERTIME_RATE;

    // Update total harga
    reservation.totalPrice += reservation.overtimeCharge;

    // Jika belum lunas, update remaining balance
    if (reservation.paymentStatus !== 'paid') {
      reservation.remainingBalance += reservation.overtimeCharge;
    }

    await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: 'Reservation completed successfully',
      reservation,
      overtimeCharge: reservation.overtimeCharge,
      newTotalPrice: reservation.totalPrice
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};  