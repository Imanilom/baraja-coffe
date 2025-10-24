import express from 'express';
import {
    getDashboardStats,
    getReservations,
    getReservationDetail,
    confirmReservation,
    // completeReservation,
    cancelReservation,
    closeOpenBill,
    getTableAvailability,
    checkInReservation,
    checkOutReservation,
    transferTable,
    createReservation,
    getTableOrderDetail,
    completeTableOrder,
    // Ganti nama method controller ke versi "dine-in"
    checkInDineInOrder,
    checkOutDineInOrder,
    getOrderDetail,
    cancelDineInOrder
} from '../controllers/gro.controller.js';
import { authMiddleware } from '../utils/verifyUser.js';

const router = express.Router();

// Dashboard Statistics
router.get('/dashboard-stats', getDashboardStats);

// Reservation Management
router.get('/reservations', authMiddleware, getReservations);
router.post('/reservations', authMiddleware, createReservation);
router.get('/reservations/:id', authMiddleware, getReservationDetail);
router.put('/reservations/:id/confirm', authMiddleware, confirmReservation);
// router.put('/reservations/:id/complete', authMiddleware, completeReservation);
router.put('/reservations/:id/cancel', authMiddleware, cancelReservation);
router.put('/reservations/:id/close-open-bill', authMiddleware, closeOpenBill);
router.put('/reservations/:id/check-in', authMiddleware, checkInReservation);
router.put('/reservations/:id/check-out', authMiddleware, checkOutReservation);

// Table & Order Management
router.get('/tables/:tableNumber/order', authMiddleware, getTableOrderDetail);
router.put('/orders/:orderId/complete', authMiddleware, completeTableOrder);

// ✅ Dine-in order actions (replaced "walk-in" with "dine-in")
router.put('/orders/:orderId/dine-in/check-in', authMiddleware, checkInDineInOrder);

router.put('/orders/:orderId/cancel', authMiddleware, cancelDineInOrder);

router.put('/orders/:orderId/dine-in/check-out', authMiddleware, checkOutDineInOrder);

// Order detail (used by tracking, GRO, etc.)
router.get('/orders/:orderId', authMiddleware, getOrderDetail);

// Table Availability
router.get('/tables/availability', authMiddleware, getTableAvailability);

// Transfer table (note: seharusnya PUT, bukan GET — diperbaiki di sini)
router.put('/reservations/:id/transfer-table', authMiddleware, transferTable);

export default router;