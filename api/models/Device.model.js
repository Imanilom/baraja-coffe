// models/Device.model.js
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
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    enum: ['tablet', 'pos', 'kiosk', 'mobile'],
    default: 'tablet'
  },
  location: {
    type: String, // e.g., "Kasir Utama", "Bar Depan", "Drive Thru"
    required: true
  },
  // ✅ KONFIGURASI AREA YANG DITANGANI
  assignedAreas: [{
    type: String, // ['A', 'B', 'C'] atau ['J', 'K', 'L']
    uppercase: true
  }],
  assignedTables: [{
    type: String, // Table numbers yang ditangani
    uppercase: true
  }],
  // ✅ KONFIGURASI JENIS PESANAN
  orderTypes: [{
    type: String,
    enum: ['food', 'beverage', 'both'],
    default: 'both'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  socketId: {
    type: String,
    default: null
  },
  lastMaintenance: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

// Unik per outlet dan deviceId
DeviceSchema.index({ outlet: 1, deviceId: 1 }, { unique: true });

export const Device = mongoose.models.Device || mongoose.model('Device', DeviceSchema);