/**
 * ✅ AUTO CHECK-IN CRON JOB
 * 
 * Purpose: Automatically check-in confirmed reservations when their reservation time arrives
 * This ensures GRO only needs to mark reservations as "complete" when finished
 * 
 * Runs every 1 minute to check for reservations that should be auto checked-in
 */

import mongoose from 'mongoose';
import Reservation from '../models/Reservation.model.js';
import { Order } from '../models/order.model.js';
import { io } from '../index.js';

let isRunning = false;

// Helper: Get WIB now
const getWIBNow = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

/**
 * Parse reservation time string (HH:mm) and combine with date
 */
const parseReservationDateTime = (reservationDate, reservationTime) => {
    if (!reservationDate || !reservationTime) return null;

    try {
        const date = new Date(reservationDate);
        const [hours, minutes] = reservationTime.split(':').map(Number);

        if (isNaN(hours) || isNaN(minutes)) return null;

        date.setHours(hours, minutes, 0, 0);
        return date;
    } catch (error) {
        console.error('Error parsing reservation datetime:', error);
        return null;
    }
};

/**
 * Main auto check-in job
 */
export const runAutoCheckInJob = async () => {
    if (isRunning) {
        console.log('⏳ [AUTO CHECK-IN] Job already running, skipping...');
        return;
    }

    isRunning = true;
    const jobStartTime = Date.now();
    const now = getWIBNow();

    console.log(`\n🔄 [AUTO CHECK-IN] Starting job at ${now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);

    try {
        // Find reservations that should be auto checked-in:
        // 1. Status = 'confirmed' (not cancelled, not completed)
        // 2. check_in_time = null (not already checked in)
        // 3. reservation_date is today or earlier
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reservations = await Reservation.find({
            status: 'confirmed',
            check_in_time: null,
            reservation_date: { $lte: now } // Date is today or earlier
        }).populate('order_id').lean();

        if (reservations.length === 0) {
            console.log('📭 [AUTO CHECK-IN] No reservations need auto check-in');
            isRunning = false;
            return { success: true, checkedIn: 0, duration: `${Date.now() - jobStartTime}ms` };
        }

        console.log(`📋 [AUTO CHECK-IN] Found ${reservations.length} potential reservations to check`);

        let checkedInCount = 0;
        const checkedInReservations = [];

        for (const reservation of reservations) {
            // Parse and check if reservation time has passed
            const reservationDateTime = parseReservationDateTime(
                reservation.reservation_date,
                reservation.reservation_time
            );

            if (!reservationDateTime) {
                console.log(`⚠️ [AUTO CHECK-IN] Could not parse datetime for reservation ${reservation.reservation_code}`);
                continue;
            }

            // Check if current time is past or equal to reservation time
            if (now >= reservationDateTime) {
                console.log(`✅ [AUTO CHECK-IN] Auto checking-in: ${reservation.reservation_code} (scheduled: ${reservation.reservation_time})`);

                try {
                    // Update reservation
                    await Reservation.findByIdAndUpdate(reservation._id, {
                        $set: {
                            check_in_time: getWIBNow(),
                            'checked_in_by.employee_id': null,
                            'checked_in_by.employee_name': 'System Auto Check-in',
                            'checked_in_by.checked_in_at': getWIBNow(),
                            updatedAtWIB: getWIBNow()
                        }
                    });

                    // Update order status to OnProcess if exists
                    if (reservation.order_id) {
                        const orderId = typeof reservation.order_id === 'object'
                            ? reservation.order_id._id
                            : reservation.order_id;

                        await Order.findByIdAndUpdate(orderId, {
                            $set: {
                                status: 'OnProcess',
                                updatedAtWIB: getWIBNow()
                            }
                        });

                        console.log(`   📦 Order status updated to OnProcess`);
                    }

                    checkedInCount++;
                    checkedInReservations.push({
                        code: reservation.reservation_code,
                        time: reservation.reservation_time
                    });

                    // Emit socket event for real-time UI update
                    if (io) {
                        io.to('gro_room').emit('reservation_auto_checked_in', {
                            reservationId: reservation._id,
                            reservationCode: reservation.reservation_code,
                            checkedInBy: 'System Auto Check-in',
                            timestamp: getWIBNow()
                        });

                        io.to('cashier_room').emit('order_status_updated', {
                            orderId: reservation.order_id?._id || reservation.order_id,
                            status: 'OnProcess',
                            updatedBy: 'System Auto Check-in',
                            timestamp: getWIBNow()
                        });
                    }
                } catch (updateError) {
                    console.error(`❌ [AUTO CHECK-IN] Failed to check-in ${reservation.reservation_code}:`, updateError.message);
                }
            }
        }

        const duration = Date.now() - jobStartTime;

        console.log(`✅ [AUTO CHECK-IN] Completed in ${duration}ms`);
        console.log(`📊 [AUTO CHECK-IN] Auto checked-in ${checkedInCount} reservations`);

        if (checkedInCount > 0) {
            checkedInReservations.forEach(r => {
                console.log(`   - ${r.code} (${r.time})`);
            });
        }

        return {
            success: true,
            checkedIn: checkedInCount,
            reservations: checkedInReservations,
            duration: `${duration}ms`
        };

    } catch (error) {
        console.error('❌ [AUTO CHECK-IN] Job failed:', error);
        return { success: false, error: error.message };
    } finally {
        isRunning = false;
    }
};

/**
 * Initialize the cron job
 * Called from index.js or server startup
 */
export const initAutoCheckInJob = (intervalMinutes = 1) => {
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`📅 [AUTO CHECK-IN] Scheduling job to run every ${intervalMinutes} minute(s)`);

    // Run after 10 seconds of server startup
    setTimeout(() => {
        runAutoCheckInJob().catch(console.error);
    }, 10000);

    // Then run on interval
    setInterval(() => {
        runAutoCheckInJob().catch(console.error);
    }, intervalMs);
};

export default {
    runAutoCheckInJob,
    initAutoCheckInJob
};
