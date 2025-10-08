// models/OrderRevision.model.js
import mongoose from 'mongoose';

const OrderOpSchema = new mongoose.Schema({
    type: { type: String, enum: ['add', 'remove', 'update_qty', 'substitute'], required: true },
    orderItemId: { type: mongoose.Schema.Types.ObjectId }, // item lama (jika ada)
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }, // item baru/target
    fromQty: Number,
    toQty: Number,
    priceDelta: { type: Number, required: true, default: 0 }, // +/-
    note: String,
    batchNumber: Number,
}, { _id: false });

const OrderRevisionSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    versionFrom: { type: Number, required: true },
    versionTo: { type: Number, required: true },
    reasonCode: { type: String, enum: ['stock_out', 'customer_request', 'merchant_error'], required: true },
    reasonNote: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deltaAmount: { type: Number, required: true, default: 0 },  // sum dari ops
    ops: [OrderOpSchema],
    createdAtWIB: { type: Date, default: () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })) }
}, { timestamps: true });

OrderRevisionSchema.index({ order: 1, createdAt: -1 });

export const OrderRevision = mongoose.model('OrderRevision', OrderRevisionSchema);