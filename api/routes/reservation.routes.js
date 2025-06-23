import express from 'express';
import Joi from 'joi';
import moment from 'moment';
import Reservation from '../models/Reservation.model.js';
import Area from '../models/Area.model.js';

const router = express.Router();

// Validation schemas
const createReservationSchema = Joi.object({
    customer_name: Joi.string().required(),
    customer_phone: Joi.string().required(),
    customer_email: Joi.string().email().optional(),
    reservation_date: Joi.string().required(),
    reservation_time: Joi.string().required(),
    area_id: Joi.string().required(),
    guest_count: Joi.number().integer().min(1).required(),
    notes: Joi.string().optional()
});

// GET /api/reservations/availability - Check availability
router.get('/availability', async (req, res) => {
    try {
        const { date, time, area_id, guest_count } = req.query;

        if (!date || !time || !area_id || !guest_count) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters'
            });
        }

        const area = await Area.findById(area_id);
        if (!area || !area.is_active) {
            return res.json({
                success: true,
                available: false,
                message: 'Area not available'
            });
        }

        if (parseInt(guest_count) > area.capacity) {
            return res.json({
                success: true,
                available: false,
                message: 'Guest count exceeds area capacity'
            });
        }

        const existingReservations = await Reservation.find({
            reservation_date: date,
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
            message: isAvailable ? 'Area available' : 'Insufficient capacity'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking availability',
            error: error.message
        });
    }
});

// POST /api/reservations - Create new reservation
router.post('/', async (req, res) => {
    try {
        const { error, value } = createReservationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
        }

        const area = await Area.findById(value.area_id);
        if (!area || !area.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Area not found or inactive'
            });
        }

        const existingReservations = await Reservation.find({
            reservation_date: value.reservation_date,
            reservation_time: value.reservation_time,
            area_id: value.area_id,
            status: { $in: ['confirmed', 'pending'] }
        });

        const totalReservedGuests = existingReservations.reduce((sum, reservation) => {
            return sum + reservation.guest_count;
        }, 0);

        if ((totalReservedGuests + value.guest_count) > area.capacity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient capacity for this reservation'
            });
        }

        const reservation = new Reservation({
            ...value,
            area_code: area.area_code
        });

        await reservation.save();
        await reservation.populate('area_id');

        res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            data: reservation
        });

    } catch (error) {
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
        ).populate('area_id');

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

export default router;
