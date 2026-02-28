// models/LoyaltyProgram.model.js
import mongoose from 'mongoose';

const LoyaltyProgramSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  consumerType: {
    type: String,
    required: true,
    default: 'member',
  },
  pointsPerRp: {
    type: Number,
    required: true,
    default: 100, // Setiap Rp100 memberikan 1 poin
  },
  registrationPoints: {
    type: Number,
    required: true,
    default: 50, // Poin yang diberikan saat registrasi
  },
  firstTransactionPoints: {
    type: Number,
    required: true,
    default: 100, // Poin tambahan untuk transaksi pertama
  },
  pointsToDiscountRatio: {
    type: Number,
    required: true,
    default: 100, // 100 poin = Rp5000 diskon
  },
  discountValuePerPoint: {
    type: Number,
    required: true,
    default: 50, // Setiap poin bernilai Rp50
  },
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: false,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model('LoyaltyProgram', LoyaltyProgramSchema);