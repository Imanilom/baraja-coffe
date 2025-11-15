import mongoose from 'mongoose';

const FingerprintSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  fingerprintData: {
    type: String, // atau Buffer untuk template fingerprint
    required: true
  },
  fingerprintIndex: {
    type: Number, // index jari (1-10)
    required: true
  },
  deviceId: {
    type: String // ID device fingerprint
  },
  deviceUserId: {
    type: String, // ID user yang terdaftar di device fingerprint
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Fingerprint = mongoose.model('Fingerprint', FingerprintSchema);
export default Fingerprint;