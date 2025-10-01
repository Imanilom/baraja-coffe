// voucher-routes.js
import express from 'express';
import mongoose from 'mongoose';
import Voucher from '../models/voucher.model.js';

const router = express.Router();

// GET /api/vouchers/available - Mendapatkan voucher yang tersedia
router.get('/available', async (req, res) => {
    try {
        const { isActive, validNow, outletId, customerType, userId } = req.query;

        // Build query filter
        const filter = {};

        if (isActive === 'true') {
            filter.isActive = true;
        }

        if (validNow === 'true') {
            const now = new Date();
            filter.validFrom = { $lte: now };
            filter.validTo = { $gte: now };
        }

        if (customerType && customerType !== 'all') {
            filter.customerType = { $in: [customerType, 'all'] };
        }

        // Filter berdasarkan outlet yang berlaku
        if (outletId) {
            filter.$or = [
                { applicableOutlets: { $size: 0 } },
                { applicableOutlets: outletId }
            ];
        }

        let vouchers = await Voucher.find(filter)
            .populate('applicableOutlets', 'name')
            .sort({ createdAt: -1 });

        // Filter voucher oneTimeUse jika userId disediakan
        if (userId) {
            vouchers = vouchers.filter(voucher => {
                // Jika bukan oneTimeUse, tampilkan
                if (!voucher.oneTimeUse) return true;

                // Jika oneTimeUse, cek apakah user sudah pernah pakai
                const hasUsed = voucher.usedBy?.some(
                    usage => usage.userId.toString() === userId
                );
                return !hasUsed;
            });
        }

        res.json({
            success: true,
            vouchers: vouchers,
            count: vouchers.length
        });

    } catch (error) {
        console.error('Error fetching vouchers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vouchers',
            error: error.message
        });
    }
});

// POST /api/vouchers/validate - Validasi voucher berdasarkan kode
router.post('/validate', async (req, res) => {
    try {
        const { code, orderAmount, outletId, customerType = 'all', userId } = req.body;

        if (!code || orderAmount === undefined) {
            return res.status(400).json({
                isValid: false,
                message: 'Code and order amount are required'
            });
        }

        const voucher = await Voucher.findOne({
            code: code.toUpperCase(),
            isActive: true
        }).populate('applicableOutlets', 'name');

        if (!voucher) {
            return res.status(404).json({
                isValid: false,
                message: 'Voucher not found or inactive'
            });
        }

        // Validasi oneTimeUse
        if (voucher.oneTimeUse && userId) {
            const hasUsed = voucher.usedBy?.some(
                usage => usage.userId.toString() === userId
            );

            if (hasUsed) {
                return res.status(400).json({
                    isValid: false,
                    message: 'You have already used this voucher'
                });
            }
        }

        // Validasi tanggal berlaku
        const now = new Date();
        if (voucher.validFrom > now) {
            return res.status(400).json({
                isValid: false,
                message: 'Voucher is not yet valid'
            });
        }

        if (voucher.validTo < now) {
            return res.status(400).json({
                isValid: false,
                message: 'Voucher has expired'
            });
        }

        // Validasi kuota
        if (voucher.quota <= 0) {
            return res.status(400).json({
                isValid: false,
                message: 'Voucher quota has been exhausted'
            });
        }

        // Validasi customer type
        if (voucher.customerType !== 'all' && voucher.customerType !== customerType) {
            return res.status(400).json({
                isValid: false,
                message: 'Voucher is not applicable for your customer type'
            });
        }

        // Validasi outlet
        if (outletId && voucher.applicableOutlets.length > 0) {
            const isOutletValid = voucher.applicableOutlets.some(outlet =>
                outlet._id.toString() === outletId
            );

            if (!isOutletValid) {
                return res.status(400).json({
                    isValid: false,
                    message: 'Voucher is not applicable for this outlet'
                });
            }
        }

        // Hitung discount amount
        let discountAmount = 0;
        let minimumSpend = 0;

        if (voucher.discountType === 'percentage') {
            const percentageValue = voucher.discountAmount / 100;
            const calculatedDiscount = orderAmount * percentageValue;
            discountAmount = Math.min(calculatedDiscount, voucher.discountAmount);
            minimumSpend = voucher.discountAmount * 5;
        } else if (voucher.discountType === 'fixed') {
            discountAmount = voucher.discountAmount;
            minimumSpend = voucher.discountAmount * 3;
        }

        // Validasi minimum spend
        if (minimumSpend > 0 && orderAmount < minimumSpend) {
            return res.status(400).json({
                isValid: false,
                message: `Minimum spend of Rp${minimumSpend.toLocaleString('id-ID')} required for this voucher`,
                minimumSpend: minimumSpend,
                currentAmount: orderAmount
            });
        }

        res.json({
            isValid: true,
            message: 'Voucher is valid',
            discountAmount: discountAmount,
            voucher: voucher
        });

    } catch (error) {
        console.error('Error validating voucher:', error);
        res.status(500).json({
            isValid: false,
            message: 'Error validating voucher',
            error: error.message
        });
    }
});

// POST /api/vouchers/mark-used - Mark voucher sebagai sudah digunakan
router.post('/mark-used', async (req, res) => {
    try {
        const { voucherCode, userId } = req.body;

        console.log('Mark used request:', { voucherCode, userId }); // Debug log

        if (!voucherCode || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Voucher ID and User ID are required'
            });
        }

        const voucher = await Voucher.findOne({ code: voucherCode });


        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }

        console.log('Before update:', voucher.usedBy); // Debug log

        // Jika oneTimeUse, tambahkan user ke usedBy array
        if (voucher.oneTimeUse) {
            const alreadyUsed = voucher.usedBy?.some(
                usage => usage.userId.toString() === userId
            );

            if (!alreadyUsed) {
                voucher.usedBy.push({
                    userId: new mongoose.Types.ObjectId(userId), // Pastikan ObjectId
                    usedAt: new Date()
                });
            }
        }

        // Kurangi quota
        if (voucher.quota > 0) {
            voucher.quota -= 1;
        }

        await voucher.save();

        console.log('After update:', voucher.usedBy); // Debug log

        res.json({
            success: true,
            message: 'Voucher marked as used',
            remainingQuota: voucher.quota
        });

    } catch (error) {
        console.error('Error marking voucher as used:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking voucher as used',
            error: error.message
        });
    }
});
// GET /api/vouchers/:id - Mendapatkan detail voucher berdasarkan ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const voucher = await Voucher.findById(id)
            .populate('applicableOutlets', 'name');

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }

        res.json({
            success: true,
            voucher: voucher
        });

    } catch (error) {
        console.error('Error fetching voucher:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching voucher',
            error: error.message
        });
    }
});

export default router;