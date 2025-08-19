import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  password: {
    type: String,
    required: false, // atau minimal: true, validate: v => v.length > 0
    default: '-'
  },
  address: {
    type: [String],
    default: []
  },
  profilePicture: {
    type: String,
    default: 'https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg',
  },
  role: {
    type: String,
    enum: ['admin', 'customer', 'waiter', 'kitchen', 'cashier junior', 'cashier senior', 'akuntan', 'inventory', 'marketing', 'operational'],
    required: true,
    default: 'customer',
  },
  cashierType: {
    type: String,
    enum: [null, 'bar-1-amphi', 'bar-2-amphi', 'bar-3-amphi', 'bar-tp', 'bar-dp', 'drive-thru'],
    required: function () { return this.role === 'cashier junior' || this.role === 'cashier senior'; },
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
  loyaltyLevel: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LoyaltyLevel', 
    required: false 
  },

}, { timestamps: true });


const User = mongoose.model('User', UserSchema);

export default User;
