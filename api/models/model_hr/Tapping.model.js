import mongoose from 'mongoose';

const TappingSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  noid: {
    type: Number,
    required: true
  },
  tapTime: {
    type: Date,
    required: true
  },
  verifyMode: {
    type: String,
    default: 'fingerprint'
  },
  
  // Data mapping
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  tapType: {
    type: String,
    enum: ['in', 'out', 'auto'],
    default: 'auto'
  },
  
  // Status processing
  status: {
    type: String,
    enum: ['pending', 'processed', 'error', 'duplicate'],
    default: 'pending'
  },
  errorMessage: String,
  
  // Metadata
  deviceTime: String,
  batteryLevel: Number,
  signalStrength: Number,
  
  // Log processing
  processedAt: Date,
  attendanceRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    default: null
  }

}, { timestamps: true });

// Index untuk performa query
TappingSchema.index({ employee: 1, tapTime: 1 });
TappingSchema.index({ deviceId: 1, noid: 1, tapTime: 1 });

const Tapping = mongoose.model('Tapping', TappingSchema);
export default Tapping;