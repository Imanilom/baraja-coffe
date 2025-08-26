import { MenuRating } from '../models/MenuRating.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';

export class MenuRatingController {

    // CREATE - Membuat rating baru
    static async createRating(req, res) {
        try {
            const { menuItemId, rating, review } = req.body;

            // Get order data from validation middleware
            const { orderObjectId, customerId } = req.orderData;

            console.log('Creating rating with:');
            console.log('- menuItemId:', menuItemId);
            console.log('- orderObjectId:', orderObjectId);
            console.log('- customerId:', customerId);
            console.log('- rating:', rating);
            console.log('- review:', review);

            // Cek apakah customer sudah pernah rating menu ini di order yang sama
            const existingRating = await MenuRating.findOne({
                menuItemId,
                customerId,
                orderId: orderObjectId // Use the ObjectId from the order
            });

            if (existingRating) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already rated this menu item for this order'
                });
            }

            // Buat rating baru
            const newRating = new MenuRating({
                menuItemId,
                customerId,
                orderId: orderObjectId, // Use the ObjectId
                rating,
                review: review || null,
            });

            console.log('Saving new rating:', newRating);
            await newRating.save();

            // Populate data untuk response
            const populatedRating = await MenuRating.findById(newRating._id)
                .populate('customerId', 'name email');

            console.log('Rating created successfully:', populatedRating);

            res.status(201).json({
                success: true,
                message: 'Rating created successfully',
                data: populatedRating
            });

        } catch (error) {
            console.error('Error creating rating:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    // READ - Mendapatkan semua rating untuk menu tertentu
    static async getMenuRatings(req, res) {
        try {
            const { menuItemId } = req.params;
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

            if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid menu item ID'
                });
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            // Query ratings dengan filter aktif dan approved
            const ratings = await MenuRating.find({
                menuItemId,
                isActive: true,
                moderationStatus: 'approved'
            })
                .populate('customerId', 'name avatar')
                .populate('outletId', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const totalRatings = await MenuRating.countDocuments({
                menuItemId,
                isActive: true,
                moderationStatus: 'approved'
            });

            // Dapatkan statistik rating
            const ratingStats = await MenuRating.getAverageRating(menuItemId);

            res.status(200).json({
                success: true,
                data: {
                    ratings,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalRatings / parseInt(limit)),
                        totalRatings,
                        hasNext: skip + ratings.length < totalRatings,
                        hasPrev: parseInt(page) > 1
                    },
                    statistics: ratingStats
                }
            });

        } catch (error) {
            console.error('Error fetching menu ratings:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // READ - Mendapatkan rating summary untuk menu
    static async getMenuRatingSummary(req, res) {
        try {
            const { menuItemId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid menu item ID'
                });
            }

            const ratingStats = await MenuRating.getAverageRating(menuItemId);

            // Dapatkan beberapa review terbaru
            const recentReviews = await MenuRating.find({
                menuItemId,
                isActive: true,
                moderationStatus: 'approved',
                review: { $exists: true, $ne: '' }
            })
                .populate('customerId', 'name avatar')
                .sort({ createdAt: -1 })
                .limit(3);

            res.status(200).json({
                success: true,
                data: {
                    ...ratingStats,
                    recentReviews
                }
            });

        } catch (error) {
            console.error('Error fetching rating summary:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // READ - Mendapatkan top rated menus
    static async getTopRatedMenus(req, res) {
        try {
            const { limit = 10, outletId } = req.query;

            const topMenus = await MenuRating.getTopRatedMenus(
                parseInt(limit),
                outletId ? new mongoose.Types.ObjectId(outletId) : null
            );

            res.status(200).json({
                success: true,
                data: topMenus
            });

        } catch (error) {
            console.error('Error fetching top rated menus:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // READ - Mendapatkan rating customer untuk menu tertentu
    static async getCustomerRating(req, res) {
        try {
            const { menuItemId, orderId } = req.params;
            const order = await Order.findOne({ order_id: orderId });
            const _id = order._id;
            const customerId = order.user_id;

            const rating = await MenuRating.findOne({
                menuItemId,
                customerId,
                orderId: _id
            })


            if (!rating) {
                return res.status(404).json({
                    success: false,
                    message: 'Rating not found'
                });
            }

            res.status(200).json({
                success: true,
                data: rating
            });

        } catch (error) {
            console.error('Error fetching customer rating:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // UPDATE - Update rating (hanya untuk customer yang membuat rating)
    static async updateRating(req, res) {
        try {
            const { ratingId } = req.params;
            const { rating, review, images, tags } = req.body;
            const customerId = req.user.id;

            // Cari rating berdasarkan ID dan customer
            const existingRating = await MenuRating.findOne({
                _id: ratingId,
                customerId
            });

            if (!existingRating) {
                return res.status(404).json({
                    success: false,
                    message: 'Rating not found or you are not authorized to update this rating'
                });
            }

            // Update data
            const updateData = {};
            if (rating !== undefined) updateData.rating = rating;
            if (review !== undefined) updateData.review = review;
            if (images !== undefined) updateData.images = images;
            if (tags !== undefined) updateData.tags = tags;

            // Reset moderation status jika ada perubahan konten
            if (review !== undefined || images !== undefined) {
                updateData.moderationStatus = 'pending';
            }

            const updatedRating = await MenuRating.findByIdAndUpdate(
                ratingId,
                updateData,
                { new: true, runValidators: true }
            )
                .populate('menuItemId', 'name imageURL')
                .populate('customerId', 'name email')
                .populate('outletId', 'name');

            res.status(200).json({
                success: true,
                message: 'Rating updated successfully',
                data: updatedRating
            });

        } catch (error) {
            console.error('Error updating rating:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    // DELETE - Soft delete rating
    static async deleteRating(req, res) {
        try {
            const { ratingId } = req.params;
            const customerId = req.user.id;

            const rating = await MenuRating.findOne({
                _id: ratingId,
                customerId
            });

            if (!rating) {
                return res.status(404).json({
                    success: false,
                    message: 'Rating not found or you are not authorized to delete this rating'
                });
            }

            // Soft delete dengan mengubah isActive menjadi false
            await MenuRating.findByIdAndUpdate(ratingId, { isActive: false });

            res.status(200).json({
                success: true,
                message: 'Rating deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting rating:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // ADMIN - Moderate rating (approve/reject)
    static async moderateRating(req, res) {
        try {
            const { ratingId } = req.params;
            const { moderationStatus, adminNotes } = req.body;

            if (!['approved', 'rejected'].includes(moderationStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid moderation status. Must be "approved" or "rejected"'
                });
            }

            const updatedRating = await MenuRating.findByIdAndUpdate(
                ratingId,
                {
                    moderationStatus,
                    adminNotes: adminNotes || ''
                },
                { new: true }
            )
                .populate('menuItemId', 'name')
                .populate('customerId', 'name email');

            if (!updatedRating) {
                return res.status(404).json({
                    success: false,
                    message: 'Rating not found'
                });
            }

            res.status(200).json({
                success: true,
                message: `Rating ${moderationStatus} successfully`,
                data: updatedRating
            });

        } catch (error) {
            console.error('Error moderating rating:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // ADMIN - Get pending ratings for moderation
    static async getPendingRatings(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const pendingRatings = await MenuRating.find({
                moderationStatus: 'pending'
            })
                .populate('menuItemId', 'name imageURL')
                .populate('customerId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const totalPending = await MenuRating.countDocuments({
                moderationStatus: 'pending'
            });

            res.status(200).json({
                success: true,
                data: {
                    ratings: pendingRatings,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalPending / parseInt(limit)),
                        totalRatings: totalPending,
                        hasNext: skip + pendingRatings.length < totalPending,
                        hasPrev: parseInt(page) > 1
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching pending ratings:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // UPDATE - Mark rating as helpful
    static async markHelpful(req, res) {
        try {
            const { ratingId } = req.params;

            const updatedRating = await MenuRating.findByIdAndUpdate(
                ratingId,
                { $inc: { helpfulCount: 1 } },
                { new: true }
            );

            if (!updatedRating) {
                return res.status(404).json({
                    success: false,
                    message: 'Rating not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Rating marked as helpful',
                data: { helpfulCount: updatedRating.helpfulCount }
            });

        } catch (error) {
            console.error('Error marking rating as helpful:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}