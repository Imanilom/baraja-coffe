// controllers/eventController.js
import Event from '../models/Event.model.js';
import Ticket from '../models/TicketPurchase.model.js';
import { MenuItem } from '../models/MenuItem.model.js';

// Create new event with MenuItem integration
export async function createEvent(req, res) {
    try {
        const eventData = req.body;

        // Create menu item for the event
        const menuItem = new MenuItem({
            name: eventData.name,
            price: eventData.price,
            description: eventData.description,
            mainCategory: 'event',
            imageURL: eventData.imageUrl || 'https://placehold.co/1920x1080/png',
            isEventItem: true,
            eventType: eventData.price === 0 ? 'free' : 'paid',
            availableStock: eventData.capacity,
            availableAt: eventData.availableAt || [],
            workstation: eventData.workstation || [],
            isActive: eventData.status !== 'cancelled'
        });

        const savedMenuItem = await menuItem.save();

        // Create event with menu item reference
        const event = new Event({
            ...eventData,
            menuItem: savedMenuItem._id,
            isFreeEvent: eventData.price === 0
        });

        const savedEvent = await event.save();

        // Update menu item with event reference
        menuItem.event = savedEvent._id;
        await menuItem.save();

        // Populate the result
        const populatedEvent = await Event.findById(savedEvent._id).populate('menuItem');

        res.status(201).json({
            success: true,
            data: populatedEvent,
            message: 'Event created successfully with menu item'
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// Get all events (with optional filters and menu item population)
export async function getEvents(req, res) {
    try {
        const filters = {};

        if (req.query.status) filters.status = req.query.status;
        if (req.query.category) filters.category = req.query.category;
        if (req.query.privacy) filters.privacy = req.query.privacy;
        if (req.query.isFreeEvent) filters.isFreeEvent = req.query.isFreeEvent === 'true';

        const events = await Event.find(filters)
            .populate('menuItem')
            .populate('freeRegistrations')
            .sort({ date: 1 });

        res.json({ success: true, data: events });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Get single event by ID with menu item
export async function getEventById(req, res) {
    try {
        const event = await Event.findById(req.params.id)
            .populate('menuItem')
            .populate('freeRegistrations')
            .populate('ticketPurchases');

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.json({ success: true, data: event });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Update event and linked menu item
export async function updateEvent(req, res) {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Update event
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('menuItem');

        // Update linked menu item if exists
        if (event.menuItem && req.body.name) {
            await MenuItem.findByIdAndUpdate(event.menuItem, {
                name: req.body.name,
                price: req.body.price !== undefined ? req.body.price : event.menuItem?.price,
                description: req.body.description,
                isActive: req.body.status !== 'cancelled'
            });
        }

        res.json({ success: true, data: updatedEvent });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// Delete event and linked menu item
export async function deleteEvent(req, res) {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Delete linked menu item if exists
        if (event.menuItem) {
            await MenuItem.findByIdAndDelete(event.menuItem);
        }

        // Delete the event
        await Event.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Event and linked menu item deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Register for free event
export async function registerFreeEvent(req, res) {
    try {
        const { eventId } = req.params;
        const { fullName, email, phone, notes } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (!event.isFreeEvent) {
            return res.status(400).json({
                success: false,
                message: 'This is not a free event. Please purchase tickets instead.'
            });
        }

        // Check capacity
        if (event.freeRegistrations.length >= event.capacity) {
            return res.status(400).json({
                success: false,
                message: 'Event is at full capacity'
            });
        }

        // Check if email already registered
        const existingRegistration = event.freeRegistrations.find(
            reg => reg.email === email
        );
        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered for this event'
            });
        }

        // Add registration
        event.freeRegistrations.push({
            fullName,
            email,
            phone,
            notes
        });

        await event.save();

        res.json({
            success: true,
            message: 'Successfully registered for the event',
            data: {
                registrationId: event.freeRegistrations[event.freeRegistrations.length - 1]._id,
                event: event.name,
                date: event.date
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// Get event registrations
export async function getEventRegistrations(req, res) {
    try {
        const event = await Event.findById(req.params.id)
            .select('freeRegistrations name date capacity');

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({
            success: true,
            data: {
                event: {
                    name: event.name,
                    date: event.date,
                    capacity: event.capacity,
                    registeredCount: event.freeRegistrations.length
                },
                registrations: event.freeRegistrations
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Update event status automatically based on date
export async function updateEventStatus(req, res) {
    try {
        const now = new Date();

        // Update upcoming to ongoing
        await Event.updateMany(
            {
                status: 'upcoming',
                date: { $lte: now }
            },
            { status: 'ongoing' }
        );

        // Update ongoing to completed
        await Event.updateMany(
            {
                status: 'ongoing',
                endDate: { $lt: now }
            },
            { status: 'completed' }
        );

        res.json({
            success: true,
            message: 'Event statuses updated successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Get all menu items with event category filter
export async function getMenuItems(req, res) {
    try {
        const filters = { isActive: true };
        const { mainCategory, category, eventType, includeInactive, search } = req.query;

        // Filter by main category (including event)
        if (mainCategory) {
            filters.mainCategory = mainCategory;
        }

        // Filter by sub-category
        if (category) {
            // Validasi bahwa category adalah ObjectId yang valid
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID format'
                });
            }
            filters.category = category;
        }

        // Filter for event items
        if (mainCategory === 'event') {
            filters.isEventItem = true;

            if (eventType) {
                filters.eventType = eventType;
            }
        }

        // Include inactive items if requested
        if (includeInactive === 'true') {
            delete filters.isActive;
        }

        // Search filter
        if (search) {
            filters.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const menuItems = await MenuItem.find(filters)
            .populate('category')
            .populate('subCategory')
            .populate({
                path: 'event',
                select: 'name date status capacity' // Hanya field yang diperlukan
            })
            .populate('availableAt')
            .sort({ mainCategory: 1, name: 1 });

        res.json({
            success: true,
            data: menuItems,
            count: menuItems.length
        });
    } catch (err) {
        console.error('Error in getMenuItems:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch menu items',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}
// Get event menu items specifically
export async function getEventMenuItems(req, res) {
    try {
        const filters = {
            mainCategory: 'event',
            isEventItem: true
        };

        const { eventType, status, includeInactive, upcomingOnly } = req.query;

        // Filter by event type
        if (eventType) {
            filters.eventType = eventType;
        }

        // Include inactive if requested
        if (includeInactive !== 'true') {
            filters.isActive = true;
        }

        let menuItems = await MenuItem.find(filters)
            .populate('category')
            .populate('subCategory')
            .populate('event')
            .populate('availableAt')
            .sort({ name: 1 });

        // Filter by event status if needed
        if (status || upcomingOnly) {
            menuItems = menuItems.filter(item => {
                if (!item.event) return false;

                if (status) {
                    return item.event.status === status;
                }

                if (upcomingOnly === 'true') {
                    return item.event.status === 'upcoming' || item.event.status === 'ongoing';
                }

                return true;
            });
        }

        res.json({
            success: true,
            data: menuItems,
            count: menuItems.length
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Get single menu item with event details
export async function getMenuItemById(req, res) {
    try {
        const menuItem = await MenuItem.findById(req.params.id)
            .populate('category')
            .populate('subCategory')
            .populate('event')
            .populate('availableAt');

        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        // If it's an event item, get additional event details
        if (menuItem.isEventItem && menuItem.event) {
            const event = await Event.findById(menuItem.event._id)
                .populate('freeRegistrations');
            menuItem.event = event;
        }

        res.json({ success: true, data: menuItem });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Get available events for POS
export async function getAvailableEvents(req, res) {
    try {
        const now = new Date();

        const events = await Event.find({
            status: { $in: ['upcoming', 'ongoing'] },
            date: { $gte: now }
        })
            .populate('menuItem')
            .sort({ date: 1 });

        const availableEvents = events.filter(event =>
            event.menuItem &&
            event.menuItem.isActive &&
            event.menuItem.availableStock > 0
        );

        res.json({
            success: true,
            data: availableEvents,
            count: availableEvents.length
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}