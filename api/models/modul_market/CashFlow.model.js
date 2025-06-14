import mongoose from "mongoose";

const cashFlowSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  day: String,
  description: String,
  cashIn: { type: Number, default: 0 },
  cashOut: { type: Number, default: 0 },
  balance: Number,
  source: { type: String },        // Sumber dana untuk cashIn (optional)
  destination: { type: String },   // tujuan dana yang dikirim
  relatedMarketList: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketList' },
  proof: String, // Bukti transaksi (optional)
  createdBy: String,
});

const Cashflow = mongoose.model('CashFlow', cashFlowSchema);
  
export default Cashflow;

export const getLastBalance = async () => {
  const lastEntry = await Cashflow.findOne().sort({ date: -1 });
  return lastEntry ? lastEntry.balance : 0;
};