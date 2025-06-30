import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  // Basic payment info
  order_id: { type: String, ref: 'Order', required: true },
  transaction_id: { type: String }, // Midtrans transaction ID (null for cash)
  method: { type: String, required: true }, // cash, bank_transfer, gopay, qris, etc.
  bank: { type: String, default: "" }, // e.g., 'bca', 'mandiri', 'gopay', 'dana', etc.
  status: { type: String, default: 'pending' }, // 'pending', 'paid', 'failed'
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
  fraud_status: { type: String },
  transaction_time: { type: String },
  expiry_time: { type: String },
  paidAt: { type: Date },
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

// Virtual untuk menghitung apakah pembayaran sudah lunas
PaymentSchema.virtual('isFullyPaid').get(function () {
  return this.status === 'paid' && this.remainingAmount === 0;
});

// Method untuk update status pembayaran
PaymentSchema.methods.markAsPaid = function () {
  this.status = 'paid';
  this.paidAt = new Date();
  return this.save();
};

// Method untuk update remaining amount
PaymentSchema.methods.updateRemainingAmount = function (newRemainingAmount) {
  this.remainingAmount = newRemainingAmount;
  return this.save();
};

// Static method untuk mencari pembayaran berdasarkan order
PaymentSchema.statics.findByOrderId = function (orderId) {
  return this.find({ order_id: orderId }).sort({ createdAt: -1 });
};

// Static method untuk mencari down payment yang belum lunas
PaymentSchema.statics.findPendingDownPayments = function () {
  return this.find({
    paymentType: 'Down Payment',
    status: 'paid',
    remainingAmount: { $gt: 0 }
  });
};

export default mongoose.model('Payment', PaymentSchema);