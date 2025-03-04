import mongoose from 'mongoose';

const OutletSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  contactNumber: { type: String, required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  outletPictures: {
    type: [String],
    default: ['https://placehold.co/600x400/png'],
  },
}, { timestamps: true });


export const Outlet = mongoose.model('Outlet', OutletSchema);
