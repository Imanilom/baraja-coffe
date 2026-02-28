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
    enum: ['makanan', 'minuman', 'instan', 'dessert', 'snack', 'event', 'bazar'],
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

  // ✅ NEW: Warehouse specific stocks
  warehouseStocks: [
    {
      warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
      },
      stock: {
        type: Number,
        default: 0,
        min: 0
      },
      workstation: String // workstation yang bertanggung jawab
    }
  ],

  // ✅ NEW: Mapping workstation ke warehouse
  workstationMapping: [
    {
      workstation: {
        type: String,
        enum: ['kitchen', 'bar'],
        required: true
      },
      warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
      },
      isPrimary: {
        type: Boolean,
        default: true
      }
    }
  ],

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
    enum: ['kitchen', 'bar' ],
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Virtual: Get primary warehouse based on workstation
MenuItemSchema.virtual('primaryWarehouseId').get(function() {
  if (!this.workstation || !this.workstationMapping || this.workstationMapping.length === 0) {
    return null;
  }
  
  const mapping = this.workstationMapping.find(m => 
    m.workstation === this.workstation && m.isPrimary
  );
  
  return mapping ? mapping.warehouseId : null;
});

// Method: Get stock for specific warehouse
MenuItemSchema.methods.getStockForWarehouse = function(warehouseId) {
  const warehouseStock = this.warehouseStocks.find(ws => 
    ws.warehouseId.toString() === warehouseId.toString()
  );
  
  return warehouseStock ? warehouseStock.stock : 0;
};

// Method: Update stock for specific warehouse
MenuItemSchema.methods.updateStockForWarehouse = function(warehouseId, newStock) {
  const index = this.warehouseStocks.findIndex(ws => 
    ws.warehouseId.toString() === warehouseId.toString()
  );
  
  if (index >= 0) {
    this.warehouseStocks[index].stock = Math.max(0, newStock);
  } else {
    this.warehouseStocks.push({
      warehouseId,
      stock: Math.max(0, newStock)
    });
  }
  
  // Update total available stock
  this.availableStock = this.warehouseStocks.reduce((total, ws) => total + ws.stock, 0);
  
  return this.save();
};

// Auto-update costPrice
MenuItemSchema.pre('save', async function (next) {
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