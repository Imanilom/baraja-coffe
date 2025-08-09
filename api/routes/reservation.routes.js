import express from 'express';
import Joi from 'joi';
import moment from 'moment';
import Reservation from '../models/Reservation.model.js';
import Area from '../models/Area.model.js';
import Table from '../models/Table.model.js'; // TAMBAHKAN IMPORT INI
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Validation schemas
const createReservationSchema = Joi.object({
    customer_name: Joi.string().optional(), // Ubah ke optional
    customer_phone: Joi.string().optional(), // Ubah ke optional  
    customer_email: Joi.string().email().optional(),
    reservation_date: Joi.string().required(),
    reservation_time: Joi.string().required(),
    area_id: Joi.string().required(),   
    guest_count: Joi.number().integer().min(1).required(),
    table_ids: Joi.array().items(Joi.string()).required(), // Tambahkan validasi table_ids
    notes: Joi.string().optional()
});

const WaiterAccess = verifyToken(['waiter', 'admin', 'superadmin']);

// GET /api/reservations/availability - Check availability (FIXED)
router.get('/availability', async (req, res) => {
    try {
        const { date, time, area_id, guest_count, table_ids } = req.query;

        console.log('Checking availability for:', { date, time, area_id, guest_count, table_ids });

        if (!date || !time || !area_id || !guest_count) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: date, time, area_id, guest_count'
            });
        }

        // ✅ KONVERSI tanggal string ke Date object
        const reservationDate = new Date(date);

        // Validasi format tanggal
        if (isNaN(reservationDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD format'
            });
        }

        // Get area information
        const area = await Area.findById(area_id);
        if (!area || !area.is_active) {
            return res.json({
                success: true,
                available: false,
                message: 'Area not available',
                reason: 'area_inactive'
            });
        }

        // Check if guest count exceeds area capacity
        if (parseInt(guest_count) > area.capacity) {
            return res.json({
                success: true,
                available: false,
                message: `Guest count (${guest_count}) exceeds area capacity (${area.capacity})`,
                reason: 'capacity_exceeded'
            });
        }

        // If specific tables are requested, check table availability
        if (table_ids) {
            const requestedTableIds = table_ids.split(',').map(id => id.trim());
            console.log('Requested table IDs:', requestedTableIds);

            // Get table information
            const tables = await Table.find({
                _id: { $in: requestedTableIds },
                area_id: area_id,
                is_active: true
            });

            console.log('Found tables:', tables.length, 'out of', requestedTableIds.length);

            // Check if all requested tables exist and are active
            if (tables.length !== requestedTableIds.length) {
                return res.json({
                    success: true,
                    available: false,
                    message: 'Some requested tables are not available or inactive',
                    reason: 'table_not_found'
                });
            }

            // Calculate total capacity of requested tables
            const totalTableCapacity = tables.reduce((sum, table) => sum + table.seats, 0);

            if (totalTableCapacity < parseInt(guest_count)) {
                return res.json({
                    success: true,
                    available: false,
                    message: `Selected tables capacity (${totalTableCapacity}) is insufficient for ${guest_count} guests`,
                    reason: 'insufficient_table_capacity'
                });
            }

            // ✅ PERBAIKAN: Gunakan Date object untuk query
            const existingReservations = await Reservation.find({
                reservation_date: {
                    $gte: new Date(reservationDate.setHours(0, 0, 0, 0)),
                    $lt: new Date(reservationDate.setHours(23, 59, 59, 999))
                },
                reservation_time: time,
                table_id: { $in: requestedTableIds },
                status: { $in: ['confirmed', 'pending'] }
            });

            console.log('Found existing reservations:', existingReservations.length);
            console.log('Existing reservations details:', existingReservations.map(r => ({
                id: r._id,
                date: r.reservation_date,
                time: r.reservation_time,
                tables: r.table_id,
                status: r.status
            })));

            if (existingReservations.length > 0) {
                // Get conflicting table IDs
                const conflictingTableIds = [];
                existingReservations.forEach(reservation => {
                    reservation.table_id.forEach(tableId => {
                        if (requestedTableIds.includes(tableId.toString()) &&
                            !conflictingTableIds.includes(tableId.toString())) {
                            conflictingTableIds.push(tableId.toString());
                        }
                    });
                });

                // Get conflicting table numbers for user-friendly message
                const conflictingTables = await Table.find({
                    _id: { $in: conflictingTableIds }
                });
                const conflictingTableNumbers = conflictingTables.map(t => t.table_number);

                return res.json({
                    success: true,
                    available: false,
                    message: `Tables ${conflictingTableNumbers.join(', ')} are already reserved for this time slot`,
                    reason: 'tables_already_reserved',
                    conflicting_tables: conflictingTableNumbers
                });
            }

            // All checks passed for specific tables
            return res.json({
                success: true,
                available: true,
                message: 'Selected tables are available',
                data: {
                    area_name: area.area_name,
                    area_code: area.area_code,
                    guest_count: parseInt(guest_count),
                    table_count: tables.length,
                    total_table_capacity: totalTableCapacity,
                    selected_tables: tables.map(t => ({
                        id: t._id,
                        table_number: t.table_number,
                        seats: t.seats
                    }))
                }
            });
        }

        // If no specific tables requested, check general area availability
        // ✅ PERBAIKAN: Gunakan Date object untuk query
        const existingReservations = await Reservation.find({
            reservation_date: {
                $gte: new Date(reservationDate.setHours(0, 0, 0, 0)),
                $lt: new Date(reservationDate.setHours(23, 59, 59, 999))
            },
            reservation_time: time,
            area_id: area_id,
            status: { $in: ['confirmed', 'pending'] }
        });

        const totalReservedGuests = existingReservations.reduce((sum, reservation) => {
            return sum + reservation.guest_count;
        }, 0);

        const availableCapacity = area.capacity - totalReservedGuests;
        const isAvailable = availableCapacity >= parseInt(guest_count);

        res.json({
            success: true,
            available: isAvailable,
            available_capacity: availableCapacity,
            total_capacity: area.capacity,
            message: isAvailable ? 'Area has sufficient capacity' : 'Insufficient capacity in area',
            reason: isAvailable ? 'available' : 'insufficient_capacity',
            data: {
                area_name: area.area_name,
                area_code: area.area_code,
                guest_count: parseInt(guest_count),
                reserved_guests: totalReservedGuests
            }
        });

    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking availability',
            error: error.message
        });
    }
});

// POST /api/reservations - Create new reservation (FIXED)
router.post('/', async (req, res) => {
    try {
        console.log('Creating reservation with data:', req.body);

        const { error, value } = createReservationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
        }

        const { date, time, area_id, guest_count, table_ids, notes } = value;

        // Validate area exists and is active
        const area = await Area.findById(area_id);
        if (!area || !area.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Area not found or inactive'
            });
        }

        // Validate tables exist and are active
        const tables = await Table.find({
            _id: { $in: table_ids },
            area_id: area_id,
            is_active: true
        });

        if (tables.length !== table_ids.length) {
            return res.status(400).json({
                success: false,
                message: 'Some tables not found or inactive'
            });
        }

        // Check total table capacity
        const totalTableCapacity = tables.reduce((sum, table) => sum + table.seats, 0);
        if (totalTableCapacity < guest_count) {
            return res.status(400).json({
                success: false,
                message: `Selected tables capacity (${totalTableCapacity}) insufficient for ${guest_count} guests`
            });
        }

        // Check if tables are available (double-check before creating)
        const conflictingReservations = await Reservation.find({
            reservation_date: date,
            reservation_time: time,
            table_id: { $in: table_ids },
            status: { $in: ['confirmed', 'pending'] }
        });

        if (conflictingReservations.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'One or more selected tables are already reserved for this time slot'
            });
        }

        // Create reservation
        const reservation = new Reservation({
            reservation_date: date,
            reservation_time: time,
            area_id: area_id,
            table_id: table_ids, // Simpan ke table_id (sesuai model)
            guest_count: guest_count,
            notes: notes || '',
            status: 'confirmed'
        });

        await reservation.save();

        // Populate data for response
        const populatedReservation = await Reservation.findById(reservation._id)
            .populate('area_id', 'area_name area_code')
            .populate('table_id', 'table_number seats');

        console.log('Reservation created successfully:', populatedReservation);

        res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            data: {
                id: populatedReservation._id,
                reservation_code: populatedReservation.reservation_code,
                reservation_date: populatedReservation.reservation_date,
                reservation_time: populatedReservation.reservation_time,
                area: {
                    id: populatedReservation.area_id._id,
                    name: populatedReservation.area_id.area_name,
                    code: populatedReservation.area_id.area_code
                },
                tables: populatedReservation.table_id.map(table => ({
                    id: table._id,
                    table_number: table.table_number,
                    seats: table.seats
                })),
                guest_count: populatedReservation.guest_count,
                notes: populatedReservation.notes,
                status: populatedReservation.status,
                created_at: populatedReservation.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating reservation',
            error: error.message
        });
    }
});

// GET /api/reservations/:id - Get reservation details
router.get('/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('area_id')
            .populate('table_id')
            .populate('order_id');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        res.json({
            success: true,
            data: reservation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching reservation',
            error: error.message
        });
    }
});

// PUT /api/reservations/:id - Update reservation
router.put('/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('area_id').populate('table_id');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        res.json({
            success: true,
            message: 'Reservation updated successfully',
            data: reservation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating reservation',
            error: error.message
        });
    }
});

// DELETE /api/reservations/:id - Cancel reservation
router.delete('/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
            { new: true }
        );

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        res.json({
            success: true,
            message: 'Reservation cancelled successfully',
            data: reservation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling reservation',
            error: error.message
        });
    }
});

// GET /api/reservations - Get all reservations with optional filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, area_id, date } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object
    const filter = {};

    if (status) {
      filter.status = { $in: status.split(',') };
    }

    if (area_id) {
      filter.area_id = area_id;
    }

    if (date) {
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD.',
        });
      }
      filter.reservation_date = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      };
    }

    // Fetch total count for pagination
    const total = await Reservation.countDocuments(filter);

    // Fetch reservations with populate
    const reservations = await Reservation.find(filter)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: reservations,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_records: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservations',
      error: error.message,
    });
  }
});

// PUT /api/reservations/:id/check-in - Waiter: Check-in tamu
router.put('/:id/check-in', async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
      });
    }

    // Validasi status
    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot check-in: Reservation is cancelled',
      });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot check-in: Reservation already completed',
      });
    }

    // Jika sudah check-in, jangan izinkan lagi
    if (reservation.check_in_time) {
      return res.status(400).json({
        success: false,
        message: 'Guest already checked in',
      });
    }

    // Lakukan check-in
    reservation.status = 'confirmed';
    reservation.check_in_time = new Date();

    await reservation.save();

    // Populate data sebelum kirim
    const populated = await Reservation.findById(reservation._id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats');

    res.json({
      success: true,
      message: 'Guest checked in successfully',
      data: {
        id: populated._id,
        status: populated.status,
        check_in_time: populated.check_in_time,
        reservation_code: populated.reservation_code,
        area: {
          name: populated.area_id.area_name,
          code: populated.area_id.area_code,
        },
        tables: populated.table_id.map(t => ({
          number: t.table_number,
          seats: t.seats,
        })),
      },
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Error during check-in',
      error: error.message,
    });
  }
});

// PUT /api/reservations/:id/check-out - Waiter: Check-out tamu
router.put('/:id/check-out', async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
      });
    }

    // Harus sudah check-in
    if (!reservation.check_in_time) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check-out: Guest has not checked in yet',
      });
    }

    // Cegah double check-out
    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Reservation already completed',
      });
    }

    // Lakukan check-out
    reservation.status = 'completed';
    reservation.check_out_time = new Date();

    await reservation.save();

    // Populate data
    const populated = await Reservation.findById(reservation._id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats');

    res.json({
      success: true,
      message: 'Guest checked out successfully',
      data: {
        id: populated._id,
        status: populated.status,
        check_out_time: populated.check_out_time,
        reservation_code: populated.reservation_code,
        duration_minutes: Math.round(
          (new Date(populated.check_out_time) - new Date(populated.check_in_time)) / 60000
        ),
      },
    });
  } catch (error) {
    console.error('Error during check-out:', error);
    res.status(500).json({
      success: false,
      message: 'Error during check-out',
      error: error.message,
    });
  }
});

export default router;