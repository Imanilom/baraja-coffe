import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    organizer: {
        type: String,
        required: true,
        trim: true
    },
    contactEmail: {
        type: String,
        required: true,
        trim: true,
        match: /.+\@.+\..+/
    },
    imageUrl: {
        type: String,
        default: 'https://placehold.co/1920x1080/png',
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    tags: {
        type: [String],
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed'],
        default: 'upcoming'
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    attendees: {
        type: [String],
        default: []
    },
    privacy: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    terms: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

const Event = mongoose.model('Event', EventSchema);

export default Event;