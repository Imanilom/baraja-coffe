import mongoose from 'mongoose';

const MenuRatingSchema = new mongoose.Schema({
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    outletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Outlet',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: function (v) {
                return Number.isInteger(v) || (v % 0.5 === 0);
            },
            message: 'Rating must be between 1-5 and can be in increments of 0.5'
        }
    },
    review: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    images: [
        {
            url: { type: String, trim: true },
            caption: { type: String, trim: true, maxlength: 200 }
        }
    ],
    helpfulCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    moderationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    tags: [
        {
            type: String,
            trim: true
        }
    ],
    adminNotes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    // Membuat index compound untuk mencegah duplicate rating dari customer yang sama untuk menu dan order yang sama
    index: [
        { menuItemId: 1, customerId: 1, orderId: 1 },
        { menuItemId: 1 },
        { customerId: 1 },
        { rating: 1 },
        { createdAt: -1 }
    ]
});

// Index unik untuk mencegah customer memberikan rating lebih dari sekali untuk menu yang sama dalam order yang sama
MenuRatingSchema.index(
    { menuItemId: 1, customerId: 1, orderId: 1 },
    { unique: true }
);

// Virtual untuk menghitung rata-rata rating per menu item
MenuRatingSchema.statics.getAverageRating = async function (menuItemId) {
    const result = await this.aggregate([
        {
            $match: {
                menuItemId: new mongoose.Types.ObjectId(menuItemId),
                isActive: true,
                moderationStatus: 'approved'
            }
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 },
                ratingDistribution: {
                    $push: '$rating'
                }
            }
        },
        {
            $project: {
                _id: 0,
                averageRating: { $round: ['$averageRating', 1] },
                totalRatings: 1,
                ratingDistribution: {
                    $let: {
                        vars: {
                            counts: {
                                $reduce: {
                                    input: '$ratingDistribution',
                                    initialValue: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                                    in: {
                                        $mergeObjects: [
                                            '$$value',
                                            {
                                                $switch: {
                                                    branches: [
                                                        { case: { $eq: ['$$this', 1] }, then: { 1: { $add: [{ $ifNull: ['$$value.1', 0] }, 1] } } },
                                                        { case: { $eq: ['$$this', 2] }, then: { 2: { $add: [{ $ifNull: ['$$value.2', 0] }, 1] } } },
                                                        { case: { $eq: ['$$this', 3] }, then: { 3: { $add: [{ $ifNull: ['$$value.3', 0] }, 1] } } },
                                                        { case: { $eq: ['$$this', 4] }, then: { 4: { $add: [{ $ifNull: ['$$value.4', 0] }, 1] } } },
                                                        { case: { $eq: ['$$this', 5] }, then: { 5: { $add: [{ $ifNull: ['$$value.5', 0] }, 1] } } }
                                                    ],
                                                    default: {}
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        in: '$$counts'
                    }
                }
            }
        }
    ]);

    return result[0] || { averageRating: 0, totalRatings: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
};

// Method untuk mendapatkan top rated menu items
MenuRatingSchema.statics.getTopRatedMenus = async function (limit = 10, outletId = null) {
    const matchStage = {
        isActive: true,
        moderationStatus: 'approved'
    };

    if (outletId) {
        matchStage.outletId = new mongoose.Types.ObjectId(outletId);
    }

    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$menuItemId',
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 }
            }
        },
        { $match: { totalRatings: { $gte: 5 } } }, // Minimal 5 rating
        { $sort: { averageRating: -1, totalRatings: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'menuitems',
                localField: '_id',
                foreignField: '_id',
                as: 'menuItem'
            }
        },
        { $unwind: '$menuItem' },
        {
            $project: {
                _id: 0,
                menuItemId: '$_id',
                menuItem: 1,
                averageRating: { $round: ['$averageRating', 1] },
                totalRatings: 1
            }
        }
    ]);
};

// Middleware untuk memverifikasi rating sebelum save
MenuRatingSchema.pre('save', async function (next) {
    try {
        // Cek apakah order dan menu item valid
        const Order = mongoose.model('Order');
        const order = await Order.findById(this.orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        // Cek apakah customer yang memberikan rating adalah pemilik order
        if (order.customerId.toString() !== this.customerId.toString()) {
            throw new Error('Customer mismatch with order');
        }

        // Cek apakah menu item ada dalam order tersebut
        const hasMenuItem = order.items.some(item =>
            item.menuItemId.toString() === this.menuItemId.toString()
        );

        if (!hasMenuItem) {
            throw new Error('Menu item not found in the order');
        }

        // Set sebagai verified jika semua validasi lolos
        this.isVerified = true;

        next();
    } catch (error) {
        next(error);
    }
});

// Middleware post save untuk update rating summary di MenuItem (opsional)
MenuRatingSchema.post('save', async function () {
    try {
        const MenuItem = mongoose.model('MenuItem');
        const ratingStats = await this.constructor.getAverageRating(this.menuItemId);

        // Update MenuItem dengan rating summary (jika ingin menyimpan di MenuItem schema)
        await MenuItem.findByIdAndUpdate(this.menuItemId, {
            $set: {
                averageRating: ratingStats.averageRating,
                totalRatings: ratingStats.totalRatings
            }
        });
    } catch (error) {
        console.error('Error updating menu item rating stats:', error);
    }
});

export const MenuRating = mongoose.model('MenuRating', MenuRatingSchema);