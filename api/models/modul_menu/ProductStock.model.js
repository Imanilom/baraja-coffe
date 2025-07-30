// models/ProductStock.js
import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  quantity: { type: Number, required: true },
  type: { type: String, enum: ['in', 'out', 'adjustment'], required: true },
  referenceId: mongoose.Schema.Types.ObjectId, // ID Recipe/Transaction
  notes: String
}, { _id: true });

const productStockSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true,
    unique: true 
  },
  currentStock: { 
    type: Number, 
    default: 0 
  },
  minStock: { 
    type: Number, 
    default: 0 
  },
  movements: [stockMovementSchema]
});

// Auto-update currentStock
productStockSchema.pre('save', function(next) {
  this.currentStock = this.movements.reduce((total, move) => {
    return move.type === 'in' ? 
      total + move.quantity : 
      total - move.quantity;
  }, 0);
  next();
});

const ProductStock = mongoose.model('ProductStock', productStockSchema);

export default ProductStock;