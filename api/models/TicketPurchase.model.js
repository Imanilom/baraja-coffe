// TicketPurchase.js
import mongoose from 'mongoose';

const TicketPurchaseSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true
    },
}, {
    timestamps: true
});

const TicketPurchase = mongoose.model('TicketPurchase', TicketPurchaseSchema);

export default TicketPurchase;
