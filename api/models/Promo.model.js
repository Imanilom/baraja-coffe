import mongoose from 'mongoose';

const PromoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  discountAmount: {
    type: Number,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  customerType: {
    type: String,
    required: true
  },
  outlet: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

const Promo = mongoose.model('Promo', PromoSchema);

export default Promo;
