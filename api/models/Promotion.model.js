import mongoose from 'mongoose';

const PromotionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  discountPercentage: { type: Number, required: true, min: 0, max: 100 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  applicableItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
}, { timestamps: true });

// Pastikan startDate lebih kecil dari endDate
PromotionSchema.pre('save', function (next) {
  if (this.startDate >= this.endDate) {
    return next(new Error('Tanggal mulai harus lebih kecil dari tanggal berakhir.'));
  }
  next();
});

PromotionSchema.index({ startDate: 1, endDate: 1 }); // Indeks untuk pencarian promosi aktif

export const Promotion = mongoose.models.Promotion || mongoose.model('Promotion', PromotionSchema);










// import mongoose from 'mongoose';

// // Check if the model is already registered
// const Promotion = mongoose.models.Promotion || mongoose.model('Promotion', new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   description: {
//     type: String,
//     trim: true,
//   },
//   discountPercentage: {
//     type: Number,
//     required: true,
//     min: 0,
//     max: 100,
//   },
//   startDate: {
//     type: Date,
//     required: true,
//   },
//   endDate: {
//     type: Date,
//     required: true,
//   },
//   applicableItems: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'MenuItem',
//   }],
// }, { timestamps: true }));

// export default Promotion;
