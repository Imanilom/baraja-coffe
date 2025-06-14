// models/Request.js
import mongoose from 'mongoose';

const requestItemSchema = new mongoose.Schema({
  item: String,
  category: { type: String, enum: ['food', 'beverages', 'packaging', 'instan', 'perlengkapan'] },
  quantity: Number,
  unit: String,
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'dibeli', 'lebih', 'kurang', 'tidak tersedia'],
    default: 'pending',
  },
  fulfilledQuantity: { type: Number, default: 0 }, // Berapa banyak yang berhasil dibeli
});

const requestSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  department: { type: String, enum: ['dapur', 'bar', 'lain-lain'] },
  requester: String,
  items: [requestItemSchema],
  reviewed: { type: Boolean, default: false },
  reviewedBy: String,
  reviewedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
});

const Request = mongoose.model('Request', requestSchema);
export default Request;
