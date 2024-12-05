import mongoose from 'mongoose';

const UserVoucherSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User', 
        required: true 
    },
    voucherId: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', 
        required: true 
    },
    claims: { 
        type: Number, default: 0 
    }, // Tracks how many times this user has claimed this voucher
  }, { timestamps: true });
  
  export const UserVoucher = mongoose.model('UserVoucher', UserVoucherSchema);
  