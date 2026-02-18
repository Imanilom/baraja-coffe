
import CashRecapLog from "../models/CashRecapLog.model.js";
import mongoose from "mongoose";
import Payment from "../models/Payment.model.js";
import { Order } from "../models/order.model.js";
import moment from "moment";

// Helper for safe ObjectID conversion
const toObjectId = (id) => {
    if (!id) return null;
    try {
        return new mongoose.Types.ObjectId(id);
    } catch (error) {
        console.warn(`Invalid ObjectId: ${id}`);
        return null;
    }
};

/**
 * Generate Cash Recap for "Cash Only" transactions.
 * Rules:
 * - Start from TODAY 00:00:00 WIB (Strict Daily Reset).
 * - If previous print exists TODAY, start from previous print's time.
 * - Filter orders:
 *    1. Cashier ID & Outlet match.
 *    2. CreatedAt in range.
 *    3. Status check matching getCashierOrderHistory logic.
 *    4. Must have valid 'Cash' payment (Settlement/Success/Completed).
 */
export const getCashRecap = async (req, res) => {
    try {
        const { outletId, deviceId } = req.body;

        if (!outletId || !deviceId) {
            return res.status(400).json({ success: false, message: "Outlet ID and Device ID are required" });
        }

        const outletObjectId = toObjectId(outletId);
        const deviceObjectId = toObjectId(deviceId);

        // 1. Calculate Time Range
        // Current time (WIB is handled by server time usually, but ensured via Date objects)
        const now = new Date();

        // Start of TODAY (00:00:00)
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        // Find last recap for this device & outlet TODAY
        const lastRecap = await CashRecapLog.findOne({
            outletId: outletObjectId,
            deviceId: deviceObjectId,
            printedAt: { $gte: startOfDay } // Only look for recaps printed TODAY
        }).sort({ printedAt: -1 });

        // Determine Start Date
        let startDate = startOfDay;
        if (lastRecap) {
            startDate = lastRecap.rangeEndDate;
        }

        const endDate = now;

        console.log(`[CashRecap] Range: ${startDate.toISOString()} - ${endDate.toISOString()}`);

        // 2. Query Orders (Step 1: Base Filter)
        const baseFilter = {
            device_id: deviceObjectId,
            outlet: outletObjectId, // Note: Order model usually uses 'outlet' or 'outletId' depending on schema, assumed 'outlet' from context
            createdAt: { $gte: startDate, $lte: endDate }
        };

        // Note: checking schema, Order model uses 'outlet' reference usually. 
        // If 'outletId' is used in schema, adapt accordingly. Based on cashierReport, it uses 'outlet'.
        // Also handling Open Bill logic from getCashierOrderHistory

        const candidateOrders = await Order.find(baseFilter).lean();

        // 3. Filter Logic (Matching getCashierOrderHistory)
        const orderIds = candidateOrders.map(o => o.order_id);

        // Fetch related payments
        const payments = await Payment.find({
            order_id: { $in: orderIds },
            status: { $ne: 'void' }
        }).lean();

        // Filter Function
        const validOrders = candidateOrders.filter(order => {
            // Check Status & Open Bill Status
            let isStatusValid = false;
            if (!order.isOpenBill) {
                // Regular: Not Pending
                if (order.status !== 'Pending') isStatusValid = true;
            } else {
                // Open Bill: Completed AND Closed
                if (order.status === 'Completed' && order.openBillStatus === 'closed') isStatusValid = true;
            }

            if (!isStatusValid) return false;

            // Check Payment (Step 2: Payment Validation)
            // Must have 'Cash' payment that is settled/completed
            const orderPayments = payments.filter(p => p.order_id.toString() === order.order_id.toString());

            const hasValidCashPayment = orderPayments.some(p => {
                const isValidStatus = ['settlement', 'Success', 'completed'].includes(p.status);
                // Flexible check for 'Cash' (case-insensitive) just to be safe, though requirement is strict
                const isCash = p.method && p.method.toLowerCase() === 'cash' || p.payment_type && p.payment_type.toLowerCase() === 'cash';
                return isValidStatus && isCash;
            });

            return hasValidCashPayment;
        });

        // 4. Calculate Totals
        let totalCashAmount = 0;
        const processedOrders = validOrders.map(order => {
            // Calculate cash amount contributes to this order
            // Assuming we take the full grandTotal if it's a pure cash order, 
            // OR strictly sum the cash payments for split payments.

            const orderPayments = payments.filter(p => p.order_id.toString() === order.order_id.toString());
            const validCashPayments = orderPayments.filter(p => {
                return ['settlement', 'Success', 'completed'].includes(p.status) &&
                    (p.method?.toLowerCase() === 'cash' || p.payment_type?.toLowerCase() === 'cash');
            });

            let cashAmount = 0;
            if (!order.isSplitPayment) {
                // ✅ FIX: Use grandTotal directly to match DB (handles discounts/custom amounts correctly)
                cashAmount = order.grandTotal;
            } else {
                // If split payment, sum only the cash portions
                cashAmount = validCashPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            }
            totalCashAmount += cashAmount;

            return {
                orderId: order.order_id,
                time: order.createdAt,
                amount: cashAmount
            };
        });

        // 5. Save Log
        const newLog = new CashRecapLog({
            outletId: outletObjectId,
            deviceId: deviceObjectId,
            rangeStartDate: startDate,
            rangeEndDate: endDate,
            totalCashAmount: totalCashAmount,
            orderCount: processedOrders.length,
            orders: processedOrders,
            printedAt: now
        });

        await newLog.save();

        // 6. Return Data
        res.status(200).json({
            success: true,
            data: {
                period: {
                    start: startDate,
                    end: endDate
                },
                printDate: now,
                totalCash: totalCashAmount,
                orderCount: processedOrders.length,
                orders: processedOrders.map(o => ({
                    id: o.orderId,
                    time: moment(o.time).format('HH:mm'), // Format for display
                    amount: o.amount
                }))
            }
        });

    } catch (error) {
        console.error('Error in getCashRecap:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

