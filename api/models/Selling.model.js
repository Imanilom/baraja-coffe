const mongoose = require('mongoose');

const SellingSchema = new mongoose.Schema({
    order_number: {
        type: String,
        required: true,
        unique: true // Menjamin nomor pesanan tidak duplikat
    },
    outlet: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Outlet',
        required: true
    },
    cashier: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        default: null // Bisa null jika pelanggan tidak terdaftar
    },
    workstation: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Workstations',
        default: null // Opsional, hanya jika diperlukan
    },
    order_items: [
        {
            menu: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
            quantity: { type: Number, required: true },
            price_per_item: { type: Number, required: true }, // Harga per item saat transaksi
            subtotal: { type: Number, required: true } // quantity * price_per_item
        }
    ],
    total_amount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0 // Diskon dalam angka, misal 10.000
    },
    tax: {
        type: Number,
        default: 0 // Pajak dalam angka, misal 5.000
    },
    final_total: {
        type: Number,
        required: true // total_amount - discount + tax
    },
    payment_method: {
        type: String,
        enum: ['cash', 'debit', 'credit', 'ewallet'],
        required: true
    },
    order_time: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'on_process', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: '' // Catatan tambahan seperti "tanpa gula", "es sedikit", dll.
    }
}, { timestamps: true });

module.exports = mongoose.model('Selling', SellingSchema);
