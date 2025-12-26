/**
 * ✅ TABLE SYNC CRON JOB
 * 
 * Purpose: Synchronize table status with active orders in background
 * This was moved from getTableAvailability endpoint for performance reasons
 * 
 * Runs every 2 minutes to keep table status consistent without blocking API requests
 */

import mongoose from 'mongoose';
import Table from '../models/Table.model.js';
import { Order } from "../models/order.model.js";
import Area from '../models/Area.model.js';
import { Outlet } from '../models/Outlet.model.js';

let isRunning = false;

/**
 * Sync table status with active orders for a single outlet
 */
const syncOutletTables = async (outletId, outletName) => {
    try {
        const startTime = Date.now();

        // Get active orders with table numbers
        const activeOrders = await Order.find({
            outlet: outletId,
            status: { $in: ['Pending', 'Waiting', 'OnProcess', 'Reserved'] },
            orderType: { $in: ['Dine-In', 'Reservation'] },
            tableNumber: { $exists: true, $ne: null, $ne: '' }
        }).select('tableNumber status orderType order_id').lean();

        const occupiedTableNumbers = new Set(
            activeOrders.map(order => order.tableNumber?.toUpperCase()).filter(Boolean)
        );

        // Get all areas for this outlet
        const areas = await Area.find({ outlet_id: outletId }).select('_id').lean();
        if (areas.length === 0) return { outlet: outletName, skipped: true, reason: 'No areas' };

        const areaIds = areas.map(area => area._id);

        // Get all active tables
        const allTables = await Table.find({
            area_id: { $in: areaIds },
            is_active: true
        });

        let updatedCount = 0;
        const updates = [];

        for (const table of allTables) {
            const tableNumberUpper = table.table_number.toUpperCase();
            const shouldBeOccupied = occupiedTableNumbers.has(tableNumberUpper);
            const currentStatus = table.status;

            // Check if status needs update
            if (shouldBeOccupied && currentStatus !== 'occupied') {
                table.status = 'occupied';
                table.is_available = false;
                table.updatedAt = new Date();

                if (!table.statusHistory) table.statusHistory = [];
                table.statusHistory.push({
                    fromStatus: currentStatus,
                    toStatus: 'occupied',
                    updatedBy: 'Cron Sync Job',
                    notes: 'Auto-sync: Active order found',
                    updatedAt: new Date()
                });

                await table.save();
                updatedCount++;
                updates.push({ table: table.table_number, from: currentStatus, to: 'occupied' });

            } else if (!shouldBeOccupied && currentStatus !== 'available') {
                table.status = 'available';
                table.is_available = true;
                table.updatedAt = new Date();

                if (!table.statusHistory) table.statusHistory = [];
                table.statusHistory.push({
                    fromStatus: currentStatus,
                    toStatus: 'available',
                    updatedBy: 'Cron Sync Job',
                    notes: 'Auto-sync: No active orders found',
                    updatedAt: new Date()
                });

                await table.save();
                updatedCount++;
                updates.push({ table: table.table_number, from: currentStatus, to: 'available' });
            }
        }

        const duration = Date.now() - startTime;

        return {
            outlet: outletName,
            totalTables: allTables.length,
            activeOrders: activeOrders.length,
            occupiedTables: occupiedTableNumbers.size,
            updatedTables: updatedCount,
            duration: `${duration}ms`,
            updates
        };

    } catch (error) {
        console.error(`❌ Error syncing tables for outlet ${outletName}:`, error.message);
        return { outlet: outletName, error: error.message };
    }
};

/**
 * Main sync job - runs for all outlets
 */
export const runTableSyncJob = async () => {
    if (isRunning) {
        console.log('⏳ Table sync job already running, skipping...');
        return;
    }

    isRunning = true;
    const jobStartTime = Date.now();

    console.log('🔄 [TABLE SYNC] Starting table synchronization job...');

    try {
        // Get all active outlets
        const outlets = await Outlet.find({ isActive: true }).select('_id name').lean();

        if (outlets.length === 0) {
            console.log('⚠️ No active outlets found');
            isRunning = false;
            return;
        }

        console.log(`📊 Processing ${outlets.length} outlets...`);

        // Process all outlets in parallel for speed
        const results = await Promise.all(
            outlets.map(outlet => syncOutletTables(outlet._id, outlet.name))
        );

        // Summary
        const totalUpdated = results.reduce((sum, r) => sum + (r.updatedTables || 0), 0);
        const totalDuration = Date.now() - jobStartTime;

        console.log(`✅ [TABLE SYNC] Completed in ${totalDuration}ms`);
        console.log(`📊 Updated ${totalUpdated} tables across ${outlets.length} outlets`);

        // Log details only if there were updates
        if (totalUpdated > 0) {
            results.forEach(result => {
                if (result.updatedTables > 0) {
                    console.log(`   ${result.outlet}: ${result.updatedTables} tables updated`);
                    result.updates?.forEach(u => {
                        console.log(`      - ${u.table}: ${u.from} → ${u.to}`);
                    });
                }
            });
        }

        return {
            success: true,
            outlets: outlets.length,
            totalUpdated,
            duration: `${totalDuration}ms`,
            results
        };

    } catch (error) {
        console.error('❌ [TABLE SYNC] Job failed:', error);
        return { success: false, error: error.message };
    } finally {
        isRunning = false;
    }
};

/**
 * Initialize the cron job
 * Called from index.js or server startup
 */
export const initTableSyncJob = (intervalMinutes = 2) => {
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`📅 [TABLE SYNC] Scheduling job to run every ${intervalMinutes} minutes`);

    // Run immediately on startup
    setTimeout(() => {
        runTableSyncJob().catch(console.error);
    }, 5000); // Wait 5s for server to fully start

    // Then run on interval
    setInterval(() => {
        runTableSyncJob().catch(console.error);
    }, intervalMs);
};

export default {
    runTableSyncJob,
    initTableSyncJob
};
