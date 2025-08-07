import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productStockId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductStock' },
  quantity: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['in', 'out', 'adjustment'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  referenceType: { type: String, enum: ['MarketList', 'Request', 'Adjustment'], required: true },
  notes: String,
  createdBy: String
}, { timestamps: true });

// Index untuk performa
stockMovementSchema.index({ productId: 1 });
stockMovementSchema.index({ referenceId: 1, referenceType: 1 });
stockMovementSchema.index({ date: -1 });
stockMovementSchema.index({ productStockId: 1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
export default StockMovement;