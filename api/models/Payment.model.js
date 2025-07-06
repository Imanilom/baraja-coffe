import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  // Basic payment info
  order_id: { type: String, ref: 'Order', required: true },
  transaction_id: { type: String },
  method: { type: String, required: true },
  status: { type: String, default: 'pending' },
  paymentType: {
    type: String,
    enum: ['Full', 'Down Payment'],
    default: 'Full'
  },
  amount: { type: Number, required: true },
  remainingAmount: { type: Number, default: 0 },
  phone: { type: String },
  discount: { type: Number, default: 0 },
  midtransRedirectUrl: { type: String },

  // Midtrans fields
  fraud_status: { type: String },
  transaction_time: { type: String },
  expiry_time: { type: String },
  settlement_time: { type: String },
  paidAt: { type: Date },

  va_numbers: [{
    bank: { type: String },
    va_number: { type: String }
  }],
  permata_va_number: { type: String },
  bill_key: { type: String },
  biller_code: { type: String },
  pdf_url: { type: String },
  currency: { type: String, default: "IDR" },
  merchant_id: { type: String },
  signature_key: { type: String },

  // NEW: Store GoPay/QRIS actions
  actions: [{
    name: { type: String },
    method: { type: String },
    url: { type: String }
  }],

  raw_response: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
  index: {
    order_id: 1,
    transaction_id: 1,
    status: 1,
    paymentType: 1,
    createdAt: -1
  }
});

// Virtual untuk lunas
PaymentSchema.virtual('isFullyPaid').get(function () {
  return (this.status === 'paid' || this.status === 'settlement') && this.remainingAmount === 0;
});

// Methods
PaymentSchema.methods.markAsPaid = function () {
  this.status = 'settlement';
  this.paidAt = new Date();
  return this.save();
};

PaymentSchema.methods.updateRemainingAmount = function (newRemainingAmount) {
  this.remainingAmount = newRemainingAmount;
  return this.save();
};

// Statics
PaymentSchema.statics.findByOrderId = function (orderId) {
  return this.find({ order_id: orderId }).sort({ createdAt: -1 });
};

PaymentSchema.statics.findPendingDownPayments = function () {
  return this.find({
    paymentType: 'Down Payment',
    status: 'settlement',
    remainingAmount: { $gt: 0 }
  });
};

export default mongoose.model('Payment', PaymentSchema);
