import mongoose from 'mongoose';

const productStockSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true,
    unique: true 
  },
  currentStock: { 
    type: Number, 
    default: 0,
    min: 0
  },
  minStock: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  movements: [{
  quantity: { type: Number, required: true },
  type: { type: String, enum: ['in', 'out', 'adjustment'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  notes: String,
  date: { type: Date, default: Date.now }
}]

}, {
  timestamps: true,
  // Optimistic concurrency control
  optimisticConcurrency: true,
  versionKey: 'version'
});

// Index tambahan
productStockSchema.index({ productId: 1 }, { unique: true });
productStockSchema.index({ 'movements': 1 });

// Middleware untuk validasi
productStockSchema.pre('save', function(next) {
  if (this.isNew && this.currentStock < 0) {
    throw new Error('Stok awal tidak boleh negatif');
  }
  next();
});

const ProductStock = mongoose.model('ProductStock', productStockSchema);
export default ProductStock;