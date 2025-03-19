import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  addons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' }],
  toppings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topping' }],
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
  isPrinted: { type: Boolean, default: false },
});

// Model Order
const OrderSchema = new mongoose.Schema({
  user: { type: String, required: true },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  status: { type: String, enum: ['Pending', 'OnProcess', 'Completed', 'Canceled'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'E-Wallet', 'Debit'], required: true },
  orderType: { type: String, enum: ['Dine-In', 'Pickup', 'Delivery'], required: true },
  deliveryAddress: { type: String },
  tableNumber: { type: String },
<<<<<<< Updated upstream
  type: { type: String, enum: ['Indoor', 'Outdoor'], default: 'Indoor' },
=======
>>>>>>> Stashed changes
  voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
}, { timestamps: true });

// Virtual untuk menghitung total harga otomatis
OrderSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((total, item) => total + item.subtotal, 0);
});

// Indeks untuk mempercepat pencarian pesanan aktif
OrderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.model('Order', OrderSchema);
