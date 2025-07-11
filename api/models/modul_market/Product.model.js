import mongoose from 'mongoose';

const productSupplierSchema = new mongoose.Schema({
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Supplier', 
    required: true 
  },
  supplierName: String,
  price: { 
    type: Number, 
    min: 0 
  }, // Harga terakhir dari supplier ini
  lastPurchaseDate: Date,
});

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['food', 'beverages', 'packaging', 'instan', 'perlengkapan'],
    required: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  suppliers: [productSupplierSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;