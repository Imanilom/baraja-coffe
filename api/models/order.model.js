import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    addons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' }],
    toppings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topping' }],
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    isPrinted: { type: Boolean, default: false },
  });
  
  const OrderSchema = new mongoose.Schema({
    user: { type: String, required: true },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['Pending','OnProcess', 'Completed', 'Canceled'], default: 'Pending' },
    paymentMethod: { type: String, enum: ['Cash', 'Card', 'E-Wallet', 'Debit'], required: true },
    orderType: { type: String, enum: ['Dine-In', 'Pickup', 'Delivery'], required: true },
    deliveryAddress: { type: String },
    tableNumber: { type: String },
    type: { type: String, enum: ['Indoor', 'Outdoor'], default: 'Indoor' },
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
  }, { timestamps: true });
  
  export const Order = mongoose.model('Order', OrderSchema);
  
