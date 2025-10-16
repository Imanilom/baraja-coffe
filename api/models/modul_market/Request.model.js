import mongoose from 'mongoose';

const RequestItemSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  productSku: String,
  category: String,
  quantity: { type: Number, required: true, min: 1 },
  unit: String,
  notes: String,
  status: { type: String, default: 'approved', enum: ['approved', 'fulfilled', 'partial', 'rejected'] },
  fulfilledQuantity: { type: Number, default: 0, min: 0 },
  availableStock: { type: Number, default: 0 },
  minimumRequest: { type: Number, default: 0 },
  sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  destinationWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  processedAt: Date,
  processedBy: String,
  type: { type: String, enum: ['transfer', 'purchase'], default: 'transfer' }
});

const RequestSchema = new mongoose.Schema({
  requestedWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  requester: { type: String, required: true },
  transferItems: [RequestItemSchema],
  purchaseItems: [RequestItemSchema],
  status: { 
    type: String, 
    default: 'approved', 
    enum: ['approved', 'rejected']
  },
  fulfillmentStatus: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'partial', 'fulfilled', 'excess']
  },
  processedBy: String,
  processedAt: Date,
  date: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: hitung persentase terpenuhi
RequestSchema.virtual('fulfillmentPercentage').get(function() {
  const allItems = [...(this.transferItems || []), ...(this.purchaseItems || [])];
  if (allItems.length === 0) return 0;

  const totalRequested = allItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalFulfilled = allItems.reduce((sum, item) => sum + (item.fulfilledQuantity || 0), 0);

  return totalRequested > 0 ? Math.round((totalFulfilled / totalRequested) * 100) : 0;
});

// Middleware: hitung summary
RequestSchema.pre('save', function(next) {
  const allItems = [...(this.transferItems || []), ...(this.purchaseItems || [])];
  this.totalItems = allItems.length;
  this.totalQuantity = allItems.reduce((sum, item) => sum + item.quantity, 0);
  this.fulfilledItems = allItems.filter(item => (item.fulfilledQuantity || 0) > 0).length;
  
  // Auto-update fulfillmentStatus berdasarkan items
  const allFulfilled = allItems.every(item => (item.fulfilledQuantity || 0) >= item.quantity);
  const someFulfilled = allItems.some(item => (item.fulfilledQuantity || 0) > 0);
  
  if (allFulfilled) {
    this.fulfillmentStatus = 'fulfilled';
  } else if (someFulfilled) {
    this.fulfillmentStatus = 'partial';
  } else {
    this.fulfillmentStatus = 'pending';
  }
  
  next();
});

// Indexes
RequestSchema.index({ date: -1 });
RequestSchema.index({ requestedWarehouse: 1, status: 1 });
RequestSchema.index({ requester: 1, date: -1 });
RequestSchema.index({ status: 1, fulfillmentStatus: 1 });

const Request = mongoose.model('Request', RequestSchema);
export default Request;