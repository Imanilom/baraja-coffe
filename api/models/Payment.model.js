import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  order_id: { type: String, ref: 'Order', required: true },
  method: { type: String, required: true }, // 'Cash', 'EDC', 'Gopay', etc.
  status: { type: String, default: 'pending' }, // 'pending', 'paid', 'failed'
  amount: { type: Number, required: true },
  phone: { type: String }, // phone number for E-Wallet payments
  discount: { type: Number, default: 0 },
  midtransRedirectUrl: { type: String }, // if using Midtrans
  paidAt: { type: Date }, // only if paid
}, { timestamps: true });

export default mongoose.model('Payment', PaymentSchema);
