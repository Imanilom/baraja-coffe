import express from 'express';
import reservationController from '../controllers/reservation.controller.js';

const router = express.Router();

// Reservation routes
router.post('/', reservationController.createReservation);
router.post('/with-order', reservationController.createReservationWithOrder);
router.get('/', reservationController.getReservations);
router.get('/availability', reservationController.checkAvailability);
router.get('/:id', reservationController.getReservationById);
router.patch('/:id/status', reservationController.updateReservationStatus);
router.post('/:id/cancel', reservationController.cancelReservation);

export default router;