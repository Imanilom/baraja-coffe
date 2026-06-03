import mongoose from "mongoose";

const cashFlowSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, required: true },
  day: { type: String, required: true },
  description: { type: String, required: true },
  
  // Cash In
  cashIn: { type: Number, default: 0, min: 0 },
  cashInPhysical: { type: Number, default: 0, min: 0 },
  cashInNonPhysical: { type: Number, default: 0, min: 0 },
  
  // Cash Out
  cashOut: { type: Number, default: 0, min: 0 },
  cashOutPhysical: { type: Number, default: 0, min: 0 },
  cashOutNonPhysical: { type: Number, default: 0, min: 0 },
  
  // Saldo
  balance: { type: Number, default: 0 },
  balancePhysical: { type: Number, default: 0, min: 0 },
  balanceNonPhysical: { type: Number, default: 0, min: 0 },
  
  // Informasi tambahan
  source: { type: String, default: '' },
  destination: { type: String, default: '' },
  paymentMethod: { 
    type: String, 
    enum: ['physical', 'non-physical', 'mixed'], 
    default: 'physical' 
  },
  relatedMarketList: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketList' },
  proof: { type: String, default: '' },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

// Middleware untuk validasi sebelum save
cashFlowSchema.pre('save', function(next) {
  // Pastikan semua nilai numerik valid
  const numericFields = [
    'cashIn', 'cashInPhysical', 'cashInNonPhysical',
    'cashOut', 'cashOutPhysical', 'cashOutNonPhysical',
    'balance', 'balancePhysical', 'balanceNonPhysical'
  ];
  
  for (const field of numericFields) {
    if (this[field] === null || this[field] === undefined || isNaN(this[field])) {
      this[field] = 0;
    } else {
      // Konversi ke number dan pastikan tidak NaN
      this[field] = Number(this[field]);
      if (isNaN(this[field])) {
        this[field] = 0;
      }
    }
  }
  
  // Validasi tambahan untuk memastikan konsistensi
  if (this.cashIn === 0 && this.cashOut === 0) {
    // Ini mungkin transaksi transfer internal seperti penarikan tunai
    console.log('Zero cash flow transaction:', this.description);
  }
  
  next();
});

// Static method untuk mendapatkan saldo terakhir dengan safety
cashFlowSchema.statics.getSafeLastBalance = async function() {
  try {
    const lastEntry = await this.findOne().sort({ date: -1, createdAt: -1 });
    
    if (!lastEntry) {
      return { balance: 0, balancePhysical: 0, balanceNonPhysical: 0 };
    }

    return {
      balance: Number(lastEntry.balance) || 0,
      balancePhysical: Number(lastEntry.balancePhysical) || 0,
      balanceNonPhysical: Number(lastEntry.balanceNonPhysical) || 0
    };
  } catch (error) {
    console.error('Error in getSafeLastBalance:', error);
    return { balance: 0, balancePhysical: 0, balanceNonPhysical: 0 };
  }
};

const CashFlow = mongoose.model('CashFlow', cashFlowSchema);
  
export default CashFlow;