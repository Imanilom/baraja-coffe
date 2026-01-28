import mongoose from 'mongoose';

const CashRecapLogSchema = new mongoose.Schema({
    outletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Outlet',
        required: true
    },
    cashierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rangeStartDate: {
        type: Date,
        required: true
    },
    rangeEndDate: {
        type: Date,
        required: true
    },
    totalCashAmount: {
        type: Number,
        required: true,
        default: 0
    },
    orderCount: {
        type: Number,
        required: true,
        default: 0
    },
    orders: [{
        orderId: String,
        time: Date,
        amount: Number
    }],
    printedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying of last print per cashier/outlet
CashRecapLogSchema.index({ outletId: 1, cashierId: 1, printedAt: -1 });

const CashRecapLog = mongoose.model('CashRecapLog', CashRecapLogSchema);

export default CashRecapLog;
