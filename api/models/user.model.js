import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phonenumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    address: {
      type: [String],
      required: true,
    },
    point: {
      type: Number,
      default: 0,
    },
    vouchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher'
      }
    ],
    role: {
      type: String,
      required: true,
      default: "user"
    },
    profilePicture: {
      type: String,
      default: 'https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg',
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
