import mongoose from 'mongoose';

const getWIBNow = () => {
    const now = new Date();
    return new Date(now.getTime() + (7 * 60 * 60 * 1000));
};

// Sub-schema: Item favorit pelanggan
const FavoriteItemSchema = new mongoose.Schema({
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
    },
    menuItemName: {
        type: String,
        required: true
    },
    orderCount: {
        type: Number,
        default: 1
    },
    lastOrdered: {
        type: Date,
        default: () => getWIBNow()
    }
}, { _id: false });

// Sub-schema: Riwayat pesanan ringkas
const OrderHistoryEntrySchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    items: [{
        name: String,
        quantity: Number,
        price: Number
    }],
    totalAmount: {
        type: Number,
        default: 0
    },
    orderType: {
        type: String,
        enum: ['Dine-In', 'Take Away'],
        default: 'Dine-In'
    },
    orderedAt: {
        type: Date,
        default: () => getWIBNow()
    }
}, { _id: false });

// Main schema
const CustomerChatbotProfileSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    whatsappJid: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: 'Pelanggan'
    },

    // Statistik interaksi
    totalInteractions: {
        type: Number,
        default: 0
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    averageOrderValue: {
        type: Number,
        default: 0
    },

    // Menu favorit (sorted by orderCount descending)
    favoriteItems: [FavoriteItemSchema],

    // Riwayat pesanan (max 50 terakhir)
    orderHistory: [OrderHistoryEntrySchema],

    // Distribusi jam interaksi (key: "0"-"23", value: jumlah)
    interactionHours: {
        type: Map,
        of: Number,
        default: () => new Map()
    },

    // Distribusi hari interaksi (key: "Senin"-"Minggu", value: jumlah)
    interactionDays: {
        type: Map,
        of: Number,
        default: () => new Map()
    },

    // Tag otomatis
    tags: [{
        type: String
    }],

    // Timestamps penting
    firstSeenAt: {
        type: Date,
        default: () => getWIBNow()
    },
    lastInteractionAt: {
        type: Date,
        default: () => getWIBNow()
    },
    lastOrderAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index untuk pencarian cepat
CustomerChatbotProfileSchema.index({ name: 'text' });
CustomerChatbotProfileSchema.index({ lastInteractionAt: -1 });
CustomerChatbotProfileSchema.index({ totalOrders: -1 });
CustomerChatbotProfileSchema.index({ totalSpent: -1 });

export default mongoose.model('CustomerChatbotProfile', CustomerChatbotProfileSchema);
