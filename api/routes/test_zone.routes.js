import express from 'express';
import { Order } from "../models/order.model.js";

const router = express.Router();

const toNumber = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
};

router.post('/:orderId/recalculate-totals', async (req, res) => {
    console.log('[ORDER] [START] Recalculate totals');

    try {
        const { orderId } = req.params;
        console.log('[ORDER] [PARAM]', { orderId });

        const {
            taxRate = 0,
            serviceRate = 0,
            applyTax = true,
            applyService = true
        } = req.body;

        console.log('[ORDER] [REQUEST_BODY]', {
            taxRate,
            serviceRate,
            applyTax,
            applyService
        });

        // 1. Ambil order
        const order = await Order.findById(orderId);
        if (!order) {
            console.log('[ORDER] [ERROR] Order not found');
            return res.status(404).json({ message: 'Order not found' });
        }

        if (!Array.isArray(order.items)) {
            throw new Error('Order items is not an array');
        }

        console.log('[ORDER] [FETCHED]', {
            itemsCount: order.items.length
        });

        // 2. Hitung totalBeforeDiscount
        const totalBeforeDiscount = order.items.reduce((sum, item, index) => {
            const price = toNumber(item.menuItemData.price);
            const qty = toNumber(item.quantity);
            const subtotal = price * qty;

            console.log('[ORDER] [ITEM]', {
                index,
                price,
                qty,
                subtotal
            });

            return sum + subtotal;
        }, 0);

        console.log('[ORDER] [CALC] totalBeforeDiscount', totalBeforeDiscount);

        // 3. Diskon
        const discount = toNumber(order.discount);
        const totalAfterDiscount = totalBeforeDiscount - discount;

        console.log('[ORDER] [DISCOUNT]', {
            discount,
            totalAfterDiscount
        });

        // 4. Pajak & service
        const taxRateNum = toNumber(taxRate);
        const serviceRateNum = toNumber(serviceRate);

        const tax = applyTax ? totalAfterDiscount * taxRateNum : 0;
        const service = applyService ? totalAfterDiscount * serviceRateNum : 0;

        console.log('[ORDER] [CALC_TAX_SERVICE]', {
            taxRateNum,
            serviceRateNum,
            tax,
            service
        });

        // 5. Final total
        const taxAndService = tax + service;
        const grandTotal = totalAfterDiscount + taxAndService;

        console.log('[ORDER] [FINAL_TOTAL]', {
            totalBeforeDiscount,
            totalAfterDiscount,
            tax,
            service,
            taxAndService,
            grandTotal,
            types: {
                totalBeforeDiscount: typeof totalBeforeDiscount,
                totalAfterDiscount: typeof totalAfterDiscount,
                tax: typeof tax,
                service: typeof service,
                grandTotal: typeof grandTotal
            }
        });

        if (!Number.isFinite(grandTotal)) {
            throw new Error('Grand total is NaN or invalid');
        }

        // 6. Simpan
        order.totalBeforeDiscount = totalBeforeDiscount;
        order.totalAfterDiscount = totalAfterDiscount;
        order.totalTax = tax;
        order.taxAndService = taxAndService;
        order.grandTotal = grandTotal;

        await order.save();

        console.log('[ORDER] [SAVED] Totals updated');
        console.log('[ORDER] [END] Success');

        return res.json({
            totalBeforeDiscount,
            totalAfterDiscount,
            totalTax: tax,
            taxAndService,
            grandTotal
        });

    } catch (err) {
        console.error('[ORDER] [FATAL_ERROR]', err.message);
        return res.status(500).json({
            message: 'Failed to recalculate totals',
            error: err.message
        });
    }
});

export default router;