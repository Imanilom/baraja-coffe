import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    quantity: Number,
    price: Number,
    total: Number,
    status: {
        type: String,
        default: "pending"
    },
}, {
    timestamps: true
});

const Ticket = mongoose.model('Ticket', TicketSchema);

export default Ticket;
