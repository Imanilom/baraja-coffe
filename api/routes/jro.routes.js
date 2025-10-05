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
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Middleware untuk JRO, Admin, dan SuperAdmin
// const JROAccess = verifyToken(['jro', 'admin', 'superadmin']);

// Dashboard Statistics
router.get('/dashboard-stats', getDashboardStats);

// Reservation Management
router.get('/reservations', getReservations);
router.get('/reservations/:id', getReservationDetail);
router.put('/reservations/:id/confirm', confirmReservation);
router.put('/reservations/:id/complete', completeReservation);
router.put('/reservations/:id/cancel', cancelReservation);
router.put('/reservations/:id/close-open-bill', closeOpenBill);
router.put('/reservations/:id/check-in', checkInReservation);
router.put('/reservations/:id/check-out', checkOutReservation);

// Table Availability
router.get('/tables/availability', getTableAvailability);

export default router;