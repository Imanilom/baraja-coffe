import mongoose from 'mongoose';

// Helper function untuk mendapatkan waktu WIB sekarang
const getWIBNow = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

const reservationSchema = new mongoose.Schema({
    reservation_code: {
        type: String,
        unique: true
    },
    reservation_date: {
        type: Date,
        required: true
    },
    reservation_time: {
        type: String,
        required: true
    },
    agenda: {
        type: String,
        default: ''
    },
    area_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area',
        required: true
    },
    table_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: true
    }],
    table_type: {
        type: String, // ✅ ADD THIS - specify the type first
        enum: ['long table', 'class', 'casual', 'theater'],
        default: 'long table'
    },
    guest_count: {
        type: Number,
        required: true,
        min: 1
    },
    guest_number: {
        type: String,
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    reservation_type: {
        type: String,
        enum: ['blocking', 'nonBlocking'],
        default: 'nonBlocking'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },

    // ✅ PENAMBAHAN: Penanggung jawab reservasi (untuk walk-in customer)
    created_by: {
        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        employee_name: {
            type: String,
            default: null
        },
        created_at: {
            type: Date,
            default: () => getWIBNow()
        }
    },

    confirm_by: {
        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        employee_name: {
            type: String,
            default: null
        },
        confirmed_at: {
            type: Date,
            default: null
        }
    },

    check_in_time: {
        type: Date,
        default: null
    },

    // ✅ PENAMBAHAN: Penanggung jawab check-in
    checked_in_by: {
        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        employee_name: {
            type: String,
            default: null
        },
        checked_in_at: {
            type: Date,
            default: null
        }
    },

    check_out_time: {
        type: Date,
        default: null
    },

    // ✅ PENAMBAHAN: Penanggung jawab check-out
    checked_out_by: {
        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        employee_name: {
            type: String,
            default: null
        },
        checked_out_at: {
            type: Date,
            default: null
        }
    },

    notes: {
        type: String,
        default: ''
    },
    serving_food: {
        type: Boolean,
    },
    equipment: [{
        type: String,
        default: []
    }],
    food_serving_option: {
        type: String,
        enum: ['immediate', 'scheduled'],
        default: 'immediate'
    },
    food_serving_time: {
        type: Date,
        default: null
    },

    // ✅ Waktu dalam WIB
    createdAtWIB: {
        type: Date,
        default: () => getWIBNow()
    },
    updatedAtWIB: {
        type: Date,
        default: () => getWIBNow()
    }
}, {
    timestamps: true
});

// Compound indexes untuk performa query
reservationSchema.index({
    reservation_date: 1,
    reservation_time: 1,
    area_id: 1
});
reservationSchema.index({
    reservation_date: 1,
    reservation_time: 1,
    table_id: 1
});
reservationSchema.index({
    reservation_code: 1
});
reservationSchema.index({
    'created_by.employee_id': 1
});
reservationSchema.index({
    'checked_in_by.employee_id': 1
});
reservationSchema.index({
    'checked_out_by.employee_id': 1
});

// Pre-save middleware untuk update updatedAtWIB
reservationSchema.pre('save', function (next) {
    this.updatedAtWIB = getWIBNow();
    next();
});

// Generate reservation code before validation
reservationSchema.pre('validate', async function (next) {
    if (!this.reservation_code) {
        try {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await mongoose.model('Reservation').countDocuments({
                createdAt: {
                    $gte: new Date(new Date().toDateString())
                }
            });
            this.reservation_code = `RSV-${date}-${String(count + 1).padStart(3, '0')}`;
        } catch (error) {
            console.error('Error generating reservation code:', error);
            return next(error);
        }
    }
    next();
});

// Virtual fields untuk format WIB
reservationSchema.virtual('createdAtWIBFormatted').get(function () {
    return this.createdAt ? this.formatToWIB(this.createdAt) : null;
});

reservationSchema.virtual('updatedAtWIBFormatted').get(function () {
    return this.updatedAt ? this.formatToWIB(this.updatedAt) : null;
});

// Method untuk format WIB
reservationSchema.methods.formatToWIB = function (date) {
    if (!date) return null;
    return date.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const Reservation = mongoose.model('Reservation', reservationSchema);
export default Reservation;