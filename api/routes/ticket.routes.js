import express from 'express';
import {
    chargeTicket,
    getUserTickets,
    updateTicketStatus,
    // getTicketByCode,
    // validateTicket,
    // getEventTickets,
    refreshTicketStatus,
    cancelTicket,
    getEventAvailability,
    bulkUpdateTickets
} from '../controllers/ticket.controller.js';

const router = express.Router();

// Core ticket purchase endpoint
router.post('/buy', chargeTicket);

// User ticket management
router.get('/user/:userId', getUserTickets);

// Event ticket management (for organizers)
// router.get('/event/:eventId', getEventTickets);
router.get('/event/:eventId/availability', getEventAvailability);

// Ticket operations
router.patch('/:id/status', updateTicketStatus);
router.get('/:id/refresh', refreshTicketStatus);
router.post('/:id/cancel', cancelTicket);
// router.get('/code/:ticketCode', getTicketByCode);
// router.post('/validate/:ticketCode', validateTicket);

// Bulk operations (for organizers)
router.post('/bulk/update', bulkUpdateTickets);

export default router;