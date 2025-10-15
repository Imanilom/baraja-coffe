// models/DeviceSession.model.js
import mongoose from 'mongoose';

const DeviceSessionSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  socketId: {
    type: String,
    default: ''
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index untuk pencarian session aktif
DeviceSessionSchema.index({ device: 1, isActive: 1 });
DeviceSessionSchema.index({ user: 1, isActive: 1 });
DeviceSessionSchema.index({ outlet: 1, isActive: 1 });

export const DeviceSession = mongoose.models.DeviceSession || mongoose.model('DeviceSession', DeviceSessionSchema);