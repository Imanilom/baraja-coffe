import mongoose from 'mongoose';

const OutletSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  location: { type: String, required: true },
  contactNumber: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  outletPictures: {
    type: [String],
    default: ['https://placehold.co/1920x1080/png'],
  },

  // ✅ Tambahan jam buka & tutup
  openTime: { type: String, required: true, default: '06:00' },  // format HH:mm
  closeTime: { type: String, required: true, default: '03:00' },

}, { timestamps: true });

export const Outlet = mongoose.model('Outlet', OutletSchema);
