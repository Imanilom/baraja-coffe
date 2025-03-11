import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: false },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false }, // Dijadikan required
  password: { type: String, required: true },
  address: [],
  profilePicture: {
    type: String,
    default: 'https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg',
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'customer', 'cashier', 'staff', 'accounting', 'inventory'],
    required: true,
    default: 'customer',
  },
  cashierType: {
    type: String,
    enum: [null, 'bar-1-amphi', 'bar-2-amphi', 'bar-3-amphi', 'bar-tp', 'bar-dp', 'drive-thru'],
    required: function () { return this.role === 'cashier'; },
    default: null
  },
  outlet: [
    {
      outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: false },
    }
  ],
  // outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' }, // Kasir & Staff harus terkait dengan outlet
  claimedVouchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' }],
  loyaltyPoints: { type: Number, required: true, default: 0 },
}, { timestamps: true });


const User = mongoose.model('User', UserSchema);

export default User;
