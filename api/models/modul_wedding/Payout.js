import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  foodPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodPackage'
  },
  amount: {
    type: Number,
    required: true
  },
  commissionRate: {
    type: Number,
    default: 10 // 10% commission for platform
  },
  commissionAmount: {
    type: Number,
    required: true
  },
  netAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  },
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'e_wallet', 'cash'],
    default: 'bank_transfer'
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountHolder: String
  },
  eWallet: {
    provider: String,
    phoneNumber: String
  },
  payoutDate: {
    type: Date,
    default: null
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  transactionReference: String,
  notes: String,
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Pre-save middleware untuk menghitung net amount
payoutSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('commissionRate')) {
    this.commissionAmount = (this.amount * this.commissionRate) / 100;
    this.netAmount = this.amount - this.commissionAmount;
  }
  next();
});

const Payout = mongoose.model("Payout", payoutSchema);
export default Payout;
