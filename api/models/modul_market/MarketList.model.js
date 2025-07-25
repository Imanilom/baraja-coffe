import mongoose from 'mongoose';

// Skema untuk detail pembayaran (bukti pembayaran)
const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'card', 'transfer'],
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
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Skema item belanja
const marketListItemSchema = new mongoose.Schema({
  // Informasi Produk
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

  // Jumlah Request vs Belanja
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

  // Harga & Supplier
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

  // Pembayaran per Item
  amountCharged: {
    type: Number,
    default: 0,
    min: 0
  }, // total harga (quantity × price)
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  }, // jumlah dibayarkan
  remainingBalance: {
    type: Number,
    default: 0,
    min: 0
  }, // sisa utang

  payment: paymentSchema // Bukti pembayaran per item
});

// Skema pengeluaran tambahan
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
  payment: paymentSchema // Bukti pembayaran untuk pengeluaran tambahan
});

// Skema utama MarketList
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
  createdBy: String
});

// Middleware: Hitung amountCharged, remainingBalance, paymentStatus otomatis
marketListSchema.pre('save', function (next) {
  this.day = new Date(this.date).toLocaleDateString('id-ID', { weekday: 'long' });

  this.items.forEach(item => {
    item.amountCharged = item.quantityPurchased * item.pricePerUnit;
    item.remainingBalance = Math.max(0, item.amountCharged - item.amountPaid);

    if (item.amountPaid >= item.amountCharged) {
      item.paymentStatus = 'paid';
    } else if (item.amountPaid > 0) {
      item.paymentStatus = 'partial';
    } else {
      item.paymentStatus = 'unpaid';
    }
  });

  next();
});

const MarketList = mongoose.model('MarketList', marketListSchema);
export default MarketList;
