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
    type: String,
    enum: ['makanan', 'minuman', 'instan', 'dessert', 'snack', 'event'],
    default: 'makanan'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  imageURL: {
    type: String,
    default: 'https://placehold.co/1920x1080/png'
  },
  costPrice: {
    type: Number,
    default: 0
  },
  availableStock: {
    type: Number,
    default: 0
  },
  
  // ✅ NEW: Event-specific fields
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  isEventItem: {
    type: Boolean,
    default: false
  },
  eventType: {
    type: String,
    enum: ['paid', 'free'],
    default: 'paid'
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
  workstation: {
    type: String,
    enum: ['kitchen', 'bar'],
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Auto-update costPrice (disesuaikan untuk event)
MenuItemSchema.pre('save', async function (next) {
  // Skip cost calculation for event items
  if (this.isEventItem) {
    return next();
  }
  
  if (this.isModified('toppings') || this.isModified('addons')) {
    const recipe = await mongoose.model('Recipe').findOne({ menuItemId: this._id });
    if (recipe) {
      let totalCost = 0;
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