// models/Event.js
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
    endDate: {
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
    contactPhone: {
        type: String,
        trim: true
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
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    
    // ✅ NEW: Free event registration data
    freeRegistrations: [{
        _id: false,
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            match: /.+\@.+\..+/
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        registrationDate: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            trim: true
        }
    }],
    
    soldTickets: {
        type: Number,
        default: 0,
        min: 0
    },
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
    },
    
    // ✅ NEW: Link to menu item
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
    },
    isFreeEvent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Virtual untuk tiket tersedia
EventSchema.virtual('availableTickets').get(function () {
    return Math.max(0, this.capacity - this.soldTickets);
});

// Method untuk mengecek ketersediaan tiket
EventSchema.methods.hasAvailableTickets = function (requestedQuantity) {
    return this.availableTickets >= requestedQuantity;
};

// Method untuk memesan tiket
EventSchema.methods.reserveTickets = function (quantity) {
    if (this.hasAvailableTickets(quantity)) {
        this.soldTickets += quantity;
        return this.save();
    }
    throw new Error('Not enough tickets available');
};  

// ✅ NEW: Method untuk registrasi event gratis
EventSchema.methods.registerFreeEvent = function (registrationData) {
    if (this.freeRegistrations.length >= this.capacity) {
        throw new Error('Event capacity reached');
    }
    
    // Cek apakah email sudah terdaftar
    const existingRegistration = this.freeRegistrations.find(
        reg => reg.email === registrationData.email
    );
    
    if (existingRegistration) {
        throw new Error('Email already registered for this event');
    }
    
    this.freeRegistrations.push(registrationData);
    return this.save();
};

EventSchema.set('toJSON', { virtuals: true });
EventSchema.set('toObject', { virtuals: true });

const Event = mongoose.model('Event', EventSchema);

export default Event;