// models/MarketList.js
import mongoose from 'mongoose';

const marketListItemSchema = new mongoose.Schema({
  item: String,
  category: { type: String, enum: ['food', 'beverages', 'packaging', 'instan', 'perlengkapan'] },
  quantity: { type: Number, min: 0 },
  unit: String,
  price: { type: Number, min: 0 },
  total: { type: Number, min: 0 },
  supplier: String,
});

const paymentSchema = new mongoose.Schema({
  type: { type: String, enum: ['offline', 'online'] },
  method: { type: String, enum: ['cash', 'card', 'transfer'], required: true },
  status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  bankFrom: String,       // hanya untuk online
  bankTo: String,         // hanya untuk online
  recipientName: String,  // hanya untuk online
  proof: String, // URL or path to the proof of payment document
  notes: String,
});

const additionalExpenseSchema = new mongoose.Schema({
  name: String,
  amount: { type: Number, min: 0 },
  notes: String
});

const marketListSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  day: String,
  items: [marketListItemSchema],
  additionalExpenses: [additionalExpenseSchema], // <== TAMBAHAN
  relatedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Request' }],
  payment: paymentSchema,
  createdBy: String,
});

const MarketList = mongoose.model('MarketList', marketListSchema);

export default MarketList;
