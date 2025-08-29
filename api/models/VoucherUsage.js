// models/VoucherUsage.js
import mongoose from 'mongoose';

const VoucherUsageSchema = new mongoose.Schema({
    voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher',
        required: true
    },
    orderId: {
        type: String,
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    outletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Outlet'
    },
    discountAmount: {
        type: Number,
        required: true
    },
    orderAmount: {
        type: Number,
        required: true
    },
    usedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index untuk optimasi query
VoucherUsageSchema.index({ voucherId: 1, orderId: 1 }, { unique: true });
VoucherUsageSchema.index({ customerId: 1, usedAt: -1 });
VoucherUsageSchema.index({ outletId: 1, usedAt: -1 });

const VoucherUsage = mongoose.model('VoucherUsage', VoucherUsageSchema);

export default VoucherUsage;