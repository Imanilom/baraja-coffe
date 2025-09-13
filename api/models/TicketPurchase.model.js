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
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'bank_transfer', 'ewallet'],
        required: true
    }
}, {
    timestamps: true
});

const TicketPurchase = mongoose.model('TicketPurchase', TicketPurchaseSchema);

export default TicketPurchase;
