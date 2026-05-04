import mongoose from "mongoose";

const foodPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  packageType: {
    type: String,
    enum: ['silver', 'gold', 'platinum', 'custom', 'ekonomis', 'premium'],
    required: true
  },
  description: String,
  pricePerPax: {
    type: Number,
    required: true
  },
  minPax: {
    type: Number,
    required: true,
    default: 50
  },
  maxPax: Number,
  // Menggunakan MenuItem sebagai referensi
  menuItems: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    quantityPerPax: {
      type: Number,
      default: 1
    },
    category: {
      type: String,
      enum: ['appetizer', 'main_course', 'dessert', 'beverage', 'snack']
    }
  }],
  includedAddons: [{
    addon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    quantity: Number,
    priceIncluded: {
      type: Boolean,
      default: true
    }
  }],
  optionalAddons: [{
    addon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    price: Number,
    priceType: {
      type: String,
      enum: ['per_pax', 'per_item', 'fixed']
    }
  }],
  servingStyle: {
    type: String,
    enum: ['buffet', 'prasmanan', 'plate_service', 'family_style'],
    default: 'buffet'
  },
  preparationTime: Number, // in hours
  images: [String],
  isAvailable: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

// Virtual untuk menghitung total menu items per kategori
foodPackageSchema.virtual('menuSummary').get(function() {
  const summary = {
    appetizers: 0,
    main_courses: 0,
    desserts: 0,
    beverages: 0,
    snacks: 0
  };
  
  this.menuItems.forEach(item => {
    if (summary[item.category]) {
      summary[item.category]++;
    }
  });
  
  return summary;
});

const FoodPackage = mongoose.model("FoodPackage", foodPackageSchema);
export default FoodPackage;