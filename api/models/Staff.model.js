import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  position: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'cashier'], required: true },
  cashierType: {
    type: String,
    enum: [null, 'bar', 'drive-thru', 'bar-outlet-2', 'bar-outlet-3'],
    required: function () { return this.role === 'cashier'; },
    default: null
  },
  phone: { type: String },
  email: { type: String, unique: true },
}, { timestamps: true });
export const Staff = mongoose.model('Staff', StaffSchema);
