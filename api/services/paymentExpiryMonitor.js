import cron from 'node-cron';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import Table from '../models/Table.model.js';
import Area from '../models/Area.model.js';
import mongoose from 'mongoose';

// Helper function untuk mendapatkan waktu WIB sekarang
const getWIBNow = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

// Logger dengan level
const log = {
    info: (msg) => console.log(`ℹ️  [INFO] ${msg}`),
    success: (msg) => console.log(`✅ [SUCCESS] ${msg}`),
    warning: (msg) => console.log(`⚠️  [WARNING] ${msg}`),
    error: (msg, err) => console.error(`❌ [ERROR] ${msg}`, err || ''),
    debug: (msg) => console.log(`🔍 [DEBUG] ${msg}`)
};

/**
 * ✅ FIXED: Rollback stock untuk expired payment dengan tracking
 * Tambahkan flag stockRolledBack di order untuk prevent double rollback
 */
const rollbackStockForExpiredPayment = async (order, session = null) => {
    log.info(`Rolling back stock for expired payment - Order: ${order.order_id}`);

    try {
        // ✅ CRITICAL FIX: Cek apakah stock sudah pernah di-rollback
        if (order.stockRolledBack === true) {
            log.warning(`Stock already rolled back for order ${order.order_id}, skipping...`);
            return { alreadyRolledBack: true, success: true };
        }

        const rollbackResults = [];

        for (const item of order.items) {
            if (!item.menuItem) continue;

            try {
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
                    log.success(`Rolled back ${item.quantity} units to MenuStock for item ${item.menuItem}`);
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
                        log.success(`Auto-reactivated menu item: ${menuItem.name}`);
                    }

                    rollbackResults.push({
                        menuItemId: item.menuItem,
                        name: menuItem.name,
                        quantity: item.quantity,
                        success: true
                    });
                }
            } catch (itemError) {
                log.error(`Failed to rollback item ${item.menuItem}:`, itemError.message);
                rollbackResults.push({
                    menuItemId: item.menuItem,
                    quantity: item.quantity,
                    success: false,
                    error: itemError.message
                });
            }
        }

        // ✅ CRITICAL: Tandai order bahwa stock sudah di-rollback
        await Order.findByIdAndUpdate(
            order._id,
            {
                stockRolledBack: true,
                stockRollbackAt: getWIBNow(),
                stockRollbackDetails: rollbackResults
            }
        );

        log.success(`Stock rollback completed and marked for order ${order.order_id}`);
        return { success: true, results: rollbackResults };

    } catch (error) {
        log.error(`Failed to rollback stock for order ${order.order_id}:`, error.message);
        return { success: false, error: error.message };
    }
};

const releaseTableForCanceledOrder = async (order, session = null, retryCount = 0) => {
    const MAX_RETRIES = 3;

    try {
        // Hanya untuk Dine-In dan Reservation
        if ((order.orderType !== 'Dine-In' && order.orderType !== 'Reservation') || !order.tableNumber || !order.outlet) {
            log.debug(`Skip table release: Order ${order.order_id} (type: ${order.orderType})`);
            return { skipped: true };
        }

        // ✅ CRITICAL FIX: Cek apakah table sudah pernah di-release untuk order ini
        if (order.tableReleased === true) {
            log.warning(`Table already released for order ${order.order_id}, skipping...`);
            return { alreadyReleased: true, success: true };
        }

        log.info(`Releasing table ${order.tableNumber} for order ${order.order_id}`);

        // Cari area berdasarkan outlet
        const areas = await Area.find({ outlet_id: order.outlet })
            .select('_id')
            .lean();

        const areaIds = areas.map(area => area._id);

        if (areaIds.length === 0) {
            log.warning(`No areas found for outlet ${order.outlet}`);
            return { success: false, reason: 'No areas found' };
        }

        // Format table_number
        const cleanTableNumber = order.tableNumber
            .toUpperCase()
            .trim()
            .replace(/[^A-Z0-9-_]/g, ''); // Allow dash and underscore

        log.debug(`Searching table: ${cleanTableNumber} in ${areaIds.length} areas`);

        const table = await Table.findOne({
            table_number: cleanTableNumber,
            area_id: { $in: areaIds },
            is_active: true
        });

        if (!table) {
            log.warning(`Table not found: ${cleanTableNumber} in outlet ${order.outlet}`);
            return { success: false, reason: 'Table not found' };
        }

        log.info(`Table found: ${table.table_number} (current status: ${table.status})`);

        const oldStatus = table.status;

        // Add to status history
        const statusHistory = table.statusHistory || [];
        statusHistory.push({
            fromStatus: oldStatus,
            toStatus: 'available',
            updatedBy: 'System Auto-Release',
            notes: `Table auto-released due to order cancellation - Order: ${order.order_id}`,
            updatedAt: getWIBNow()
        });

        // Update table
        await Table.findByIdAndUpdate(
            table._id,
            {
                status: 'available',
                is_available: true,
                updatedAt: getWIBNow(),
                statusHistory: statusHistory
            }
        );

        // ✅ CRITICAL: Tandai order bahwa table sudah di-release
        await Order.findByIdAndUpdate(
            order._id,
            {
                tableReleased: true,
                tableReleasedAt: getWIBNow()
            }
        );

        log.success(`Table ${table.table_number} released: ${oldStatus} → available`);
        return { success: true, table: table.table_number };

    } catch (error) {
        log.error(`Error releasing table for order ${order.order_id}:`, error.message);
        return { success: false, error: error.message };
    }
};



/**
 * ✅ Auto-complete OnProcess orders yang sudah ganti tanggal
 */
const autoCompleteExpiredOnProcessOrders = async () => {
    try {
        const now = getWIBNow();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        log.info(`Checking for OnProcess orders from previous dates`);

        // Cari semua order dengan status OnProcess yang dibuat hari sebelumnya
        const expiredOnProcessOrders = await Order.find({
            status: 'OnProcess',
            createdAtWIB: { $lt: today }
        }).lean();

        if (expiredOnProcessOrders.length === 0) {
            log.success(`No expired OnProcess orders found`);
            return { completedCount: 0, totalFound: 0 };
        }

        log.info(`Found ${expiredOnProcessOrders.length} OnProcess orders from previous dates`);

        // Batch update untuk performance
        const orderIds = expiredOnProcessOrders.map(order => order._id);

        const result = await Order.updateMany(
            { _id: { $in: orderIds } },
            {
                $set: {
                    status: 'Completed',
                    updatedAtWIB: getWIBNow(),
                    cancellationReason: null,
                    autoCompletedAt: getWIBNow(),
                    autoCompletedReason: 'Auto-completed expired OnProcess order'
                }
            }
        );

        log.success(`Completed ${result.modifiedCount} expired OnProcess orders`);
        return { completedCount: result.modifiedCount, totalFound: expiredOnProcessOrders.length };

    } catch (error) {
        log.error('Error in autoCompleteExpiredOnProcessOrders:', error.message);
        return { error: error.message };
    }
};

/**
 * ✅ Cleanup orphaned payments
 */
const cleanupOrphanedPayments = async () => {
    try {
        log.info('Cleaning up orphaned payments...');

        // Dapatkan semua order_id yang ada di collection Order
        const existingOrderIds = await Order.distinct('order_id');

        // Cari payment yang order_id-nya tidak ada di Order collection
        const orphanedPayments = await Payment.find({
            order_id: { $nin: existingOrderIds },
            status: { $ne: 'orphaned' } // Skip yang sudah di-mark
        }).lean();

        if (orphanedPayments.length === 0) {
            log.success(`No orphaned payments found`);
            return { cleanedCount: 0 };
        }

        log.info(`Found ${orphanedPayments.length} orphaned payments`);

        // Batch update
        const result = await Payment.updateMany(
            {
                order_id: { $nin: existingOrderIds },
                status: { $ne: 'orphaned' }
            },
            {
                $set: {
                    status: 'orphaned',
                    notes: 'Order tidak ditemukan - payment di-mark as orphaned',
                    orphanedAt: getWIBNow()
                }
            }
        );

        log.success(`Marked ${result.modifiedCount} orphaned payments`);
        return { cleanedCount: result.modifiedCount };

    } catch (error) {
        log.error('Error in cleanupOrphanedPayments:', error.message);
        return { error: error.message };
    }
};

/**
 * ✅ FIXED: Monitor expired payments dengan batch processing dan prevent double processing
 */
/**
 * ✅ FIXED: Monitor expired payments dengan batch processing dan prevent double processing
 * ✅ PERBAIKAN: Exclude Reservation orders dari auto-cancel
 */

const monitorExpiredPayments = async () => {
    const session = await mongoose.startSession();

    try {
        const now = new Date();

        log.info('Starting payment expiry monitor...');

        // ✅ PERBAIKAN: Cari pending payments yang sudah expired
        const expiredPayments = await Payment.find({
            status: 'pending',
            expiry_time: { $exists: true, $ne: null },
            expiry_time: { $lt: now }, // Hanya yang sudah expired
            processedExpiry: { $ne: true } // Skip yang sudah diproses
        })
            .sort({ expiry_time: 1 }) // Urutkan dari yang paling lama
            .lean();

        if (expiredPayments.length === 0) {
            log.success(`No expired payments to process`);
            return {
                processedCount: 0,
                skippedCount: 0,
                errorCount: 0,
                totalChecked: 0
            };
        }

        log.info(`Found ${expiredPayments.length} expired pending payments to process`);

        let processedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        let reservationSkippedCount = 0;
        let openBillSkippedCount = 0;

        // ✅ PERBAIKAN KRITIS: Process SEQUENTIALLY bukan parallel
        // Untuk hindari transaction race condition
        for (let i = 0; i < expiredPayments.length; i++) {
            const payment = expiredPayments[i];

            try {
                log.info(`Processing expired payment [${i + 1}/${expiredPayments.length}] - Code: ${payment.payment_code}, Order: ${payment.order_id}`);

                // Gunakan session yang berbeda untuk setiap payment
                const paymentSession = await mongoose.startSession();

                try {
                    await paymentSession.withTransaction(async () => {
                        // ✅ Update payment dengan flag processedExpiry
                        await Payment.findByIdAndUpdate(
                            payment._id,
                            {
                                status: 'expire',
                                processedExpiry: true,
                                expiredAt: getWIBNow(),
                                notes: `Payment expired at ${getWIBNow().toISOString()}`
                            },
                            { session: paymentSession }
                        );

                        // Cari order terkait
                        const order = await Order.findOne({ order_id: payment.order_id })
                            .populate('items.menuItem')
                            .session(paymentSession);

                        if (!order) {
                            log.warning(`Order not found: ${payment.order_id} - marking payment as orphaned`);

                            await Payment.findByIdAndUpdate(
                                payment._id,
                                {
                                    status: 'orphaned',
                                    notes: 'Order tidak ditemukan saat processing expired payment',
                                    orphanedAt: getWIBNow()
                                },
                                { session: paymentSession }
                            );

                            skippedCount++;
                            return;
                        }

                        // ✅ CRITICAL: Skip Reservasi - tidak boleh di-expire
                        if (order.orderType === 'Reservation') {
                            log.warning(`⚠️ SKIPPING Reservation order ${order.order_id} - reservations should not expire automatically`);
                            reservationSkippedCount++;
                            skippedCount++;
                            return;
                        }

                        // ✅ PERBAIKAN: Skip Open Bill orders - tidak boleh di-expire
                        if (order.isOpenBill === true) {
                            log.warning(`⚠️ SKIPPING Open Bill order ${order.order_id} - open bills should not expire automatically`);
                            openBillSkippedCount++;
                            skippedCount++;
                            return;
                        }

                        // Cek apakah ada payment lain yang sudah settlement
                        const hasSettledPayment = await Payment.findOne({
                            order_id: payment.order_id,
                            status: 'settlement'
                        }).session(paymentSession).lean();

                        if (hasSettledPayment) {
                            log.info(`Order ${payment.order_id} has settled payment, skipping cancellation`);
                            skippedCount++;
                            return;
                        }

                        // ✅ Rollback stock dengan tracking
                        const stockRollback = await rollbackStockForExpiredPayment(order, paymentSession);

                        if (stockRollback.alreadyRolledBack) {
                            log.info(`Stock already rolled back for order ${order.order_id}`);
                        } else if (stockRollback.success) {
                            log.success(`Stock rollback successful for order ${order.order_id}`);
                        } else {
                            log.error(`Stock rollback failed for order ${order.order_id}`);
                        }

                        // ✅ Release table dengan tracking
                        const tableRelease = await releaseTableForCanceledOrder(order, paymentSession);

                        if (tableRelease.alreadyReleased) {
                            log.info(`Table already released for order ${order.order_id}`);
                        } else if (tableRelease.success) {
                            log.success(`Table released for order ${order.order_id}`);
                        }

                        // Tentukan apakah order harus di-cancel
                        let shouldCancelOrder = true;

                        if (payment.paymentType === 'Down Payment' || payment.paymentType === 'Final Payment') {
                            const otherPendingPayments = await Payment.findOne({
                                order_id: payment.order_id,
                                _id: { $ne: payment._id },
                                status: 'pending'
                            }).session(paymentSession).lean();

                            if (otherPendingPayments) {
                                shouldCancelOrder = false;
                                log.info(`Order ${order.order_id} has other pending payments, not canceling`);
                            }
                        }

                        if (shouldCancelOrder) {
                            await Order.findByIdAndUpdate(
                                order._id,
                                {
                                    status: 'Canceled',
                                    updatedAtWIB: getWIBNow(),
                                    cancellationReason: `Payment expired at ${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
                                    canceledBySystem: true,
                                    canceledAt: getWIBNow()
                                },
                                { session: paymentSession }
                            );

                            log.success(`✅ Order ${order.order_id} auto-canceled due to payment expiry`);
                            processedCount++;
                        } else {
                            skippedCount++;
                        }
                    });

                } catch (transactionError) {
                    errorCount++;
                    log.error(`Transaction error for payment ${payment.payment_code}:`, transactionError.message);

                    // Fallback: Update payment status tanpa transaction
                    try {
                        await Payment.findByIdAndUpdate(payment._id, {
                            status: 'expire',
                            processedExpiry: true,
                            expiredAt: getWIBNow(),
                            notes: `Auto-expired with error: ${transactionError.message}`
                        });
                        log.info(`Payment ${payment.payment_code} marked as expire (fallback)`);
                    } catch (fallbackError) {
                        log.error(`Fallback update failed for ${payment.payment_code}:`, fallbackError.message);
                    }

                } finally {
                    await paymentSession.endSession();
                }

                // ✅ Delay antar processing untuk hindari overload
                if (i < expiredPayments.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
                }

            } catch (error) {
                errorCount++;
                log.error(`Error processing payment ${payment.payment_code}:`, error.message);
            }
        }

        log.info(`\n📊 Payment Expiry Monitor Summary:`);
        log.success(`✅ Processed: ${processedCount} (non-reservation, non-openbill)`);
        log.info(`ℹ️  Skipped: ${skippedCount}`);
        log.info(`⚠️  Reservation orders skipped: ${reservationSkippedCount}`);
        log.info(`⚠️  Open Bill orders skipped: ${openBillSkippedCount}`);
        log.error(`❌ Errors: ${errorCount}`);
        log.info(`📊 Total Checked: ${expiredPayments.length}`);

        return {
            processedCount,
            skippedCount,
            reservationSkippedCount,
            openBillSkippedCount,
            errorCount,
            totalChecked: expiredPayments.length
        };

    } catch (error) {
        log.error('❌ Error in monitorExpiredPayments:', error.message);
        return { error: error.message };
    } finally {
        await session.endSession();
    }
};

/**
 * ✅ PERBAIKAN BARU: Monitor reservation expiry (beda logic dengan regular orders)
 * Reservation hanya expire berdasarkan reservation_date dan reservation_time, bukan payment expiry
 */
const monitorReservationExpiry = async () => {
    try {
        const now = getWIBNow();
        log.info('Starting reservation expiry monitor...');

        // Cari reservations yang sudah lewat waktu tapi masih pending
        const Reservation = mongoose.model('Reservation');

        const expiredReservations = await Reservation.find({
            status: 'pending',
            reservation_date: { $lt: now }, // Tanggal reservasi sudah lewat
            reservation_time: { $lt: now.getHours() + ':' + now.getMinutes() } // Waktu sudah lewat
        }).lean();

        if (expiredReservations.length === 0) {
            log.success(`No expired reservations to process`);
            return { expiredCount: 0, totalFound: 0 };
        }

        log.info(`Found ${expiredReservations.length} expired reservations`);

        let expiredCount = 0;

        for (const reservation of expiredReservations) {
            try {
                // Update reservation status
                await Reservation.findByIdAndUpdate(
                    reservation._id,
                    {
                        status: 'expired',
                        updatedAtWIB: getWIBNow(),
                        cancellationReason: 'Reservation expired - customer did not arrive'
                    }
                );

                // Cari dan cancel order terkait reservation
                const relatedOrder = await Order.findOne({
                    originalReservationId: reservation._id,
                    status: 'Pending'
                });

                if (relatedOrder) {
                    // Rollback stock
                    await rollbackStockForExpiredPayment(relatedOrder);

                    // Cancel order
                    await Order.findByIdAndUpdate(
                        relatedOrder._id,
                        {
                            status: 'Canceled',
                            updatedAtWIB: getWIBNow(),
                            cancellationReason: 'Reservation expired - auto cancelled',
                            canceledBySystem: true,
                            canceledAt: getWIBNow()
                        }
                    );

                    // Release table
                    await releaseTableForCanceledOrder(relatedOrder);
                }

                expiredCount++;
                log.success(`Reservation ${reservation.reservation_id} expired and processed`);

            } catch (error) {
                log.error(`Error processing reservation ${reservation.reservation_id}:`, error.message);
            }
        }

        log.success(`✅ Processed ${expiredCount} expired reservations`);
        return { expiredCount, totalFound: expiredReservations.length };

    } catch (error) {
        log.error('❌ Error in monitorReservationExpiry:', error.message);
        return { error: error.message };
    }
};

/**
 * ✅ PERBAIKAN BARU: Monitor Open Bill expiry
 * Open Bill hanya expire setelah 7 hari (bukan 24 jam)
 */
const monitorOpenBillExpiry = async () => {
    try {
        const now = getWIBNow();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        log.info('Starting open bill expiry monitor (7 days)...');

        // Cari open bills yang sudah lebih dari 7 hari
        const expiredOpenBills = await Order.find({
            isOpenBill: true,
            status: 'Pending',
            createdAt: { $lt: sevenDaysAgo },
            canceledBySystem: { $ne: true }
        }).lean();

        if (expiredOpenBills.length === 0) {
            log.success(`No expired open bills to process`);
            return { expiredCount: 0, totalFound: 0 };
        }

        log.info(`Found ${expiredOpenBills.length} open bills older than 7 days`);

        let expiredCount = 0;

        for (const order of expiredOpenBills) {
            try {
                // Untuk open bill, kita tidak rollback stock (karena sudah dikonsumsi)
                // Hanya cancel order dan release table

                // Cancel order
                await Order.findByIdAndUpdate(
                    order._id,
                    {
                        status: 'Canceled',
                        updatedAtWIB: getWIBNow(),
                        cancellationReason: 'Open bill expired after 7 days',
                        canceledBySystem: true,
                        canceledAt: getWIBNow()
                    }
                );

                // Release table
                await releaseTableForCanceledOrder(order);

                expiredCount++;
                log.success(`Open Bill ${order.order_id} expired after 7 days and processed`);

            } catch (error) {
                log.error(`Error processing open bill ${order.order_id}:`, error.message);
            }
        }

        log.success(`✅ Processed ${expiredCount} expired open bills`);
        return { expiredCount, totalFound: expiredOpenBills.length };

    } catch (error) {
        log.error('❌ Error in monitorOpenBillExpiry:', error.message);
        return { error: error.message };
    }
};

// Fungsi untuk auto-cancel pending orders yang sudah lama (> 1 hari)
// PERBAIKAN: Hanya cancel untuk NON-Reservation dan NON-OpenBill orders
async function autoCancelOldPendingOrders(outletId) {
    try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const Order = mongoose.model('Order');

        // ✅ PERBAIKAN: Hanya cancel order yang BUKAN Reservation DAN BUKAN Open Bill
        const result = await Order.updateMany(
            {
                "outlet": new mongoose.Types.ObjectId(outletId),
                "status": "Pending",
                "createdAt": { $lt: oneDayAgo },
                "canceledBySystem": { $ne: true },
                "orderType": {
                    $nin: ["Reservation"]  // ✅ EXCLUDE Reservation dari auto-cancel
                },
                "isOpenBill": false  // ✅ EXCLUDE Open Bill dari auto-cancel
            },
            {
                $set: {
                    status: "Cancelled",
                    canceledBySystem: true,
                    canceledAt: new Date(),
                    cancellationReason: "Auto-cancelled: Order pending for more than 24 hours (non-reservation, non-openbill)"
                }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ Auto-cancelled ${result.modifiedCount} pending orders (non-reservation, non-openbill) older than 24 hours`);

            // Sync ulang status meja setelah cancel order
            setTimeout(async () => {
                try {
                    await Table.syncTableStatusWithActiveOrders(outletId);
                    console.log(`✅ Table re-sync completed after auto-cancel for outlet ${outletId}`);
                } catch (syncError) {
                    console.error('⚠️ Table re-sync error:', syncError.message);
                }
            }, 2000);
        }

        return result.modifiedCount;

    } catch (error) {
        console.error('❌ Error auto-cancelling orders:', error);
        return 0;
    }
}

/**
 * ✅ Setup cron job untuk monitoring
 */
/**
 * ✅ Setup cron job untuk monitoring dengan logika baru
 */
export const setupPaymentExpiryMonitor = () => {
    log.info('🚀 Setting up payment expiry monitoring system with new logic...\n');

    // 1. Payment expiry check - setiap 5 menit (untuk NON-Reservation dan NON-OpenBill)
    cron.schedule('*/5 * * * *', async () => {
        log.info(`[${getWIBNow().toISOString()}] Running payment expiry monitor (non-reservation, non-openbill)...`);
        await monitorExpiredPayments();
    });
    log.success('✅ Payment expiry monitor started - Running every 5 minutes (excludes reservation & open bill)');

    // 2. Auto-cancel pending orders > 24 jam - setiap hari jam 03:00 WIB
    // PERBAIKAN: Hanya untuk NON-Reservation dan NON-OpenBill
    cron.schedule('0 3 * * *', async () => {
        log.info(`[${getWIBNow().toISOString()}] Running auto-cancel for old pending orders (non-reservation, non-openbill)...`);

        const outlets = await mongoose.model('Outlet').find({ is_active: true }).select('_id');

        for (const outlet of outlets) {
            const cancelledCount = await autoCancelOldPendingOrders(outlet._id);
            if (cancelledCount > 0) {
                log.success(`✅ Outlet ${outlet._id}: Cancelled ${cancelledCount} pending orders (non-reservation, non-openbill)`);
            }
        }

    }, {
        timezone: 'Asia/Jakarta'
    });
    log.success('✅ Pending order auto-cancel started - Running daily at 03:00 WIB (excludes reservation & open bill)');

    // 3. Reservation expiry check - setiap jam (berdasarkan reservation time)
    cron.schedule('0 * * * *', async () => {
        log.info(`[${getWIBNow().toISOString()}] Running reservation expiry monitor...`);
        await monitorReservationExpiry();
    });
    log.success('✅ Reservation expiry monitor started - Running hourly');

    // 4. Open Bill expiry check - setiap hari jam 04:00 WIB (7 days expiry)
    cron.schedule('0 4 * * *', async () => {
        log.info(`[${getWIBNow().toISOString()}] Running open bill expiry monitor (7 days)...`);
        await monitorOpenBillExpiry();
    }, {
        timezone: 'Asia/Jakarta'
    });
    log.success('✅ Open bill expiry monitor started - Running daily at 04:00 WIB (7 days expiry)');

    // 5. Auto-complete OnProcess orders - setiap hari jam 01:00 WIB
    cron.schedule('0 1 * * *', async () => {
        log.info(`[${getWIBNow().toISOString()}] Running auto-complete for expired OnProcess orders...`);
        await autoCompleteExpiredOnProcessOrders();
    }, {
        timezone: 'Asia/Jakarta'
    });
    log.success('✅ OnProcess auto-complete monitor started - Running daily at 01:00 WIB');

    // 6. Cleanup orphaned payments - setiap hari jam 02:00 WIB
    cron.schedule('0 2 * * *', async () => {
        log.info(`[${getWIBNow().toISOString()}] Running orphaned payments cleanup...`);
        await cleanupOrphanedPayments();
    }, {
        timezone: 'Asia/Jakarta'
    });
    log.success('✅ Orphaned payments cleanup started - Running daily at 02:00 WIB\n');

    log.info('📋 CRON JOB SUMMARY:');
    log.info('─────────────────────');
    log.info('• Payment Expiry: Every 5 min (excludes Reservation & Open Bill)');
    log.info('• Auto-cancel: Daily at 03:00 (excludes Reservation & Open Bill)');
    log.info('• Reservation Expiry: Hourly');
    log.info('• Open Bill Expiry: Daily at 04:00 (7 days)');
    log.info('• OnProcess Auto-complete: Daily at 01:00');
    log.info('• Orphaned Payments: Daily at 02:00');
    log.info('─────────────────────\n');

    log.info('✅ Cron jobs initialized with new logic.');
};

/**
 * ✅ Manual trigger functions
 */
export const triggerPaymentExpiryCheck = async () => {
    log.info('🔄 Manual trigger: Payment expiry check');
    const result = await monitorExpiredPayments();
    return { success: true, message: 'Payment expiry check completed', result };
};

export const triggerOnProcessAutoComplete = async () => {
    log.info('🔄 Manual trigger: OnProcess auto-complete');
    const result = await autoCompleteExpiredOnProcessOrders();
    return {
        success: true,
        message: 'OnProcess auto-complete check completed',
        result
    };
};

export const triggerCleanupOrphanedPayments = async () => {
    log.info('🔄 Manual trigger: Cleanup orphaned payments');
    const result = await cleanupOrphanedPayments();
    return {
        success: true,
        message: 'Orphaned payments cleanup completed',
        result
    };
};

/**
 * ✅ API endpoints
 */
export const manualCheckExpiredPayments = async (req, res) => {
    try {
        const result = await monitorExpiredPayments();
        res.status(200).json({
            success: true,
            message: 'Payment expiry check completed successfully',
            data: result
        });
    } catch (error) {
        log.error('Error in manual check:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to check expired payments',
            error: error.message
        });
    }
};

export const manualTriggerOnProcessComplete = async (req, res) => {
    try {
        const result = await autoCompleteExpiredOnProcessOrders();
        res.status(200).json({
            success: true,
            message: 'OnProcess auto-complete check completed successfully',
            data: result
        });
    } catch (error) {
        log.error('Error in OnProcess auto-complete:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to auto-complete OnProcess orders',
            error: error.message
        });
    }
};

export const manualTriggerCleanupOrphaned = async (req, res) => {
    try {
        const result = await cleanupOrphanedPayments();
        res.status(200).json({
            success: true,
            message: 'Orphaned payments cleanup completed successfully',
            data: result
        });
    } catch (error) {
        log.error('Error in cleanup orphaned:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup orphaned payments',
            error: error.message
        });
    }
};

/**
 * ✅ Force reset table status
 */
export const forceResetTableStatus = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const { tableNumber } = req.params;
            const { outletId } = req.body;

            if (!outletId) {
                throw new Error('Outlet ID is required');
            }

            log.info(`Force resetting table ${tableNumber} for outlet ${outletId}`);

            // Cari areas untuk outlet
            const areas = await Area.find({ outlet_id: outletId })
                .session(session)
                .lean();

            const areaIds = areas.map(area => area._id);

            if (areaIds.length === 0) {
                throw new Error(`No areas found for outlet ${outletId}`);
            }

            // Format dan cari order aktif
            const cleanTableNumber = tableNumber
                .toUpperCase()
                .trim()
                .replace(/[^A-Z0-9-_]/g, '');

            const activeOrders = await Order.find({
                tableNumber: cleanTableNumber,
                outlet: outletId,
                status: { $in: ['Pending', 'Waiting', 'OnProcess', 'Reserved'] }
            }).session(session);

            log.info(`Found ${activeOrders.length} active orders for table ${cleanTableNumber}`);

            // Batalkan semua order aktif + rollback stock
            for (const order of activeOrders) {
                await rollbackStockForExpiredPayment(order, session);

                await Order.findByIdAndUpdate(
                    order._id,
                    {
                        status: 'Canceled',
                        updatedAtWIB: getWIBNow(),
                        cancellationReason: 'Table force reset by system',
                        canceledBySystem: true,
                        canceledAt: getWIBNow()
                    },
                    { session }
                );

                log.success(`Cancelled order: ${order.order_id}`);
            }

            // Reset status meja
            const table = await Table.findOne({
                table_number: cleanTableNumber,
                area_id: { $in: areaIds },
                is_active: true
            }).session(session);

            if (!table) {
                throw new Error(`Table ${tableNumber} not found`);
            }

            const oldStatus = table.status;

            if (!table.statusHistory) {
                table.statusHistory = [];
            }

            table.statusHistory.push({
                fromStatus: oldStatus,
                toStatus: 'available',
                updatedBy: 'System Force Reset',
                notes: `Table force reset - ${activeOrders.length} orders cancelled and stock rolled back`,
                updatedAt: getWIBNow()
            });

            await Table.findByIdAndUpdate(
                table._id,
                {
                    status: 'available',
                    is_available: true,
                    updatedAt: getWIBNow(),
                    statusHistory: table.statusHistory
                },
                { session }
            );

            log.success(`Table ${cleanTableNumber} force reset completed. Status: ${oldStatus} → available`);

            res.json({
                success: true,
                message: `Table ${cleanTableNumber} berhasil direset ke status available. ${activeOrders.length} orders dibatalkan dan stock dikembalikan.`,
                data: {
                    table: {
                        table_number: table.table_number,
                        old_status: oldStatus,
                        new_status: 'available'
                    },
                    cancelled_orders: activeOrders.length,
                    stock_rollback: activeOrders.length > 0
                }
            });
        });

    } catch (error) {
        log.error('Error force resetting table:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error resetting table status',
            error: error.message
        });
    } finally {
        await session.endSession();
    }
};

export default {
    setupPaymentExpiryMonitor,
    triggerPaymentExpiryCheck,
    triggerOnProcessAutoComplete,
    triggerCleanupOrphanedPayments,
    manualCheckExpiredPayments,
    manualTriggerOnProcessComplete,
    manualTriggerCleanupOrphaned,
    forceResetTableStatus
};
