import mongoose from 'mongoose';
import { Outlet } from '../models/Outlet.model.js';

const TaxAndServiceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['tax', 'service'],
    default: 'tax'
  },
  name: {
    type: String,
    required: [true, 'Nama pajak/layanan harus diisi'],
    trim: true,
    maxlength: [100, 'Nama tidak boleh lebih dari 100 karakter']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Deskripsi tidak boleh lebih dari 500 karakter']
  },
  percentage: {
    type: Number,
    min: [0, 'Persentase tidak boleh negatif'],
    max: [100, 'Persentase tidak boleh lebih dari 100%']
  },
  fixedFee: {
    type: Number,
    min: [0, 'Biaya tetap tidak boleh negatif']
  },
  appliesToOutlets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: [true, 'Harus memilih minimal satu outlet']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});



// Validation middleware
TaxAndServiceSchema.pre('save', async function (next) {
  if (this.type === 'tax' && (this.percentage === undefined || this.percentage === null)) {
    throw new Error('Pajak harus memiliki persentase');
  }

  if (this.type === 'service' && !this.percentage && !this.fixedFee) {
    throw new Error('Layanan harus memiliki persentase atau biaya tetap');
  }

  // Validate outlets
  if (this.appliesToOutlets.length === 0) {
    throw new Error('Harus memilih minimal satu outlet');
  }

  const outletCount = await Outlet.countDocuments({ _id: { $in: this.appliesToOutlets } });
  if (outletCount !== this.appliesToOutlets.length) {
    throw new Error('Beberapa outlet tidak valid');
  }

  next();
});

export const TaxAndService = mongoose.model('TaxAndService', TaxAndServiceSchema);