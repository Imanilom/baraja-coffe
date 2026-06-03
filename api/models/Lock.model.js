// models/Lock.model.js
import mongoose from 'mongoose';

const lockSchema = new mongoose.Schema({
    _id: String,
    lockedAt: Date,
    expiresAt: Date,
    owner: String
}, {
    timestamps: true,
    // Disable auto-index untuk performance
    autoIndex: false
});

// Compound index untuk query performance
lockSchema.index({ expiresAt: 1 });
lockSchema.index({ owner: 1 });

const Lock = mongoose.model('Lock', lockSchema);

export default Lock;