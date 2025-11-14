// models/model_hr/RawFingerprint.model.js
import mongoose from 'mongoose';

const RawFingerprintSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  deviceUserId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  fingerprintData: {
    type: String,
    required: true
  },
  fingerprintIndex: {
    type: Number,
    required: true
  },
  isMapped: {
    type: Boolean,
    default: false
  },
  mappedToEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  lastStatus: {
    type: String,
    enum: ['checkIn', 'checkOut'],
    default: 'checkIn'
  },
  activityCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Index untuk pencarian yang efisien
RawFingerprintSchema.index({ deviceId: 1, deviceUserId: 1 });
RawFingerprintSchema.index({ isMapped: 1 });
RawFingerprintSchema.index({ mappedToEmployee: 1 });
RawFingerprintSchema.index({ lastActivity: -1 });

// Middleware untuk update activity count
RawFingerprintSchema.pre('save', function(next) {
  if (this.isModified('lastActivity')) {
    this.activityCount += 1;
  }
  next();
});

export default mongoose.model('RawFingerprint', RawFingerprintSchema);