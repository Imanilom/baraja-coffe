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
      ref: 'Product'
    }, // For 'buy_x_get_y'
    getProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }, // For 'buy_x_get_y'
    bundleProducts: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
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
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
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
