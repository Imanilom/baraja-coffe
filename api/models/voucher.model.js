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
  }, { timestamps: true });
  
  export const Voucher = mongoose.model('Voucher', VoucherSchema);
  