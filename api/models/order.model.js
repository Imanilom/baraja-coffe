import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    order_id: { 
        type: Number, 
        required: true 
    },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            customization: { type: [String] },
            price: { type: Number, required: true },
            notes: { type: String },
        }
    ],

    totalPrice: { 
        type: Number, 
        required: true 
    },
    discount: { 
        type: Number, 
        default: 0 
    },
    customerName: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, enum: ['pending', 'completed', 'canceled'], 
        default: 'pending' 
    },
    types: { 
        type: String, enum: ['pickup', 'dinein', 'delivery'], 
        required: true 
    },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
