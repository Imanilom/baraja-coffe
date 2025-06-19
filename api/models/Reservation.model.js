import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
    reservation_code: {
        type: String,
        required: true,
        unique: true
    },
    customer_name: {
        type: String,
        required: true
    },
    customer_phone: {
        type: String,
        required: true
    },
    customer_email: {
        type: String,
        default: ''
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
    area_code: {
        type: String,
        required: true
    },
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
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Generate reservation code
reservationSchema.pre('save', async function (next) {
    if (!this.reservation_code) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await mongoose.model('Reservation').countDocuments({
            created_at: {
                $gte: new Date(new Date().toDateString())
            }
        });
        this.reservation_code = `RSV-${date}-${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

const Reservation = mongoose.model('Reservation', reservationSchema);
export default Reservation;
