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
