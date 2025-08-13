import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';

export const validateRating = async (req, res, next) => {
    try {
        // Tambahkan logging untuk debug
        console.log('=== DEBUG VALIDATION ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Request headers:', req.headers);
        console.log('========================');

        // Extract data - handle both 'id' and 'orderId' field names
        const { menuItemId, rating, review } = req.body;
        const orderId = req.body.orderId || req.body.id; // Handle both field names
        const errors = [];

        console.log('Extracted orderId:', orderId);

        // Validasi menuItemId
        if (!menuItemId) {
            errors.push('Menu item ID is required');
        } else if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
            errors.push('Invalid menu item ID format');
        }

        // Validasi orderId
        if (!orderId) {
            errors.push('Order ID is required');
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Find order and validate
        const order = await Order.findOne({ order_id: orderId });
        console.log('Found order:', order ? 'Yes' : 'No');

        if (!order) {
            errors.push('Order not found');
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        const orderObjectId = order._id;
        console.log('Order ObjectId:', orderObjectId);

        // Add order data to request for use in controller
        req.orderData = {
            orderId: orderId,
            orderObjectId: orderObjectId,
            customerId: order.user_id
        };

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

    } catch (error) {
        console.error('Error in validation middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during validation',
            error: error.message
        });
    }
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