import mongoose from 'mongoose';

const OutletSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String },
    contactNumber: { type: String },
    OutletPicture: {
      type: String,
      default: 'https://placehold.co/600x400/png',
    },
  }, { timestamps: true });
  
  export const Outlet = mongoose.model('Outlet', OutletSchema);
  