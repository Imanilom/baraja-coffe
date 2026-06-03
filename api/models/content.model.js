import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['banner', 'promo', 'voucher'],
    required: true,
  },
  imageUrls: {
    type: [String],
    default: ['https://placehold.co/1920x1080/png'], 
  },
  description: {
    type: String,
    required: true,
  },
  createdBy: { // Menyimpan informasi tentang siapa yang membuat konten
    type: String, 
    required: true,
  },
  startDate: { // Kapan konten mulai berlaku
    type: Date,
    required: true,
  },
  endDate: { // Kapan konten berakhir
    type: Date,
    required: true,
  },
}, { timestamps: true });

const Content = mongoose.model('Content', contentSchema);

export default Content;
