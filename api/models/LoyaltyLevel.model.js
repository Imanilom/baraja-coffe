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
    default: 0, // Minimum poin untuk mencapai level ini
  },

  description: {
    type: String,
  },

  // Berapa poin yang didapat per total transaksi tertentu
  pointsPerCurrency: {
    type: Number,
    required: true,
    default: 1, // contoh: 1 poin per 1000 rupiah
  },

  currencyUnit: {
    type: Number,
    required: true,
    default: 1000, // contoh: setiap Rp 1.000 = 1 poin
  },

  // Bonus poin saat naik level
  levelUpBonusPoints: {
    type: Number,
    required: true,
    default: 0
  },

  // Diskon atau benefit khusus level ini
  benefits: {
    type: [String],
    default: [] // contoh: ['5% discount', 'Free drink on birthday']
  }

}, { timestamps: true });
  
const LoyaltyLevel = mongoose.model('LoyaltyLevel', LoyaltyLevelSchema);

export default LoyaltyLevel;
