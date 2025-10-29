import mongoose from 'mongoose';

const FingerprintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  noid: {
    type: Number, // noid dari device fingerprint (1-1000 biasanya)
    required: true
  },
  fingerprintData: {
    type: String, // template fingerprint (bisa string atau buffer)
    default: null
  },
  deviceId: {
    type: String, // ID device fingerprint
    required: true
  },
  deviceType: {
    type: String, // tipe device fingerprint
    default: 'ESP-Fingerprint'
  },
  isRegistered: {
    type: Boolean, // status registrasi fingerprint
    default: false
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastSynced: {
    type: Date, // terakhir sync dengan device
    default: Date.now
  }
}, { timestamps: true });

// Index untuk memastikan noid unik per device
FingerprintSchema.index({ noid: 1, deviceId: 1 }, { unique: true });

const Fingerprint = mongoose.model('Fingerprint', FingerprintSchema);
export default Fingerprint;