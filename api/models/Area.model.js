import mongoose from 'mongoose';

const areaSchema = new mongoose.Schema({
    area_code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    area_name: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    description: {
        type: String,
        default: ''
    },
    benefit: {
        type: [String],
        default: ['none']
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

areaSchema.virtual('tables', {
    ref: 'Table',
    localField: '_id',
    foreignField: 'area_id'
});

areaSchema.set('toJSON', { virtuals: true });
areaSchema.set('toObject', { virtuals: true });

const Area = mongoose.model('Area', areaSchema);
export default Area;
