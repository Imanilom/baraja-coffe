import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', },
  quantity: { type: Number, min: 1 },
  subtotal: { type: Number, min: 0 },
  addons: [{ name: String, price: Number }],
  toppings: [{ name: String, price: Number }],
  notes: { type: String, default: '' },
  isPrinted: { type: Boolean, default: false },

  // ✅ Tambahan untuk outlet
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  outletName: { type: String },

  // ✅ Tambahan untuk paymnet
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
    enum: ['Cash', 'Card', 'E-Wallet', 'Debit', 'Bank Transfer', 'No Payment'],
  },
  orderType: {
    type: String,
    enum: ['Dine-In', 'Pickup', 'Delivery', 'Take Away', 'Reservation', 'Event'],
    required: true
  },
  deliveryAddress: { type: String },
  tableNumber: { type: String },
  pickupTime: { type: String },
  type: { type: String, enum: ['Indoor', 'Outdoor'], default: 'Indoor' },

  // ✅ NEW: Open Bill fields
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

  // Reservation reference
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }

}, { timestamps: true });

// Virtual untuk totalPrice (sebelum diskon & pajak, tetap disediakan)
OrderSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((total, item) => total + item.subtotal, 0);
});

// Indeks untuk mempercepat pencarian pesanan aktif
OrderSchema.index({ status: 1, createdAt: -1 });

// ✅ NEW: Index for open bill orders
OrderSchema.index({ isOpenBill: 1, originalReservationId: 1 });
OrderSchema.index({ reservation: 1 });

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);