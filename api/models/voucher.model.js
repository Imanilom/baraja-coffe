import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    discountAmount: {
        type: Number,
        required: true
    },
    claimedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    expirationDate: {
        type: Date,
        required: true
    },
    voucherPicture: {
        type: String,
        default:
          'https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg',
      },
}, { timestamps: true });

export default mongoose.model('Voucher', voucherSchema);
