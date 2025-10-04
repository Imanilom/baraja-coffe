// models/MenuItem.js

import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  mainCategory: {
    type: String, // Main category type (e.g., "food", "beverage")
    enum: ['makanan', 'minuman', 'instan', 'dessert', 'snack', 'event'],
    default: 'makanan'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    // required: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  imageURL: {
    type: String,
    default: 'https://placehold.co/1920x1080/png'
  },
  costPrice: { // Harga pokok produksi (auto-calculated)
    type: Number,
    default: 0
  },
  availableStock: { // Porsi tersedia (auto-calculated)
    type: Number,
    default: 0
  },
  toppings: [
    {
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  addons: [
    {
      name: {
        type: String,
        required: true
      },
      options: [
        {
          label: {
            type: String,
            required: true
          },
          price: {
            type: Number,
            required: true
          },
          isDefault: {
            type: Boolean,
            default: false
          }
        }
      ]
    }
  ],
  availableAt: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet'
    }
  ],
  workstation:
  {
    type: String,
    enum: ['kitchen', 'bar', 'bar-belakang'],
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Auto-update costPrice
MenuItemSchema.pre('save', async function (next) {
  if (this.isModified('toppings') || this.isModified('addons')) {
    const recipe = await mongoose.model('Recipe').findOne({ menuItemId: this._id });
    if (recipe) {
      let totalCost = 0;
      // Hitung harga dasar
      for (const ing of recipe.baseIngredients) {
        const product = await mongoose.model('Product').findById(ing.productId);
        if (product) totalCost += (product.suppliers[0]?.price || 0) * ing.quantity;
      }
      this.costPrice = totalCost;
    }
  }
  next();
});

export const MenuItem = mongoose.model('MenuItem', MenuItemSchema);