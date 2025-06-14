import mongoose from 'mongoose';

export const validateRating = (req, res, next) => {
    // Tambahkan logging untuk debug
    console.log('=== DEBUG VALIDATION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    console.log('========================');

    // const { menuItemId, orderId, rating, review, images, tags } = req.body;
    // const errors = [];
    const { menuItemId, orderId, rating, review } = req.body;
    const errors = [];

    // Validasi menuItemId
    if (!menuItemId) {
        errors.push('Menu item ID is required');
    } else if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
        errors.push('Invalid menu item ID format');
    }

    // Validasi orderId (untuk create rating)
    if (req.method === 'POST' && !orderId) {
        errors.push('Order ID is required');
    } else if (orderId && !mongoose.Types.ObjectId.isValid(orderId)) {
        errors.push('Invalid order ID format');
    }

    // Validasi rating
    if (rating === undefined || rating === null) {
        errors.push('Rating is required');
    } else {
        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            errors.push('Rating must be between 1 and 5');
        } else if (!(Number.isInteger(ratingNum) || ratingNum % 0.5 === 0)) {
            errors.push('Rating must be integer or in increments of 0.5');
        }
    }

    // Validasi review (opsional tapi ada batasan)
    if (review !== undefined) {
        if (typeof review !== 'string') {
            errors.push('Review must be a string');
        } else if (review.length > 1000) {
            errors.push('Review cannot exceed 1000 characters');
        }
    }

    // // Validasi images (opsional)
    // if (images !== undefined) {
    //     if (!Array.isArray(images)) {
    //         errors.push('Images must be an array');
    //     } else {
    //         images.forEach((image, index) => {
    //             if (!image.url || typeof image.url !== 'string') {
    //                 errors.push(`Image ${index + 1}: URL is required and must be a string`);
    //             }
    //             if (image.caption && typeof image.caption !== 'string') {
    //                 errors.push(`Image ${index + 1}: Caption must be a string`);
    //             }
    //             if (image.caption && image.caption.length > 200) {
    //                 errors.push(`Image ${index + 1}: Caption cannot exceed 200 characters`);
    //             }
    //         });
    //     }
    // }

    // // Validasi tags (opsional)
    // if (tags !== undefined) {
    //     if (!Array.isArray(tags)) {
    //         errors.push('Tags must be an array');
    //     } else {
    //         tags.forEach((tag, index) => {
    //             if (typeof tag !== 'string') {
    //                 errors.push(`Tag ${index + 1}: Must be a string`);
    //             }
    //         });
    //     }
    // }

    // Jika ada error, return bad request
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    // Lanjut ke controller jika semua validasi pass
    next();
};

// Middleware untuk validasi moderasi admin
export const validateModeration = (req, res, next) => {
    const { moderationStatus, adminNotes } = req.body;
    const errors = [];

    // Validasi moderation status
    if (!moderationStatus) {
        errors.push('Moderation status is required');
    } else if (!['approved', 'rejected'].includes(moderationStatus)) {
        errors.push('Moderation status must be either "approved" or "rejected"');
    }

    // Validasi admin notes (opsional)
    if (adminNotes !== undefined && typeof adminNotes !== 'string') {
        errors.push('Admin notes must be a string');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};