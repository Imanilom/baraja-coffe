import Reservation from '../models/Reservation.model.js';
import { TableLayout } from '../models/TableLayout.model.js';
import mongoose from 'mongoose';

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