import mongoose from 'mongoose';

const TaxAndServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['tax', 'service'],
  },
  description: {
    type: String,
    default: '',
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  fixedFee: {
    type: Number,
    min: 0,
  },
  appliesToOutlets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
    }
  ],
  appliesToMenuItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    }
  ],
  appliesToCustomerTypes: [
    {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'vip'],
    }
  ],
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

/**
 * Validasi custom:
 * - Tax wajib menggunakan percentage.
 * - Service bisa pakai fixedFee atau percentage, tapi salah satu wajib ada.
 */
TaxAndServiceSchema.pre('save', function (next) {
  if (this.name === 'tax') {
    if (typeof this.percentage !== 'number') {
      return next(new Error('Tax harus memiliki nilai percentage.'));
    }
    this.fixedFee = undefined;
  }

  if (this.name === 'service') {
    if (typeof this.percentage !== 'number' && typeof this.fixedFee !== 'number') {
      return next(new Error('Service harus memiliki percentage atau fixedFee.'));
    }
  }

  next();
});

export const TaxAndService = mongoose.model('TaxAndService', TaxAndServiceSchema);
