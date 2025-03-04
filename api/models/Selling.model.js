const mongoose = require('mongoose');

const SellingSchema = new mongoose.Schema({

    outlet: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Outlet',
        required: true
    },
    cashier: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        required: true
    },
    workstation: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Workstations',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        required: true
    },
    menu: {
        type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    total_amount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        required: true
    },
    order_time: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'on_process', 'completed', 'cancelled'],
        default: 'Pending'
    },
}, { timestamps: true });

module.exports = mongoose.model('Selling', SellingSchema);