import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  transaction_id: { type: String, required: true }, // unique transaction ID from payment gateway
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  method: { type: String, required: true }, // 'Cash', 'EDC', 'Gopay', etc.
  status: { type: String, default: 'pending' }, // 'pending', 'paid', 'failed'
  fraud_status: { type: String, default: 'accept' }, // 'accept', 'deny', 'challenge'
  amount: { type: Number, required: true },
  transaction_time: { type: Date, default: Date.now }, // time of transaction
  expiry_time: { type: Date }, // time when the transaction expires
  // phone: { type: String }, // phone number for E-Wallet payments
  // discount: { type: Number, default: 0 },
  // midtransRedirectUrl: { type: String }, // if using Midtrans
  paidAt: { type: Date }, // only if paid
}, { timestamps: true });

export default mongoose.model('Payment', PaymentSchema);
