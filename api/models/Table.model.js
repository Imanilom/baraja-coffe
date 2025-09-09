import mongoose from 'mongoose';
import Area from './Area.model.js';

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
    shape: {
        type: String,
        enum: ['square', 'rectangle', 'circle', 'oval', 'custom'],
        default: 'rectangle'
    },
    position: {
        x: { type: Number, default: 0, min: 0 },
        y: { type: Number, default: 0, min: 0 }
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'reserved', 'maintenance'],
        default: 'available'
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
    timestamps: true
});

// Compound index untuk memastikan table_number unik per area
tableSchema.index({ table_number: 1, area_id: 1 }, { unique: true });

// Virtual untuk mendapatkan full table code
tableSchema.virtual('table_code').get(function () {
    return this.table_number;
});

// Validasi posisi meja tidak melebihi ukuran ruangan
tableSchema.pre('save', async function (next) {
    try {
        const area = await Area.findById(this.area_id);
        if (!area) {
            return next(new Error('Area tidak ditemukan'));
        }

        if (this.position.x > area.roomSize.width || this.position.y > area.roomSize.height) {
            return next(new Error(`Posisi meja (${this.position.x}, ${this.position.y}) melebihi ukuran area (${area.roomSize.width}, ${area.roomSize.height})`));
        }

        next();
    } catch (err) {
        next(err);
    }
});

const Table = mongoose.model('Table', tableSchema);
export default Table;