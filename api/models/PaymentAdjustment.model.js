import mongoose from 'mongoose';

const PaymentAdjustmentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    revisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderRevision' },
    kind: { type: String, enum: ['increase_pending', 'decrease_pending', 'settled_refund', 'new_pending'], required: true },
    direction: { type: String, enum: ['charge', 'refund'], required: true },
    amount: { type: Number, required: true },
    note: String,
}, { timestamps: true });

export default mongoose.model('PaymentAdjustment', PaymentAdjustmentSchema);
