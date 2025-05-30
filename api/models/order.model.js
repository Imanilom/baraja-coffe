import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
  addons: [{ name: String, price: Number }],
  toppings: [{ name: String, price: Number }],
  isPrinted: { type: Boolean, default: false },
});

// Model Order
const OrderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user: { type: String, required: true, default: 'Guest' },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [OrderItemSchema],
  notes: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'OnProcess', 'Completed', 'Canceled'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'E-Wallet', 'Debit', 'Bank Transfer'] },
  orderType: { type: String, enum: ['Dine-In', 'Pickup', 'Delivery'], required: true },
  deliveryAddress: { type: String },
  tableNumber: { type: String },
  type: { type: String, enum: ['Indoor', 'Outdoor'], default: 'Indoor' },
  voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  promotions: [{ type: String }],
  source: { type: String, enum: ['Web', 'App', 'Cashier'], required: true },
}, { timestamps: true });

// Virtual untuk menghitung total harga otomatis
OrderSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((total, item) => total + item.subtotal, 0);
});

// Indeks untuk mempercepat pencarian pesanan aktif
OrderSchema.index({ status: 1, createdAt: -1 });

// export const Order = mongoose.model('Order', OrderSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

