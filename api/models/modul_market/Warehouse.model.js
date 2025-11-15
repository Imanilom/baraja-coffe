// models/Warehouse.model.js
import mongoose from 'mongoose';
const warehouseSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true, lowercase: true }, // 'pusat', 'kitchen', 'bar-depan', 'bar-belakang', dst.
  name: { type: String, required: true }, // "Gudang Pusat", "Kitchen Amphi" ...
  type: { type: String, enum: ['central','department'], required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

warehouseSchema.index({ code: 1 }, { unique: true });
export default mongoose.model('Warehouse', warehouseSchema);
