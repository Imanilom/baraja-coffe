import mongoose from 'mongoose';

// Refund Item Schema
const RefundItemSchema = new mongoose.Schema({
  orderItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  menuItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MenuItem', 
    required: true 
  },
  menuItemName: { type: String, required: true },
  quantity: { 
    type: Number, 
    min: 1, 
    required: true 
  },
  refundQuantity: { 
    type: Number, 
    min: 1, 
    required: true 
  },
  unitPrice: { 
    type: Number, 
    min: 0, 
    required: true 
  },
  subtotal: { 
    type: Number, 
    min: 0, 
    required: true 
  },
  refundAmount: { 
    type: Number, 
    min: 0, 
    required: true 
  },
  addons: [{ 
    name: String, 
    price: Number 
  }],
  toppings: [{ 
    name: String, 
    price: Number 
  }],
  notes: { type: String, default: '' },
  refundReason: {
    type: String,
    required: true,
    enum: [
      'item_not_as_described',
      'wrong_item',
      'poor_quality',
      'late_delivery',
      'customer_change_mind',
      'duplicate_order',
      'other'
    ]
  },
  refundReasonDescription: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed', 'cancelled'],
    default: 'pending'
  },
  processedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  processedAt: { type: Date },
  rejectionReason: { type: String },
  kitchenStatus: {
    type: String,
    enum: ['pending', 'cooking', 'ready', 'served', 'cannot_refund'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: () => getWIBNow()
  },
  updatedAt: {
    type: Date,
    default: () => getWIBNow()
  }
});

// Refund Schema
const RefundSchema = new mongoose.Schema({
  refundId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  order_id: { 
    type: String, 
    ref: 'Order', 
    required: true 
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  requestedBy: { 
    type: String, 
    required: true 
  },
  refundItems: [RefundItemSchema],
  status: {
    type: String,
    enum: ['pending', 'partially_approved', 'approved', 'rejected', 'processed', 'cancelled'],
    default: 'pending'
  },
  totalRefundAmount: { 
    type: Number, 
    min: 0, 
    default: 0 
  },
  originalPaymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'QRIS', 'E-Wallet', 'Debit', 'Bank Transfer'],
    required: true
  },
  refundMethod: {
    type: String,
    enum: ['original_method', 'cash', 'voucher', 'bank_transfer'],
    default: 'original_method'
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountHolder: String
  },
  voucherCode: { type: String },
  adminNotes: { type: String },
  processedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  processedAt: { type: Date },
  rejectionReason: { type: String },
  createdAt: {
    type: Date,
    default: () => getWIBNow()
  },
  updatedAt: {
    type: Date,
    default: () => getWIBNow()
  }
}, {
  timestamps: true
});

export const Refund = mongoose.models.Refund || mongoose.model('Refund', RefundSchema);