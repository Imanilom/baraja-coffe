import TicketPurchase from '../models/TicketPurchase.model.js';
import Event from '../models/Event.model.js';

// Beli tiket
export async function buyTicket(req, res) {
    try {
        const { eventId, userId, quantity, paymentMethod } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // hitung tiket terjual
        const sold = await TicketPurchase.aggregate([
            { $match: { event: event._id, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);

        const ticketsSold = sold.length > 0 ? sold[0].total : 0;
        const ticketsLeft = event.capacity - ticketsSold;

        if (quantity > ticketsLeft) {
            return res.status(400).json({ success: false, message: 'Not enough tickets available' });
        }

        // hitung total harga
        const totalPrice = event.price * quantity;

        const ticketPurchase = new TicketPurchase({
            event: eventId,
            user: userId,
            quantity,
            totalPrice,
            paymentMethod,
            status: 'pending'
        });

        await ticketPurchase.save();

        res.status(201).json({ success: true, data: ticketPurchase });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// tiket user
export async function getUserTickets(req, res) {
    try {
        const tickets = await TicketPurchase.find({ user: req.params.userId })
            .populate('event');
        res.json({ success: true, data: tickets });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// update status tiket (misalnya setelah pembayaran)
export async function updateTicketStatus(req, res) {
    try {
        const ticket = await TicketPurchase.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        ticket.status = req.body.status || ticket.status;
        await ticket.save();

        res.json({ success: true, data: ticket });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
