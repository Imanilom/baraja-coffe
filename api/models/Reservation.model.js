import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
    reservation_code: {
        type: String,
        unique: true
        // Hapus required: true dari sini karena akan di-generate otomatis
    },
    reservation_date: {
        type: String,
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
        default: 'non-blocking'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Generate reservation code before validation
reservationSchema.pre('validate', async function (next) {
    if (!this.reservation_code) {
        try {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await mongoose.model('Reservation').countDocuments({
                created_at: {
                    $gte: new Date(new Date().toDateString())
                }
            });
            this.reservation_code = `RSV-${date}-${String(count + 1).padStart(3, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

const Reservation = mongoose.model('Reservation', reservationSchema);
export default Reservation;