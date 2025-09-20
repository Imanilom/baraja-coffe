import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    addons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' }],
    toppings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topping' }],
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
});

const CartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [CartItemSchema],
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
    createdAt: { type: Date, default: Date.now },
});

// Virtual untuk menghitung total harga otomatis
CartSchema.virtual('totalPrice').get(function () {
    return this.items.reduce((total, item) => total + item.subtotal, 0);
});

export const Cart = mongoose.model('Cart', CartSchema);
