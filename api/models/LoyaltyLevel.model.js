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
    default: 0, // Jumlah poin yang diperlukan untuk mencapai level ini
  },
  description: {
    type: String,
  },
}, { timestamps: true });

const LoyaltyLevel = mongoose.model('LoyaltyLevel', LoyaltyLevelSchema);

export default LoyaltyLevel;