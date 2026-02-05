import mongoose from 'mongoose';

const MenuStockSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },
  type: { 
    type: String, 
    enum: ['waste', 'adjustment', 'sale', 'production', 'transfer'],
    default: 'adjustment'
  },
  quantity: { 
    type: Number, 
    default: 0
  },
  reason: { 
    type: String,
    enum: ['busuk', 'tidak_bagus', 'kedaluwarsa', 'rusak', 'hilang', 'lainnya', 'manual_adjustment', 'initial_setup','order_fulfillment', 'transfer_in', 'transfer_out'],
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
    default: 'system'
  },
  notes: { 
    type: String 
  },
  relatedWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    default: null
  },
  transferId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
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

// Compound index untuk unique stock per menu item per warehouse
MenuStockSchema.index({ menuItemId: 1, warehouseId: 1 }, { unique: true });

// Virtual: effectiveStock
MenuStockSchema.virtual('effectiveStock').get(function () {
  return this.manualStock !== null && this.manualStock !== undefined 
    ? this.manualStock 
    : this.calculatedStock;
});

// Index untuk performa query
MenuStockSchema.index({ menuItemId: 1 });
MenuStockSchema.index({ warehouseId: 1 });
MenuStockSchema.index({ lastCalculatedAt: -1 });
MenuStockSchema.index({ type: 1 });

// Middleware untuk auto-update currentStock
MenuStockSchema.pre('save', function(next) {
  this.currentStock = this.effectiveStock;
  next();
});

// Pastikan virtual muncul
MenuStockSchema.set('toJSON', { virtuals: true });
MenuStockSchema.set('toObject', { virtuals: true });

const MenuStock = mongoose.model('MenuStock', MenuStockSchema);
export default MenuStock;