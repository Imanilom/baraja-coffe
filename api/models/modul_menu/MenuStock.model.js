// models/MenuStock.model.js - Versi diperbaiki
import mongoose from 'mongoose';

const MenuStockSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
    unique: true,
  },

  type: { 
    type: String, 
    enum: ['waste', 'adjustment', 'sale', 'production'],
    default: 'adjustment' // Default value
  },
  quantity: { 
    type: Number, 
    default: 0 // Default untuk initial creation
  },
  reason: { 
    type: String,
    enum: ['busuk', 'tidak_bagus', 'kedaluwarsa', 'rusak', 'hilang', 'lainnya', 'manual_adjustment', 'initial_setup'],
    default: 'initial_setup'
  },
  previousStock: { 
    type: Number, 
    default: 0 
  },
  currentStock: { 
    type: Number, 
    default: 0 
  },
  calculatedStock: {
    type: Number,
    default: 0,
    min: 0,
  },
  manualStock: {
    type: Number,
    default: null,
    min: 0,
  },
  adjustmentNote: {
    type: String,
    trim: true,
  },
  adjustedBy: {
     type: String,
      trim: true,
      default: null,
  },
  handledBy: { 
    type: String, 
    default: 'system' // Default value
  },
  notes: { 
    type: String 
  },
  lastCalculatedAt: {
    type: Date,
    default: Date.now,
  },
  lastAdjustedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Virtual: effectiveStock → prioritas manualStock jika ada, else calculatedStock
MenuStockSchema.virtual('effectiveStock').get(function () {
  return this.manualStock !== null && this.manualStock !== undefined 
    ? this.manualStock 
    : this.calculatedStock;
});

// Index untuk performa query
MenuStockSchema.index({ menuItemId: 1 });
MenuStockSchema.index({ lastCalculatedAt: -1 });
MenuStockSchema.index({ type: 1 });

// Middleware untuk auto-update currentStock berdasarkan effectiveStock
MenuStockSchema.pre('save', function(next) {
  this.currentStock = this.effectiveStock;
  next();
});

// Pastikan virtual muncul saat toJSON / toObject
MenuStockSchema.set('toJSON', { virtuals: true });
MenuStockSchema.set('toObject', { virtuals: true });

const MenuStock = mongoose.model('MenuStock', MenuStockSchema);
export default MenuStock;