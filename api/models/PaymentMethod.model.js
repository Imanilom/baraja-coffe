import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: 'default.png' },
  color: { type: String, default: '#2196F3' },
  
  // Format 2 fields (Flat List)
  payment_method: { type: String, required: true },
  payment_method_name: { type: String, required: true },
  bank_code: { type: String, required: true },
  isBank: { type: Boolean, default: false },
  isCash: { type: Boolean, default: false },
  isPtBank: { type: Boolean, default: false },
  groOnly: { type: Boolean, default: false },
  
  // Format 1 fields (Hierarchy)
  methodIds: { type: [String], default: [] },
  typeCode: { type: String },
  isDigital: { type: Boolean, default: true },
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
