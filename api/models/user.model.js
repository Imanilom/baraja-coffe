import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false }, // Dijadikan required
  password: { type: String, required: true },
  address: { type: String, required: false }, // Menggunakan string, bukan array
  profilePicture: {
    type: String,
    default: 'https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg',
  },
  role: {
    type: String,
    enum: ['Admin', 'Customer', 'Staff'],
    required: true,
    default: 'Customer',
  },
  // outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' }, // Kasir & Staff harus terkait dengan outlet
  // claimedVouchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' }],
  loyaltyPoints: { type: Number, required: true, default: 0 },
}, { timestamps: true });


const User = mongoose.model('User', UserSchema);

export default User;
