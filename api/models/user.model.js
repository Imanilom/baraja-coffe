import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true }, // Dijadikan required
  password: { type: String, required: true },
  address: { type: String, default: '' }, // Menggunakan string, bukan array
  profilePicture: {
    type: String,
    default: 'https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg',
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Customer', 'Staff', 'Cashier'], // Tambahkan Manager
    required: true
  },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' }, // Kasir & Staff harus terkait dengan outlet
  workstation: { type: mongoose.Schema.Types.ObjectId, ref: 'Workstation', default: null }, // Opsional jika ada workstation tertentu
  claimedVouchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' }],
  loyaltyPoints: { type: Number, required: true, default: 0 },
}, { timestamps: true });


const User = mongoose.model('User', UserSchema);

export default User;
