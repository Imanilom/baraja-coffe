import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
    table_number: {
        type: String,
        required: true,
        uppercase: true
    },
    area_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area',
        required: true
    },
    seats: {
        type: Number,
        required: true,
        min: 1,
        default: 4
    },
    table_type: {
        type: String,
        enum: ['regular', 'vip', 'family', 'couple'],
        default: 'regular'
    },
    is_available: {
        type: Boolean,
        default: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound index untuk memastikan table_number unik per area
tableSchema.index({ table_number: 1, area_id: 1 }, { unique: true });

// Virtual untuk mendapatkan full table code (contoh: A01, B02)
tableSchema.virtual('table_code').get(function () {
    return this.table_number;
});

const Table = mongoose.model('Table', tableSchema);
export default Table;