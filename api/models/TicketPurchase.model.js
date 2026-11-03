// TicketPurchase.js
import mongoose from 'mongoose';

const TicketPurchaseSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
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
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled', 'used'],
        default: 'pending'
    },
    usedAt: {
        type: Date,
        default: null
    },
    usedBy: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Method helper: konfirmasi tiket setelah pembayaran berhasil
TicketPurchaseSchema.methods.confirmTicket = function () {
    this.status = 'paid';
    return this.save();
};

// Method helper: batalkan tiket
TicketPurchaseSchema.methods.cancelTicket = function () {
    this.status = 'cancelled';
    return this.save();
};

// Method helper: tandai tiket sudah digunakan
TicketPurchaseSchema.methods.useTicket = function (staffName = 'system') {
    this.status = 'used';
    this.usedAt = new Date();
    this.usedBy = staffName;
    return this.save();
};

const TicketPurchase = mongoose.model('TicketPurchase', TicketPurchaseSchema);

export default TicketPurchase;
