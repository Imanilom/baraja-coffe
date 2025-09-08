import mongoose from 'mongoose';

const productStockSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  category: { type: String, required: true }, // kategori utama
  currentStock: { type: Number, default: 0, min: 0 },
  minStock: { type: Number, default: 0, min: 0 },
  movements: [{
    quantity: { type: Number, required: true },
    type: { type: String, enum: ['in','out','adjustment'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null }, // misal: orderId, adjustmentId
    notes: String,
    destination: String, // misal: 'Bar Depan Amphi', 'Dapur'
    handledBy: String, // userId atau nama staff
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  optimisticConcurrency: true,
  versionKey: 'version'
});

// index unik untuk kombinasi productId + category
productStockSchema.index({ productId: 1, category: 1 }, { unique: true });

// Index tambahan
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