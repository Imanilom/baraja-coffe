import mongoose from 'mongoose';

// Helper function untuk mendapatkan waktu WIB sekarang
const getWIBNow = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

// Helper function untuk convert Date ke WIB
const toWIB = (date) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

const OrderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  quantity: { type: Number, min: 1 },
  subtotal: { type: Number, min: 0 },
  addons: [{ name: String, price: Number }],
  toppings: [{ name: String, price: Number }],
  notes: { type: String, default: '' },
  batchNumber: { type: Number, default: 1 },
  addedAt: {
    type: Date,
    default: () => getWIBNow() // Simpan dalam WIB
  },
  kitchenStatus: {
    type: String,
    enum: ['pending', 'printed', 'cooking', 'ready', 'served'],
    default: 'pending'
  },
  isPrinted: { type: Boolean, default: false },
  printedAt: {
    type: Date,
    set: function (date) {
      return date ? toWIB(date) : date;
    }
  },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  outletName: { type: String },
  payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null }
});

// Model Order
const OrderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user: { type: String, required: true, default: 'Guest' },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [OrderItemSchema],
  status: {
    type: String,
    enum: ['Pending', 'Waiting', 'Reserved', 'OnProcess', 'Completed', 'Canceled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'QRIS', 'E-Wallet', 'Debit', 'Bank Transfer', 'No Payment'],
  },
  orderType: {
    type: String,
    enum: ['Dine-In', 'Pickup', 'Delivery', 'Take Away', 'Reservation', 'Event'],
    required: true
  },
  deliveryAddress: { type: String },
  tableNumber: { type: String },
  pickupTime: {
    type: String,
    // Untuk waktu pickup, simpan sebagai string dalam format WIB
  },
  type: { type: String, enum: ['Indoor', 'Outdoor'], default: 'Indoor' },
  isOpenBill: { type: Boolean, default: false },
  originalReservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },

  // Diskon & Promo
  discounts: {
    autoPromoDiscount: { type: Number, default: 0 },
    manualDiscount: { type: Number, default: 0 },
    voucherDiscount: { type: Number, default: 0 }
  },
  appliedPromos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Promo' }],
  appliedManualPromo: { type: mongoose.Schema.Types.ObjectId, ref: 'Promo' },
  appliedVoucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },

  // Pajak dan Service Fee
  taxAndServiceDetails: [{
    type: { type: String, enum: ['tax', 'service'], required: true },
    name: String,
    amount: Number
  }],
  totalTax: { type: Number, default: 0 },
  totalServiceFee: { type: Number, default: 0 },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },

  // Total akhir
  totalBeforeDiscount: { type: Number, required: true },
  totalAfterDiscount: { type: Number, required: true },
  grandTotal: { type: Number, required: true },

  // Sumber order
  source: { type: String, enum: ['Web', 'App', 'Cashier', 'Waiter'], required: true },
  currentBatch: { type: Number, default: 1 },
  lastItemAddedAt: {
    type: Date,
    set: function (date) {
      return date ? toWIB(date) : date;
    }
  },
  kitchenNotifications: [{
    batchNumber: Number,
    sentAt: {
      type: Date,
      default: () => getWIBNow()
    },
    type: { type: String, enum: ['new_batch', 'additional_items'] }
  }],

  // Reservation reference
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },

  // ✅ TAMBAHAN: Simpan waktu dalam WIB secara eksplisit
  createdAtWIB: {
    type: Date,
    default: () => getWIBNow()
  },
  updatedAtWIB: {
    type: Date,
    default: () => getWIBNow()
  }

}, {
  timestamps: true, // Ini akan tetap menyimpan UTC
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields untuk menampilkan waktu dalam WIB
OrderSchema.virtual('createdAtWIBFormatted').get(function () {
  return this.createdAt ? this.formatToWIB(this.createdAt) : null;
});

OrderSchema.virtual('updatedAtWIBFormatted').get(function () {
  return this.updatedAt ? this.formatToWIB(this.updatedAt) : null;
});

// Method untuk format WIB
OrderSchema.methods.formatToWIB = function (date) {
  if (!date) return null;
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Method untuk mendapatkan tanggal WIB (tanpa waktu)
OrderSchema.methods.getWIBDate = function () {
  const date = this.createdAt || new Date();
  return date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Pre-save middleware untuk update updatedAtWIB
OrderSchema.pre('save', function (next) {
  this.updatedAtWIB = getWIBNow();
  next();
});

// Virtual untuk totalPrice
// Virtual untuk totalPrice - PERBAIKAN
OrderSchema.virtual('totalPrice').get(function () {
  // Tambahkan null check
  if (!this.items || !Array.isArray(this.items)) {
    return 0;
  }
  return this.items.reduce((total, item) => total + item.subtotal, 0);
});

// Indeks untuk mempercepat pencarian pesanan aktif
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ isOpenBill: 1, originalReservationId: 1 });
OrderSchema.index({ reservation: 1 });
OrderSchema.index({ createdAtWIB: -1 }); // Index untuk pencarian berdasarkan WIB

// Skema untuk riwayat pemindahan meja
OrderSchema.add({
  transferHistory: [{
    fromTable: String,
    toTable: String,
    transferredBy: String, // Nama GRO yang mentransfer
    reason: String,
    transferredAt: {
      type: Date,
      default: () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
    }
  }]
});

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);