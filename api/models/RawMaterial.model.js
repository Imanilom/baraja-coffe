import mongoose from 'mongoose';
import { MenuItem } from './MenuItem.model.js'; 

const RawMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  quantity: { 
    type: Number, 
    required: true, 
    min: 0,
    validate: {
      validator: function(value) {
        return this.maximumStock ? value <= this.maximumStock : true;
      },
      message: 'Quantity cannot exceed maximum stock limit'
    }
  },
  unit: { type: String, required: true, trim: true },
  minimumStock: { type: Number, required: true, min: 0 },
  maximumStock: { type: Number, required: true, min: 1 },
  costPerUnit: { type: Number, required: true, min: 0 },
  supplier: { type: String },
  datein: { type: Date, default: Date.now },
  notes: { type: String },
  expiryDate: { type: Date },
  lastUpdated: { type: Date, default: Date.now },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  availableAt: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', index: true },
  status: { 
    type: String, 
    enum: ['Available', 'Low Stock', 'Out of Stock', 'Overstocked', 'Expired'], 
    default: 'Available' 
  }
}, { timestamps: true });

// Middleware: Update `lastUpdated` and `status` before saving
RawMaterialSchema.pre('save', function (next) {
  this.lastUpdated = new Date();

  if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'Expired';
  } else if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity < this.minimumStock) {
    this.status = 'Low Stock';
  } else if (this.maximumStock && this.quantity > this.maximumStock) {
    this.status = 'Overstocked';
  } else {
    this.status = 'Available';
  }

  next();
});

// Post-save hook to update related menu items
RawMaterialSchema.post('save', async function (doc) {
  if (doc.quantity < doc.minimumStock) {
    await MenuItem.updateMany(
      { 'rawMaterials.materialId': doc._id },
      { $set: { isActive: false } }
    );
  } else {
    await MenuItem.updateMany(
      { 'rawMaterials.materialId': doc._id, isActive: false },
      { $set: { isActive: true } }
    );
  }
});

export const RawMaterial = mongoose.model('RawMaterial', RawMaterialSchema);