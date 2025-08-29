
import mongoose from 'mongoose';

const OutletSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true }, // Dipisah dari `city`
  city: { type: String, required: true }, // Tambahan untuk penyortiran data lebih mudah
  location: { type: String, required: true },
  contactNumber: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  outletPictures: {
    type: [String],
    default: ['https://placehold.co/1920x1080/png'],
  },
}, { timestamps: true });


export const Outlet = mongoose.model('Outlet', OutletSchema);
