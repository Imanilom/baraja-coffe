import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    enum: ['fingerprint', 'rfid', 'nfc'],
    default: 'fingerprint'
  },
  location: {
    type: String, // lokasi penempatan device
    required: true
  },
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  macAddress: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: null
  },
  batteryLevel: {
    type: Number,
    default: null
  },
  firmwareVersion: {
    type: String,
    default: '1.0.0'
  },
  settings: {
    syncInterval: { type: Number, default: 30 }, // detik
    maxUsers: { type: Number, default: 1000 },
    beepEnabled: { type: Boolean, default: true }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Device = mongoose.model('FingerDevice', DeviceSchema);
export default Device;