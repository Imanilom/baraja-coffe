import TicketPurchase from '../models/TicketPurchase.model.js';
import Event from '../models/Event.model.js';
import Payment from '../models/Payment.model.js';
import User from "../models/user.model.js";
import { snap, coreApi } from '../utils/MidtransConfig.js';

const generatePaymentCode = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const HH = String(now.getHours()).padStart(2, '0');
    const MM = String(now.getMinutes()).padStart(2, '0');
    const SS = String(now.getSeconds()).padStart(2, '0');
    return `${dd}${mm}${yyyy}${HH}${MM}${SS}`;
};


// Beli tiket
export const chargeTicket = async (req, res) => {
    try {
        const {
            payment_type,
            transaction_details,
            bank_transfer,
            event_id,
            user_id,
            quantity
        } = req.body;

        const payment_code = generatePaymentCode();
        const order_id = transaction_details?.order_id;
        const gross_amount = transaction_details?.gross_amount;

        // === Validasi input ===
        if (!order_id || !gross_amount) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and gross amount are required'
            });
        }

        if (!event_id || !user_id || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Event ID, User ID, and quantity are required'
            });
        }

        // === Validasi event ===
        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const availableTickets = event.capacity - (event.soldTickets || 0);
        if (availableTickets < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Tidak cukup tiket tersedia',
                availableTickets
            });
        }

        // === Validasi user ===
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // === Setup payment parameters ===
        let chargeParams = {
            payment_type: payment_type,
            transaction_details: {
                gross_amount: parseInt(gross_amount),
                order_id: payment_code,
            },
        };

        // === Setup payment method specific parameters ===
        if (payment_type === 'bank_transfer') {
            if (!bank_transfer?.bank) {
                return res.status(400).json({ success: false, message: 'Bank is required for bank transfer' });
            }
            chargeParams.bank_transfer = { bank: bank_transfer.bank };
        } else if (payment_type === 'gopay') {
            chargeParams.gopay = {};
        } else if (payment_type === 'qris') {
            chargeParams.qris = {};
        } else if (payment_type === 'shopeepay') {
            chargeParams.shopeepay = {};
        } else if (payment_type === 'credit_card') {
            chargeParams.credit_card = { secure: true };
        } else {
            return res.status(400).json({
                success: false,
                message: 'Unsupported payment type for ticket purchase'
            });
        }

        // === Call Midtrans API ===
        const response = await coreApi.charge(chargeParams);

        // === Create Payment record ===
        const payment = new Payment({
            transaction_id: response.transaction_id,
            order_id: order_id,
            payment_code: payment_code,
            amount: parseInt(gross_amount),
            totalAmount: parseInt(gross_amount),
            method: payment_type,
            status: response.transaction_status || 'pending',
            fraud_status: response.fraud_status,
            transaction_time: response.transaction_time,
            expiry_time: response.expiry_time,
            settlement_time: response.settlement_time || null,
            va_numbers: response.va_numbers || [],
            permata_va_number: response.permata_va_number || null,
            bill_key: response.bill_key || null,
            biller_code: response.biller_code || null,
            pdf_url: response.pdf_url || null,
            currency: response.currency || 'IDR',
            merchant_id: response.merchant_id || null,
            signature_key: response.signature_key || null,
            actions: response.actions || [],
            paymentType: 'Full',
            remainingAmount: 0,
            relatedPaymentId: null,
            raw_response: response
        });

        const savedPayment = await payment.save();

        // === Create TicketPurchase record ===
        const ticketPurchase = new TicketPurchase({
            event: event_id,
            user: user_id,
            payment_id: savedPayment._id,
            quantity: quantity,
            totalPrice: parseInt(gross_amount)
        });

        const savedTicketPurchase = await ticketPurchase.save();

        // === Update Event with ticket purchase reference (optional) ===
        await Event.updateOne(
            { _id: event_id },
            { $addToSet: { ticket_purchases: savedTicketPurchase._id } }
        );

        // === Return response in same format as original charge function ===
        return res.status(200).json({
            ...response,
            paymentType: 'Full',
            totalAmount: parseInt(gross_amount),
            remainingAmount: 0,
            is_down_payment: false,
            relatedPaymentId: null,
            ticketPurchaseId: savedTicketPurchase._id,
            event_id: event_id,
            user_id: user_id,
            quantity: quantity,
            down_payment_amount: null,
        });

    } catch (error) {
        console.error('Ticket payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Ticket payment failed',
            error: error.message || error
        });
    }
};

// tiket user
export const getUserTickets = async (req, res) => {
    try {
        const tickets = await TicketPurchase.find({ user: req.params.userId })
            .populate('event')              // ambil detail event
            .populate('payment_id');        // ambil detail payment

        res.json({ success: true, data: tickets });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// update status tiket (misalnya setelah pembayaran)
export const updateTicketStatus = async (req, res) => {
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

// ✅ TAMBAHAN ENDPOINTS yang diperlukan untuk melengkapi ticket.controller.js

// Refresh ticket status (sync payment status)
export const refreshTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await TicketPurchase.findById(id)
            .populate('payment_id')
            .populate('event', 'name date location status')
            .populate('user', 'name email');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Check if payment status has changed
        if (ticket.payment_id) {
            const payment = ticket.payment_id;

            // If payment is now settled but ticket is still pending, confirm it
            if (['settlement', 'paid'].includes(payment.status) && ticket.status === 'pending') {
                await ticket.confirmTicket();
            }
            // If payment failed but ticket is still pending, cancel it
            else if (['cancel', 'expire', 'failure'].includes(payment.status) && ticket.status === 'pending') {
                await ticket.cancelTicket();

                // Release capacity
                const event = await Event.findById(ticket.event);
                if (event) {
                    event.soldTickets = Math.max(0, event.soldTickets - ticket.quantity);
                    await event.save();
                }
            }
        }

        // Refresh ticket data
        const refreshedTicket = await TicketPurchase.findById(id)
            .populate('payment_id')
            .populate('event', 'name date location status')
            .populate('user', 'name email');

        res.json({
            success: true,
            data: refreshedTicket,
            message: 'Ticket status refreshed'
        });

    } catch (err) {
        console.error('Refresh ticket status error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to refresh ticket status'
        });
    }
}

// Cancel ticket purchase
export const cancelTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const ticket = await TicketPurchase.findById(id)
            .populate('payment_id')
            .populate('event');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Check if ticket can be cancelled
        if (ticket.status === 'used') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel used ticket'
            });
        }

        if (ticket.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Ticket is already cancelled'
            });
        }

        // Check event date (allow cancellation up to 24 hours before event)
        const eventDate = new Date(ticket.event.date);
        const now = new Date();
        const hoursDifference = (eventDate - now) / (1000 * 60 * 60);

        if (hoursDifference < 24) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel ticket less than 24 hours before event'
            });
        }

        // Cancel the ticket
        await ticket.cancelTicket();

        // Release capacity back to event
        const event = await Event.findById(ticket.event);
        if (event) {
            event.soldTickets = Math.max(0, event.soldTickets - ticket.quantity);
            await event.save();
        }

        // If payment was successful, initiate refund process (implementation depends on payment gateway)
        if (['settlement', 'paid'].includes(ticket.payment_id?.status)) {
            // TODO: Implement refund logic based on your payment gateway
            console.log(`Refund needed for ticket ${ticket.ticketCode}, payment ${ticket.payment_id.transaction_id}`);
        }

        res.json({
            success: true,
            data: ticket,
            message: 'Ticket cancelled successfully',
            refundStatus: ['settlement', 'paid'].includes(ticket.payment_id?.status) ? 'pending' : 'not_required'
        });

    } catch (err) {
        console.error('Cancel ticket error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to cancel ticket'
        });
    }
}

// Get event availability
export const getEventAvailability = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const availableTickets = event.availableTickets;
        const soldTickets = event.soldTickets;
        const capacity = event.capacity;

        // Calculate ticket sales statistics
        const ticketPurchases = await TicketPurchase.find({ event: eventId })
            .populate('payment_id', 'status');

        const confirmedTickets = ticketPurchases.filter(ticket =>
            ['settlement', 'paid'].includes(ticket.payment_id?.status)
        ).reduce((sum, ticket) => sum + ticket.quantity, 0);

        const pendingTickets = ticketPurchases.filter(ticket =>
            ticket.payment_id?.status === 'pending'
        ).reduce((sum, ticket) => sum + ticket.quantity, 0);

        res.json({
            success: true,
            data: {
                eventId,
                capacity,
                soldTickets,
                availableTickets,
                confirmedTickets,
                pendingTickets,
                isAvailable: availableTickets > 0,
                salesPercentage: Math.round((soldTickets / capacity) * 100),
                lastUpdated: new Date()
            }
        });

    } catch (err) {
        console.error('Get event availability error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to get event availability'
        });
    }
}

// Bulk ticket operations (for organizers)
export const bulkUpdateTickets = async (req, res) => {
    try {
        const { ticketIds, action, data } = req.body;

        if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Ticket IDs array is required'
            });
        }

        let results = [];
        let errors = [];

        for (const ticketId of ticketIds) {
            try {
                const ticket = await TicketPurchase.findById(ticketId);
                if (!ticket) {
                    errors.push({ ticketId, error: 'Ticket not found' });
                    continue;
                }

                switch (action) {
                    case 'confirm':
                        if (ticket.status === 'pending') {
                            await ticket.confirmTicket();
                            results.push({ ticketId, action: 'confirmed' });
                        } else {
                            errors.push({ ticketId, error: 'Cannot confirm non-pending ticket' });
                        }
                        break;

                    case 'cancel':
                        if (['pending', 'confirmed'].includes(ticket.status)) {
                            await ticket.cancelTicket();
                            results.push({ ticketId, action: 'cancelled' });
                        } else {
                            errors.push({ ticketId, error: 'Cannot cancel this ticket' });
                        }
                        break;

                    case 'checkin':
                        if (ticket.status === 'confirmed') {
                            await ticket.useTicket(data?.checkedInBy || 'system');
                            results.push({ ticketId, action: 'checked_in' });
                        } else {
                            errors.push({ ticketId, error: 'Cannot check-in non-confirmed ticket' });
                        }
                        break;

                    default:
                        errors.push({ ticketId, error: 'Invalid action' });
                }
            } catch (error) {
                errors.push({ ticketId, error: error.message });
            }
        }

        res.json({
            success: true,
            data: {
                processed: results.length,
                succeeded: results,
                failed: errors
            },
            message: `Bulk operation completed. ${results.length} succeeded, ${errors.length} failed.`
        });

    } catch (err) {
        console.error('Bulk update tickets error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to perform bulk update'
        });
    }
}
