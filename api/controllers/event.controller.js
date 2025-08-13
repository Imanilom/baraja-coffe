// controllers/eventController.js
import Event from '../models/Event.model.js';
import { MenuItem } from '../models/MenuItem.model.js';

// Create new event
export async function createEvent(req, res) {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json({ success: true, data: event });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// Get all events (with optional filters)
export async function getEvents(req, res) {
    try {
        const filters = {};

        if (req.query.status) filters.status = req.query.status;
        if (req.query.category) filters.category = req.query.category;
        if (req.query.privacy) filters.privacy = req.query.privacy;

        const events = await Event.find(filters).sort({ date: 1 });
        res.json({ success: true, data: events });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Get single event by ID
export async function getEventById(req, res) {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.json({ success: true, data: event });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Update event
export async function updateEvent(req, res) {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.json({ success: true, data: event });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// Delete event
export async function deleteEvent(req, res) {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Add attendee
export async function addAttendee(req, res) {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.attendees.length >= event.capacity) {
            return res.status(400).json({ success: false, message: 'Event is at full capacity' });
        }
        if (event.attendees.includes(req.body.email)) {
            return res.status(400).json({ success: false, message: 'Attendee already registered' });
        }

        event.attendees.push(req.body.email);
        await event.save();

        res.json({ success: true, data: event });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// Remove attendee
export async function removeAttendee(req, res) {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        event.attendees = event.attendees.filter(email => email !== req.body.email);
        await event.save();

        res.json({ success: true, data: event });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
