import mongoose from 'mongoose';

const OutletSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true }, // Dipisah dari `city`
  city: { type: String, required: true }, // Tambahan untuk penyortiran data lebih mudah
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  contactNumber: { type: String, required: true }, // Dijadikan wajib
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Manager yang mengelola outlet
  outletPictures: {
    type: [String],
    default: ['https://placehold.co/600x400/png'],
  },
}, { timestamps: true });


export const Outlet = mongoose.model('Outlet', OutletSchema);
