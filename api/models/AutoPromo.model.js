import mongoose from 'mongoose';

const AutoPromoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  promoType: {
    type: String,
    enum: ['discount_on_quantity', 'discount_on_total', 'buy_x_get_y', 'bundling'],
    required: true
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

const AutoPromo = mongoose.model('AutoPromo', AutoPromoSchema);

export default AutoPromo;
