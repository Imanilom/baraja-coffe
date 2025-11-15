import mongoose from 'mongoose';

const TappingSchema = new mongoose.Schema({
  // Data dari ESP device
  deviceId: {
    type: String,
    required: true
  },
  noid: {
    type: Number, // noid finger dari device
    required: true
  },
  tapTime: {
    type: Date, // waktu tap dari device
    required: true
  },
  verifyMode: {
    type: String, // fingerprint, password, card, etc
    default: 'fingerprint'
  },
  
  // Data setelah diproses server
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // akan diisi setelah mapping
  },
  tapType: {
    type: String,
    enum: ['in', 'out', 'auto'],
    default: 'auto' // auto detect in/out
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'error'],
    default: 'pending'
  },
  errorMessage: {
    type: String,
    default: null
  },
  
  // Metadata device
  deviceTime: {
    type: String, // waktu asli dari device (string)
    default: null
  },
  batteryLevel: {
    type: Number, // level baterai device
    default: null
  },
  signalStrength: {
    type: Number, // strength sinyal WiFi/GSM
    default: null
  },
  
  // Log processing
  processedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const Tapping = mongoose.model('Tapping', TappingSchema);
export default Tapping;