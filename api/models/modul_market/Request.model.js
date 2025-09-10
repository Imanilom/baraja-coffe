import mongoose from 'mongoose';

const requestItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productSku: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['food', 'beverages', 'packaging', 'instan', 'perlengkapan'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  },
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'dibeli', 'lebih', 'kurang', 'tidak tersedia'],
    default: 'pending'
  },
  fulfilledQuantity: {
    type: Number,
    default: 0
  },
  // Field tambahan untuk tracking
  availableStock: {
    type: Number,
    default: 0
  },
  minimumRequest: {
    type: Number,
    default: 1
  },
  processedAt: Date,
  processedBy: String
});

const requestSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  requester: {
    type: String,
    required: true
  },
  requestedWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true }, // misal: 'kitchen' atau 'bar-depan'

  items: [requestItemSchema],
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: String,
  reviewedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  fulfillmentStatus: {
    type: String,
    enum: ['pending', 'dibeli', 'lebih', 'kurang', 'tidak tersedia', 'partial'],
    default: 'pending'
  },
  // Field tambahan
  rejectionReason: String,
  totalItems: {
    type: Number,
    default: function() {
      return this.items.length;
    }
  },
  totalQuantity: {
    type: Number,
    default: function() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
  },
  fulfilledItems: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  // Tracking purchase yang dilakukan untuk fulfill request ini
  purchaseItems: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: Number,
    notes: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual untuk menghitung fulfillment percentage
requestSchema.virtual('fulfillmentPercentage').get(function() {
  if (this.items.length === 0) return 0;
  
  const totalRequested = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalFulfilled = this.items.reduce((sum, item) => sum + item.fulfilledQuantity, 0);
  
  return totalRequested > 0 ? Math.round((totalFulfilled / totalRequested) * 100) : 0;
});

// Index untuk performance
requestSchema.index({ date: -1 });
requestSchema.index({ department: 1, status: 1 });
requestSchema.index({ requester: 1, date: -1 });
requestSchema.index({ status: 1, fulfillmentStatus: 1 });

// Middleware untuk update fulfillment summary
requestSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalItems = this.items.length;
    this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.fulfilledItems = this.items.filter(item => item.fulfilledQuantity > 0).length;
  }
  next();
});

const Request = mongoose.model('Request', requestSchema);
export default Request;