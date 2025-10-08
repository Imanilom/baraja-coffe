// models/LoyaltyLevel.model.js
import mongoose from 'mongoose';

const LoyaltyLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  requiredPoints: {
    type: Number,
    required: true,
    default: 0,
  },
  description: {
    type: String,
  },
  pointsPerCurrency: {
    type: Number,
    required: true,
    default: 1,
  },
  currencyUnit: {
    type: Number,
    required: true,
    default: 1000,
  },
  levelUpBonusPoints: {
    type: Number,
    required: true,
    default: 0
  },
  benefits: {
    type: [String],
    default: []
  }
}, { timestamps: true });

export default mongoose.model('LoyaltyLevel', LoyaltyLevelSchema);