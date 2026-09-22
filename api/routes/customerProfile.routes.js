import express from 'express';
import CustomerChatbotProfile from '../models/CustomerChatbotProfile.model.js';

const router = express.Router();

/**
 * GET /api/customer-profiles/stats/summary
 * Statistik ringkasan keseluruhan pelanggan chatbot
 */
router.get('/stats/summary', async (req, res) => {
    try {
        const [stats] = await CustomerChatbotProfile.aggregate([
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    totalOrders: { $sum: '$totalOrders' },
                    totalRevenue: { $sum: '$totalSpent' },
                    avgOrderValue: { $avg: '$averageOrderValue' },
                    avgInteractions: { $avg: '$totalInteractions' },
                    maxOrders: { $max: '$totalOrders' },
                    maxSpent: { $max: '$totalSpent' }
                }
            }
        ]);

        // Pelanggan paling aktif (by totalOrders)
        const topCustomers = await CustomerChatbotProfile.find({ totalOrders: { $gt: 0 } })
            .sort({ totalOrders: -1 })
            .limit(5)
            .select('name phone totalOrders totalSpent tags')
            .lean();

        // Distribusi jam global (aggregate dari semua pelanggan)
        const hourlyDistribution = {};
        const profiles = await CustomerChatbotProfile.find({}).select('interactionHours').lean();
        for (const p of profiles) {
            if (p.interactionHours) {
                for (const [hour, count] of Object.entries(p.interactionHours)) {
                    hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + count;
                }
            }
        }

        // Menu paling populer (aggregate dari favoriteItems)
        const menuPopularity = {};
        const allProfiles = await CustomerChatbotProfile.find({ 'favoriteItems.0': { $exists: true } })
            .select('favoriteItems')
            .lean();
        for (const p of allProfiles) {
            for (const fi of p.favoriteItems) {
                menuPopularity[fi.menuItemName] = (menuPopularity[fi.menuItemName] || 0) + fi.orderCount;
            }
        }
        const topMenuItems = Object.entries(menuPopularity)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, totalOrdered: count }));

        res.json({
            success: true,
            data: {
                summary: stats || {
                    totalCustomers: 0,
                    totalOrders: 0,
                    totalRevenue: 0,
                    avgOrderValue: 0,
                    avgInteractions: 0
                },
                topCustomers,
                hourlyDistribution,
                topMenuItems
            }
        });
    } catch (err) {
        console.error('Error fetching customer profile stats:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/customer-profiles
 * List semua profil pelanggan chatbot (paginated, searchable)
 */
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            sortBy = 'lastInteractionAt',
            sortOrder = 'desc',
            tag = ''
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Build query filter
        const filter = {};
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { name: searchRegex },
                { phone: searchRegex }
            ];
        }
        if (tag) {
            filter.tags = tag;
        }

        // Build sort
        const sort = {};
        const validSortFields = ['lastInteractionAt', 'totalOrders', 'totalSpent', 'totalInteractions', 'name', 'createdAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'lastInteractionAt';
        sort[sortField] = sortOrder === 'asc' ? 1 : -1;

        const [customers, total] = await Promise.all([
            CustomerChatbotProfile.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .select('name phone totalInteractions totalOrders totalSpent averageOrderValue tags lastInteractionAt lastOrderAt firstSeenAt')
                .lean(),
            CustomerChatbotProfile.countDocuments(filter)
        ]);

        // Ambil semua tags unik untuk filter sidebar
        const allTags = await CustomerChatbotProfile.distinct('tags');

        res.json({
            success: true,
            data: customers,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            },
            availableTags: allTags
        });
    } catch (err) {
        console.error('Error fetching customer profiles:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/customer-profiles/:id
 * Detail profil pelanggan chatbot (termasuk favoriteItems, orderHistory, distribusi jam)
 */
router.get('/:id', async (req, res) => {
    try {
        const profile = await CustomerChatbotProfile.findById(req.params.id).lean();
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profil pelanggan tidak ditemukan.' });
        }

        res.json({ success: true, data: profile });
    } catch (err) {
        console.error('Error fetching customer profile detail:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * DELETE /api/customer-profiles/:id
 * Hapus profil pelanggan
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await CustomerChatbotProfile.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Profil pelanggan tidak ditemukan.' });
        }
        res.json({ success: true, message: 'Profil pelanggan berhasil dihapus.' });
    } catch (err) {
        console.error('Error deleting customer profile:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
