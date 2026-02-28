import mongoose from 'mongoose';

const AutoPromoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  promoType: {
    type: String,
    enum: ['discount_on_quantity', 'discount_on_total', 'buy_x_get_y', 'bundling', 'product_specific'],
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: function () {
      // Required for discount-based promo types
      return ['discount_on_quantity', 'discount_on_total', 'product_specific'].includes(this.promoType);
    }
  },
  conditions: {
    minQuantity: Number,
    minTotal: Number,
    buyProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    getProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    bundleProducts: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
      },
      quantity: Number
    }],
    // New field for product-specific promo
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }]
  },
  discount: {
    type: Number,
    required: function () {
      return this.promoType !== 'buy_x_get_y';
    }
  },
  bundlePrice: {
    type: Number,
    required: function () {
      return this.promoType === 'bundling';
    }
  },
  consumerType: {
    type: String,
    default: 'all'
  },
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validTo: {
    type: Date,
    required: true
  },
  // New fields for active hours (happy hour)
  activeHours: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    schedule: [{
      dayOfWeek: {
        type: Number,
        min: 0, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        max: 6,
        required: false
      },
      startTime: {
        type: String, // Format: "HH:MM" in 24-hour format, e.g., "14:00" for 2 PM
        required: false,
        validate: {
          validator: function (v) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Start time must be in HH:MM format (24-hour)'
        }
      },
      endTime: {
        type: String, // Format: "HH:MM" in 24-hour format, e.g., "00:00" for midnight
        required: false,
        validate: {
          validator: function (v) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'End time must be in HH:MM format (24-hour)'
        }
      }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

/**
 * Middleware to check expiration before save
 */
AutoPromoSchema.pre('save', function (next) {
  if (this.validTo && new Date() > this.validTo) {
    this.isActive = false;
  }
  next();
});

/**
 * Middleware to check expiration before update
 */
AutoPromoSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.validTo && new Date() > new Date(update.validTo)) {
    update.isActive = false;
    this.setUpdate(update);
  }
  next();
});

/**
 * Static method to check if promo is currently active (considering active hours)
 */
AutoPromoSchema.statics.isPromoActive = function (promoId) {
  return this.findById(promoId).then(promo => {
    if (!promo || !promo.isActive) return false;

    // Check date validity
    const now = new Date();
    if (now < promo.validFrom || now > promo.validTo) return false;

    // If active hours is not enabled, promo is active
    if (!promo.activeHours.isEnabled) return true;

    // Check if current time is within active hours
    return promo.isWithinActiveHours(now);
  });
};

/**
 * Instance method to check if current time is within active hours
 */
AutoPromoSchema.methods.isWithinActiveHours = function (date = new Date()) {
  if (!this.activeHours.isEnabled) return true;

  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentTime = date.toTimeString().slice(0, 5); // "HH:MM" format

  // Find schedule for current day
  const todaySchedule = this.activeHours.schedule.find(
    schedule => schedule.dayOfWeek === dayOfWeek
  );

  if (!todaySchedule) return false;

  const { startTime, endTime } = todaySchedule;

  // Handle cases where end time crosses midnight
  if (endTime < startTime) {
    // End time is next day (e.g., 14:00 to 02:00)
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    // Normal case (e.g., 14:00 to 22:00)
    return currentTime >= startTime && currentTime <= endTime;
  }
};

/**
 * Instance method to get current active schedule
 */
AutoPromoSchema.methods.getCurrentSchedule = function () {
  if (!this.activeHours.isEnabled) return null;

  const now = new Date();
  const dayOfWeek = now.getDay();

  return this.activeHours.schedule.find(
    schedule => schedule.dayOfWeek === dayOfWeek
  );
};

/**
 * Instance method to calculate discount amount based on discount type
 */
AutoPromoSchema.methods.calculateDiscount = function (originalAmount) {
  if (!this.discount || !this.discountType) return 0;

  if (this.discountType === 'percentage') {
    // Ensure discount is between 0-100 for percentage
    const percentage = Math.min(Math.max(this.discount, 0), 100);
    return (originalAmount * percentage) / 100;
  } else if (this.discountType === 'fixed') {
    // For fixed amount, ensure discount doesn't exceed original amount
    return Math.min(this.discount, originalAmount);
  }
  
  return 0;
};

/**
 * Instance method to get formatted discount display
 */
AutoPromoSchema.methods.getDiscountDisplay = function () {
  if (!this.discount || !this.discountType) return 'No discount';

  if (this.discountType === 'percentage') {
    return `${this.discount}%`;
  } else if (this.discountType === 'fixed') {
    // Assuming currency formatting
    return `Rp${this.discount.toLocaleString()}`;
  }
  
  return this.discount.toString();
};

const AutoPromo = mongoose.model('AutoPromo', AutoPromoSchema);

export default AutoPromo;