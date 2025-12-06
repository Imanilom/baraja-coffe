// models/CustomerLoyalty.model.js
import mongoose from 'mongoose';

const CustomerLoyaltySchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  loyaltyProgram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoyaltyProgram',
    required: true,
  },
  currentPoints: {
    type: Number,
    default: 0,
  },
  totalPointsEarned: {
    type: Number,
    default: 0,
  },
  totalPointsRedeemed: {
    type: Number,
    default: 0,
  },
  currentLevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoyaltyLevel',
  },
  isFirstTransaction: {
    type: Boolean,
    default: true,
  },
  lastTransactionDate: {
    type: Date,
  },
  transactionCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model('CustomerLoyalty', CustomerLoyaltySchema);