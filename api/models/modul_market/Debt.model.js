import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierName: { 
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productName: {
    type: String,
    required: true
  },
  productSku: {
    type: String,
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
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer'],
    required: true
  },
  marketListId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketList'
  },
  status: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  notes: String,
  createdBy: String,
  paidDate: Date,
  paidAmount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Middleware untuk validasi
debtSchema.pre('save', function(next) {
  if (this.paidAmount > this.amount) {
    throw new Error('Jumlah pembayaran tidak boleh melebihi jumlah hutang');
  }
  
  if (this.paidAmount === this.amount) {
    this.status = 'paid';
    this.paidDate = this.paidDate || new Date();
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  }
  
  next();
});

const Debt = mongoose.model('Debt', debtSchema);
export default Debt;