import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
  addons: [{ name: String, price: Number }],
  toppings: [{ name: String, price: Number }],
  notes: { type: String, default: '' },
  isPrinted: { type: Boolean, default: false },
});

// Model Order
const OrderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user: { type: String, required: true, default: 'Guest' },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [OrderItemSchema],
  status: {
    type: String,
    enum: ['Pending', 'Waiting', 'OnProcess', 'Completed', 'Canceled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'E-Wallet', 'Debit', 'Bank Transfer']
  },
  orderType: {
    type: String,
    enum: ['Dine-In', 'Pickup', 'Delivery', 'Reservation'],
    required: true
  },
  deliveryAddress: { type: String },
  tableNumber: { type: String },
  type: { type: String, enum: ['Indoor', 'Outdoor'], default: 'Indoor' },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },

  // Diskon & Promo
  discounts: {
    autoPromoDiscount: { type: Number, default: 0 },
    manualDiscount: { type: Number, default: 0 },
    voucherDiscount: { type: Number, default: 0 }
  },
  appliedPromos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Promo' }],
  appliedManualPromo: { type: mongoose.Schema.Types.ObjectId, ref: 'Promo' },
  appliedVoucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },

  // // Pajak dan Service Fee
  taxAndServiceDetails: [{
    type: { type: String, enum: ['Tax', 'Service'], required: true },
    name: String,
    amount: Number
  }],
  totalTax: { type: Number, default: 0 },
  totalServiceFee: { type: Number, default: 0 },

  // // Total akhir
  totalBeforeDiscount: { type: Number, required: true },
  totalAfterDiscount: { type: Number, required: true },
  grandTotal: { type: Number, required: true },

  // Sumber order
  source: { type: String, enum: ['Web', 'App', 'Cashier'], required: true }

}, { timestamps: true });

// Virtual untuk totalPrice (sebelum diskon & pajak, tetap disediakan)
OrderSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((total, item) => total + item.subtotal, 0);
});

// Indeks untuk mempercepat pencarian pesanan aktif
OrderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
