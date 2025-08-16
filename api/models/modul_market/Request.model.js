import mongoose from 'mongoose';

const requestItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productSku: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['food', 'beverages', 'packaging', 'instan', 'perlengkapan'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  },
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'dibeli', 'lebih', 'kurang', 'tidak tersedia'],
    default: 'pending'
  },
  fulfilledQuantity: {
    type: Number,
    default: 0
  }
});

const requestSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  department: {
    type: String,
    enum: ['dapur', 'bar depan', 'bar belakang', 'event', 'ob'],
    required: true
  },
  requester: {
    type: String,
    required: true
  },
  items: [requestItemSchema],
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: String,
  reviewedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  fulfillmentStatus: {
    type: String,
    enum: ['pending', 'dibeli', 'lebih', 'kurang', 'tidak tersedia', 'partial'],
    default: 'pending'
  }
});

const Request = mongoose.model('Request', requestSchema);
export default Request;