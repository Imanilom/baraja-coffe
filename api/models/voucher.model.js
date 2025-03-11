import mongoose from 'mongoose';

const VoucherSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true 
    },
    description: { 
        type: String 
    },
    discountAmount: { 
        type: Number, 
        required: true 
    },
    minimumOrder: { 
        type: Number, 
        default: 0 
    },
    startDate: { 
        type: Date 
    },
    endDate: { 
        type: Date 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    maxClaims: { 
        type: Number, 
        required: true 
    }, 
    image: { 
        type: String,
        default: 'https://placehold.co/1920x1080/png',
    },
  }, { timestamps: true });
  
  export const Voucher = mongoose.model('Voucher', VoucherSchema);
  