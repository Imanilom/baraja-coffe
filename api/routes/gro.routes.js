import express from 'express';
import {
    getDashboardStats,
    getReservations,
    getReservationDetail,
    confirmReservation,
    completeReservation,
    cancelReservation,
    closeOpenBill,
    getTableAvailability,
    checkInReservation,
    checkOutReservation,
    transferTable,
    createReservation,
    getTableOrderDetail,
    completeTableOrder,
    checkInWalkInOrder,
    checkOutWalkInOrder
} from '../controllers/gro.controller.js';
import { authMiddleware, verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Middleware untuk gro, Admin, dan SuperAdmin
// const groAccess = verifyToken(['gro', 'admin', 'superadmin']);

// Dashboard Statistics
router.get('/dashboard-stats', getDashboardStats);

// Reservation Management
router.get('/reservations', authMiddleware, getReservations);
router.post('/reservations', authMiddleware, createReservation); // ✅ Route baru untuk create reservation
router.get('/reservations/:id', authMiddleware, getReservationDetail);
router.put('/reservations/:id/confirm', authMiddleware, confirmReservation);
router.put('/reservations/:id/complete', authMiddleware, completeReservation);
router.put('/reservations/:id/cancel', authMiddleware, cancelReservation);
router.put('/reservations/:id/close-open-bill', authMiddleware, closeOpenBill);
router.put('/reservations/:id/check-in', authMiddleware, checkInReservation);
router.put('/reservations/:id/check-out', authMiddleware, checkOutReservation);
router.get('/tables/:tableNumber/order', authMiddleware, getTableOrderDetail);
router.put('/orders/:orderId/complete', authMiddleware, completeTableOrder);

// Walk-in order actions
router.put('/orders/:orderId/walk-in/check-in', authMiddleware, checkInWalkInOrder);
router.put('/orders/:orderId/walk-in/check-out', authMiddleware, checkOutWalkInOrder);

// Table Availability
router.get('/tables/availability', authMiddleware, getTableAvailability);
router.get('/reservations/:id/transfer-table', authMiddleware, transferTable);

export default router;