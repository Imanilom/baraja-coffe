// voucher-routes.js
import express from 'express';
import mongoose from 'mongoose';
import Voucher from '../models/voucher.model.js'; // Import model Voucher Anda
import VoucherUsage from '../models/VoucherUsage.js'; // Import model VoucherUsage

const router = express.Router();

// GET /api/vouchers/available - Mendapatkan voucher yang tersedia
router.get('/available', async (req, res) => {
    try {
        const { isActive, validNow, outletId, customerType } = req.query;

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
                { applicableOutlets: { $size: 0 } }, // Berlaku untuk semua outlet
                { applicableOutlets: outletId }       // Berlaku untuk outlet tertentu
            ];
        }

        const vouchers = await Voucher.find(filter)
            .populate('applicableOutlets', 'name')
            .sort({ createdAt: -1 });

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
        const { code, orderAmount, outletId, customerType = 'all' } = req.body;

        if (!code || orderAmount === undefined) {
            return res.status(400).json({
                isValid: false,
                message: 'Code and order amount are required'
            });
        }

        // Cari voucher berdasarkan kode
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
            // Untuk percentage, discountAmount adalah nilai maksimal discount
            const percentageValue = voucher.discountAmount / 100; // Convert to decimal
            const calculatedDiscount = orderAmount * percentageValue;

            // Ambil nilai minimum antara calculated discount dan maximum discount
            discountAmount = Math.min(calculatedDiscount, voucher.discountAmount);

            // Set minimum spend (bisa disesuaikan dengan business logic)
            minimumSpend = voucher.discountAmount * 5; // Contoh: 5x max discount

        } else if (voucher.discountType === 'fixed') {
            discountAmount = voucher.discountAmount;

            // Set minimum spend untuk fixed discount
            minimumSpend = voucher.discountAmount * 3; // Contoh: 3x discount amount
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

// POST /api/vouchers/apply - Apply voucher (untuk tracking penggunaan)
router.post('/apply', async (req, res) => {
    try {
        const { code, orderAmount, orderId, outletId, customerId } = req.body;

        if (!code || !orderId || orderAmount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Code, order ID, and order amount are required'
            });
        }

        // Validasi voucher terlebih dahulu
        const voucher = await Voucher.findOne({
            code: code.toUpperCase(),
            isActive: true
        });

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found or inactive'
            });
        }

        // Cek apakah voucher sudah digunakan untuk order ini
        const existingUsage = await VoucherUsage.findOne({
            voucherId: voucher._id,
            orderId: orderId
        });

        if (existingUsage) {
            return res.status(400).json({
                success: false,
                message: 'Voucher already applied to this order'
            });
        }

        // Validasi kuota
        if (voucher.quota <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Voucher quota has been exhausted'
            });
        }

        // Hitung discount amount
        let discountAmount = 0;

        if (voucher.discountType === 'percentage') {
            const percentageValue = voucher.discountAmount / 100;
            const calculatedDiscount = orderAmount * percentageValue;
            discountAmount = Math.min(calculatedDiscount, voucher.discountAmount);
        } else {
            discountAmount = voucher.discountAmount;
        }

        // Mulai transaction untuk memastikan data consistency
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Kurangi kuota voucher
            await Voucher.findByIdAndUpdate(
                voucher._id,
                { $inc: { quota: -1 } },
                { session }
            );

            // Catat penggunaan voucher
            await VoucherUsage.create([{
                voucherId: voucher._id,
                orderId: orderId,
                customerId: customerId,
                outletId: outletId,
                discountAmount: discountAmount,
                orderAmount: orderAmount,
                usedAt: new Date()
            }], { session });

            await session.commitTransaction();

            res.json({
                success: true,
                message: 'Voucher applied successfully',
                discountAmount: discountAmount
            });

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('Error applying voucher:', error);
        res.status(500).json({
            success: false,
            message: 'Error applying voucher',
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