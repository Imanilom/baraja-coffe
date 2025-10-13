import mongoose from "mongoose";

const cashFlowSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  day: String,
  description: String,
  
  // Cash In
  cashIn: { type: Number, default: 0 },
  cashInPhysical: { type: Number, default: 0 },      // Uang fisik yang masuk
  cashInNonPhysical: { type: Number, default: 0 },   // Uang non-fisik yang masuk
  
  // Cash Out
  cashOut: { type: Number, default: 0 },
  cashOutPhysical: { type: Number, default: 0 },     // Uang fisik yang keluar
  cashOutNonPhysical: { type: Number, default: 0 },  // Uang non-fisik yang keluar
  
  // Saldo
  balance: Number,
  balancePhysical: { type: Number, default: 0 },     // Saldo uang fisik
  balanceNonPhysical: { type: Number, default: 0 },  // Saldo uang non-fisik
  
  // Informasi tambahan
  source: { type: String },
  destination: { type: String },
  paymentMethod: { type: String, enum: ['physical', 'non-physical', 'mixed'], default: 'physical' }, // Metode pembayaran
  relatedMarketList: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketList' },
  proof: String,
  createdBy: String,
});

const Cashflow = mongoose.model('CashFlow', cashFlowSchema);
  
export default Cashflow;

// Fungsi untuk mendapatkan saldo terakhir
export const getLastBalance = async () => {
  const lastEntry = await Cashflow.findOne().sort({ date: -1 });
  return lastEntry ? {
    balance: lastEntry.balance,
    balancePhysical: lastEntry.balancePhysical,
    balanceNonPhysical: lastEntry.balanceNonPhysical
  } : { balance: 0, balancePhysical: 0, balanceNonPhysical: 0 };
};