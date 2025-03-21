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
    minQuantity: Number, // For 'discount_on_quantity'
    minTotal: Number, // For 'discount_on_total'
    buyProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }, // For 'buy_x_get_y'
    getProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }, // For 'buy_x_get_y'
    bundleProducts: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
      },
      quantity: Number
    }], // For 'bundling'
  },
  discount: {
    type: Number, // Discount percentage or fixed amount
    required: function() {
      return this.promoType !== 'buy_x_get_y';
    }
  },
  bundlePrice: {
    type: Number,
    required: function() {
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

const AutoPromo = mongoose.model('AutoPromo', AutoPromoSchema);

export default AutoPromo;
