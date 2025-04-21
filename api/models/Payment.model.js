import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['Cash', 'EDC', 'E-Wallet'], required: true },
  status: { type: String, enum: ['Success', 'Failed', 'Pending'], required: true },
  cardDetails: {
    cardHolderName: { type: String },
    cardNumber: { type: String },
    expirationDate: { type: String },
    cvv: { type: String },
  },
}, { timestamps: true });

const Payment = mongoose.model('Payment', PaymentSchema);


export default Payment;
