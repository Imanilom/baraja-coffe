import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'mixed'],
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'unpaid', 'partial'],
    default: 'unpaid'
  },
  bankFrom: String,
  bankTo: String,
  recipientName: String,
  proofOfPayment: String,
  notes: String,
  amount: Number,
  amountPhysical: { type: Number, default: 0 },
  amountNonPhysical: { type: Number, default: 0 },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const marketListItemSchema = new mongoose.Schema({
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
  unit: {
    type: String,
    required: true
  },
  quantityRequested: {
    type: Number,
    required: true,
    min: 0
  },
  quantityPurchased: {
    type: Number,
    default: 0,
    min: 0
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierName: {
    type: String,
    required: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  amountCharged: {
    type: Number,
    default: 0,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  payment: paymentSchema,
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  requestItemId: String,
  purpose: {
    type: String,
    enum: ['replenish', 'direct_purchase'],
    default: 'direct_purchase'
  }
});

const additionalExpenseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: String,
  payment: paymentSchema
});

const marketListSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    default: Date.now 
  },
  day: String,
  items: [marketListItemSchema],
  additionalExpenses: [additionalExpenseSchema],
  relatedRequests: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Request' 
  }],
  createdBy: String,
  purpose: {
    type: String,
    enum: ['replenish', 'direct_purchase'],
    default: 'direct_purchase'
  },
  totalCharged: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  totalPhysical: { type: Number, default: 0 },
  totalNonPhysical: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

// Middleware: Hitung totals
marketListSchema.pre('save', function (next) {
  this.day = new Date(this.date).toLocaleDateString('id-ID', { weekday: 'long' });

  let totalCharged = 0;
  let totalPaid = 0;
  let totalPhysical = 0;
  let totalNonPhysical = 0;

  this.items.forEach(item => {
    item.amountCharged = item.quantityPurchased * item.pricePerUnit;
    item.remainingBalance = Math.max(0, item.amountCharged - item.amountPaid);

    totalCharged += item.amountCharged;
    totalPaid += item.amountPaid;

    // Hitung pembagian fisik/non-fisik
    if (item.payment && item.payment.method) {
      switch (item.payment.method) {
        case 'cash':
          totalPhysical += item.amountPaid;
          break;
        case 'card':
        case 'transfer':
          totalNonPhysical += item.amountPaid;
          break;
        case 'mixed':
          totalPhysical += item.payment.amountPhysical || 0;
          totalNonPhysical += item.payment.amountNonPhysical || 0;
          break;
        default:
          totalPhysical += item.amountPaid;
      }
    } else {
      totalPhysical += item.amountPaid;
    }
  });

  this.totalCharged = totalCharged;
  this.totalPaid = totalPaid;
  this.totalPhysical = totalPhysical;
  this.totalNonPhysical = totalNonPhysical;

  next();
});

const MarketList = mongoose.model('MarketList', marketListSchema);
export default MarketList;