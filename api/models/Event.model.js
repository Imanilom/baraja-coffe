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
    // ✅ FIXED: Changed to proper ticket tracking
    soldTickets: {
        type: Number,
        default: 0,
        min: 0
    },
    // ✅ ADDED: Track ticket purchases
    ticketPurchases: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TicketPurchase'
    }],
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

// ✅ ADDED: Virtual for available tickets
EventSchema.virtual('availableTickets').get(function () {
    return Math.max(0, this.capacity - this.soldTickets);
});

// ✅ ADDED: Method to check ticket availability
EventSchema.methods.hasAvailableTickets = function (requestedQuantity) {
    return this.availableTickets >= requestedQuantity;
};

// ✅ ADDED: Method to reserve tickets
EventSchema.methods.reserveTickets = function (quantity) {
    if (this.hasAvailableTickets(quantity)) {
        this.soldTickets += quantity;
        return this.save();
    }
    throw new Error('Not enough tickets available');
};

EventSchema.set('toJSON', { virtuals: true });
EventSchema.set('toObject', { virtuals: true });

const Event = mongoose.model('Event', EventSchema);

export default Event;