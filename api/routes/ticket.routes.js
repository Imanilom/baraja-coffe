import express from 'express';
import { buyTicket, getUserTickets, updateTicketStatus } from '../controllers/ticket.controller.js';

const router = express.Router();

router.post('/buy', buyTicket); // beli tiket
router.get('/user/:userId', getUserTickets); // daftar tiket milik user
router.patch('/:id/status', updateTicketStatus); // update status tiket

export default router;
