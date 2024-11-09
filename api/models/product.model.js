import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    category: { 
        type: [String],
        required: true 
    },
    description: { 
        type: String 
    },
    price: { 
        type: Number, 
        required: true 
    },
    discount: { 
        type: Number, 
        default: 0 
    },
    stock: { 
        type: Number, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    productPicture: {
        type: String,
        default:
          'https://via.placeholder.com/1200x1200.jpg',
      },
    productBanner: {
        type: String,
        default:
          'https://via.placeholder.com/1200x400.jpg',
      },
      customizationOptions: [
        {
          option: { type: String, required: true },
          values: [{ type: String, required: true }],
        },
      ],
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
