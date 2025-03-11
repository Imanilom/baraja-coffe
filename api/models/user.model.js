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
    required: true 
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
    default: 'customer',
    enum: ['admin', 'customer', 'staff'], 
    required: true 
  },
  claimedVouchers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
    },
  ],
  loyaltyPoints: { 
    type: Number, 
    required: true,
    default: 0
  },
  level: { 
    type: Number, 
    required: true, 
    default: 1, // Level awal
    min: 1 
  },
  experiencePoints: { 
    type: Number, 
    required: true, 
    default: 0, // XP yang diperlukan sebelum naik level
    min: 0
  },
  referralCode: { 
    type: String, 
    unique: true 
  },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;
