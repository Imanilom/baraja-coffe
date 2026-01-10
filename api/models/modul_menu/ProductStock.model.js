import mongoose from 'mongoose';

const productStockSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  category: { type: String }, // kategori utama
  currentStock: { type: Number, default: 0, min: 0 },
  minStock: { type: Number, default: 0, min: 0 },
  warehouse: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Warehouse',
  required: true
  },

  movements: [{
  quantity: { type: Number, required: true },
  type: { type: String, enum: ['in','out','adjustment','transfer'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  notes: String,
  sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },     // untuk out/transfer
  destinationWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },// untuk in/transfer
  handledBy: String,
  date: { type: Date, default: Date.now }
  }]

}, {
  timestamps: true,
  optimisticConcurrency: true,
  versionKey: 'version'
});

productStockSchema.index({ productId: 1, warehouse: 1 }, { unique: true });
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