import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const VoucherSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    default: uuidv4,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  discountAmount: {
    type: Number,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validTo: {
    type: Date,
    required: true
  },
  quota: {
    type: Number,
    required: true
  },
  oneTimeUse: {
    type: Boolean,
    default: false
  },
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  applicableOutlets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet'
  }], // If empty, valid for all outlets
  customerType: {
    type: String,
    required: true
  },
  printOnReceipt: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Voucher = mongoose.model('Voucher', VoucherSchema);

export default Voucher;
