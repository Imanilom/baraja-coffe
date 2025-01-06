import mongoose from 'mongoose';

const OutletSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  contactNumber: { type: String },
  latitude: { type: Number, required: true }, 
  longitude: { type: Number, required: true }, 
  outletPictures: {
    type: [String],
    default: ['https://placehold.co/600x400/png'], // Gambar default
  },
}, { timestamps: true });

export const Outlet = mongoose.model('Outlet', OutletSchema);
