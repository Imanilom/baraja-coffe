import Reservation from '../models/Reservation_backup.model.js';
import { TableLayout } from '../models/TableLayout.model.js';
import { validateOrderData, sanitizeForRedis, createMidtransCoreTransaction, createMidtransSnapTransaction } from '../validators/order.validator.js';
import { orderQueue } from '../queues/order.queue.js';
import { db } from '../utils/mongo.js';
import { Order } from '../models/order.model.js';
import mongoose from 'mongoose';

const MAX_HOURS = 2;
const OVERTIME_RATE = 20000;

function generateOrderId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.getTime().toString().slice(-6);
  return `RESV-${dateStr}-${timeStr}`;
}

export const createReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      user,
      username,
      outlet,
      tableId,
      peopleCount,
      items,
      totalPrice,
      paymentType,
      downPayment,
      paymentMethod,
      source
    } = req.body;

    // Validasi items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one menu item is required' });
    }

    // Validasi tableId
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

    // Mapping items untuk Order
    const orderItems = items.map(item => ({
      menuItem: item.menuItemId, // Harus ObjectId MenuItem
      quantity: item.quantity,
      subtotal: item.subtotal,
      addons: item.addons || [],
      toppings: item.toppings || [],
      notes: item.notes || ''
    }));

    // Buat Order
    const order = new Order({
      order_id: generateOrderId(),
      user_id: user, // Jika user adalah ObjectId User
      user: username, // Bisa diisi sesuai sumber
      cashier: null, // Jika tidak ada cashier, bisa kosong
      items: orderItems,
      status: 'Pending',
      paymentMethod,
      orderType: 'Dine-In', // Karena ada tableId
      tableNumber: tableId ? tableId.toString() : undefined,
      outlet,
      totalBeforeDiscount: totalPrice, // Sesuaikan nanti jika ada diskon
      totalAfterDiscount: totalPrice,
      grandTotal: totalPrice,
      source: source,
      type: 'Indoor'
    });

    await order.save({ session });

    // Buat Reservasi
    const reservation = new Reservation({
      user,
      outlet,
      tableId,
      peopleCount,
      items,
      totalPrice,
      paymentType,
      downPayment,
      paymentMethod,
      orderId: order._id // Opsional: simpan orderId di reservasi
    });

    await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      reservation,
      order
    });
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