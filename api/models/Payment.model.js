import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentDate: { 
    type: Date, 
    default: Date.now 
  },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Card', 'E-Wallet', 'gopay', 'dana', 'ovo'], // Allowed payment methods
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Success', 'Failed', 'Pending'], 
    required: true 
  },
}, { timestamps: true });

const Payment = mongoose.model('Payment', PaymentSchema);

export default Payment;
c