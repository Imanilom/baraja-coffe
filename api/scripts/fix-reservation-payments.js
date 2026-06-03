import mongoose from 'mongoose';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import Table from '../models/Table.model.js';
import Area from '../models/Area.model.js';

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
 * ✅ SCRIPT IDENTIFIKASI: Cari reservasi yang salah ter-expire/cancel
 * 
 * Script ini HANYA mengidentifikasi data yang bermasalah, TIDAK langsung memperbaiki.
 * Setelah review, baru jalankan fungsi fix yang sesuai.
 */

/**
 * 1. Identifikasi Payment Reservasi yang Salah Ter-Expire
 * 
 * ✅ UPDATED: Hanya identifikasi reservasi yang BELUM lewat waktu reservasinya
 * - Jika reservation_date + reservation_time sudah lewat → SKIP (memang seharusnya expire)
 * - Jika reservation_date + reservation_time belum lewat → FLAG (salah expire karena bug 30 menit)
 */
export const identifyExpiredReservationPayments = async () => {
    try {
        log.info('🔍 Mencari payment reservasi yang salah ter-expire...');

        // Cari semua payment dengan status expire
        const expiredPayments = await Payment.find({
            status: 'expire'
        }).lean();

        log.info(`Found ${expiredPayments.length} expired payments, checking which are reservations...`);

        const problematicPayments = [];
        const skippedPayments = [];

        for (const payment of expiredPayments) {
            // Cari order terkait dengan populate reservation
            const order = await Order.findOne({ order_id: payment.order_id })
                .populate('reservation')
                .lean();

            if (order && order.orderType === 'Reservation') {
                // ✅ CRITICAL: Cek apakah reservation time sudah lewat
                let shouldSkip = false;
                let skipReason = '';

                if (order.reservation) {
                    const reservation = order.reservation;
                    const reservationDate = new Date(reservation.reservation_date);
                    const timeParts = (reservation.reservation_time || '00:00').split(':');

                    // Gabungkan date + time
                    const reservationDateTime = new Date(
                        reservationDate.getFullYear(),
                        reservationDate.getMonth(),
                        reservationDate.getDate(),
                        parseInt(timeParts[0]),
                        parseInt(timeParts[1])
                    );

                    const now = new Date();

                    // Jika reservation time sudah lewat, skip (memang seharusnya expire)
                    if (reservationDateTime < now) {
                        shouldSkip = true;
                        skipReason = `Reservation time sudah lewat (${reservationDateTime.toLocaleString('id-ID')})`;
                    }
                }

                if (shouldSkip) {
                    skippedPayments.push({
                        payment_code: payment.payment_code,
                        order_id: payment.order_id,
                        reason: skipReason
                    });
                } else {
                    // ✅ Ini yang perlu diperbaiki (reservation belum lewat tapi sudah expire)
                    problematicPayments.push({
                        payment_id: payment._id,
                        payment_code: payment.payment_code,
                        order_id: payment.order_id,
                        amount: payment.amount,
                        expiry_time: payment.expiry_time,
                        expired_at: payment.expiredAt,
                        order_status: order.status,
                        order_created: order.createdAtWIB,
                        reservation_date: order.reservation?.reservation_date,
                        reservation_time: order.reservation?.reservation_time
                    });
                }
            }
        }

        log.success(`\n📊 HASIL IDENTIFIKASI:`);
        log.info(`Total payment expire: ${expiredPayments.length}`);
        log.warning(`Payment reservasi yang di-skip (sudah lewat waktu): ${skippedPayments.length}`);
        log.error(`Payment reservasi yang SALAH ter-expire (belum lewat waktu): ${problematicPayments.length}\n`);

        if (skippedPayments.length > 0) {
            log.info('Payment yang di-skip (tidak perlu diperbaiki):');
            skippedPayments.forEach((p, idx) => {
                console.log(`  ${idx + 1}. ${p.payment_code} (${p.order_id}) - ${p.reason}`);
            });
            console.log('');
        }

        if (problematicPayments.length > 0) {
            log.warning('Detail payment yang bermasalah (PERLU DIPERBAIKI):');
            problematicPayments.forEach((p, idx) => {
                console.log(`\n${idx + 1}. Payment Code: ${p.payment_code}`);
                console.log(`   Order ID: ${p.order_id}`);
                console.log(`   Amount: Rp ${p.amount.toLocaleString()}`);
                console.log(`   Expiry Time: ${p.expiry_time}`);
                console.log(`   Order Status: ${p.order_status}`);
                console.log(`   Reservation Date: ${p.reservation_date}`);
                console.log(`   Reservation Time: ${p.reservation_time}`);
                console.log(`   ⚠️  SALAH EXPIRE - Reservasi belum lewat waktu!`);
            });
        }

        return {
            total: expiredPayments.length,
            skipped: skippedPayments.length,
            problematic: problematicPayments.length,
            details: problematicPayments
        };

    } catch (error) {
        log.error('Error identifying expired reservation payments:', error.message);
        return { error: error.message };
    }
};

/**
 * 2. Identifikasi Order Reservasi yang Salah Ter-Cancel
 * 
 * ✅ UPDATED: Hanya identifikasi reservasi yang BELUM lewat waktu reservasinya
 */
export const identifyCanceledReservationOrders = async () => {
    try {
        log.info('🔍 Mencari order reservasi yang salah ter-cancel...');

        const canceledReservations = await Order.find({
            orderType: 'Reservation',
            status: 'Canceled',
            $or: [
                { canceledBySystem: true },
                { cancellationReason: { $regex: /auto-cancel|payment expired|tidak ada pembayaran/i } }
            ]
        }).populate('reservation').lean();

        const problematicOrders = [];
        const skippedOrders = [];

        for (const order of canceledReservations) {
            // ✅ CRITICAL: Cek apakah reservation time sudah lewat
            let shouldSkip = false;
            let skipReason = '';

            if (order.reservation) {
                const reservation = order.reservation;
                const reservationDate = new Date(reservation.reservation_date);
                const timeParts = (reservation.reservation_time || '00:00').split(':');

                const reservationDateTime = new Date(
                    reservationDate.getFullYear(),
                    reservationDate.getMonth(),
                    reservationDate.getDate(),
                    parseInt(timeParts[0]),
                    parseInt(timeParts[1])
                );

                const now = new Date();

                // Jika reservation time sudah lewat, skip (memang seharusnya cancel)
                if (reservationDateTime < now) {
                    shouldSkip = true;
                    skipReason = `Reservation time sudah lewat (${reservationDateTime.toLocaleString('id-ID')})`;
                }
            }

            if (shouldSkip) {
                skippedOrders.push({
                    order_id: order.order_id,
                    reason: skipReason
                });
            } else {
                problematicOrders.push(order);
            }
        }

        log.success(`\n📊 HASIL IDENTIFIKASI:`);
        log.warning(`Order reservasi yang di-skip (sudah lewat waktu): ${skippedOrders.length}`);
        log.error(`Order reservasi yang SALAH ter-cancel (belum lewat waktu): ${problematicOrders.length}\n`);

        if (skippedOrders.length > 0) {
            log.info('Order yang di-skip (tidak perlu diperbaiki):');
            skippedOrders.forEach((o, idx) => {
                console.log(`  ${idx + 1}. ${o.order_id} - ${o.reason}`);
            });
            console.log('');
        }

        if (problematicOrders.length > 0) {
            log.warning('Detail order yang bermasalah (PERLU DIPERBAIKI):');
            problematicOrders.forEach((order, idx) => {
                console.log(`\n${idx + 1}. Order ID: ${order.order_id}`);
                console.log(`   User: ${order.user}`);
                console.log(`   Grand Total: Rp ${order.grandTotal.toLocaleString()}`);
                console.log(`   Canceled At: ${order.canceledAt}`);
                console.log(`   Cancellation Reason: ${order.cancellationReason}`);
                console.log(`   Reservation Date: ${order.reservation?.reservation_date}`);
                console.log(`   Reservation Time: ${order.reservation?.reservation_time}`);
                console.log(`   Stock Rolled Back: ${order.stockRolledBack ? 'Yes' : 'No'}`);
                console.log(`   Table Released: ${order.tableReleased ? 'Yes' : 'No'}`);
                console.log(`   ⚠️  SALAH CANCEL - Reservasi belum lewat waktu!`);
            });
        }

        return {
            total: canceledReservations.length,
            skipped: skippedOrders.length,
            problematic: problematicOrders.length,
            details: problematicOrders
        };

    } catch (error) {
        log.error('Error identifying canceled reservation orders:', error.message);
        return { error: error.message };
    }
};

/**
 * 3. Identifikasi Stock yang Salah Di-Rollback untuk Reservasi
 */
export const identifyWrongStockRollbacks = async () => {
    try {
        log.info('🔍 Mencari reservasi yang stock-nya salah di-rollback...');

        const reservationsWithRollback = await Order.find({
            orderType: 'Reservation',
            stockRolledBack: true
        }).populate('items.menuItem').lean();

        log.success(`\n📊 HASIL IDENTIFIKASI:`);
        log.error(`Reservasi dengan stock rollback: ${reservationsWithRollback.length}\n`);

        if (reservationsWithRollback.length > 0) {
            log.warning('Detail reservasi yang perlu diperbaiki stock-nya:');
            reservationsWithRollback.forEach((order, idx) => {
                console.log(`\n${idx + 1}. Order ID: ${order.order_id}`);
                console.log(`   Status: ${order.status}`);
                console.log(`   Rollback At: ${order.stockRollbackAt}`);
                console.log(`   Items rolled back:`);

                if (order.stockRollbackDetails && order.stockRollbackDetails.length > 0) {
                    order.stockRollbackDetails.forEach(detail => {
                        console.log(`     - ${detail.name}: ${detail.quantity} units (${detail.success ? 'Success' : 'Failed'})`);
                    });
                }
            });
        }

        return {
            total: reservationsWithRollback.length,
            details: reservationsWithRollback
        };

    } catch (error) {
        log.error('Error identifying wrong stock rollbacks:', error.message);
        return { error: error.message };
    }
};

/**
 * 4. MASTER FUNCTION: Identifikasi Semua Masalah
 */
export const identifyAllReservationIssues = async () => {
    try {
        log.info('🚀 Memulai identifikasi lengkap masalah reservasi...\n');

        const payments = await identifyExpiredReservationPayments();
        console.log('\n' + '='.repeat(80) + '\n');

        const orders = await identifyCanceledReservationOrders();
        console.log('\n' + '='.repeat(80) + '\n');

        const stocks = await identifyWrongStockRollbacks();
        console.log('\n' + '='.repeat(80) + '\n');

        log.success('✅ RINGKASAN IDENTIFIKASI:');
        log.error(`- Payment yang salah expire: ${payments.problematic || 0}`);
        log.error(`- Order yang salah cancel: ${orders.total || 0}`);
        log.error(`- Stock yang salah rollback: ${stocks.total || 0}`);

        return {
            payments,
            orders,
            stocks,
            summary: {
                totalIssues: (payments.problematic || 0) + (orders.total || 0) + (stocks.total || 0)
            }
        };

    } catch (error) {
        log.error('Error in master identification:', error.message);
        return { error: error.message };
    }
};

/**
 * ⚠️ FUNGSI PERBAIKAN - HANYA JALANKAN SETELAH REVIEW IDENTIFIKASI
 */

/**
 * 5. Fix Payment Reservasi yang Expire
 */
export const fixExpiredReservationPayments = async (dryRun = true) => {
    const session = await mongoose.startSession();

    try {
        log.info(`🔧 ${dryRun ? '[DRY RUN]' : '[LIVE]'} Memperbaiki payment reservasi yang expire...`);

        const identification = await identifyExpiredReservationPayments();
        const problematicPayments = identification.details || [];

        if (problematicPayments.length === 0) {
            log.success('Tidak ada payment yang perlu diperbaiki');
            return { fixed: 0 };
        }

        let fixedCount = 0;

        if (!dryRun) {
            await session.withTransaction(async () => {
                for (const p of problematicPayments) {
                    await Payment.findByIdAndUpdate(
                        p.payment_id,
                        {
                            $set: {
                                status: 'pending',
                                processedExpiry: false,
                                expiredAt: null
                            },
                            $unset: {
                                expiry_time: ""
                            }
                        },
                        { session }
                    );

                    fixedCount++;
                    log.success(`Fixed payment: ${p.payment_code}`);
                }
            });
        } else {
            log.warning(`[DRY RUN] Akan memperbaiki ${problematicPayments.length} payments`);
            fixedCount = problematicPayments.length;
        }

        log.success(`✅ ${dryRun ? 'Akan memperbaiki' : 'Berhasil memperbaiki'} ${fixedCount} payments`);

        return { fixed: fixedCount };

    } catch (error) {
        log.error('Error fixing expired reservation payments:', error.message);
        return { error: error.message };
    } finally {
        await session.endSession();
    }
};

/**
 * 6. Fix Order Reservasi yang Ter-Cancel
 */
export const fixCanceledReservationOrders = async (targetStatus = 'Reserved', dryRun = true) => {
    const session = await mongoose.startSession();

    try {
        log.info(`🔧 ${dryRun ? '[DRY RUN]' : '[LIVE]'} Memperbaiki order reservasi yang ter-cancel...`);

        const identification = await identifyCanceledReservationOrders();
        const canceledOrders = identification.details || [];

        if (canceledOrders.length === 0) {
            log.success('Tidak ada order yang perlu diperbaiki');
            return { fixed: 0 };
        }

        let fixedCount = 0;

        if (!dryRun) {
            await session.withTransaction(async () => {
                for (const order of canceledOrders) {
                    await Order.findByIdAndUpdate(
                        order._id,
                        {
                            $set: {
                                status: targetStatus,
                                updatedAtWIB: getWIBNow()
                            },
                            $unset: {
                                cancellationReason: "",
                                canceledBySystem: "",
                                canceledAt: "",
                                autoCompletedAt: "",
                                autoCompletedReason: ""
                            }
                        },
                        { session }
                    );

                    fixedCount++;
                    log.success(`Fixed order: ${order.order_id} -> ${targetStatus}`);
                }
            });
        } else {
            log.warning(`[DRY RUN] Akan memperbaiki ${canceledOrders.length} orders ke status: ${targetStatus}`);
            fixedCount = canceledOrders.length;
        }

        log.success(`✅ ${dryRun ? 'Akan memperbaiki' : 'Berhasil memperbaiki'} ${fixedCount} orders`);

        return { fixed: fixedCount };

    } catch (error) {
        log.error('Error fixing canceled reservation orders:', error.message);
        return { error: error.message };
    } finally {
        await session.endSession();
    }
};

/**
 * 7. Fix Stock yang Salah Di-Rollback
 */
export const fixWrongStockRollbacks = async (dryRun = true) => {
    const session = await mongoose.startSession();

    try {
        log.info(`🔧 ${dryRun ? '[DRY RUN]' : '[LIVE]'} Memperbaiki stock yang salah di-rollback...`);

        const identification = await identifyWrongStockRollbacks();
        const ordersWithRollback = identification.details || [];

        if (ordersWithRollback.length === 0) {
            log.success('Tidak ada stock yang perlu diperbaiki');
            return { fixed: 0 };
        }

        let fixedCount = 0;

        if (!dryRun) {
            await session.withTransaction(async () => {
                for (const order of ordersWithRollback) {
                    // Kurangi kembali stock yang sudah di-rollback (karena seharusnya tidak di-rollback)
                    for (const item of order.items) {
                        if (!item.menuItem) continue;

                        try {
                            // Kurangi MenuStock
                            const menuStock = await MenuStock.findOne({ menuItemId: item.menuItem })
                                .session(session);

                            if (menuStock) {
                                const updateData = {
                                    $inc: {
                                        currentStock: -item.quantity
                                    }
                                };

                                if (menuStock.manualStock !== null) {
                                    updateData.$inc.manualStock = -item.quantity;
                                } else {
                                    updateData.$inc.calculatedStock = -item.quantity;
                                }

                                await MenuStock.findByIdAndUpdate(menuStock._id, updateData, { session });
                            }

                            // Kurangi MenuItem availableStock
                            await MenuItem.findByIdAndUpdate(
                                item.menuItem,
                                { $inc: { availableStock: -item.quantity } },
                                { session }
                            );

                            log.success(`Restored stock for item ${item.menuItem}: -${item.quantity} units`);

                        } catch (itemError) {
                            log.error(`Failed to restore stock for item ${item.menuItem}:`, itemError.message);
                        }
                    }

                    // Clear rollback flags
                    await Order.findByIdAndUpdate(
                        order._id,
                        {
                            $set: {
                                stockRolledBack: false,
                                updatedAtWIB: getWIBNow()
                            },
                            $unset: {
                                stockRollbackAt: "",
                                stockRollbackDetails: ""
                            }
                        },
                        { session }
                    );

                    fixedCount++;
                    log.success(`Fixed stock rollback for order: ${order.order_id}`);
                }
            });
        } else {
            log.warning(`[DRY RUN] Akan memperbaiki stock untuk ${ordersWithRollback.length} orders`);
            fixedCount = ordersWithRollback.length;
        }

        log.success(`✅ ${dryRun ? 'Akan memperbaiki' : 'Berhasil memperbaiki'} stock untuk ${fixedCount} orders`);

        return { fixed: fixedCount };

    } catch (error) {
        log.error('Error fixing wrong stock rollbacks:', error.message);
        return { error: error.message };
    } finally {
        await session.endSession();
    }
};

/**
 * 8. MASTER FIX FUNCTION - Perbaiki Semua Masalah
 */
export const fixAllReservationIssues = async (targetStatus = 'Reserved', dryRun = true) => {
    try {
        log.info(`🚀 ${dryRun ? '[DRY RUN]' : '[LIVE]'} Memulai perbaikan lengkap masalah reservasi...\n`);

        const payments = await fixExpiredReservationPayments(dryRun);
        console.log('\n' + '='.repeat(80) + '\n');

        const orders = await fixCanceledReservationOrders(targetStatus, dryRun);
        console.log('\n' + '='.repeat(80) + '\n');

        const stocks = await fixWrongStockRollbacks(dryRun);
        console.log('\n' + '='.repeat(80) + '\n');

        log.success(`✅ RINGKASAN PERBAIKAN ${dryRun ? '(DRY RUN)' : '(LIVE)'}:`);
        log.success(`- Payment diperbaiki: ${payments.fixed || 0}`);
        log.success(`- Order diperbaiki: ${orders.fixed || 0}`);
        log.success(`- Stock diperbaiki: ${stocks.fixed || 0}`);

        if (dryRun) {
            log.warning('\n⚠️  Ini adalah DRY RUN. Tidak ada perubahan yang disimpan ke database.');
            log.warning('Untuk menjalankan perbaikan sesungguhnya, set dryRun = false');
        }

        return {
            payments,
            orders,
            stocks,
            summary: {
                totalFixed: (payments.fixed || 0) + (orders.fixed || 0) + (stocks.fixed || 0)
            }
        };

    } catch (error) {
        log.error('Error in master fix:', error.message);
        return { error: error.message };
    }
};

export default {
    identifyExpiredReservationPayments,
    identifyCanceledReservationOrders,
    identifyWrongStockRollbacks,
    identifyAllReservationIssues,
    fixExpiredReservationPayments,
    fixCanceledReservationOrders,
    fixWrongStockRollbacks,
    fixAllReservationIssues
};
