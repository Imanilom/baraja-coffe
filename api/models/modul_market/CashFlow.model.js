import mongoose from "mongoose";

const cashFlowSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  day: String,
  description: String,
  
  // Cash In
  cashIn: { type: Number, default: 0, min: 0 },
  cashInPhysical: { type: Number, default: 0, min: 0 },      // Uang fisik yang masuk
  cashInNonPhysical: { type: Number, default: 0, min: 0 },   // Uang non-fisik yang masuk
  
  // Cash Out
  cashOut: { type: Number, default: 0, min: 0 },
  cashOutPhysical: { type: Number, default: 0, min: 0 },     // Uang fisik yang keluar
  cashOutNonPhysical: { type: Number, default: 0, min: 0 },  // Uang non-fisik yang keluar
  
  // Saldo
  balance: { type: Number, default: 0 },
  balancePhysical: { type: Number, default: 0, min: 0 },     // Saldo uang fisik
  balanceNonPhysical: { type: Number, default: 0, min: 0 },  // Saldo uang non-fisik
  
  // Informasi tambahan
  source: { type: String },
  destination: { type: String },
  paymentMethod: { type: String, enum: ['physical', 'non-physical', 'mixed'], default: 'physical' },
  relatedMarketList: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketList' },
  proof: String,
  createdBy: String,
}, {
  timestamps: true
});

// Middleware untuk validasi sebelum save
cashFlowSchema.pre('save', function(next) {
  // Pastikan semua nilai numerik tidak NaN
  const numericFields = [
    'cashIn', 'cashInPhysical', 'cashInNonPhysical',
    'cashOut', 'cashOutPhysical', 'cashOutNonPhysical',
    'balance', 'balancePhysical', 'balanceNonPhysical'
  ];
  
  for (const field of numericFields) {
    if (isNaN(this[field]) || this[field] === null || this[field] === undefined) {
      this[field] = 0;
    }
  }
  
  next();
});

const CashFlow = mongoose.model('CashFlow', cashFlowSchema);
  
export default CashFlow;