import mongoose from 'mongoose';

const RawMaterialSchema = new mongoose.Schema({
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  minimumStock: { type: Number, required: true },
  supplier: { type: String },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export const RawMaterial = mongoose.model('RawMaterial', RawMaterialSchema);
