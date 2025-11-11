// routes/eventRoutes.js
import express from 'express';
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    registerFreeEvent,
    getEventRegistrations,
    updateEventStatus,
    getMenuItems,
    getEventMenuItems,
    getMenuItemById,
    getAvailableEvents
} from '../controllers/eventController.js';

const router = express.Router();

// Event CRUD Routes
router.post('/', createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

// Event Registration & Management
router.post('/:id/register', registerFreeEvent);
router.get('/:id/registrations', getEventRegistrations);
router.patch('/status/update', updateEventStatus);

// Menu Items Routes (with Event support)
router.get('/menu-items', getMenuItems);
router.get('/menu-items/events', getEventMenuItems);
router.get('/menu-items/events/available', getAvailableEvents);
router.get('/menu-items/:id', getMenuItemById);

export default router;