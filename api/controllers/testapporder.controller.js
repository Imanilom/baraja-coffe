/**
 * ==================================================================================
 * OPTIMIZED ORDER CREATION CONTROLLER - HIGH LOAD VERSION
 * ==================================================================================
 * 
 * IMPROVEMENTS:
 * ✅ Parallel stock processing
 * ✅ Batched database operations
 * ✅ Request timeout handling
 * ✅ Connection pooling optimization
 * ✅ Caching strategy
 * ✅ Circuit breaker pattern
 * ✅ Rate limiting ready
 * 
 * ==================================================================================
 */

import dayjs from 'dayjs';
import QRCode from 'qrcode';
import { MenuItem } from "../models/MenuItem.model.js";
import { Order } from "../models/order.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import mongoose from 'mongoose';
import { io } from '../index.js';
import Reservation from '../models/Reservation.model.js';
import { TaxAndService } from '../models/TaxAndService.model.js';
import { db } from '../utils/mongo.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import { Device } from '../models/Device.model.js';
import { PrintLogger } from '../services/print-logger.service.js';
/**
 * ==================================================================================
 * SECTION 1: CONFIGURATION & CONSTANTS
 * ==================================================================================
 */
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 50; // Reduced dari 100ms
const REQUEST_TIMEOUT_MS = 30000; // 30 detik timeout
const BATCH_SIZE = 10; // Process items in batches
const MAX_CONCURRENT_OPERATIONS = 5; // Limit concurrent DB ops
// Circuit Breaker Configuration
const CIRCUIT_BREAKER = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    failures: 0,
    lastFailureTime: null,
    state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
};
// Simple in-memory cache (untuk production gunakan Redis)
const CACHE = {
    taxAndService: new Map(),
    menuItems: new Map(),
    TTL: 300000 // 5 minutes
};
/**
 * ==================================================================================
 * SECTION 2: UTILITY FUNCTIONS
 * ==================================================================================
 */
/**
 * Timeout wrapper untuk semua async operations
 */
const withTimeout = (promise, timeoutMs = REQUEST_TIMEOUT_MS) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
        )
    ]);
};
/**
 * Circuit Breaker Pattern
 */
const executeWithCircuitBreaker = async (fn, operation = 'unknown') => {
    // Check if circuit is open
    if (CIRCUIT_BREAKER.state === 'OPEN') {
        const timeSinceLastFailure = Date.now() - CIRCUIT_BREAKER.lastFailureTime;
        if (timeSinceLastFailure < CIRCUIT_BREAKER.resetTimeout) {
            throw new Error(`Circuit breaker OPEN for ${operation}`);
        }
        CIRCUIT_BREAKER.state = 'HALF_OPEN';
    }
    try {
        const result = await fn();
        // Reset on success
        if (CIRCUIT_BREAKER.state === 'HALF_OPEN') {
            CIRCUIT_BREAKER.state = 'CLOSED';
            CIRCUIT_BREAKER.failures = 0;
        }
        return result;
    } catch (error) {
        CIRCUIT_BREAKER.failures++;
        CIRCUIT_BREAKER.lastFailureTime = Date.now();
        if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.failureThreshold) {
            CIRCUIT_BREAKER.state = 'OPEN';
            console.error(`🔴 Circuit breaker OPENED for ${operation}`);
        }
        throw error;
    }
};
/**
 * Batch processing dengan concurrency limit
 */
const processBatch = async (items, processor, concurrency = MAX_CONCURRENT_OPERATIONS) => {
    const results = [];
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(item => processor(item).catch(err => ({ error: err })))
        );
        results.push(...batchResults);
    }
    return results;
};
/**
 * Retry dengan exponential backoff (optimized)
 */
const retryWithBackoff = async (fn, maxRetries = MAX_RETRY_ATTEMPTS) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (!error.message?.includes('version') &&
                !error.message?.includes('No matching document found') &&
                !error.message?.includes('Stock conflict')) {
                throw error;
            }
            if (attempt < maxRetries) {
                const delay = RETRY_DELAY_MS * Math.pow(1.5, attempt - 1); // Reduced multiplier
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
};
/**
 * Get from cache or fetch
 */
const getCached = async (key, fetchFn, ttl = CACHE.TTL) => {
    const cached = CACHE.menuItems.get(key);
    if (cached && (Date.now() - cached.timestamp) < ttl) {
        return cached.data;
    }
    const data = await fetchFn();
    CACHE.menuItems.set(key, { data, timestamp: Date.now() });
    return data;
};
/**
 * ==================================================================================
 * SECTION 3: OPTIMIZED STOCK VALIDATION (PARALLEL)
 * ==================================================================================
 */
// ✅ ADD THIS HELPER FUNCTION before validateAndReserveStockOptimized
/**
 * Helper function to check if item is custom amount
 * Custom amount items have productId starting with 'custom_'
 */
const isCustomAmountItem = (productId) => {
    return productId && productId.toString().startsWith('custom_');
};
/**
 * ==================================================================================
 * UPDATED SECTION 3: OPTIMIZED STOCK VALIDATION (SKIP CUSTOM AMOUNTS)
 * ==================================================================================
 */
const validateAndReserveStockOptimized = async (items) => {
    const stockReservations = [];
    try {
        // ✅ FILTER: Separate custom amount items from regular menu items
        const regularItems = items.filter(item => !isCustomAmountItem(item.productId));
        const customAmountItems = items.filter(item => isCustomAmountItem(item.productId));
        console.log(`📊 Item breakdown: ${regularItems.length} regular, ${customAmountItems.length} custom amounts`);
        // Skip stock validation if only custom amount items
        if (regularItems.length === 0) {
            console.log('✅ All items are custom amounts, skipping stock validation');
            return [];
        }
        // OPTIMIZATION 1: Batch fetch all menu items & stocks in parallel
        const menuItemIds = regularItems.map(item => item.productId);
        const [menuItems, menuStocks] = await Promise.all([
            MenuItem.find({ _id: { $in: menuItemIds } })
                .select('_id name price availableStock isActive __v')
                .lean(),
            MenuStock.find({ menuItemId: { $in: menuItemIds } })
                .select('menuItemId warehouseId currentStock manualStock calculatedStock __v')
                .sort({ warehouseId: -1 }) // ✅ Prefer records WITH warehouseId (null comes last)
                .lean()
        ]);
        // Create lookup maps
        const menuItemMap = new Map(menuItems.map(item => [item._id.toString(), item]));
        // ✅ FIXED: Prefer records with warehouseId, fallback to legacy
        const stockMap = new Map();
        menuStocks.forEach(stock => {
            const menuItemIdStr = stock.menuItemId.toString();
            const existingStock = stockMap.get(menuItemIdStr);

            // If no existing record, or this one has warehouseId and existing doesn't, use this one
            if (!existingStock || (stock.warehouseId && !existingStock.warehouseId)) {
                stockMap.set(menuItemIdStr, stock);
            }
        });
        // OPTIMIZATION 2: Validate semua items secara parallel
        const validationPromises = regularItems.map(async (item) => {
            const menuItem = menuItemMap.get(item.productId);
            if (!menuItem) {
                throw new Error(`Menu item not found: ${item.productId}`);
            }
            if (!menuItem.isActive) {
                throw new Error(`Menu item "${menuItem.name}" is not available`);
            }
            const menuStock = stockMap.get(item.productId);
            if (!menuStock) {
                throw new Error(`Stock data not found for "${menuItem.name}"`);
            }
            const effectiveStock = menuStock.manualStock !== null
                ? menuStock.manualStock
                : menuStock.calculatedStock;
            if (effectiveStock < item.quantity) {
                throw new Error(
                    `Insufficient stock for "${menuItem.name}". Available: ${effectiveStock}, Requested: ${item.quantity}`
                );
            }
            return {
                menuItemId: menuItem._id,
                menuItemName: menuItem.name,
                menuItemVersion: menuItem.__v,
                menuStockId: menuStock._id,
                menuStockVersion: menuStock.__v,
                requestedQty: item.quantity,
                currentStock: effectiveStock,
                isManualStock: menuStock.manualStock !== null
            };
        });
        stockReservations.push(...await Promise.all(validationPromises));
        return stockReservations;
    } catch (error) {
        throw error;
    }
};
/**
 * ==================================================================================
 * SECTION 4: OPTIMIZED STOCK DEDUCTION (PARALLEL)
 * ==================================================================================
 */
const deductStockWithLockingOptimized = async (stockReservations) => {
    // OPTIMIZATION: Process in batches dengan concurrency limit
    const processor = async (reservation) => {
        return await retryWithBackoff(async () => {
            // Parallel update MenuItem dan MenuStock
            const [updatedStock, updatedMenuItem] = await Promise.all([
                MenuStock.findOneAndUpdate(
                    {
                        _id: reservation.menuStockId,
                        __v: reservation.menuStockVersion
                    },
                    {
                        $inc: {
                            currentStock: -reservation.requestedQty,
                            ...(reservation.isManualStock
                                ? { manualStock: -reservation.requestedQty }
                                : { calculatedStock: -reservation.requestedQty }
                            ),
                            __v: 1
                        }
                    },
                    { new: true }
                ),
                MenuItem.findOneAndUpdate(
                    {
                        _id: reservation.menuItemId,
                        __v: reservation.menuItemVersion
                    },
                    {
                        $inc: {
                            availableStock: -reservation.requestedQty,
                            __v: 1
                        }
                    },
                    { new: true }
                )
            ]);
            if (!updatedStock) {
                throw new Error(
                    `Stock conflict for "${reservation.menuItemName}". Please retry.`
                );
            }
            if (!updatedMenuItem) {
                // Rollback stock update
                await MenuStock.findByIdAndUpdate(
                    reservation.menuStockId,
                    {
                        $inc: {
                            currentStock: reservation.requestedQty,
                            ...(reservation.isManualStock
                                ? { manualStock: reservation.requestedQty }
                                : { calculatedStock: reservation.requestedQty }
                            )
                        }
                    }
                );
                throw new Error(
                    `MenuItem update conflict for "${reservation.menuItemName}". Please retry.`
                );
            }
            // Auto-deactivate jika stock habis (async, non-blocking)
            if (updatedStock.currentStock <= 0) {
                MenuItem.findByIdAndUpdate(
                    reservation.menuItemId,
                    { isActive: false }
                ).catch(err => console.error('Auto-deactivate failed:', err));
            }
            return {
                menuItemId: reservation.menuItemId,
                menuItemName: reservation.menuItemName,
                deductedQty: reservation.requestedQty,
                newStock: updatedStock.currentStock,
                success: true
            };
        });
    };
    return await processBatch(stockReservations, processor);
};
/**
 * ==================================================================================
 * SECTION 5: OPTIMIZED ROLLBACK (PARALLEL)
 * ==================================================================================
 */
const rollbackStockOptimized = async (deductionResults) => {
    console.log('🔄 Rolling back stock deductions...');
    const rollbackPromises = deductionResults
        .filter(result => result.success)
        .map(async (result) => {
            try {
                await Promise.all([
                    MenuStock.findOneAndUpdate(
                        { menuItemId: result.menuItemId },
                        {
                            $inc: {
                                currentStock: result.deductedQty,
                                calculatedStock: result.deductedQty
                            }
                        }
                    ),
                    MenuItem.findByIdAndUpdate(
                        result.menuItemId,
                        {
                            $inc: { availableStock: result.deductedQty }
                        }
                    )
                ]);
                console.log(`✅ Rolled back ${result.deductedQty} units for "${result.menuItemName}"`);
            } catch (error) {
                console.error(`❌ Rollback failed for "${result.menuItemName}":`, error.message);
            }
        });
    await Promise.allSettled(rollbackPromises);
};
/**
 * ==================================================================================
 * SECTION 6: CACHED TAX & SERVICE CALCULATION
 * ==================================================================================
 */
const calculateTaxAndServiceCached = async (subtotal, outlet, isReservation, isOpenBill) => {
    try {
        const cacheKey = `tax_service_${outlet}`;
        const taxAndServices = await getCached(
            cacheKey,
            () => TaxAndService.find({
                isActive: true,
                appliesToOutlets: outlet
            }).lean()
        );
        let totalTax = 0;
        let totalServiceFee = 0;
        const taxAndServiceDetails = [];
        for (const item of taxAndServices) {
            if (item.type === 'tax') {
                if (item.name.toLowerCase().includes('ppn') || item.name.toLowerCase() === 'tax') {
                    const amount = subtotal * (item.percentage / 100);
                    totalTax += amount;
                    taxAndServiceDetails.push({
                        id: item._id,
                        name: item.name,
                        type: item.type,
                        percentage: item.percentage,
                        amount: amount
                    });
                }
            } else if (item.type === 'service') {
                const amount = subtotal * (item.percentage / 100);
                totalServiceFee += amount;
                taxAndServiceDetails.push({
                    id: item._id,
                    name: item.name,
                    type: item.type,
                    percentage: item.percentage,
                    amount: amount
                });
            }
        }
        return { totalTax, totalServiceFee, taxAndServiceDetails };
    } catch (error) {
        console.error('Error calculating tax and service:', error);
        return { totalTax: 0, totalServiceFee: 0, taxAndServiceDetails: [] };
    }
};
/**
 * ==================================================================================
 * SECTION 7: OPTIMIZED ORDER ID GENERATOR
 * ==================================================================================
 */
export async function generateOrderId(tableNumber) {
    const now = dayjs();
    const dateStr = now.format('YYYYMMDD');
    const dayStr = now.format('DD');
    let tableOrDayCode = tableNumber;
    if (!tableNumber) {
        const days = ['MD', 'TU', 'WD', 'TH', 'FR', 'ST', 'SN'];
        const dayCode = days[now.day()]; // dayjs().day() is 0 (Sun) to 6 (Sat)
        tableOrDayCode = `${dayCode}${dayStr}`;
    }
    const key = `order_seq_${tableOrDayCode}_${dateStr}`;
    // Use MongoDB atomic operation with retry
    const result = await retryWithBackoff(async () => {
        return await db.collection('counters').findOneAndUpdate(
            { _id: key },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
    });
    const seq = result.value.seq;
    return `ORD-${dayStr}${tableOrDayCode}-${String(seq).padStart(3, '0')}`;
}
/**
 * ==================================================================================
 * SECTION 8: DATE PARSER (No Change)
 * ==================================================================================
 */
function parseIndonesianDate(dateString) {
    const monthMap = {
        'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
        'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
        'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
    };
    const parts = dateString.trim().split(' ');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = monthMap[parts[1]];
        const year = parts[2];
        if (month) {
            return new Date(`${year}-${month}-${day}`);
        }
    }
    return new Date(dateString);
}

/**
 * ==================================================================================
 * SECTION 8.5: GRO ORDER BROADCAST TO WORKSTATIONS
 * ==================================================================================
 * Broadcasts GRO orders directly to Bar Depan and Kitchen devices for immediate print.
 * This ensures GRO orders are printed without delay.
 */
async function broadcastGROOrderToWorkstations({
    orderId, tableNumber, orderItems, orderType, outlet, customerName, isReservation, service, isOpenBill
}) {
    try {
        if (!orderItems || orderItems.length === 0) {
            console.log('📭 No items to broadcast to workstations');
            return;
        }

        console.log('\n🖨️ ========== GRO WORKSTATION BROADCAST ==========');
        console.log(`📋 Order ID: ${orderId}`);
        console.log(`🪑 Table: ${tableNumber || 'N/A'}`);
        console.log(`📦 Items: ${orderItems.length}`);
        console.log(`📅 Type: ${orderType}${isReservation ? ' (Reservation)' : ''}`);

        // Get target devices: bar_depan + kitchen from same outlet
        const targetDevices = await Device.find({
            outlet: outlet,
            isActive: true,
            $or: [
                { location: 'depan' },   // Bar Depan
                { location: 'kitchen' }  // Kitchen/Dapur
            ]
        }).lean();

        if (targetDevices.length === 0) {
            console.log('⚠️ No active workstation devices found for outlet:', outlet);
            console.log('==================================================\n');
            return;
        }

        console.log(`📱 Found ${targetDevices.length} workstation devices`);

        // Separate items by workstation type
        const beverageItems = orderItems.filter(item => {
            const mainCat = (item.menuItem?.mainCategory || item.mainCategory || '').toLowerCase();
            const ws = (item.menuItem?.workstation || item.workstation || '').toLowerCase();
            return mainCat.includes('beverage') || mainCat.includes('minuman') || ws.includes('bar');
        });

        const kitchenItems = orderItems.filter(item => {
            const mainCat = (item.menuItem?.mainCategory || item.mainCategory || '').toLowerCase();
            const ws = (item.menuItem?.workstation || item.workstation || '').toLowerCase();
            return !mainCat.includes('beverage') && !mainCat.includes('minuman') && !ws.includes('bar');
        });

        console.log(`   🍹 Beverage items: ${beverageItems.length}`);
        console.log(`   🍳 Kitchen items: ${kitchenItems.length}`);

        // ✅ LOGGING: Log pending attempts on server side (Non-blocking)
        const logPromises = [];

        // Log Beverage Items
        if (beverageItems.length > 0) {
            beverageItems.forEach(item => {
                logPromises.push(PrintLogger.logPrintAttempt(
                    orderId,
                    item,
                    'bar_depan', // Default logic: GRO usually prints to bar depan/kitchen
                    { type: 'unknown', info: 'GRO Broadcast' },
                    { is_auto_print: true }
                ));
            });
        }

        // Log Kitchen Items
        if (kitchenItems.length > 0) {
            kitchenItems.forEach(item => {
                logPromises.push(PrintLogger.logPrintAttempt(
                    orderId,
                    item,
                    'kitchen',
                    { type: 'unknown', info: 'GRO Broadcast' },
                    { is_auto_print: true }
                ));
            });
        }

        // Fire-and-forget logging
        Promise.allSettled(logPromises).then((results) => {
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            console.log(`📝 [GRO-LOG] Logged ${successCount}/${logPromises.length} print attempts`);
        }).catch(err => console.error('⚠️ [GRO-LOG] Failed to log:', err));

        // Emit to each device
        let sentCount = 0;
        for (const device of targetDevices) {
            const isBarDevice = device.location === 'depan';
            const relevantItems = isBarDevice ? beverageItems : kitchenItems;

            if (relevantItems.length === 0) {
                console.log(`   ⏭️ Skipping ${device.deviceName} - No relevant items`);
                continue;
            }

            const printData = {
                orderId,
                tableNumber: tableNumber || '',
                orderType: orderType || 'Dine-In',
                source: 'Gro',
                name: customerName || 'Guest',
                service: service || 'Dine-In',
                orderItems: relevantItems.map(item => ({
                    _id: item._id?.toString() || item.menuItem?._id?.toString(),
                    menuItemId: item.menuItem?._id?.toString() || item._id?.toString(),
                    name: item.menuItem?.name || item.menuItemData?.name || item.name || 'Unknown',
                    quantity: item.quantity || 1,
                    notes: item.notes || '',
                    addons: item.addons || [],
                    toppings: item.toppings || [],
                    workstation: item.menuItem?.workstation || item.workstation || 'kitchen',
                    mainCategory: item.menuItem?.mainCategory || item.mainCategory
                })),
                deviceId: device.deviceId,
                targetDevice: device.deviceName,
                isReservation: isReservation || false,
                isGROOrder: true,
                isOpenBill: isOpenBill || false,
                timestamp: new Date()
            };

            const eventType = isBarDevice ? 'beverage_immediate_print' : 'kitchen_immediate_print';

            // Send via socket
            if (device.socketId && global.io) {
                global.io.to(device.socketId).emit(eventType, printData);
                console.log(`   ✅ Sent to ${device.deviceName} via socket: ${device.socketId}`);
                sentCount++;
            } else {
                // Fallback: send to room based on location
                const roomName = isBarDevice ? 'bar_depan' : 'kitchen_room';
                if (global.io) {
                    global.io.to(roomName).emit(eventType, printData);
                    console.log(`   ✅ Sent to ${device.deviceName} via room: ${roomName}`);
                    sentCount++;
                }
            }
        }

        console.log(`📊 Broadcast complete: ${sentCount} devices notified`);
        console.log('==================================================\n');

    } catch (error) {
        console.error('❌ Error broadcasting GRO order to workstations:', error);
    }
}

/**
 * ==================================================================================
 * SECTION 9: MAIN OPTIMIZED CONTROLLER
 * ==================================================================================
 */
export const createAppOrder = async (req, res) => {
    const startTime = Date.now();
    let stockDeductions = [];
    try {
        await withTimeout((async () => {
            const {
                items,
                customAmountItems, // ✅ NEW: Separate custom amounts
                orderType,
                tableNumber,
                deliveryAddress,
                pickupTime,
                paymentDetails,
                voucherCode,
                userId,
                outlet,
                reservationData,
                reservationType,
                isOpenBill,
                openBillData,
                isGroMode,
                groId,
                userName,
                guestPhone,
                // ✅ NEW: DP Already Paid (instant settlement)
                dpAlreadyPaid,
                dpBankInfo,
                // ✅ FIX: Custom DP Amount from frontend
                customDpAmount,
                // ✅ FIX: Tax data from frontend
                taxDetails,
                totalTax,
            } = req.body;
            console.log('🚀 Optimized createAppOrder:', {
                isGroMode,
                itemsCount: items?.length || 0,
                customAmountsCount: customAmountItems?.length || 0,
                timestamp: new Date().toISOString()
            });
            // ✅ Log custom amounts
            if (customAmountItems && customAmountItems.length > 0) {
                console.log('💰 Custom Amounts Detected:');
                customAmountItems.forEach((ca, idx) => {
                    console.log(`   ${idx + 1}. ${ca.name}: Rp ${ca.amount}`);
                });
            }
            // ✅ AUTO OPEN BILL: GRO orders are always open bill
            const effectiveIsOpenBill = isGroMode ? true : isOpenBill;
            if (isGroMode && !isOpenBill) {
                console.log('📋 [GRO AUTO OPEN BILL] Forcing isOpenBill=true for GRO order');
            }

            // VALIDATION
            const shouldSkipItemValidation =
                (orderType === 'reservation' && !effectiveIsOpenBill) ||
                (orderType === 'reservation' && effectiveIsOpenBill) ||
                effectiveIsOpenBill;
            if ((!items || items.length === 0) &&
                (!customAmountItems || customAmountItems.length === 0) &&
                !shouldSkipItemValidation) {
                return res.status(400).json({
                    success: false,
                    message: 'Order must contain at least one item or custom amount'
                });
            }
            if (!effectiveIsOpenBill && !orderType) {
                return res.status(400).json({ success: false, message: 'Order type is required' });
            }
            if (!paymentDetails?.method) {
                return res.status(400).json({ success: false, message: 'Payment method is required' });
            }
            // USER AUTHENTICATION (dengan caching)
            let userExists = null;
            let finalUserId = null;
            let finalUserName = userName || 'Guest';
            let groUser = null;
            // Parallel user fetch jika perlu
            const userFetchPromises = [];
            if (isGroMode && groId) {
                userFetchPromises.push(
                    getCached(`user_${groId}`, () => User.findById(groId).lean())
                        .then(user => { groUser = user; })
                );
            }
            if (!isGroMode && userId) {
                userFetchPromises.push(
                    getCached(`user_${userId}`, () => User.findById(userId).lean())
                        .then(user => { userExists = user; })
                );
            }
            if (userFetchPromises.length > 0) {
                await Promise.all(userFetchPromises);
            }
            if (isGroMode) {
                if (!groId || !groUser) {
                    return res.status(400).json({ success: false, message: 'Invalid GRO ID' });
                }
                finalUserId = null;
                finalUserName = userName || 'Guest';
            } else {
                if (!userId || !userExists) {
                    return res.status(404).json({ success: false, message: 'User not found' });
                }
                finalUserId = userId;
                finalUserName = userExists.username || 'Guest';
            }
            // STOCK VALIDATION (OPTIMIZED)
            let stockReservations = [];
            if (items && items.length > 0 && !shouldSkipItemValidation) {
                try {
                    stockReservations = await executeWithCircuitBreaker(
                        () => validateAndReserveStockOptimized(items),
                        'stock_validation'
                    );
                    console.log(`✅ Stock validated in ${Date.now() - startTime}ms`);
                } catch (stockError) {
                    console.error('❌ Stock validation failed:', stockError.message);
                    return res.status(400).json({
                        success: false,
                        message: stockError.message,
                        code: 'INSUFFICIENT_STOCK'
                    });
                }
            }
            // ✅ FIXED: OPEN BILL HANDLING - Added search by Order._id
            let existingOrder = null;
            let existingReservation = null;
            if (effectiveIsOpenBill && openBillData) {
                console.log('🔍 Open Bill Search - reservationId:', openBillData.reservationId);
                console.log('🔍 Open Bill Search - tableNumbers:', openBillData.tableNumbers);
                // ✅ FIX: Added 4 search strategies including Order._id search
                const [orderByOrderIdField, orderByObjectId, orderByReservation, orderByTable] = await Promise.all([
                    // Strategy 1: Search by order_id field (format "ORD-...")
                    Order.findOne({ order_id: openBillData.reservationId }),
                    // Strategy 2: Search by Order._id (MongoDB ObjectId) - THIS IS THE FIX!
                    mongoose.Types.ObjectId.isValid(openBillData.reservationId)
                        ? Order.findById(openBillData.reservationId)
                        : null,
                    // Strategy 3: Search via Reservation._id -> Order
                    mongoose.Types.ObjectId.isValid(openBillData.reservationId)
                        ? Reservation.findById(openBillData.reservationId)
                            .then(res => res?.order_id ? Order.findById(res.order_id) : null)
                            .catch(() => null)
                        : null,
                    // Strategy 4: Fallback by table number
                    openBillData.tableNumbers
                        ? Order.findOne({
                            tableNumber: openBillData.tableNumbers,
                            isOpenBill: true,
                            status: { $in: ['OnProcess', 'Reserved'] }
                        }).sort({ createdAt: -1 })
                        : null
                ]);
                existingOrder = orderByOrderIdField || orderByObjectId || orderByReservation || orderByTable;
                console.log('🔍 Open Bill Search Results:', {
                    byOrderIdField: !!orderByOrderIdField,
                    byObjectId: !!orderByObjectId,
                    byReservation: !!orderByReservation,
                    byTable: !!orderByTable,
                    found: !!existingOrder,
                    existingOrderId: existingOrder?.order_id || 'N/A'
                });
                // Create new order if not found
                if (!existingOrder) {
                    console.log('⚠️ No existing order found, creating new open bill order');

                    const generatedOrderId = await generateOrderId(
                        openBillData.tableNumbers || tableNumber || 'OPENBILL'
                    );
                    const createdByData = isGroMode && groUser ? {
                        employee_id: groUser._id,
                        employee_name: groUser.username || 'Unknown GRO',
                        created_at: new Date()
                    } : {
                        employee_id: null,
                        employee_name: null,
                        created_at: new Date()
                    };
                    existingOrder = new Order({
                        order_id: generatedOrderId,
                        user_id: finalUserId,
                        user: finalUserName,
                        groId: isGroMode ? groId : null,
                        items: [],
                        status: 'OnProcess',
                        paymentMethod: paymentDetails.method || 'Cash',
                        orderType: 'Reservation',
                        deliveryAddress: deliveryAddress || '',
                        tableNumber: openBillData.tableNumbers || tableNumber || '',
                        type: 'Indoor',
                        isOpenBill: true,
                        outlet: outlet || "67cbc9560f025d897d69f889",
                        totalBeforeDiscount: 0,
                        totalAfterDiscount: 0,
                        totalTax: 0,
                        totalServiceFee: 0,
                        discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
                        appliedPromos: [],
                        appliedManualPromo: null,
                        appliedVoucher: null,
                        taxAndServiceDetails: [],
                        grandTotal: 0,
                        promotions: [],
                        source: isGroMode ? 'Gro' : 'App',
                        created_by: createdByData,
                    });
                    await existingOrder.save();
                } else {
                    console.log('✅ Found existing order:', existingOrder.order_id);
                }
            }
            // ORDER TYPE FORMATTING (same as before)
            let formattedOrderType = '';
            switch (orderType) {
                case 'dineIn': formattedOrderType = 'Dine-In'; break;
                case 'delivery': formattedOrderType = 'Delivery'; break;
                case 'pickup': formattedOrderType = 'Pickup'; break;
                case 'takeAway': formattedOrderType = 'Take Away'; break;
                case 'reservation': formattedOrderType = 'Reservation'; break;
                default: return res.status(400).json({ success: false, message: 'Invalid order type' });
            }
            // ORDER STATUS
            let orderStatus = 'Pending';
            if (isGroMode) {
                if (effectiveIsOpenBill) {
                    orderStatus = existingOrder ? existingOrder.status : 'OnProcess';
                } else if (orderType === 'reservation') {
                    orderStatus = 'Reserved';
                } else if (['dineIn', 'takeAway', 'pickup', 'delivery'].includes(orderType)) {
                    // ✅ User Request: Direct to 'Waiting' for these types from GRO
                    orderStatus = 'Waiting';
                }
            }
            // CREATED_BY METADATA
            const createdByData = isGroMode && groUser ? {
                employee_id: groUser._id,
                employee_name: groUser.username || 'Unknown GRO',
                created_at: new Date()
            } : {
                employee_id: null,
                employee_name: null,
                created_at: new Date()
            };
            // PICKUP TIME
            let parsedPickupTime = null;
            if (orderType === 'pickup' && pickupTime) {
                const [hours, minutes] = pickupTime.split(':').map(Number);
                const now = new Date();
                parsedPickupTime = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    hours,
                    minutes
                );
            }
            // VOUCHER PROCESSING
            let voucherId = null;
            let voucherAmount = 0;
            let discountType = null;
            if (voucherCode) {
                const voucher = await Voucher.findOneAndUpdate(
                    { code: voucherCode, quota: { $gt: 0 } },
                    { $inc: { quota: -1 } },
                    { new: true }
                );
                if (voucher) {
                    voucherId = voucher._id;
                    voucherAmount = voucher.discountAmount;
                    discountType = voucher.discountType;
                }
            }
            // STOCK DEDUCTION (OPTIMIZED)
            if (stockReservations.length > 0) {
                try {
                    stockDeductions = await executeWithCircuitBreaker(
                        () => deductStockWithLockingOptimized(stockReservations),
                        'stock_deduction'
                    );
                    console.log(`✅ Stock deducted in ${Date.now() - startTime}ms`);
                } catch (deductError) {
                    console.error('❌ Stock deduction failed:', deductError.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to deduct stock. Please try again.',
                        code: 'STOCK_DEDUCTION_FAILED'
                    });
                }
            }
            // ORDER ITEMS PROCESSING (Regular items only)
            const orderItems = [];
            if (items && items.length > 0) {
                const menuItemIds = items.map(item => item.productId);
                const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } })
                    .populate('availableAt')
                    .lean();
                const menuItemMap = new Map(menuItems.map(item => [item._id.toString(), item]));
                for (const item of items) {
                    const menuItem = menuItemMap.get(item.productId);
                    if (!menuItem) {
                        if (stockDeductions.length > 0) {
                            await rollbackStockOptimized(stockDeductions);
                        }
                        return res.status(404).json({
                            success: false,
                            message: `Menu item not found: ${item.productId}`
                        });
                    }
                    const processedAddons = item.addons?.map(addon => ({
                        name: addon.name,
                        price: addon.price
                    })) || [];
                    const processedToppings = item.toppings?.map(topping => ({
                        name: topping.name,
                        price: topping.price
                    })) || [];
                    const addonsTotal = processedAddons.reduce((sum, addon) => sum + addon.price, 0);
                    const toppingsTotal = processedToppings.reduce((sum, topping) => sum + topping.price, 0);

                    // ✅ Calculate ORIGINAL subtotal from database price (for totalBeforeDiscount)
                    const originalSubtotal = item.quantity * (menuItem.price + addonsTotal + toppingsTotal);

                    // ✅ FIX: Use totalprice from frontend if available (already includes discount)
                    // Otherwise fallback to database price calculation
                    let itemSubtotal;
                    if (item.totalprice && item.totalprice > 0) {
                        // Frontend sent totalprice (price already discounted per unit)
                        itemSubtotal = item.totalprice * item.quantity;
                        console.log(`   📦 ${item.productName}: Original: ${originalSubtotal}, Discounted: ${itemSubtotal}`);
                    } else {
                        // Fallback: calculate from database price (no discount)
                        itemSubtotal = originalSubtotal;
                        console.log(`   📦 ${item.productName}: No discount, using DB price: ${itemSubtotal}`);
                    }

                    orderItems.push({
                        menuItem: menuItem._id,
                        quantity: item.quantity,
                        subtotal: itemSubtotal,               // ✅ Discounted price (for payment)
                        originalSubtotal: originalSubtotal,   // ✅ Original DB price (for totalBeforeDiscount)
                        addons: processedAddons,
                        toppings: processedToppings,
                        notes: item.notes || '',
                        outletId: menuItem.availableAt?.[0]?._id || null,
                        outletName: menuItem.availableAt?.[0]?.name || null,
                        isPrinted: false,
                        payment_id: null,
                        dineType: item.dineType || 'Dine-In', // ✅ NEW: Include dineType from request
                    });
                }
            }
            console.log(`✅ Processed ${orderItems.length} regular menu items`);
            // ✅ PROCESS CUSTOM AMOUNTS (separate from items)
            const processedCustomAmounts = [];
            if (customAmountItems && customAmountItems.length > 0) {
                for (const ca of customAmountItems) {
                    processedCustomAmounts.push({
                        amount: ca.amount || 0,
                        name: ca.name || 'Penyesuaian Pembayaran',
                        description: ca.description || '',
                        dineType: ca.dineType || 'Dine-In',
                        appliedAt: new Date(),
                    });
                }
                console.log(`✅ Processed ${processedCustomAmounts.length} custom amounts`);
            }
            // PRICE CALCULATION
            // ✅ FIX: totalBeforeDiscount uses ORIGINAL database price
            let totalBeforeDiscount = orderItems.reduce((sum, item) => sum + (item.originalSubtotal || item.subtotal), 0);
            // ✅ FIX: totalAfterDiscount uses DISCOUNTED price (for payment)
            let totalAfterDiscount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

            // ✅ ADD CUSTOM AMOUNTS to both totals (custom amounts don't have discount)
            const totalCustomAmount = processedCustomAmounts.reduce((sum, ca) => sum + ca.amount, 0);
            totalBeforeDiscount += totalCustomAmount;
            totalAfterDiscount += totalCustomAmount;

            console.log(`💰 Price Calculation:`);
            console.log(`   Original (DB) subtotal: ${orderItems.reduce((sum, item) => sum + (item.originalSubtotal || item.subtotal), 0)}`);
            console.log(`   Discounted subtotal: ${orderItems.reduce((sum, item) => sum + item.subtotal, 0)}`);
            console.log(`   Custom amounts: ${totalCustomAmount}`);
            console.log(`   totalBeforeDiscount: ${totalBeforeDiscount}`);
            console.log(`   totalAfterDiscount: ${totalAfterDiscount}`);

            if (orderType === 'reservation' && !effectiveIsOpenBill && orderItems.length === 0 && processedCustomAmounts.length === 0) {
                totalBeforeDiscount = 25000;
                totalAfterDiscount = 25000;
            }
            // Tax and service calculation - ✅ FIX: Tax is calculated on DISCOUNTED price
            let taxServiceCalculation = { totalTax: 0, totalServiceFee: 0, taxAndServiceDetails: [] };
            if (totalAfterDiscount > 0) {
                // ✅ FIX: Respect frontend "disable tax" toggle (totalTax 0 and empty details)
                const isTaxDisabled = (totalTax === 0 && (!taxDetails || taxDetails.length === 0));

                if (!isTaxDisabled) {
                    taxServiceCalculation = await calculateTaxAndServiceCached(
                        totalAfterDiscount,  // ✅ Tax on discounted price
                        outlet || "67cbc9560f025d897d69f889",
                        orderType === 'reservation',
                        effectiveIsOpenBill
                    );
                } else {
                    console.log('ℹ️ Tax explicitly disabled by frontend (GRO toggle) in Optimized Controller');
                }
            }
            // Apply voucher discount on top of menu discount
            // ✅ FIX: Don't redeclare totalAfterDiscount, just apply voucher on it
            if (discountType === 'percentage') {
                totalAfterDiscount = totalAfterDiscount - (totalAfterDiscount * (voucherAmount / 100));
            } else if (discountType === 'fixed') {
                totalAfterDiscount = totalAfterDiscount - voucherAmount;
                if (totalAfterDiscount < 0) totalAfterDiscount = 0;
            }
            const grandTotal = totalAfterDiscount + taxServiceCalculation.totalTax + taxServiceCalculation.totalServiceFee;
            let newOrder;
            // ORDER CREATION - OPEN BILL FLOW
            if (effectiveIsOpenBill && existingOrder) {
                console.log('📝 Adding items to existing open bill order:', existingOrder.order_id);
                if (orderItems.length > 0) {
                    existingOrder.items.push(...orderItems);
                }
                // ✅ ADD CUSTOM AMOUNTS to existing order
                if (processedCustomAmounts.length > 0) {
                    if (!existingOrder.customAmountItems) {
                        existingOrder.customAmountItems = [];
                    }
                    existingOrder.customAmountItems.push(...processedCustomAmounts);
                    console.log(`✅ Added ${processedCustomAmounts.length} custom amounts to existing order`);
                }
                // Recalculate totals
                // ✅ FIX: Use originalSubtotal for totalBeforeDiscount, subtotal for totalAfterDiscount
                const newItemsOriginalTotal = orderItems.reduce((sum, item) => sum + (item.originalSubtotal || item.subtotal), 0);
                const newItemsDiscountedTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
                const newCustomAmountsTotal = processedCustomAmounts.reduce((sum, ca) => sum + ca.amount, 0);

                const updatedTotalBeforeDiscount = existingOrder.totalBeforeDiscount + newItemsOriginalTotal + newCustomAmountsTotal;
                let updatedTotalAfterDiscount = (existingOrder.totalAfterDiscount || existingOrder.totalBeforeDiscount) + newItemsDiscountedTotal + newCustomAmountsTotal;

                // Apply voucher on discounted total
                if (voucherId && discountType === 'percentage') {
                    updatedTotalAfterDiscount = updatedTotalAfterDiscount - (updatedTotalAfterDiscount * (voucherAmount / 100));
                } else if (voucherId && discountType === 'fixed') {
                    updatedTotalAfterDiscount = updatedTotalAfterDiscount - voucherAmount;
                    if (updatedTotalAfterDiscount < 0) updatedTotalAfterDiscount = 0;
                }
                let updatedTaxCalculation = { totalTax: 0, totalServiceFee: 0, taxAndServiceDetails: [] };
                if (updatedTotalAfterDiscount > 0) {
                    updatedTaxCalculation = await calculateTaxAndServiceCached(
                        updatedTotalAfterDiscount,
                        outlet || "67cbc9560f025d897d69f889",
                        orderType === 'reservation',
                        true
                    );
                }
                existingOrder.totalBeforeDiscount = updatedTotalBeforeDiscount;
                existingOrder.totalAfterDiscount = updatedTotalAfterDiscount;
                existingOrder.totalTax = updatedTaxCalculation.totalTax;
                existingOrder.totalServiceFee = updatedTaxCalculation.totalServiceFee;
                existingOrder.taxAndServiceDetails = updatedTaxCalculation.taxAndServiceDetails;
                existingOrder.totalCustomAmount = existingOrder.customAmountItems?.reduce((sum, ca) => sum + ca.amount, 0) || 0;
                existingOrder.grandTotal = updatedTotalAfterDiscount + updatedTaxCalculation.totalTax + updatedTaxCalculation.totalServiceFee;
                if (voucherId) {
                    existingOrder.appliedVoucher = voucherId;
                    existingOrder.voucher = voucherId;
                }
                if (isGroMode) {
                    if (!existingOrder.groId) existingOrder.groId = groId;
                    if (!existingOrder.created_by?.employee_id) existingOrder.created_by = createdByData;
                    if (existingOrder.source !== 'Gro') existingOrder.source = 'Gro';
                }
                await existingOrder.save();
                newOrder = existingOrder;

                console.log('✅ Successfully added items to existing order:', existingOrder.order_id);
            }
            // ORDER CREATION - NEW ORDER FLOW
            else {
                const generatedOrderId = await generateOrderId(tableNumber || '');
                newOrder = new Order({
                    order_id: generatedOrderId,
                    user_id: finalUserId,
                    user: finalUserName,
                    cashier: null,
                    groId: isGroMode ? groId : null,
                    items: orderItems,
                    customAmountItems: processedCustomAmounts, // ✅ Add custom amounts
                    status: orderStatus,
                    paymentMethod: paymentDetails.method,
                    orderType: formattedOrderType,
                    deliveryAddress: deliveryAddress || '',
                    tableNumber: tableNumber || '',
                    pickupTime: parsedPickupTime,
                    type: 'Indoor',
                    voucher: voucherId,
                    outlet: outlet || "67cbc9560f025d897d69f889",
                    totalBeforeDiscount,
                    totalAfterDiscount,
                    totalTax: taxServiceCalculation.totalTax,
                    totalServiceFee: taxServiceCalculation.totalServiceFee,
                    totalCustomAmount, // ✅ Add total custom amount
                    discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
                    appliedPromos: [],
                    appliedManualPromo: null,
                    appliedVoucher: voucherId,
                    taxAndServiceDetails: taxServiceCalculation.taxAndServiceDetails,
                    grandTotal: grandTotal,
                    promotions: [],
                    source: isGroMode ? 'Gro' : 'App',
                    reservation: null,
                    // ✅ FIXED: Pass isOpenBill as-is (allow undefined) so Mongoose model default logic works for Dine-In/Reservation
                    isOpenBill: effectiveIsOpenBill,
                    created_by: createdByData,
                });
                try {
                    await newOrder.save();
                    console.log(`✅ Order created with ${orderItems.length} items and ${processedCustomAmounts.length} custom amounts`);
                } catch (saveError) {
                    console.error('❌ Order save failed, rolling back stock:', saveError.message);
                    if (stockDeductions.length > 0) {
                        await rollbackStockOptimized(stockDeductions);
                    }
                    throw saveError;
                }
            }
            // ORDER VERIFICATION
            const savedOrder = await Order.findById(newOrder._id);
            console.log('✅ Order created:', {
                orderId: savedOrder._id,
                order_id: savedOrder.order_id,
                status: savedOrder.status,
                source: savedOrder.source,
                duration: `${Date.now() - startTime}ms`
            });
            // RESERVATION CREATION
            // Create reservation for:
            // 1. Non-open bill reservation orders (customer flow)
            // 2. GRO reservation orders when creating NEW order (not adding to existing)
            let reservationRecord = null;
            const isNewGroReservation = isGroMode && orderType === 'reservation' && !existingOrder;
            if (orderType === 'reservation' && (!effectiveIsOpenBill || isNewGroReservation)) {
                try {
                    let parsedReservationDate;
                    if (reservationData.reservationDate) {
                        parsedReservationDate = typeof reservationData.reservationDate === 'string'
                            ? (reservationData.reservationDate.match(/Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember/)
                                ? parseIndonesianDate(reservationData.reservationDate)
                                : new Date(reservationData.reservationDate))
                            : new Date(reservationData.reservationDate);
                    } else {
                        parsedReservationDate = new Date();
                    }
                    if (isNaN(parsedReservationDate.getTime())) {
                        await Order.findByIdAndDelete(newOrder._id);
                        if (stockDeductions.length > 0) await rollbackStockOptimized(stockDeductions);
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid reservation date format'
                        });
                    }
                    const servingType = reservationData.serving_type || 'ala carte';
                    const equipment = Array.isArray(reservationData.equipment) ? reservationData.equipment : [];
                    const agenda = reservationData.agenda || '';
                    const foodServingOption = reservationData.food_serving_option || 'immediate';
                    const foodServingTime = reservationData.food_serving_time ? new Date(reservationData.food_serving_time) : null;
                    const reservationStatus = isGroMode ? 'confirmed' : 'pending';
                    reservationRecord = new Reservation({
                        reservation_date: parsedReservationDate,
                        reservation_time: reservationData.reservationTime,
                        area_id: reservationData.areaIds,
                        table_id: reservationData.tableIds,
                        guest_count: reservationData.guestCount,
                        guest_number: isGroMode ? guestPhone : null,
                        order_id: newOrder._id,
                        status: reservationStatus,
                        reservation_type: reservationType || 'nonBlocking',
                        notes: reservationData.notes || '',
                        serving_type: servingType,
                        equipment: equipment,
                        agenda: agenda,
                        food_serving_option: foodServingOption,
                        food_serving_time: foodServingTime,
                        created_by: createdByData
                    });
                    await reservationRecord.save();

                    // Link reservation to order
                    newOrder.reservation = reservationRecord._id;
                    await newOrder.save();
                    console.log('✅ Reservation created:', {
                        reservationId: reservationRecord._id,
                        status: reservationRecord.status
                    });
                } catch (reservationError) {
                    console.error('❌ Reservation failed:', reservationError.message);
                    await Order.findByIdAndDelete(newOrder._id);
                    if (stockDeductions.length > 0) await rollbackStockOptimized(stockDeductions);
                    return res.status(500).json({
                        success: false,
                        message: 'Error creating reservation',
                        error: reservationError.message
                    });
                }
            }

            // ✅ REFACTORED: DP Already Paid is now handled by /api/charge endpoint
            // This ensures all payment creation goes through a single endpoint for consistency.
            // The frontend will call /api/charge with dp_already_paid=true after order creation.
            if (dpAlreadyPaid && isGroMode && orderType === 'reservation') {
                console.log('💳 DP Already Paid flag set - Payment will be created via /api/charge endpoint');
                console.log('   Order ID:', newOrder.order_id);
                console.log('   Custom DP Amount:', customDpAmount);
                console.log('   Bank Info:', dpBankInfo?.bankName);
            }
            // RESPONSE
            const responseData = {
                success: true,
                message: effectiveIsOpenBill ? 'Items added to existing order successfully' : `${orderType === 'reservation' ? 'Reservation' : 'Order'} created successfully`,
                order: newOrder,
                isOpenBill: effectiveIsOpenBill || false,
                existingReservation: effectiveIsOpenBill ? existingReservation : null,
                stockDeductions: stockDeductions.map(d => ({
                    menuItemName: d.menuItemName,
                    deductedQty: d.deductedQty,
                    newStock: d.newStock
                }))
            };
            if (reservationRecord) {
                responseData.reservation = reservationRecord;
            }
            // FRONTEND MAPPING
            const mappedOrders = {
                _id: newOrder._id,
                userId: newOrder.user_id,
                customerName: newOrder.user,
                cashierId: newOrder.cashier,
                groId: newOrder.groId,
                items: newOrder.items.map(item => ({
                    _id: item._id,
                    quantity: item.quantity,
                    subtotal: item.subtotal,
                    isPrinted: item.isPrinted,
                    menuItem: { ...item.menuItem, categories: item.menuItem.category },
                    selectedAddons: item.addons.length > 0 ? item.addons.map(addon => ({
                        name: addon.name,
                        _id: addon._id,
                        options: [{ id: addon._id, label: addon.label || addon.name, price: addon.price }]
                    })) : [],
                    selectedToppings: item.toppings.length > 0 ? item.toppings.map(topping => ({
                        id: topping._id || topping.id,
                        name: topping.name,
                        price: topping.price
                    })) : []
                })),
                status: newOrder.status,
                orderType: newOrder.orderType,
                deliveryAddress: newOrder.deliveryAddress,
                tableNumber: newOrder.tableNumber,
                pickupTime: newOrder.pickupTime,
                type: newOrder.type,
                paymentMethod: newOrder.paymentMethod || "Cash",
                totalPrice: newOrder.totalBeforeDiscount,
                totalAfterDiscount: newOrder.totalAfterDiscount,
                totalTax: newOrder.totalTax,
                totalServiceFee: newOrder.totalServiceFee,
                taxAndServiceDetails: newOrder.taxAndServiceDetails,
                grandTotal: newOrder.grandTotal,
                voucher: newOrder.voucher || null,
                outlet: newOrder.outlet || null,
                promotions: newOrder.promotions || [],
                source: newOrder.source,
                created_by: newOrder.created_by,
                createdAt: newOrder.createdAt,
                updatedAt: newOrder.updatedAt,
                __v: newOrder.__v,
                isOpenBill: effectiveIsOpenBill || false
            };
            // ✅ LOG ORDER CREATION SUCCESS
            console.log(`\n✅ ========== ORDER CREATED ==========`);
            console.log(`📋 Order ID: ${newOrder.order_id}`);
            console.log(`🪑 Table: ${newOrder.tableNumber || 'N/A'}`);
            console.log(`👤 Customer: ${newOrder.user || 'Guest'}`);
            console.log(`📦 Items: ${newOrder.items.length} items`);
            console.log(`💰 Total: Rp ${newOrder.grandTotal.toLocaleString('id-ID')}`);
            console.log(`📱 Source: ${newOrder.source}`);
            console.log(`🔖 Status: ${newOrder.status}`);
            console.log(`💳 Payment: ${newOrder.paymentMethod}`);
            if (effectiveIsOpenBill) {
                console.log(`📝 Type: Open Bill (items added to existing order)`);
            } else if (reservationRecord) {
                console.log(`📅 Type: Reservation`);
            }
            console.log(`=====================================\n`);
            // SOCKET.IO NOTIFICATION
            if (effectiveIsOpenBill) {
                io.to('cashier_room').emit('open_bill_order', {
                    mappedOrders,
                    originalReservation: existingReservation,
                    message: 'Additional items added to existing reservation'
                });
                console.log(`📤 Socket emitted: open_bill_order → cashier_room`);
            } else {
                io.to('cashier_room').emit('new_order', { mappedOrders });
                console.log(`📤 Socket emitted: new_order → cashier_room`);
            }

            // 🔥 GRO IMMEDIATE PRINT: Broadcast to workstations (Bar Depan + Kitchen)
            // For GRO orders, send items directly to workstation devices for immediate print
            if (isGroMode && orderItems.length > 0) {
                // CRITICAL: For open bill, only send NEW items (orderItems), not all items (newOrder.items)
                await broadcastGROOrderToWorkstations({
                    orderId: newOrder.order_id,
                    tableNumber: newOrder.tableNumber,
                    orderItems: orderItems,  // Only new items for both new order and open bill
                    orderType: formattedOrderType,
                    outlet: outlet || newOrder.outlet,
                    customerName: finalUserName,
                    isReservation: orderType === 'reservation',
                    service: newOrder.type || 'Dine-In',
                    isOpenBill: effectiveIsOpenBill || false
                });
            }

            console.log(`✅ Order completed in ${Date.now() - startTime}ms`);
            res.status(201).json(responseData);
        })(), REQUEST_TIMEOUT_MS);
    } catch (error) {
        console.error('❌ Error in createAppOrder:', error);
        if (stockDeductions.length > 0) {
            console.log('🔄 Rolling back stock...');
            await rollbackStockOptimized(stockDeductions);
        }
        res.status(500).json({
            success: false,
            message: error.message === 'Operation timeout' ? 'Request timeout, please try again' : 'Error creating order',
            error: error.message,
            code: error.message === 'Operation timeout' ? 'TIMEOUT' : 'ORDER_CREATION_FAILED'
        });
    }
};