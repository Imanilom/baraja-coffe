import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true 
    },
    price: { 
      type: Number, 
      required: true 
    },
    description: { 
      type: String 
    },
    category: { 
      type: String, 
      required: true 
    },
    stock: { 
      type: Number, 
      default: 0 
    },
    imageURL: { 
      type: String 
    },
    toppings: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Topping' 
      }
    ],
    addOns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AddOn',
      },
    ],
  }, { timestamps: true });
  
  export const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
  