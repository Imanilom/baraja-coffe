import express from 'express';
import { chargeTicket, getUserTickets, updateTicketStatus } from '../controllers/ticket.controller.js';

const router = express.Router();

// Endpoint untuk pembelian tiket (sesuai dengan Flutter service)
router.post('/buy', chargeTicket);

// Endpoint untuk mendapatkan tiket user
router.get('/user/:userId', getUserTickets);

// Endpoint untuk update status tiket
router.patch('/:id/status', updateTicketStatus);

export default router;