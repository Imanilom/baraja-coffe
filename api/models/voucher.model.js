import mongoose from 'mongoose';

const VoucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  discountAmount: { type: Number, required: true, min: 0 },
  minimumOrder: { type: Number, default: 0, min: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  maxClaims: { type: Number, required: true, min: 1 },
  image: {
    type: String,
    default: 'https://placehold.co/1920x1080/png',
  },
}, { timestamps: true });

// Validasi tanggal voucher
VoucherSchema.pre('save', function (next) {
  if (this.startDate >= this.endDate) {
    return next(new Error('Tanggal mulai harus lebih kecil dari tanggal berakhir.'));
  }
  next();
});

VoucherSchema.index({ code: 1, isActive: 1 });

export const Voucher = mongoose.model('Voucher', VoucherSchema);





// import mongoose from 'mongoose';
// import { v4 as uuidv4 } from 'uuid';

// const VoucherSchema = new mongoose.Schema({
//   code: {
//     type: String,
//     unique: true,
//     default: uuidv4,
//     required: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   description: {
//     type: String
//   },
//   discountAmount: {
//     type: Number,
//     required: true
//   },
//   discountType: {
//     type: String,
//     enum: ['percentage', 'fixed'],
//     required: true
//   },
//   validFrom: {
//     type: Date,
//     required: true
//   },
//   validTo: {
//     type: Date,
//     required: true
//   },
//   quota: {
//     type: Number,
//     required: true
//   },
//   applicableOutlets: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Outlet'
//   }], // If empty, valid for all outlets
//   customerType: {
//     type: String,
//     required: true
//   },
//   printOnReceipt: {
//     type: Boolean,
//     default: false
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   }
// }, { timestamps: true });

// const Voucher = mongoose.model('Voucher', VoucherSchema);

// export default Voucher;
