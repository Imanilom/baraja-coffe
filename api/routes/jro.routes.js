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
    checkOutReservation
} from '../controllers/jro.controller.js';
import { authMiddleware, verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Middleware untuk JRO, Admin, dan SuperAdmin
// const JROAccess = verifyToken(['jro', 'admin', 'superadmin']);

// Dashboard Statistics
router.get('/dashboard-stats', getDashboardStats);

// Reservation Management
router.get('/reservations', authMiddleware, getReservations);
router.get('/reservations/:id', authMiddleware, getReservationDetail);
router.put('/reservations/:id/confirm', authMiddleware, confirmReservation);
router.put('/reservations/:id/complete', authMiddleware, completeReservation);
router.put('/reservations/:id/cancel', authMiddleware, cancelReservation);
router.put('/reservations/:id/close-open-bill', authMiddleware, closeOpenBill);
router.put('/reservations/:id/check-in', authMiddleware, checkInReservation);
router.put('/reservations/:id/check-out', authMiddleware, checkOutReservation);

// Table Availability
router.get('/tables/availability', authMiddleware, getTableAvailability);

export default router;