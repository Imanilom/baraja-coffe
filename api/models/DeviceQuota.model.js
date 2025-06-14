import mongoose from 'mongoose';

const DeviceQuotaSchema = new mongoose.Schema({
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true,
    unique: true
  },
  quotas: [
    {
      role: {
        type: String,
        enum: ['cashier senior', 'cashier junior', 'inventory', 'kitchen', 'drive-thru', 'waiter'],
        required: true
      },
      maxDevices: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ]
}, { timestamps: true });

export const DeviceQuota = mongoose.models.DeviceQuota || mongoose.model('DeviceQuota', DeviceQuotaSchema);
