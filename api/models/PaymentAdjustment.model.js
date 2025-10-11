// models/PaymentAdjustment.model.js
import mongoose from 'mongoose';

const PaymentAdjustmentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    revision: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderRevision', required: true },
    direction: { type: String, enum: ['charge', 'refund'], required: true }, // charge=+, refund=-
    amount: { type: Number, required: true }, // selalu positif
    method: { type: String, enum: ['Cash', 'Card', 'QRIS', 'E-Wallet', 'Debit', 'Bank Transfer', 'Store Credit'], default: 'Cash' },
    status: { type: String, enum: ['pending', 'settlement', 'failed', 'canceled'], default: 'pending' },

    gateway: { type: String },
    transactionId: { type: String },
    raw_response: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

PaymentAdjustmentSchema.index({ order: 1, createdAt: -1 });

export const PaymentAdjustment = mongoose.model('PaymentAdjustment', PaymentAdjustmentSchema);