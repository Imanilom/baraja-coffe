import cron from 'node-cron';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';

/**
 * ✅ CRITICAL: Rollback stock untuk expired payment
 */
const rollbackStockForExpiredPayment = async (order) => {
    console.log(`🔄 Rolling back stock for expired payment - Order: ${order.order_id}`);

    try {
        for (const item of order.items) {
            if (!item.menuItem) continue;

            // Rollback MenuStock
            const menuStock = await MenuStock.findOne({ menuItemId: item.menuItem });
            if (menuStock) {
                const updateData = {
                    $inc: {
                        currentStock: item.quantity
                    }
                };

                // Tentukan apakah manual atau calculated stock
                if (menuStock.manualStock !== null) {
                    updateData.$inc.manualStock = item.quantity;
                } else {
                    updateData.$inc.calculatedStock = item.quantity;
                }

                await MenuStock.findByIdAndUpdate(menuStock._id, updateData);

                console.log(`✅ Rolled back ${item.quantity} units to MenuStock for item ${item.menuItem}`);
            }

            // Rollback MenuItem availableStock
            const menuItem = await MenuItem.findByIdAndUpdate(
                item.menuItem,
                { $inc: { availableStock: item.quantity } },
                { new: true }
            );

            if (menuItem) {
                // Re-activate item jika stock sekarang > 0
                if (menuItem.availableStock > 0 && !menuItem.isActive) {
                    await MenuItem.findByIdAndUpdate(
                        item.menuItem,
                        { isActive: true }
                    );
                    console.log(`🟢 Auto-reactivated menu item: ${menuItem.name}`);
                }

                console.log(`✅ Rolled back ${item.quantity} units to MenuItem "${menuItem.name}"`);
            }
        }

        return true;
    } catch (error) {
        console.error(`❌ Failed to rollback stock for order ${order.order_id}:`, error);
        return false;
    }
};

/**
 * ✅ Monitor expired payments dan auto-cancel order + rollback stock
 */
const monitorExpiredPayments = async () => {
    try {
        const now = new Date();

        // Cari semua payment yang pending dan sudah expired
        const expiredPayments = await Payment.find({
            status: { $in: ['pending', 'expire'] },
            expiry_time: { $exists: true, $ne: null }
        });

        if (expiredPayments.length === 0) {
            return;
        }

        console.log(`🔍 Found ${expiredPayments.length} payments to check for expiry`);

        for (const payment of expiredPayments) {
            try {
                // Parse expiry_time (format: "YYYY-MM-DD HH:mm:ss")
                let expiryDate;
                if (typeof payment.expiry_time === 'string') {
                    // Convert "2025-01-09 14:30:00" to Date object
                    expiryDate = new Date(payment.expiry_time.replace(' ', 'T'));
                } else {
                    expiryDate = new Date(payment.expiry_time);
                }

                // Cek apakah sudah expired
                if (expiryDate <= now) {
                    console.log(`⏰ Payment expired - Payment Code: ${payment.payment_code}, Order: ${payment.order_id}`);

                    // Update payment status ke 'expire'
                    await Payment.findByIdAndUpdate(payment._id, {
                        status: 'expire'
                    });

                    // Cari order terkait
                    const order = await Order.findOne({ order_id: payment.order_id })
                        .populate('items.menuItem');

                    if (!order) {
                        console.log(`⚠️ Order not found: ${payment.order_id}`);
                        continue;
                    }

                    // Cek apakah ada payment lain yang sudah settlement untuk order ini
                    const hasSettledPayment = await Payment.findOne({
                        order_id: payment.order_id,
                        status: 'settlement'
                    });

                    if (hasSettledPayment) {
                        console.log(`ℹ️ Order ${payment.order_id} has settled payment, skipping cancellation`);
                        continue;
                    }

                    // ✅ CRITICAL: Rollback stock
                    const stockRollbackSuccess = await rollbackStockForExpiredPayment(order);

                    if (stockRollbackSuccess) {
                        console.log(`✅ Stock rollback successful for order ${order.order_id}`);
                    }

                    // Update order status
                    let shouldCancelOrder = true;

                    // Untuk Down Payment atau Final Payment yang expired
                    if (payment.paymentType === 'Down Payment' || payment.paymentType === 'Final Payment') {
                        // Cek apakah ada payment lain yang masih pending
                        const otherPendingPayments = await Payment.findOne({
                            order_id: payment.order_id,
                            _id: { $ne: payment._id },
                            status: 'pending'
                        });

                        if (otherPendingPayments) {
                            shouldCancelOrder = false;
                            console.log(`ℹ️ Order ${payment.order_id} has other pending payments, not canceling order`);
                        }
                    }

                    if (shouldCancelOrder) {
                        await Order.findByIdAndUpdate(order._id, {
                            status: 'Canceled',
                            cancellationReason: `Payment expired at ${expiryDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
                        });

                        console.log(`🚫 Order ${order.order_id} auto-canceled due to payment expiry`);
                    }

                    // Log activity
                    console.log(`✅ Processed expired payment: ${payment.payment_code}`);
                }
            } catch (error) {
                console.error(`❌ Error processing payment ${payment.payment_code}:`, error);
                continue;
            }
        }

    } catch (error) {
        console.error('❌ Error in monitorExpiredPayments:', error);
    }
};

/**
 * ✅ Setup cron job untuk monitoring
 * Jalan setiap 5 menit
 */
export const setupPaymentExpiryMonitor = () => {
    // Cron pattern: setiap 5 menit
    cron.schedule('*/5 * * * *', async () => {
        console.log('🔄 Running payment expiry monitor...');
        await monitorExpiredPayments();
    });

    console.log('✅ Payment expiry monitor started - Running every 5 minutes');

    // Jalankan sekali saat startup
    console.log('🚀 Running initial payment expiry check...');
    monitorExpiredPayments();
};

/**
 * ✅ Manual trigger untuk testing atau on-demand execution
 */
export const triggerPaymentExpiryCheck = async () => {
    console.log('🔄 Manual trigger: Payment expiry check');
    await monitorExpiredPayments();
    return { success: true, message: 'Payment expiry check completed' };
};

/**
 * ✅ API endpoint untuk manual trigger (opsional)
 */
export const manualCheckExpiredPayments = async (req, res) => {
    try {
        await monitorExpiredPayments();
        res.status(200).json({
            success: true,
            message: 'Payment expiry check completed successfully'
        });
    } catch (error) {
        console.error('❌ Error in manual check:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check expired payments',
            error: error.message
        });
    }
};