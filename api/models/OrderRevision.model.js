import mongoose from 'mongoose';

const OrderRevisionSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true, required: true },
    idempotencyKey: { type: String, index: true, sparse: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    changes: {
        added: [mongoose.Schema.Types.Mixed],
        removed: [mongoose.Schema.Types.Mixed],
        updated: [mongoose.Schema.Types.Mixed],
    },
    delta: {
        subtotalDelta: { type: Number, default: 0 },
        taxDelta: { type: Number, default: 0 },
        serviceDelta: { type: Number, default: 0 },
        grandDelta: { type: Number, default: 0 },
    },
    effects: {
        pendingPaymentAdjusted: [{ paymentId: mongoose.Schema.Types.ObjectId, amountDelta: Number }],
        newPendingPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
        refundPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    },
}, { timestamps: true });

export default mongoose.model('OrderRevision', OrderRevisionSchema);
