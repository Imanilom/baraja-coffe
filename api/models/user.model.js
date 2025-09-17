import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: function () {
      return this.role === "customer"; // hanya wajib kalau role = customer
    },
    unique: true
  },
  phone: {
    type: String
  },
  password: {
    type: String,
    required: false,
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

  // 🔑 Role jadi referensi
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },

  cashierType: {
    type: String,
    enum: [null, 'bar-1-amphi', 'bar-2-amphi', 'bar-3-amphi', 'bar-tp', 'bar-dp', 'drive-thru'],
    required: false,
    default: null
  },

  outlet: [
    {
      outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: false },
    }
  ],

  claimedVouchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' }],
  loyaltyPoints: { type: Number, required: true, default: 0 },
  loyaltyLevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoyaltyLevel',
    required: false
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }
  ],
  authType: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;
