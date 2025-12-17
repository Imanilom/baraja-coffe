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
                const menuStock = await MenuStock.findOne({ menuItemId: item.menuItem })
                    .session(session);

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

                    await MenuStock.findByIdAndUpdate(menuStock._id, updateData, { session });
                    log.success(`Rolled back ${item.quantity} units to MenuStock for item ${item.menuItem}`);
                }

                // Rollback MenuItem availableStock
                const menuItem = await MenuItem.findByIdAndUpdate(
                    item.menuItem,
                    { $inc: { availableStock: item.quantity } },
                    { new: true, session }
                );

                if (menuItem) {
                    // Re-activate item jika stock sekarang > 0
                    if (menuItem.availableStock > 0 && !menuItem.isActive) {
                        await MenuItem.findByIdAndUpdate(
                            item.menuItem,
                            { isActive: true },
                            { session }
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
            },
            { session }
        );

        log.success(`Stock rollback completed and marked for order ${order.order_id}`);
        return { success: true, results: rollbackResults };

    } catch (error) {
        log.error(`Failed to rollback stock for order ${order.order_id}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * ✅ FIXED: Bebaskan meja dengan retry mechanism
 */
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
            .session(session)
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
        }).session(session);

        if (!table) {
            log.warning(`Table not found: ${cleanTableNumber} in outlet ${order.outlet}`);
            return { success: false, reason: 'Table not found' };
        }

        log.info(`Table found: ${table.table_number} (current status: ${table.status})`);

        const oldStatus = table.status;

        // Update table status
        const updateQuery = {
            status: 'available',
            is_available: true,
            updatedAt: getWIBNow()
        };

        // Add to status history
        if (!table.statusHistory) {
            table.statusHistory = [];
        }

        table.statusHistory.push({
            fromStatus: oldStatus,
            toStatus: 'available',
            updatedBy: 'System Auto-Release',
            notes: `Table auto-released due to order cancellation - Order: ${order.order_id}`,
            updatedAt: getWIBNow()
        });

        updateQuery.statusHistory = table.statusHistory;

        const result = await Table.findByIdAndUpdate(
            table._id,
            updateQuery,
            { session, new: true }
        );

        if (result) {
            // ✅ CRITICAL: Tandai order bahwa table sudah di-release
            await Order.findByIdAndUpdate(
                order._id,
                {
                    tableReleased: true,
                    tableReleasedAt: getWIBNow()
                },
                { session }
            );

            log.success(`Table ${result.table_number} released: ${oldStatus} → available`);
            return { success: true, table: result.table_number };
        } else {
            throw new Error(`Failed to update table ${table.table_number}`);
        }

    } catch (error) {
        log.error(`Error releasing table for order ${order.order_id}:`, error.message);

        // Retry mechanism
        if (retryCount < MAX_RETRIES) {
            log.info(`Retrying table release (${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
            return releaseTableForCanceledOrder(order, session, retryCount + 1);
        }

        return { success: false, error: error.message, retriesExhausted: true };
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

        // ✅ FIX: Tambahkan filter untuk exclude payment yang sudah diproses
        const expiredPayments = await Payment.find({
            status: 'pending', // Hanya pending, karena expire sudah diproses
            expiry_time: { $exists: true, $ne: null },
            processedExpiry: { $ne: true } // ✅ NEW: Skip yang sudah diproses
        }).lean();

        if (expiredPayments.length === 0) {
            log.success(`No expired payments to process`);
            return {
                processedCount: 0,
                skippedCount: 0,
                errorCount: 0,
                totalChecked: 0
            };
        }

        log.info(`Found ${expiredPayments.length} pending payments to check for expiry`);

        let processedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        let reservationSkippedCount = 0;

        // ✅ IMPROVEMENT: Process in batches untuk avoid memory issue
        const BATCH_SIZE = 10;
        for (let i = 0; i < expiredPayments.length; i += BATCH_SIZE) {
            const batch = expiredPayments.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (payment) => {
                try {
                    // Parse expiry_time
                    let expiryDate;
                    if (typeof payment.expiry_time === 'string') {
                        expiryDate = new Date(payment.expiry_time.replace(' ', 'T'));
                    } else {
                        expiryDate = new Date(payment.expiry_time);
                    }

                    // Cek apakah sudah expired
                    if (expiryDate > now) {
                        skippedCount++;
                        return;
                    }

                    log.info(`Payment expired - Code: ${payment.payment_code}, Order: ${payment.order_id}`);

                    // Start transaction untuk order ini
                    await session.withTransaction(async () => {
                        // ✅ CRITICAL: Update payment dengan flag processedExpiry
                        await Payment.findByIdAndUpdate(
                            payment._id,
                            {
                                status: 'expire',
                                processedExpiry: true, // ✅ NEW: Tandai sudah diproses
                                expiredAt: getWIBNow()
                            },
                            { session }
                        );

                        // Cari order terkait
                        const order = await Order.findOne({ order_id: payment.order_id })
                            .populate('items.menuItem')
                            .session(session);

                        if (!order) {
                            log.warning(`Order not found: ${payment.order_id} - marking payment as orphaned`);

                            await Payment.findByIdAndUpdate(
                                payment._id,
                                {
                                    status: 'orphaned',
                                    notes: 'Order tidak ditemukan saat processing expired payment',
                                    orphanedAt: getWIBNow()
                                },
                                { session }
                            );

                            skippedCount++;
                            return;
                        }

                        // ✅ PERBAIKAN KRITIS: EXCLUDE RESERVATION ORDERS
                        // Cek apakah order adalah Reservation
                        const isReservationOrder = order.orderType === 'Reservation' || 
                                                   order.orderType === 'Reservasi' ||
                                                   order.isOpenBill === true || // Juga exclude open bill
                                                   order.reservation; // Atau punya field reservation

                        if (isReservationOrder) {
                            log.info(`⏩ Skip auto-cancel: Order ${order.order_id} adalah ${order.orderType} atau open bill`, {
                                orderType: order.orderType,
                                isOpenBill: order.isOpenBill,
                                hasReservationField: !!order.reservation
                            });
                            
                            // ✅ TIDAK BATALKAN ORDER, hanya tandai payment sebagai expire
                            reservationSkippedCount++;
                            return; // Exit transaction, order tetap active
                        }

                        // Cek apakah ada payment lain yang sudah settlement
                        const hasSettledPayment = await Payment.findOne({
                            order_id: payment.order_id,
                            status: 'settlement'
                        }).session(session).lean();

                        if (hasSettledPayment) {
                            log.info(`Order ${payment.order_id} has settled payment, skipping cancellation`);
                            skippedCount++;
                            return;
                        }

                        // ✅ Rollback stock dengan tracking
                        const stockRollback = await rollbackStockForExpiredPayment(order, session);

                        if (stockRollback.alreadyRolledBack) {
                            log.info(`Stock already rolled back for order ${order.order_id}`);
                        } else if (stockRollback.success) {
                            log.success(`Stock rollback successful for order ${order.order_id}`);
                        } else {
                            log.error(`Stock rollback failed for order ${order.order_id}`);
                        }

                        // ✅ Release table dengan tracking
                        const tableRelease = await releaseTableForCanceledOrder(order, session);

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
                            }).session(session).lean();

                            if (otherPendingPayments) {
                                shouldCancelOrder = false;
                                log.info(`Order ${payment.order_id} has other pending payments, not canceling`);
                            }
                        }

                        if (shouldCancelOrder) {
                            await Order.findByIdAndUpdate(
                                order._id,
                                {
                                    status: 'Canceled',
                                    updatedAtWIB: getWIBNow(),
                                    cancellationReason: `Payment expired at ${expiryDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
                                    canceledBySystem: true,
                                    canceledAt: getWIBNow()
                                },
                                { session }
                            );

                            log.success(`Order ${order.order_id} auto-canceled due to payment expiry`);
                        }

                        processedCount++;
                    });

                } catch (error) {
                    errorCount++;
                    log.error(`Error processing payment ${payment.payment_code}:`, error.message);
                }
            }));
        }

        log.info(`\n📊 Payment Expiry Monitor Summary:`);
        log.success(`Processed: ${processedCount}`);
        log.info(`Skipped: ${skippedCount} (non-expired)`);
        log.info(`Reservation orders skipped: ${reservationSkippedCount}`);
        log.error(`Errors: ${errorCount}`);
        log.info(`Total Checked: ${expiredPayments.length}`);

        return { 
            processedCount, 
            skippedCount, 
            reservationSkippedCount,
            errorCount, 
            totalChecked: expiredPayments.length 
        };

    } catch (error) {
        log.error('Error in monitorExpiredPayments:', error.message);
        return { error: error.message };
    } finally {
        await session.endSession();
    }
};
/**
 * ✅ Setup cron job untuk monitoring
 */
export const setupPaymentExpiryMonitor = () => {
    log.info('🚀 Setting up payment expiry monitoring system...\n');

    // Payment expiry check - setiap 5 menit
    cron.schedule('*/5 * * * *', async () => {
        log.info(`[${getWIBNow().toISOString()}] Running payment expiry monitor...`);
        await monitorExpiredPayments();
    });
    log.success('Payment expiry monitor started - Running every 5 minutes');

    // Auto-complete OnProcess orders - setiap hari jam 01:00 WIB
    cron.schedule('0 1 * * *', async () => {
        log.info(`[${getWIBNow().toISOString()}] Running auto-complete for expired OnProcess orders...`);
        await autoCompleteExpiredOnProcessOrders();
    }, {
        timezone: 'Asia/Jakarta'
    });
    log.success('OnProcess auto-complete monitor started - Running daily at 01:00 WIB');

    // Cleanup orphaned payments - setiap hari jam 02:00 WIB
    cron.schedule('0 2 * * *', async () => {
        log.info(`[${getWIBNow().toISOString()}] Running orphaned payments cleanup...`);
        await cleanupOrphanedPayments();
    }, {
        timezone: 'Asia/Jakarta'
    });
    log.success('Orphaned payments cleanup started - Running daily at 02:00 WIB\n');

    // ✅ IMPORTANT: Jangan jalankan initial check saat startup
    // Karena bisa menyebabkan double processing
    log.info('✅ Cron jobs initialized. Initial checks will run on schedule.');
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
