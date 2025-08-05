import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
    reservation_code: {
        type: String,
        unique: true
    },
    reservation_date: {
        type: Date, // ✅ UBAH: String → Date
        required: true
    },
    reservation_time: {
        type: String,
        required: true
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
    guest_count: {
        type: Number,
        required: true,
        min: 1
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
    check_in_time: {
        type: Date,
        default: null
    },
    check_out_time: {
        type: Date,
        default: null
    },      
    notes: {
        type: String,
        default: ''
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

// PERBAIKAN: Generate reservation code before validation
reservationSchema.pre('validate', async function (next) {
    if (!this.reservation_code) {
        try {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

            // PERBAIKAN: Gunakan createdAt yang sesuai dengan timestamps: true
            const count = await mongoose.model('Reservation').countDocuments({
                createdAt: { // Ubah dari created_at ke createdAt
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

const Reservation = mongoose.model('Reservation', reservationSchema);
export default Reservation;