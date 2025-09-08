// routes/eventRoutes.js
import { Router } from 'express';
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    addAttendee,
    removeAttendee,
    buyTicket
} from '../controllers/event.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = Router();
const marketingAcceess = verifyToken('marketing', 'admin', 'superadmin');

router.post('/', createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:id/attendees', addAttendee);
router.delete('/:id/attendees', removeAttendee);

router.put('/ticket', buyTicket)

export default router;
