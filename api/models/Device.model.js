import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['cashier senior', 'cashier junior', 'inventory', 'kitchen', 'drive-thru', 'waiter'],
    required: true
  },
  location: {
    type: String, // e.g., "Bar Depan", "Dapur", "Bar Belakang"
    required: true
  },
  deviceName: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Unik per outlet dan deviceId untuk mencegah duplikasi
DeviceSchema.index({ outlet: 1, deviceId: 1 }, { unique: true });

export const Device = mongoose.models.Device || mongoose.model('Device', DeviceSchema);
