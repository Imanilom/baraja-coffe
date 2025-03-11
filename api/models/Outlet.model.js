import mongoose from 'mongoose';

const OutletSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  contactNumber: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  outletPictures: {
    type: [String],
    default: ['https://placehold.co/600x400/png'],
  },
}, { timestamps: true });


export const Outlet = mongoose.model('Outlet', OutletSchema);
