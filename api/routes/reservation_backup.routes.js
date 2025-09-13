import express from 'express';
import {
  createReservation,
  cancelReservation
} from '../controllers/reservation.controller.js';

const router = express.Router();

router.post('/', createReservation);
router.put('/:id/cancel', cancelReservation);

export default router;