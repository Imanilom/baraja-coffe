/**
 * ==================================================================================
 * ORDER CREATION CONTROLLER - FLOW SEPARATION DOCUMENTATION
 * ==================================================================================
 * 
 * File ini menangani pembuatan order untuk 2 mode berbeda:
 * 🔵 GRO MODE    - Staff restaurant membuat order untuk customer
 * 🟢 CUSTOMER MODE - Customer membuat order sendiri via app
 * 
 * ==================================================================================
 */

import Payment from '../models/Payment.model.js';
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

/**
 * ==================================================================================
 * SECTION 1: OPTIMISTIC LOCKING CONSTANTS
 * ==================================================================================
 * Digunakan untuk mencegah race condition saat concurrent stock updates
 * SHARED: 🔵 GRO & 🟢 CUSTOMER
 */
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

/**
 * ==================================================================================
 * SECTION 2: HELPER FUNCTIONS - RETRY MECHANISM
 * ==================================================================================
 * SHARED: 🔵 GRO & 🟢 CUSTOMER
 * 
 * Fungsi ini melakukan retry dengan exponential backoff jika terjadi version conflict
 * Digunakan oleh: deductStockWithLocking()
 */
const retryWithBackoff = async (fn, maxRetries = MAX_RETRY_ATTEMPTS) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Hanya retry untuk version conflict errors
            if (!error.message?.includes('version') &&
                !error.message?.includes('No matching document found') &&
                !error.message?.includes('Stock conflict')) {
                throw error;
            }

            if (attempt < maxRetries) {
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                console.log(`⚠️ Conflict detected, retry ${attempt}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
};

/**
 * ==================================================================================
 * SECTION 3: STOCK VALIDATION & RESERVATION
 * ==================================================================================
 * SHARED: 🔵 GRO & 🟢 CUSTOMER
 * 
 * PHASE 1 dari 3-phase stock management:
 * 1. Validate & Reserve (fungsi ini)
 * 2. Deduct
 * 3. Rollback (jika gagal)
 * 
 * Fungsi ini:
 * - Mengecek apakah stock mencukupi untuk semua items
 * - Menyimpan snapshot version numbers untuk optimistic locking
 * - Menggunakan MongoDB session untuk transaction consistency
 */
const validateAndReserveStock = async (items) => {
    const stockReservations = [];
    const session = await mongoose.startSession();

    try {
        await session.startTransaction();

        for (const item of items) {
            // Ambil menu item dengan version number (__v)
            const menuItem = await MenuItem.findById(item.productId)
                .session(session)
                .select('_id name price availableStock isActive __v');

            if (!menuItem) {
                throw new Error(`Menu item not found: ${item.productId}`);
            }

            if (!menuItem.isActive) {
                throw new Error(`Menu item "${menuItem.name}" is not available`);
            }

            // Ambil stock data dengan version number
            const menuStock = await MenuStock.findOne({ menuItemId: menuItem._id })
                .session(session)
                .select('currentStock manualStock calculatedStock __v');

            if (!menuStock) {
                throw new Error(`Stock data not found for "${menuItem.name}"`);
            }

            // Manual stock memiliki priority lebih tinggi dari calculated stock
            const effectiveStock = menuStock.manualStock !== null
                ? menuStock.manualStock
                : menuStock.calculatedStock;

            // Validasi stock mencukupi
            if (effectiveStock < item.quantity) {
                throw new Error(
                    `Insufficient stock for "${menuItem.name}". Available: ${effectiveStock}, Requested: ${item.quantity}`
                );
            }

            // Simpan reservation data untuk digunakan di phase 2 (deduction)
            stockReservations.push({
                menuItemId: menuItem._id,
                menuItemName: menuItem.name,
                menuItemVersion: menuItem.__v,      // Untuk optimistic locking
                menuStockId: menuStock._id,
                menuStockVersion: menuStock.__v,    // Untuk optimistic locking
                requestedQty: item.quantity,
                currentStock: effectiveStock,
                isManualStock: menuStock.manualStock !== null
            });
        }

        await session.commitTransaction();
        return stockReservations;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * ==================================================================================
 * SECTION 4: STOCK DEDUCTION WITH LOCKING
 * ==================================================================================
 * SHARED: 🔵 GRO & 🟢 CUSTOMER
 * 
 * PHASE 2 dari 3-phase stock management
 * 
 * Fungsi ini:
 * - Melakukan actual stock deduction
 * - Menggunakan optimistic locking dengan version check
 * - Auto-retry jika ada conflict
 * - Auto-deactivate menu item jika stock habis
 */
const deductStockWithLocking = async (stockReservations) => {
    const deductionResults = [];

    for (const reservation of stockReservations) {
        const result = await retryWithBackoff(async () => {
            // Update MenuStock dengan version check (optimistic locking)
            const updatedStock = await MenuStock.findOneAndUpdate(
                {
                    _id: reservation.menuStockId,
                    __v: reservation.menuStockVersion  // Version check
                },
                {
                    $inc: {
                        currentStock: -reservation.requestedQty,
                        ...(reservation.isManualStock
                            ? { manualStock: -reservation.requestedQty }
                            : { calculatedStock: -reservation.requestedQty }
                        ),
                        __v: 1  // Increment version
                    }
                },
                { new: true }
            );

            // Jika null, berarti version mismatch (ada update dari request lain)
            if (!updatedStock) {
                throw new Error(
                    `Stock conflict for "${reservation.menuItemName}". Please retry.`
                );
            }

            // Update MenuItem dengan version check
            const updatedMenuItem = await MenuItem.findOneAndUpdate(
                {
                    _id: reservation.menuItemId,
                    __v: reservation.menuItemVersion  // Version check
                },
                {
                    $inc: {
                        availableStock: -reservation.requestedQty,
                        __v: 1  // Increment version
                    }
                },
                { new: true }
            );

            // Jika MenuItem update gagal, rollback MenuStock update
            if (!updatedMenuItem) {
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

            return {
                menuItemId: reservation.menuItemId,
                menuItemName: reservation.menuItemName,
                deductedQty: reservation.requestedQty,
                newStock: updatedStock.currentStock,
                success: true
            };
        });

        deductionResults.push(result);

        // Auto-deactivate jika stock habis
        if (result.newStock <= 0) {
            await MenuItem.findByIdAndUpdate(
                reservation.menuItemId,
                { isActive: false }
            );
            console.log(`🔴 Auto-deactivated "${result.menuItemName}" - stock depleted`);
        }
    }

    return deductionResults;
};

/**
 * ==================================================================================
 * SECTION 5: STOCK ROLLBACK
 * ==================================================================================
 * SHARED: 🔵 GRO & 🟢 CUSTOMER
 * 
 * PHASE 3 dari 3-phase stock management (Error Recovery)
 * 
 * Dipanggil jika:
 * - Order creation gagal setelah stock deduction
 * - Payment processing gagal
 * - Validation error setelah deduction
 * 
 * Fungsi ini mengembalikan stock yang sudah di-deduct
 */
const rollbackStock = async (deductionResults) => {
    console.log('🔄 Rolling back stock deductions...');

    for (const result of deductionResults) {
        if (result.success) {
            try {
                // Kembalikan stock di MenuStock
                await MenuStock.findOneAndUpdate(
                    { menuItemId: result.menuItemId },
                    {
                        $inc: {
                            currentStock: result.deductedQty,
                            calculatedStock: result.deductedQty
                        }
                    }
                );

                // Kembalikan stock di MenuItem
                await MenuItem.findByIdAndUpdate(
                    result.menuItemId,
                    {
                        $inc: { availableStock: result.deductedQty }
                    }
                );

                console.log(`✅ Rolled back ${result.deductedQty} units for "${result.menuItemName}"`);
            } catch (error) {
                console.error(`❌ Rollback failed for "${result.menuItemName}":`, error.message);
            }
        }
    }
};

/**
 * ==================================================================================
 * SECTION 6: TAX & SERVICE CALCULATION
 * ==================================================================================
 * SHARED: 🔵 GRO & 🟢 CUSTOMER
 * 
 * Menghitung:
 * - PPN (Pajak Pertambahan Nilai)
 * - Service charge
 * 
 * Berdasarkan outlet dan tipe order
 */
const calculateTaxAndService = async (subtotal, outlet, isReservation, isOpenBill) => {
    try {
        // Ambil tax & service yang active untuk outlet ini
        const taxAndServices = await TaxAndService.find({
            isActive: true,
            appliesToOutlets: outlet
        });

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

        return {
            totalTax,
            totalServiceFee,
            taxAndServiceDetails
        };
    } catch (error) {
        console.error('Error calculating tax and service:', error);
        return {
            totalTax: 0,
            totalServiceFee: 0,
            taxAndServiceDetails: []
        };
    }
};

/**
 * ==================================================================================
 * SECTION 7: ORDER ID GENERATOR
 * ==================================================================================
 * SHARED: 🔵 GRO & 🟢 CUSTOMER
 * 
 * Generate unique order ID dengan format:
 * ORD-{day}{table/dayCode}-{sequence}
 * 
 * Contoh:
 * - ORD-05T12-001 (tanggal 5, table 12, sequence 1)
 * - ORD-05MD05-001 (tanggal 5, Monday, sequence 1)
 * 
 * Menggunakan atomic counter di MongoDB untuk avoid duplicate
 */
export async function generateOrderId(tableNumber) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    let tableOrDayCode = tableNumber;
    if (!tableNumber) {
        // Jika tidak ada table number, gunakan day code
        const days = ['MD', 'TU', 'WD', 'TH', 'FR', 'ST', 'SN'];
        const dayCode = days[now.getDay()];
        tableOrDayCode = `${dayCode}${day}`;
    }

    const key = `order_seq_${tableOrDayCode}_${dateStr}`;

    // Atomic increment untuk sequence number
    const result = await db.collection('counters').findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );

    const seq = result.value.seq;
    return `ORD-${day}${tableOrDayCode}-${String(seq).padStart(3, '0')}`;
}

/**
 * ==================================================================================
 * SECTION 8: DATE PARSER
 * ==================================================================================
 * SHARED: 🔵 GRO & 🟢 CUSTOMER
 * 
 * Parse Indonesian date format ke JavaScript Date object
 * Contoh: "5 Desember 2025" → Date(2025-12-05)
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
 * SECTION 9: MAIN CONTROLLER - CREATE APP ORDER
 * ==================================================================================
 * 
 * Entry point untuk semua order creation
 * Menangani 2 mode berbeda:
 * 
 * 🔵 GRO MODE (isGroMode = true):
 *    - Staff restaurant membuat order untuk customer
 *    - Customer bisa guest (tidak perlu userId)
 *    - Order status bisa langsung 'Reserved' atau 'OnProcess'
 *    - Reservation langsung 'confirmed'
 * 
 * 🟢 CUSTOMER MODE (isGroMode = false):
 *    - Customer membuat order sendiri via mobile app
 *    - Harus authenticated (userId required)
 *    - Order status dimulai dari 'Pending'
 *    - Reservation perlu approval ('pending')
 */
export const createAppOrder = async (req, res) => {
    let stockDeductions = [];  // Track untuk rollback jika gagal

    try {
        /**
         * ========================================================================
         * SECTION 9A: EXTRACT REQUEST PARAMETERS
         * ========================================================================
         */
        const {
            items,                  // Array of ordered items
            orderType,              // dineIn, delivery, pickup, takeAway, reservation
            tableNumber,            // Nomor meja (untuk dine-in)
            deliveryAddress,        // Alamat (untuk delivery)
            pickupTime,             // Waktu pickup (untuk pickup)
            paymentDetails,         // { method: 'Cash'/'Card'/dll }
            voucherCode,            // Kode voucher (optional)
            userId,                 // 🟢 CUSTOMER: User ID (required)
            outlet,                 // Outlet ID
            reservationData,        // Data reservation (untuk reservation type)
            reservationType,        // blocking/nonBlocking
            isOpenBill,             // Flag untuk tambah item ke existing order
            openBillData,           // Data existing order
            taxDetails,
            totalTax,
            subtotal: frontendSubtotal,
            discount: frontendDiscount,
            isGroMode,              // 🔵 GRO: Flag mode GRO
            groId,                  // 🔵 GRO: Employee ID
            userName,               // 🔵 GRO: Customer name (manual input)
            guestPhone,             // 🔵 GRO: Customer phone (manual input)
        } = req.body;

        console.log('🔒 Secure createAppOrder request:', {
            isGroMode,
            groId,
            userName,
            userId,
            isOpenBill,
            orderType,
            itemsCount: items ? items.length : 0
        });

        /**
         * ========================================================================
         * SECTION 9B: INPUT VALIDATION
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         */

        // Skip validation untuk case khusus:
        // - Reservation tanpa items (down payment only)
        // - Open bill (bisa tambah items ke existing order)
        const shouldSkipItemValidation =
            (orderType === 'reservation' && !isOpenBill) ||
            (orderType === 'reservation' && isOpenBill) ||
            isOpenBill;

        if ((!items || items.length === 0) && !shouldSkipItemValidation) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item'
            });
        }

        if (!isOpenBill && !orderType) {
            return res.status(400).json({ success: false, message: 'Order type is required' });
        }

        if (!paymentDetails?.method) {
            return res.status(400).json({ success: false, message: 'Payment method is required' });
        }

        /**
         * ========================================================================
         * SECTION 9C: USER AUTHENTICATION & AUTHORIZATION
         * ========================================================================
         * 
         * 🔵 GRO MODE:
         *    - Validasi groId (employee) harus ada
         *    - Customer tidak perlu punya user account (bisa guest)
         *    - userName & guestPhone diinput manual oleh staff
         * 
         * 🟢 CUSTOMER MODE:
         *    - Validasi userId harus ada dan valid
         *    - userName diambil dari database user
         */
        let userExists = null;
        let finalUserId = null;
        let finalUserName = userName || 'Guest';
        let groUser = null;

        if (isGroMode) {
            // 🔵 GRO MODE VALIDATION
            if (!groId) {
                return res.status(400).json({ success: false, message: 'GRO ID is required for GRO mode' });
            }

            // Validate employee exists
            groUser = await User.findById(groId);
            if (!groUser) {
                return res.status(404).json({ success: false, message: 'GRO not found' });
            }

            // Customer tidak perlu user ID
            finalUserId = null;
            finalUserName = userName || 'Guest';
        } else {
            // 🟢 CUSTOMER MODE VALIDATION
            if (!userId) {
                return res.status(400).json({ success: false, message: 'User ID is required' });
            }

            // Validate customer user exists
            userExists = await User.findById(userId);
            if (!userExists) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            finalUserId = userId;
            finalUserName = userExists.username || 'Guest';
        }

        /**
         * ========================================================================
         * SECTION 9D: STOCK VALIDATION & RESERVATION (PHASE 1)
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * CRITICAL: Validate stock SEBELUM create order
         * Ini mencegah order dibuat jika stock tidak cukup
         */
        let stockReservations = [];
        if (items && items.length > 0 && !shouldSkipItemValidation) {
            try {
                console.log('🔒 Validating and reserving stock...');
                stockReservations = await validateAndReserveStock(items);
                console.log('✅ Stock validation passed:', {
                    itemsCount: stockReservations.length,
                    totalRequested: stockReservations.reduce((sum, r) => sum + r.requestedQty, 0)
                });
            } catch (stockError) {
                console.error('❌ Stock validation failed:', stockError.message);
                return res.status(400).json({
                    success: false,
                    message: stockError.message,
                    code: 'INSUFFICIENT_STOCK'
                });
            }
        }

        /**
         * ========================================================================
         * SECTION 9E: OPEN BILL HANDLING
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * Mencari existing order untuk scenario "tambah item ke order yang sudah ada"
         * 
         * Search order by:
         * 1. order_id (string)
         * 2. _id (MongoDB ObjectId)
         * 3. Reservation → order_id
         * 4. tableNumber + isOpenBill = true
         */
        let existingOrder = null;
        let existingReservation = null;

        if (isOpenBill && openBillData) {
            console.log('🔍 Enhanced Open Bill Search:', {
                reservationId: openBillData.reservationId,
                tableNumbers: openBillData.tableNumbers
            });

            // Search 1: By order_id (string)
            existingOrder = await Order.findOne({ order_id: openBillData.reservationId });

            // Search 2: By MongoDB _id
            if (!existingOrder) {
                try {
                    existingOrder = await Order.findById(openBillData.reservationId);
                } catch (idError) {
                    console.log('🔍 Invalid ObjectId format');
                }
            }

            // Search 3: Via Reservation
            if (!existingOrder) {
                existingReservation = await Reservation.findById(openBillData.reservationId);
                if (existingReservation && existingReservation.order_id) {
                    existingOrder = await Order.findById(existingReservation.order_id);
                }
            }

            // Search 4: By table number
            if (!existingOrder && openBillData.tableNumbers) {
                existingOrder = await Order.findOne({
                    tableNumber: openBillData.tableNumbers,
                    isOpenBill: true,
                    status: { $in: ['OnProcess', 'Reserved'] }
                }).sort({ createdAt: -1 });
            }

            // Jika tidak ditemukan, buat order baru untuk open bill
            if (!existingOrder) {
                console.log('⚠️ Creating new order for open bill...');

                const generatedOrderId = await generateOrderId(openBillData.tableNumbers || tableNumber || 'OPENBILL');

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
                    outlet: outlet && outlet !== "" ? outlet : "67cbc9560f025d897d69f889",
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

                if (existingReservation && !existingReservation.order_id) {
                    existingReservation.order_id = existingOrder._id;
                    await existingReservation.save();
                }
            }
        }

        /**
         * ========================================================================
         * SECTION 9F: ORDER TYPE FORMATTING & VALIDATION
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * Convert orderType dari camelCase ke format display
         * Validate required fields untuk setiap tipe
         */
        let formattedOrderType = '';
        switch (orderType) {
            case 'dineIn':
                formattedOrderType = 'Dine-In';
                if (!tableNumber && !isOpenBill) {
                    return res.status(400).json({ success: false, message: 'Table number is required for dine-in orders' });
                }
                break;
            case 'delivery':
                formattedOrderType = 'Delivery';
                if (!deliveryAddress) {
                    return res.status(400).json({ success: false, message: 'Delivery address is required' });
                }
                break;
            case 'pickup':
                formattedOrderType = 'Pickup';
                if (!pickupTime) {
                    return res.status(400).json({ success: false, message: 'Pickup time is required' });
                }
                break;
            case 'takeAway':
                formattedOrderType = 'Take Away';
                break;
            case 'reservation':
                formattedOrderType = 'Reservation';
                if (!reservationData && !isOpenBill) {
                    return res.status(400).json({ success: false, message: 'Reservation data required' });
                }
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid order type' });
        }

        /**
         * ========================================================================
         * SECTION 9G: ORDER STATUS DETERMINATION
         * ========================================================================
         * 
         * 🔵 GRO MODE:
         *    - Reservation → 'Reserved' (langsung dikonfirmasi)
         *    - Dine-in → 'OnProcess' (langsung diproses)
         *    - Open Bill → Follow existing status
         *    - Others → 'Pending'
         * 
         * 🟢 CUSTOMER MODE:
         *    - Semua order → 'Pending' (perlu confirmation dari staff)
         */
        let orderStatus = 'Pending';

        if (isGroMode) {
            // 🔵 GRO MODE STATUS LOGIC
            if (isOpenBill) {
                orderStatus = existingOrder ? existingOrder.status : 'OnProcess';
            } else if (orderType === 'reservation') {
                orderStatus = 'Reserved';
            } else if (orderType === 'dineIn') {
                orderStatus = 'OnProcess';
            } else {
                orderStatus = 'Pending';
            }
        }
        // 🟢 CUSTOMER MODE: status tetap 'Pending' (default value)

        /**
         * ========================================================================
         * SECTION 9H: CREATED_BY METADATA
         * ========================================================================
         * 
         * 🔵 GRO MODE: Isi dengan employee info
         * 🟢 CUSTOMER MODE: Kosong
         */
        const createdByData = isGroMode && groUser ? {
            employee_id: groUser._id,
            employee_name: groUser.username || 'Unknown GRO',
            created_at: new Date()
        } : {
            employee_id: null,
            employee_name: null,
            created_at: new Date()
        };

        /**
         * ========================================================================
         * SECTION 9I: PICKUP TIME PARSING
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * Convert pickup time string (HH:mm) ke Date object
         */
        let parsedPickupTime = null;
        if (orderType === 'pickup') {
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

        /**
         * ========================================================================
         * SECTION 9J: VOUCHER PROCESSING
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * Find dan apply voucher jika ada
         * Decrement quota voucher secara atomic
         */
        let voucherId = null;
        let voucherAmount = 0;
        let discountType = null;
        if (voucherCode) {
            const voucher = await Voucher.findOneAndUpdate(
                { code: voucherCode },
                { $inc: { quota: -1 } },
                { new: true }
            );
            if (voucher) {
                voucherId = voucher._id;
                voucherAmount = voucher.discountAmount;
                discountType = voucher.discountType;
            }
        }

        /**
         * ========================================================================
         * SECTION 9K: STOCK DEDUCTION (PHASE 2)
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * CRITICAL: Actual stock deduction dengan optimistic locking
         * Jika gagal, return error dan client harus retry
         */
        if (stockReservations.length > 0) {
            try {
                console.log('🔒 Deducting stock with optimistic locking...');
                stockDeductions = await deductStockWithLocking(stockReservations);
                console.log('✅ Stock deducted successfully:', {
                    itemsCount: stockDeductions.length,
                    totalDeducted: stockDeductions.reduce((sum, d) => sum + d.deductedQty, 0)
                });
            } catch (deductError) {
                console.error('❌ Stock deduction failed:', deductError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to deduct stock. Please try again.',
                    code: 'STOCK_DEDUCTION_FAILED'
                });
            }
        }

        /**
         * ========================================================================
         * SECTION 9L: ORDER ITEMS PROCESSING
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * Process setiap item:
         * - Calculate subtotal dengan addons & toppings
         * - Populate outlet info
         * - Format untuk disimpan di order
         */
        const orderItems = [];
        if (items && items.length > 0) {
            for (const item of items) {
                const menuItem = await MenuItem.findById(item.productId).populate('availableAt');
                if (!menuItem) {
                    // Rollback stock jika ada item yang tidak ditemukan
                    if (stockDeductions.length > 0) {
                        await rollbackStock(stockDeductions);
                    }
                    return res.status(404).json({
                        success: false,
                        message: `Menu item not found: ${item.productId}`
                    });
                }

                // Process addons
                const processedAddons = item.addons?.map(addon => ({
                    name: addon.name,
                    price: addon.price
                })) || [];

                // Process toppings
                const processedToppings = item.toppings?.map(topping => ({
                    name: topping.name,
                    price: topping.price
                })) || [];

                // Calculate item subtotal
                const addonsTotal = processedAddons.reduce((sum, addon) => sum + addon.price, 0);
                const toppingsTotal = processedToppings.reduce((sum, topping) => sum + topping.price, 0);
                const itemSubtotal = item.quantity * (menuItem.price + addonsTotal + toppingsTotal);

                orderItems.push({
                    menuItem: menuItem._id,
                    quantity: item.quantity,
                    subtotal: itemSubtotal,
                    addons: processedAddons,
                    toppings: processedToppings,
                    notes: item.notes || '',
                    outletId: menuItem.availableAt?.[0]?._id || null,
                    outletName: menuItem.availableAt?.[0]?.name || null,
                    isPrinted: false,
                    payment_id: null,
                });
            }
        }

        /**
         * ========================================================================
         * SECTION 9M: PRICE CALCULATION
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * Calculate:
         * - Subtotal (sum of all items)
         * - Tax & Service Fee
         * - Voucher discount
         * - Grand Total
         */
        let totalBeforeDiscount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

        // Special case: Open bill tanpa items
        if (isOpenBill && totalBeforeDiscount === 0 && orderItems.length === 0) {
            console.log('ℹ️ Open bill with no items');
        }

        // Special case: Reservation tanpa items (down payment 25k)
        if (orderType === 'reservation' && !isOpenBill && orderItems.length === 0) {
            totalBeforeDiscount = 25000;
        }

        // Calculate tax & service
        let taxServiceCalculation = {
            totalTax: 0,
            totalServiceFee: 0,
            taxAndServiceDetails: []
        };

        if (totalBeforeDiscount > 0) {
            taxServiceCalculation = await calculateTaxAndService(
                totalBeforeDiscount,
                outlet || "67cbc9560f025d897d69f889",
                orderType === 'reservation',
                isOpenBill
            );
        }

        // Apply voucher discount
        let totalAfterDiscount = totalBeforeDiscount;
        if (discountType === 'percentage') {
            totalAfterDiscount = totalBeforeDiscount - (totalBeforeDiscount * (voucherAmount / 100));
        } else if (discountType === 'fixed') {
            totalAfterDiscount = totalBeforeDiscount - voucherAmount;
            if (totalAfterDiscount < 0) totalAfterDiscount = 0;
        }

        // Calculate grand total
        const grandTotal = totalAfterDiscount + taxServiceCalculation.totalTax + taxServiceCalculation.totalServiceFee;

        let newOrder;

        /**
         * ========================================================================
         * SECTION 9N: ORDER CREATION - OPEN BILL FLOW
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * Menambahkan items ke existing order
         * Recalculate semua totals
         */
        if (isOpenBill && existingOrder) {
            console.log('📝 Adding items to existing open bill order');

            if (orderItems.length > 0) {
                // Add new items to existing order
                existingOrder.items.push(...orderItems);

                // Recalculate totals
                const newItemsTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
                const updatedTotalBeforeDiscount = existingOrder.totalBeforeDiscount + newItemsTotal;

                // Recalculate discount
                let updatedTotalAfterDiscount = updatedTotalBeforeDiscount;
                if (voucherId && discountType === 'percentage') {
                    updatedTotalAfterDiscount = updatedTotalBeforeDiscount - (updatedTotalBeforeDiscount * (voucherAmount / 100));
                } else if (voucherId && discountType === 'fixed') {
                    updatedTotalAfterDiscount = updatedTotalBeforeDiscount - voucherAmount;
                    if (updatedTotalAfterDiscount < 0) updatedTotalAfterDiscount = 0;
                }

                // Recalculate tax & service
                let updatedTaxCalculation = {
                    totalTax: 0,
                    totalServiceFee: 0,
                    taxAndServiceDetails: []
                };

                if (updatedTotalAfterDiscount > 0) {
                    updatedTaxCalculation = await calculateTaxAndService(
                        updatedTotalAfterDiscount,
                        outlet || "67cbc9560f025d897d69f889",
                        orderType === 'reservation',
                        true
                    );
                }

                // Update existing order totals
                existingOrder.totalBeforeDiscount = updatedTotalBeforeDiscount;
                existingOrder.totalAfterDiscount = updatedTotalAfterDiscount;
                existingOrder.totalTax = updatedTaxCalculation.totalTax;
                existingOrder.totalServiceFee = updatedTaxCalculation.totalServiceFee;
                existingOrder.taxAndServiceDetails = updatedTaxCalculation.taxAndServiceDetails;
                existingOrder.grandTotal = updatedTotalAfterDiscount + updatedTaxCalculation.totalTax + updatedTaxCalculation.totalServiceFee;

                // Apply voucher if provided
                if (voucherId) {
                    existingOrder.appliedVoucher = voucherId;
                    existingOrder.voucher = voucherId;
                }
            }

            // 🔵 Update GRO info jika belum ada
            if (isGroMode) {
                if (!existingOrder.groId) {
                    existingOrder.groId = groId;
                }
                if (!existingOrder.created_by?.employee_id) {
                    existingOrder.created_by = createdByData;
                }
                if (existingOrder.source !== 'Gro') {
                    existingOrder.source = 'Gro';
                }
            }

            await existingOrder.save();
            newOrder = existingOrder;
        }
        /**
         * ========================================================================
         * SECTION 9O: ORDER CREATION - NEW ORDER FLOW
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER (dengan values berbeda)
         * 
         * Membuat order baru
         * 
         * Perbedaan GRO vs Customer:
         * - user_id: 🟢 userId | 🔵 null
         * - user: 🟢 username (DB) | 🔵 userName (manual input)
         * - groId: 🟢 null | 🔵 groId
         * - status: 🟢 'Pending' | 🔵 'Reserved'/'OnProcess'
         * - source: 🟢 'App' | 🔵 'Gro'
         * - created_by: 🟢 empty | 🔵 employee info
         */
        else {
            const generatedOrderId = await generateOrderId(tableNumber || '');
            newOrder = new Order({
                order_id: generatedOrderId,
                user_id: finalUserId,              // 🟢 userId | 🔵 null
                user: finalUserName,                // 🟢 username | 🔵 manual input
                cashier: null,
                groId: isGroMode ? groId : null,    // 🔵 employee ID | 🟢 null
                items: orderItems,
                status: orderStatus,                // 🔵 Reserved/OnProcess | 🟢 Pending
                // paymentMethod: paymentDetails.method,
                orderType: formattedOrderType,
                deliveryAddress: deliveryAddress || '',
                tableNumber: tableNumber || '',
                pickupTime: parsedPickupTime,
                type: 'Indoor',
                voucher: voucherId,
                outlet: outlet && outlet !== "" ? outlet : "67cbc9560f025d897d69f889",
                totalBeforeDiscount,
                totalAfterDiscount,
                totalTax: taxServiceCalculation.totalTax,
                totalServiceFee: taxServiceCalculation.totalServiceFee,
                discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
                appliedPromos: [],
                appliedManualPromo: null,
                appliedVoucher: voucherId,
                taxAndServiceDetails: taxServiceCalculation.taxAndServiceDetails,
                grandTotal: grandTotal,
                promotions: [],
                source: isGroMode ? 'Gro' : 'App',  // 🔵 Gro | 🟢 App
                reservation: null,
                isOpenBill: false,
                created_by: createdByData,          // 🔵 employee info | 🟢 empty
            });

            try {
                await newOrder.save();
            } catch (saveError) {
                console.error('❌ Order save failed, rolling back stock:', saveError.message);
                // CRITICAL: Rollback stock jika save gagal
                if (stockDeductions.length > 0) {
                    await rollbackStock(stockDeductions);
                }
                throw saveError;
            }
        }

        /**
         * ========================================================================
         * SECTION 9P: ORDER VERIFICATION
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * Verify order tersimpan dengan benar di database
         */
        const savedOrder = await Order.findById(newOrder._id);
        console.log('✅ Verified saved order:', {
            orderId: savedOrder._id,
            order_id: savedOrder.order_id,
            status: savedOrder.status,
            source: savedOrder.source,
            totalTax: savedOrder.totalTax,
            grandTotal: savedOrder.grandTotal,
            itemsCount: savedOrder.items.length,
            stockDeducted: stockDeductions.length > 0
        });

        /**
         * ========================================================================
         * SECTION 9Q: RESERVATION CREATION
         * ========================================================================
         * Hanya untuk orderType = 'reservation'
         * 
         * 🔵 GRO MODE:
         *    - status: 'confirmed' (langsung dikonfirmasi oleh staff)
         *    - guest_number: Bisa diisi dari guestPhone
         * 
         * 🟢 CUSTOMER MODE:
         *    - status: 'pending' (perlu approval dari staff)
         *    - guest_number: null (diambil dari user profile)
         */
        let reservationRecord = null;
        if (orderType === 'reservation' && !isOpenBill) {
            try {
                // Parse reservation date
                let parsedReservationDate;

                if (reservationData.reservationDate) {
                    if (typeof reservationData.reservationDate === 'string') {
                        parsedReservationDate = reservationData.reservationDate.match(/Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember/)
                            ? parseIndonesianDate(reservationData.reservationDate)
                            : new Date(reservationData.reservationDate);
                    } else {
                        parsedReservationDate = new Date(reservationData.reservationDate);
                    }
                } else {
                    parsedReservationDate = new Date();
                }

                if (isNaN(parsedReservationDate.getTime())) {
                    await Order.findByIdAndDelete(newOrder._id);
                    if (stockDeductions.length > 0) {
                        await rollbackStock(stockDeductions);
                    }
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid reservation date format. Please use YYYY-MM-DD or standard date format.'
                    });
                }

                // Extract reservation data
                const servingType = reservationData.serving_type || 'ala carte';
                const equipment = Array.isArray(reservationData.equipment)
                    ? reservationData.equipment
                    : [];
                const agenda = reservationData.agenda || '';
                const foodServingOption = reservationData.food_serving_option || 'immediate';
                const foodServingTime = reservationData.food_serving_time
                    ? new Date(reservationData.food_serving_time)
                    : null;

                // 🔵 GRO: 'confirmed' | 🟢 CUSTOMER: 'pending'
                const reservationStatus = isGroMode ? 'confirmed' : 'pending';

                // Validate serving_type
                const validServingTypes = ['ala carte', 'buffet'];
                if (!validServingTypes.includes(servingType)) {
                    await Order.findByIdAndDelete(newOrder._id);
                    if (stockDeductions.length > 0) {
                        await rollbackStock(stockDeductions);
                    }
                    return res.status(400).json({
                        success: false,
                        message: `Invalid serving_type. Must be one of: ${validServingTypes.join(', ')}`
                    });
                }

                // Validate food_serving_option
                const validFoodServingOptions = ['immediate', 'scheduled'];
                if (!validFoodServingOptions.includes(foodServingOption)) {
                    await Order.findByIdAndDelete(newOrder._id);
                    if (stockDeductions.length > 0) {
                        await rollbackStock(stockDeductions);
                    }
                    return res.status(400).json({
                        success: false,
                        message: `Invalid food_serving_option. Must be one of: ${validFoodServingOptions.join(', ')}`
                    });
                }

                // Validate: scheduled requires food_serving_time
                if (foodServingOption === 'scheduled' && !foodServingTime) {
                    await Order.findByIdAndDelete(newOrder._id);
                    if (stockDeductions.length > 0) {
                        await rollbackStock(stockDeductions);
                    }
                    return res.status(400).json({
                        success: false,
                        message: 'food_serving_time is required when food_serving_option is scheduled'
                    });
                }

                console.log('📝 Creating reservation with complete data:', {
                    serving_type: servingType,
                    equipment_count: equipment.length,
                    equipment_items: equipment.join(', ') || 'none',
                    agenda: agenda || 'none',
                    food_serving_option: foodServingOption,
                    food_serving_time: foodServingTime ? foodServingTime.toISOString() : 'immediate',
                    status: reservationStatus,          // 🔵 confirmed | 🟢 pending
                    source: isGroMode ? 'GRO' : 'App'
                });

                // Create reservation record
                reservationRecord = new Reservation({
                    reservation_date: parsedReservationDate,
                    reservation_time: reservationData.reservationTime,
                    area_id: reservationData.areaIds,
                    table_id: reservationData.tableIds,
                    guest_count: reservationData.guestCount,
                    guest_number: isGroMode ? guestPhone : null,    // 🔵 manual input | 🟢 null
                    order_id: newOrder._id,
                    status: reservationStatus,                      // 🔵 confirmed | 🟢 pending
                    reservation_type: reservationType || 'nonBlocking',
                    notes: reservationData.notes || '',

                    // Reservation details
                    serving_type: servingType,
                    equipment: equipment,
                    agenda: agenda,
                    food_serving_option: foodServingOption,
                    food_serving_time: foodServingTime,

                    created_by: createdByData                       // 🔵 employee info | 🟢 empty
                });

                await reservationRecord.save();

                // Link reservation to order
                newOrder.reservation = reservationRecord._id;
                await newOrder.save();

                console.log('✅ Reservation created successfully:', {
                    reservationId: reservationRecord._id,
                    reservation_code: reservationRecord.reservation_code,
                    status: reservationRecord.status,
                    serving_type: reservationRecord.serving_type,
                    equipment_count: reservationRecord.equipment.length,
                    equipment_list: reservationRecord.equipment.join(', ') || 'none',
                    agenda: reservationRecord.agenda || 'none',
                    food_serving_option: reservationRecord.food_serving_option,
                    food_serving_time: reservationRecord.food_serving_time
                        ? reservationRecord.food_serving_time.toISOString()
                        : 'immediate',
                    guest_count: reservationRecord.guest_count,
                    createdBy: createdByData.employee_name || 'App User',
                    isGroMode: isGroMode
                });
            } catch (reservationError) {
                console.error('❌ Reservation creation failed:', reservationError.message);
                await Order.findByIdAndDelete(newOrder._id);
                if (stockDeductions.length > 0) {
                    await rollbackStock(stockDeductions);
                }
                return res.status(500).json({
                    success: false,
                    message: 'Error creating reservation',
                    error: reservationError.message
                });
            }
        }

        /**
         * ========================================================================
         * SECTION 9R: RESPONSE PREPARATION
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         */
        const responseData = {
            success: true,
            message: isOpenBill ?
                'Items added to existing order successfully' :
                `${orderType === 'reservation' ? 'Reservation' : 'Order'} created successfully`,
            order: newOrder,
            isOpenBill: isOpenBill || false,
            existingReservation: isOpenBill ? existingReservation : null,
            stockDeductions: stockDeductions.map(d => ({
                menuItemName: d.menuItemName,
                deductedQty: d.deductedQty,
                newStock: d.newStock
            }))
        };

        if (reservationRecord) {
            responseData.reservation = reservationRecord;
        }

        /**
         * ========================================================================
         * SECTION 9S: FRONTEND MAPPING
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * Map order data ke format yang expected oleh frontend/cashier app
         */
        const mappedOrders = {
            _id: newOrder._id,
            userId: newOrder.user_id,
            customerName: newOrder.user,
            cashierId: newOrder.cashier,
            groId: newOrder.groId,                          // 🔵 employee ID | 🟢 null
            items: newOrder.items.map(item => ({
                _id: item._id,
                quantity: item.quantity,
                subtotal: item.subtotal,
                isPrinted: item.isPrinted,
                menuItem: {
                    ...item.menuItem,
                    categories: item.menuItem.category,
                },
                selectedAddons: item.addons.length > 0 ? item.addons.map(addon => ({
                    name: addon.name,
                    _id: addon._id,
                    options: [{
                        id: addon._id,
                        label: addon.label || addon.name,
                        price: addon.price
                    }]
                })) : [],
                selectedToppings: item.toppings.length > 0 ? item.toppings.map(topping => ({
                    id: topping._id || topping.id,
                    name: topping.name,
                    price: topping.price
                })) : []
            })),
            status: newOrder.status,                        // 🔵 Reserved/OnProcess | 🟢 Pending
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
            source: newOrder.source,                        // 🔵 'Gro' | 🟢 'App'
            created_by: newOrder.created_by,                // 🔵 employee info | 🟢 empty
            createdAt: newOrder.createdAt,
            updatedAt: newOrder.updatedAt,
            __v: newOrder.__v,
            isOpenBill: isOpenBill || false
        };

        /**
         * ========================================================================
         * SECTION 9T: REAL-TIME NOTIFICATION
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * Emit order ke cashier application via Socket.IO
         */
        if (isOpenBill) {
            io.to('cashier_room').emit('open_bill_order', {
                mappedOrders,
                originalReservation: existingReservation,
                message: 'Additional items added to existing reservation'
            });
        } else {
            io.to('cashier_room').emit('new_order', { mappedOrders });
        }

        console.log('✅ Order created successfully with stock protection');
        res.status(201).json(responseData);

    } catch (error) {
        console.error('❌ Error in createAppOrder:', error);

        /**
         * ========================================================================
         * SECTION 9U: ERROR HANDLING & ROLLBACK (PHASE 3)
         * ========================================================================
         * SHARED: 🔵 GRO & 🟢 CUSTOMER
         * 
         * CRITICAL: Rollback stock jika terjadi error setelah deduction
         */
        if (stockDeductions.length > 0) {
            console.log('🔄 Error occurred, rolling back stock deductions...');
            await rollbackStock(stockDeductions);
        }

        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message,
            code: 'ORDER_CREATION_FAILED'
        });
    }
};

/**
 * ==================================================================================
 * FLOW SUMMARY & COMPARISON
 * ==================================================================================
 *
 * 📊 COMPARISON TABLE: GRO MODE vs CUSTOMER MODE
 * ==================================================================================
 *
 * | Aspect              | 🔵 GRO MODE                | 🟢 CUSTOMER MODE           |
 * |---------------------|----------------------------|----------------------------|
 * | Authentication      | groId (employee)           | userId (customer)          |
 * | Customer Info       | Manual input (userName)    | From DB (username)         |
 * | Customer Required   | No (bisa guest)            | Yes (harus register)       |
 * | Order Status        | Reserved/OnProcess/Pending | Pending                    |
 * | Reservation Status  | confirmed                  | pending                    |
 * | Source Field        | 'Gro'                      | 'App'                      |
 * | created_by          | Employee info filled       | Empty                      |
 * | groId Field         | Employee ID                | null                       |
 * | user_id Field       | null (guest)               | Customer user ID           |
 * | guest_number        | Can be filled manually     | null                       |
 *
 *
 * 🔄 SHARED FLOWS (Both GRO & Customer)
 * ==================================================================================
 *
 * 1. STOCK MANAGEMENT (3-Phase):
 *    Phase 1: Validate & Reserve    → validateAndReserveStock()
 *    Phase 2: Deduct with Locking   → deductStockWithLocking()
 *    Phase 3: Rollback on Failure   → rollbackStock()
 *
 * 2. PRICE CALCULATION:
 *    - Item subtotals (base price + addons + toppings)
 *    - Tax calculation (PPN)
 *    - Service fee calculation
 *    - Voucher discount (percentage or fixed)
 *    - Grand total
 *
 * 3. OPEN BILL HANDLING:
 *    - Search existing order (4 methods)
 *    - Add items to existing order
 *    - Recalculate all totals
 *
 * 4. ORDER TYPES:
 *    - Dine-In (requires tableNumber)
 *    - Delivery (requires deliveryAddress)
 *    - Pickup (requires pickupTime)
 *    - Take Away
 *    - Reservation (requires reservationData)
 *
 * 5. NOTIFICATIONS:
 *    - Socket.IO emit to cashier_room
 *    - Real-time updates
 *
 *
 * 🎯 USE CASES
 * ==================================================================================
 *
 * 🔵 GRO MODE Use Cases:
 * ----------------------
 * 1. Walk-in customer (guest tanpa account)
 *    - Staff langsung input nama customer
 *    - Order langsung OnProcess
 *
 * 2. Phone reservation
 *    - Staff input data customer via phone
 *    - Reservation langsung confirmed
 *
 * 3. Table service
 *    - Staff create order untuk meja tertentu
 *    - Open bill: tambah item ke order yang ada
 *
 * 4. Event/Party booking
 *    - Staff handle large reservation
 *    - Input equipment, agenda, serving type
 *
 *
 * 🟢 CUSTOMER MODE Use Cases:
 * ---------------------------
 * 1. Mobile app order
 *    - Customer browse menu dan order sendiri
 *    - Order perlu konfirmasi staff
 *
 * 2. Online reservation
 *    - Customer booking table via app
 *    - Perlu approval dari staff
 *
 * 3. Pre-order for pickup
 *    - Customer order ahead
 *    - Pilih waktu pickup
 *
 * 4. Delivery order
 *    - Customer order untuk dikirim
 *    - Input alamat lengkap
 *
 *
 * ⚠️ CRITICAL POINTS
 * ==================================================================================
 *
 * 1. STOCK MANAGEMENT:
 *    - ALWAYS validate before

// import Payment from '../models/Payment.model.js';
// import { MenuItem } from "../models/MenuItem.model.js";
// import { Order } from "../models/order.model.js";
// import User from "../models/user.model.js";
// import Voucher from "../models/voucher.model.js";
// import mongoose from 'mongoose';
// import { io } from '../index.js';
// import Reservation from '../models/Reservation.model.js';
// import { TaxAndService } from '../models/TaxAndService.model.js';
// import { db } from '../utils/mongo.js';
// import MenuStock from '../models/modul_menu/MenuStock.model.js';

// /**
//  * ✅ OPTIMISTIC LOCKING CONSTANTS
//  */
// const MAX_RETRY_ATTEMPTS = 3;
// const RETRY_DELAY_MS = 100;

// /**
//  * ✅ Helper: Retry dengan exponential backoff
//  */
// const retryWithBackoff = async (fn, maxRetries = MAX_RETRY_ATTEMPTS) => {
//     let lastError;

//     for (let attempt = 1; attempt <= maxRetries; attempt++) {
//         try {
//             return await fn();
//         } catch (error) {
//             lastError = error;

//             if (!error.message?.includes('version') &&
//                 !error.message?.includes('No matching document found') &&
//                 !error.message?.includes('Stock conflict')) {
//                 throw error;
//             }

//             if (attempt < maxRetries) {
//                 const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
//                 console.log(`⚠️ Conflict detected, retry ${attempt}/${maxRetries} after ${delay}ms...`);
//                 await new Promise(resolve => setTimeout(resolve, delay));
//             }
//         }
//     }

//     throw lastError;
// };

// /**
//  * ✅ CRITICAL: Validate dan reserve stock dengan optimistic locking
//  */
// const validateAndReserveStock = async (items) => {
//     const stockReservations = [];
//     const session = await mongoose.startSession();

//     try {
//         await session.startTransaction();

//         for (const item of items) {
//             const menuItem = await MenuItem.findById(item.productId)
//                 .session(session)
//                 .select('_id name price availableStock isActive __v');

//             if (!menuItem) {
//                 throw new Error(`Menu item not found: ${item.productId}`);
//             }

//             if (!menuItem.isActive) {
//                 throw new Error(`Menu item "${menuItem.name}" is not available`);
//             }

//             const menuStock = await MenuStock.findOne({ menuItemId: menuItem._id })
//                 .session(session)
//                 .select('currentStock manualStock calculatedStock __v');

//             if (!menuStock) {
//                 throw new Error(`Stock data not found for "${menuItem.name}"`);
//             }

//             const effectiveStock = menuStock.manualStock !== null
//                 ? menuStock.manualStock
//                 : menuStock.calculatedStock;

//             if (effectiveStock < item.quantity) {
//                 throw new Error(
//                     `Insufficient stock for "${menuItem.name}". Available: ${effectiveStock}, Requested: ${item.quantity}`
//                 );
//             }

//             stockReservations.push({
//                 menuItemId: menuItem._id,
//                 menuItemName: menuItem.name,
//                 menuItemVersion: menuItem.__v,
//                 menuStockId: menuStock._id,
//                 menuStockVersion: menuStock.__v,
//                 requestedQty: item.quantity,
//                 currentStock: effectiveStock,
//                 isManualStock: menuStock.manualStock !== null
//             });
//         }

//         await session.commitTransaction();
//         return stockReservations;

//     } catch (error) {
//         await session.abortTransaction();
//         throw error;
//     } finally {
//         session.endSession();
//     }
// };

// /**
//  * ✅ CRITICAL: Deduct stock dengan optimistic locking
//  */
// const deductStockWithLocking = async (stockReservations) => {
//     const deductionResults = [];

//     for (const reservation of stockReservations) {
//         const result = await retryWithBackoff(async () => {
//             const updatedStock = await MenuStock.findOneAndUpdate(
//                 {
//                     _id: reservation.menuStockId,
//                     __v: reservation.menuStockVersion
//                 },
//                 {
//                     $inc: {
//                         currentStock: -reservation.requestedQty,
//                         ...(reservation.isManualStock
//                             ? { manualStock: -reservation.requestedQty }
//                             : { calculatedStock: -reservation.requestedQty }
//                         ),
//                         __v: 1
//                     }
//                 },
//                 { new: true }
//             );

//             if (!updatedStock) {
//                 throw new Error(
//                     `Stock conflict for "${reservation.menuItemName}". Please retry.`
//                 );
//             }

//             const updatedMenuItem = await MenuItem.findOneAndUpdate(
//                 {
//                     _id: reservation.menuItemId,
//                     __v: reservation.menuItemVersion
//                 },
//                 {
//                     $inc: {
//                         availableStock: -reservation.requestedQty,
//                         __v: 1
//                     }
//                 },
//                 { new: true }
//             );

//             if (!updatedMenuItem) {
//                 await MenuStock.findByIdAndUpdate(
//                     reservation.menuStockId,
//                     {
//                         $inc: {
//                             currentStock: reservation.requestedQty,
//                             ...(reservation.isManualStock
//                                 ? { manualStock: reservation.requestedQty }
//                                 : { calculatedStock: reservation.requestedQty }
//                             )
//                         }
//                     }
//                 );
//                 throw new Error(
//                     `MenuItem update conflict for "${reservation.menuItemName}". Please retry.`
//                 );
//             }

//             return {
//                 menuItemId: reservation.menuItemId,
//                 menuItemName: reservation.menuItemName,
//                 deductedQty: reservation.requestedQty,
//                 newStock: updatedStock.currentStock,
//                 success: true
//             };
//         });

//         deductionResults.push(result);

//         if (result.newStock <= 0) {
//             await MenuItem.findByIdAndUpdate(
//                 reservation.menuItemId,
//                 { isActive: false }
//             );
//             console.log(`🔴 Auto-deactivated "${result.menuItemName}" - stock depleted`);
//         }
//     }

//     return deductionResults;
// };

// /**
//  * ✅ CRITICAL: Rollback stock jika order gagal
//  */
// const rollbackStock = async (deductionResults) => {
//     console.log('🔄 Rolling back stock deductions...');

//     for (const result of deductionResults) {
//         if (result.success) {
//             try {
//                 await MenuStock.findOneAndUpdate(
//                     { menuItemId: result.menuItemId },
//                     {
//                         $inc: {
//                             currentStock: result.deductedQty,
//                             calculatedStock: result.deductedQty
//                         }
//                     }
//                 );

//                 await MenuItem.findByIdAndUpdate(
//                     result.menuItemId,
//                     {
//                         $inc: { availableStock: result.deductedQty }
//                     }
//                 );

//                 console.log(`✅ Rolled back ${result.deductedQty} units for "${result.menuItemName}"`);
//             } catch (error) {
//                 console.error(`❌ Rollback failed for "${result.menuItemName}":`, error.message);
//             }
//         }
//     }
// };

// const calculateTaxAndService = async (subtotal, outlet, isReservation, isOpenBill) => {
//     try {
//         const taxAndServices = await TaxAndService.find({
//             isActive: true,
//             appliesToOutlets: outlet
//         });

//         let totalTax = 0;
//         let totalServiceFee = 0;
//         const taxAndServiceDetails = [];

//         for (const item of taxAndServices) {
//             if (item.type === 'tax') {
//                 if (item.name.toLowerCase().includes('ppn') || item.name.toLowerCase() === 'tax') {
//                     const amount = subtotal * (item.percentage / 100);
//                     totalTax += amount;
//                     taxAndServiceDetails.push({
//                         id: item._id,
//                         name: item.name,
//                         type: item.type,
//                         percentage: item.percentage,
//                         amount: amount
//                     });
//                 }
//             } else if (item.type === 'service') {
//                 const amount = subtotal * (item.percentage / 100);
//                 totalServiceFee += amount;
//                 taxAndServiceDetails.push({
//                     id: item._id,
//                     name: item.name,
//                     type: item.type,
//                     percentage: item.percentage,
//                     amount: amount
//                 });
//             }
//         }

//         return {
//             totalTax,
//             totalServiceFee,
//             taxAndServiceDetails
//         };
//     } catch (error) {
//         console.error('Error calculating tax and service:', error);
//         return {
//             totalTax: 0,
//             totalServiceFee: 0,
//             taxAndServiceDetails: []
//         };
//     }
// };

// export async function generateOrderId(tableNumber) {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const dateStr = `${year}${month}${day}`;

//     let tableOrDayCode = tableNumber;
//     if (!tableNumber) {
//         const days = ['MD', 'TU', 'WD', 'TH', 'FR', 'ST', 'SN'];
//         const dayCode = days[now.getDay()];
//         tableOrDayCode = `${dayCode}${day}`;
//     }

//     const key = `order_seq_${tableOrDayCode}_${dateStr}`;

//     const result = await db.collection('counters').findOneAndUpdate(
//         { _id: key },
//         { $inc: { seq: 1 } },
//         { upsert: true, returnDocument: 'after' }
//     );

//     const seq = result.value.seq;
//     return `ORD-${day}${tableOrDayCode}-${String(seq).padStart(3, '0')}`;
// }

// function parseIndonesianDate(dateString) {
//     const monthMap = {
//         'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
//         'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
//         'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
//     };

//     const parts = dateString.trim().split(' ');
//     if (parts.length === 3) {
//         const day = parts[0].padStart(2, '0');
//         const month = monthMap[parts[1]];
//         const year = parts[2];
//         if (month) {
//             return new Date(`${year}-${month}-${day}`);
//         }
//     }
//     return new Date(dateString);
// }

// export const createAppOrder = async (req, res) => {
//     let stockDeductions = [];

//     try {
//         const {
//             items,
//             orderType,
//             tableNumber,
//             deliveryAddress,
//             pickupTime,
//             paymentDetails,
//             voucherCode,
//             userId,
//             outlet,
//             reservationData,
//             reservationType,
//             isOpenBill,
//             openBillData,
//             taxDetails,
//             totalTax,
//             subtotal: frontendSubtotal,
//             discount: frontendDiscount,
//             isGroMode,
//             groId,
//             userName,
//             guestPhone,
//         } = req.body;

//         console.log('🔒 Secure createAppOrder request:', {
//             isGroMode,
//             groId,
//             userName,
//             userId,
//             isOpenBill,
//             orderType,
//             itemsCount: items ? items.length : 0
//         });

//         // ✅ Validasi items
//         const shouldSkipItemValidation =
//             (orderType === 'reservation' && !isOpenBill) ||
//             (orderType === 'reservation' && isOpenBill) ||
//             isOpenBill;

//         if ((!items || items.length === 0) && !shouldSkipItemValidation) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Order must contain at least one item'
//             });
//         }

//         if (!isOpenBill && !orderType) {
//             return res.status(400).json({ success: false, message: 'Order type is required' });
//         }

//         if (!paymentDetails?.method) {
//             return res.status(400).json({ success: false, message: 'Payment method is required' });
//         }

//         // ✅ Validasi user
//         let userExists = null;
//         let finalUserId = null;
//         let finalUserName = userName || 'Guest';
//         let groUser = null;

//         if (isGroMode) {
//             if (!groId) {
//                 return res.status(400).json({ success: false, message: 'GRO ID is required for GRO mode' });
//             }

//             groUser = await User.findById(groId);
//             if (!groUser) {
//                 return res.status(404).json({ success: false, message: 'GRO not found' });
//             }

//             finalUserId = null;
//             finalUserName = userName || 'Guest';
//         } else {
//             if (!userId) {
//                 return res.status(400).json({ success: false, message: 'User ID is required' });
//             }

//             userExists = await User.findById(userId);
//             if (!userExists) {
//                 return res.status(404).json({ success: false, message: 'User not found' });
//             }

//             finalUserId = userId;
//             finalUserName = userExists.username || 'Guest';
//         }

//         // ✅ CRITICAL: Validate and reserve stock BEFORE creating order
//         let stockReservations = [];
//         if (items && items.length > 0 && !shouldSkipItemValidation) {
//             try {
//                 console.log('🔒 Validating and reserving stock...');
//                 stockReservations = await validateAndReserveStock(items);
//                 console.log('✅ Stock validation passed:', {
//                     itemsCount: stockReservations.length,
//                     totalRequested: stockReservations.reduce((sum, r) => sum + r.requestedQty, 0)
//                 });
//             } catch (stockError) {
//                 console.error('❌ Stock validation failed:', stockError.message);
//                 return res.status(400).json({
//                     success: false,
//                     message: stockError.message,
//                     code: 'INSUFFICIENT_STOCK'
//                 });
//             }
//         }

//         // ✅ Enhanced existing order search untuk open bill
//         let existingOrder = null;
//         let existingReservation = null;

//         if (isOpenBill && openBillData) {
//             console.log('🔍 Enhanced Open Bill Search:', {
//                 reservationId: openBillData.reservationId,
//                 tableNumbers: openBillData.tableNumbers
//             });

//             existingOrder = await Order.findOne({ order_id: openBillData.reservationId });

//             if (!existingOrder) {
//                 try {
//                     existingOrder = await Order.findById(openBillData.reservationId);
//                 } catch (idError) {
//                     console.log('🔍 Invalid ObjectId format');
//                 }
//             }

//             if (!existingOrder) {
//                 existingReservation = await Reservation.findById(openBillData.reservationId);
//                 if (existingReservation && existingReservation.order_id) {
//                     existingOrder = await Order.findById(existingReservation.order_id);
//                 }
//             }

//             if (!existingOrder && openBillData.tableNumbers) {
//                 existingOrder = await Order.findOne({
//                     tableNumber: openBillData.tableNumbers,
//                     isOpenBill: true,
//                     status: { $in: ['OnProcess', 'Reserved'] }
//                 }).sort({ createdAt: -1 });
//             }

//             if (!existingOrder) {
//                 console.log('⚠️ Creating new order for open bill...');

//                 const generatedOrderId = await generateOrderId(openBillData.tableNumbers || tableNumber || 'OPENBILL');

//                 const createdByData = isGroMode && groUser ? {
//                     employee_id: groUser._id,
//                     employee_name: groUser.username || 'Unknown GRO',
//                     created_at: new Date()
//                 } : {
//                     employee_id: null,
//                     employee_name: null,
//                     created_at: new Date()
//                 };

//                 existingOrder = new Order({
//                     order_id: generatedOrderId,
//                     user_id: finalUserId,
//                     user: finalUserName,
//                     groId: isGroMode ? groId : null,
//                     items: [],
//                     status: 'OnProcess',
//                     paymentMethod: paymentDetails.method || 'Cash',
//                     orderType: 'Reservation',
//                     deliveryAddress: deliveryAddress || '',
//                     tableNumber: openBillData.tableNumbers || tableNumber || '',
//                     type: 'Indoor',
//                     isOpenBill: true,
//                     outlet: outlet && outlet !== "" ? outlet : "67cbc9560f025d897d69f889",
//                     totalBeforeDiscount: 0,
//                     totalAfterDiscount: 0,
//                     totalTax: 0,
//                     totalServiceFee: 0,
//                     discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
//                     appliedPromos: [],
//                     appliedManualPromo: null,
//                     appliedVoucher: null,
//                     taxAndServiceDetails: [],
//                     grandTotal: 0,
//                     promotions: [],
//                     source: isGroMode ? 'Gro' : 'App',
//                     created_by: createdByData,
//                 });

//                 await existingOrder.save();

//                 if (existingReservation && !existingReservation.order_id) {
//                     existingReservation.order_id = existingOrder._id;
//                     await existingReservation.save();
//                 }
//             }
//         }

//         // ✅ Format orderType
//         let formattedOrderType = '';
//         switch (orderType) {
//             case 'dineIn':
//                 formattedOrderType = 'Dine-In';
//                 if (!tableNumber && !isOpenBill) {
//                     return res.status(400).json({ success: false, message: 'Table number is required for dine-in orders' });
//                 }
//                 break;
//             case 'delivery':
//                 formattedOrderType = 'Delivery';
//                 if (!deliveryAddress) {
//                     return res.status(400).json({ success: false, message: 'Delivery address is required' });
//                 }
//                 break;
//             case 'pickup':
//                 formattedOrderType = 'Pickup';
//                 if (!pickupTime) {
//                     return res.status(400).json({ success: false, message: 'Pickup time is required' });
//                 }
//                 break;
//             case 'takeAway':
//                 formattedOrderType = 'Take Away';
//                 break;
//             case 'reservation':
//                 formattedOrderType = 'Reservation';
//                 if (!reservationData && !isOpenBill) {
//                     return res.status(400).json({ success: false, message: 'Reservation data required' });
//                 }
//                 break;
//             default:
//                 return res.status(400).json({ success: false, message: 'Invalid order type' });
//         }

//         // ✅ Tentukan status order
//         let orderStatus = 'Pending';

//         if (isGroMode) {
//             if (isOpenBill) {
//                 orderStatus = existingOrder ? existingOrder.status : 'OnProcess';
//             } else if (orderType === 'reservation') {
//                 orderStatus = 'Reserved';
//             } else if (orderType === 'dineIn') {
//                 orderStatus = 'OnProcess';
//             } else {
//                 orderStatus = 'Pending';
//             }
//         }

//         const createdByData = isGroMode && groUser ? {
//             employee_id: groUser._id,
//             employee_name: groUser.username || 'Unknown GRO',
//             created_at: new Date()
//         } : {
//             employee_id: null,
//             employee_name: null,
//             created_at: new Date()
//         };

//         // ✅ Handle pickup time
//         let parsedPickupTime = null;
//         if (orderType === 'pickup') {
//             const [hours, minutes] = pickupTime.split(':').map(Number);
//             const now = new Date();
//             parsedPickupTime = new Date(
//                 now.getFullYear(),
//                 now.getMonth(),
//                 now.getDate(),
//                 hours,
//                 minutes
//             );
//         }

//         // ✅ Find voucher
//         let voucherId = null;
//         let voucherAmount = 0;
//         let discountType = null;
//         if (voucherCode) {
//             const voucher = await Voucher.findOneAndUpdate(
//                 { code: voucherCode },
//                 { $inc: { quota: -1 } },
//                 { new: true }
//             );
//             if (voucher) {
//                 voucherId = voucher._id;
//                 voucherAmount = voucher.discountAmount;
//                 discountType = voucher.discountType;
//             }
//         }

//         // ✅ CRITICAL: Deduct stock setelah validasi berhasil
//         if (stockReservations.length > 0) {
//             try {
//                 console.log('🔒 Deducting stock with optimistic locking...');
//                 stockDeductions = await deductStockWithLocking(stockReservations);
//                 console.log('✅ Stock deducted successfully:', {
//                     itemsCount: stockDeductions.length,
//                     totalDeducted: stockDeductions.reduce((sum, d) => sum + d.deductedQty, 0)
//                 });
//             } catch (deductError) {
//                 console.error('❌ Stock deduction failed:', deductError.message);
//                 return res.status(500).json({
//                     success: false,
//                     message: 'Failed to deduct stock. Please try again.',
//                     code: 'STOCK_DEDUCTION_FAILED'
//                 });
//             }
//         }

//         // ✅ Process items
//         const orderItems = [];
//         if (items && items.length > 0) {
//             for (const item of items) {
//                 const menuItem = await MenuItem.findById(item.productId).populate('availableAt');
//                 if (!menuItem) {
//                     if (stockDeductions.length > 0) {
//                         await rollbackStock(stockDeductions);
//                     }
//                     return res.status(404).json({
//                         success: false,
//                         message: `Menu item not found: ${item.productId}`
//                     });
//                 }

//                 const processedAddons = item.addons?.map(addon => ({
//                     name: addon.name,
//                     price: addon.price
//                 })) || [];

//                 const processedToppings = item.toppings?.map(topping => ({
//                     name: topping.name,
//                     price: topping.price
//                 })) || [];

//                 const addonsTotal = processedAddons.reduce((sum, addon) => sum + addon.price, 0);
//                 const toppingsTotal = processedToppings.reduce((sum, topping) => sum + topping.price, 0);
//                 const itemSubtotal = item.quantity * (menuItem.price + addonsTotal + toppingsTotal);

//                 orderItems.push({
//                     menuItem: menuItem._id,
//                     quantity: item.quantity,
//                     subtotal: itemSubtotal,
//                     addons: processedAddons,
//                     toppings: processedToppings,
//                     notes: item.notes || '',
//                     outletId: menuItem.availableAt?.[0]?._id || null,
//                     outletName: menuItem.availableAt?.[0]?.name || null,
//                     isPrinted: false,
//                     payment_id: null,
//                 });
//             }
//         }

//         // ✅ Calculate totals
//         let totalBeforeDiscount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

//         if (isOpenBill && totalBeforeDiscount === 0 && orderItems.length === 0) {
//             console.log('ℹ️ Open bill with no items');
//         }

//         if (orderType === 'reservation' && !isOpenBill && orderItems.length === 0) {
//             totalBeforeDiscount = 25000;
//         }

//         let taxServiceCalculation = {
//             totalTax: 0,
//             totalServiceFee: 0,
//             taxAndServiceDetails: []
//         };

//         if (totalBeforeDiscount > 0) {
//             taxServiceCalculation = await calculateTaxAndService(
//                 totalBeforeDiscount,
//                 outlet || "67cbc9560f025d897d69f889",
//                 orderType === 'reservation',
//                 isOpenBill
//             );
//         }

//         let totalAfterDiscount = totalBeforeDiscount;
//         if (discountType === 'percentage') {
//             totalAfterDiscount = totalBeforeDiscount - (totalBeforeDiscount * (voucherAmount / 100));
//         } else if (discountType === 'fixed') {
//             totalAfterDiscount = totalBeforeDiscount - voucherAmount;
//             if (totalAfterDiscount < 0) totalAfterDiscount = 0;
//         }

//         const grandTotal = totalAfterDiscount + taxServiceCalculation.totalTax + taxServiceCalculation.totalServiceFee;

//         let newOrder;

//         // ✅ Handle Open Bill scenario
//         if (isOpenBill && existingOrder) {
//             console.log('📝 Adding items to existing open bill order');

//             if (orderItems.length > 0) {
//                 existingOrder.items.push(...orderItems);

//                 const newItemsTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
//                 const updatedTotalBeforeDiscount = existingOrder.totalBeforeDiscount + newItemsTotal;

//                 let updatedTotalAfterDiscount = updatedTotalBeforeDiscount;
//                 if (voucherId && discountType === 'percentage') {
//                     updatedTotalAfterDiscount = updatedTotalBeforeDiscount - (updatedTotalBeforeDiscount * (voucherAmount / 100));
//                 } else if (voucherId && discountType === 'fixed') {
//                     updatedTotalAfterDiscount = updatedTotalBeforeDiscount - voucherAmount;
//                     if (updatedTotalAfterDiscount < 0) updatedTotalAfterDiscount = 0;
//                 }

//                 let updatedTaxCalculation = {
//                     totalTax: 0,
//                     totalServiceFee: 0,
//                     taxAndServiceDetails: []
//                 };

//                 if (updatedTotalAfterDiscount > 0) {
//                     updatedTaxCalculation = await calculateTaxAndService(
//                         updatedTotalAfterDiscount,
//                         outlet || "67cbc9560f025d897d69f889",
//                         orderType === 'reservation',
//                         true
//                     );
//                 }

//                 existingOrder.totalBeforeDiscount = updatedTotalBeforeDiscount;
//                 existingOrder.totalAfterDiscount = updatedTotalAfterDiscount;
//                 existingOrder.totalTax = updatedTaxCalculation.totalTax;
//                 existingOrder.totalServiceFee = updatedTaxCalculation.totalServiceFee;
//                 existingOrder.taxAndServiceDetails = updatedTaxCalculation.taxAndServiceDetails;
//                 existingOrder.grandTotal = updatedTotalAfterDiscount + updatedTaxCalculation.totalTax + updatedTaxCalculation.totalServiceFee;

//                 if (voucherId) {
//                     existingOrder.appliedVoucher = voucherId;
//                     existingOrder.voucher = voucherId;
//                 }
//             }

//             if (isGroMode) {
//                 if (!existingOrder.groId) {
//                     existingOrder.groId = groId;
//                 }
//                 if (!existingOrder.created_by?.employee_id) {
//                     existingOrder.created_by = createdByData;
//                 }
//                 if (existingOrder.source !== 'Gro') {
//                     existingOrder.source = 'Gro';
//                 }
//             }

//             await existingOrder.save();
//             newOrder = existingOrder;
//         }
//         else {
//             // ✅ Normal order creation
//             const generatedOrderId = await generateOrderId(tableNumber || '');
//             newOrder = new Order({
//                 order_id: generatedOrderId,
//                 user_id: finalUserId,
//                 user: finalUserName,
//                 cashier: null,
//                 groId: isGroMode ? groId : null,
//                 items: orderItems,
//                 status: orderStatus,
//                 paymentMethod: paymentDetails.method,
//                 orderType: formattedOrderType,
//                 deliveryAddress: deliveryAddress || '',
//                 tableNumber: tableNumber || '',
//                 pickupTime: parsedPickupTime,
//                 type: 'Indoor',
//                 voucher: voucherId,
//                 outlet: outlet && outlet !== "" ? outlet : "67cbc9560f025d897d69f889",
//                 totalBeforeDiscount,
//                 totalAfterDiscount,
//                 totalTax: taxServiceCalculation.totalTax,
//                 totalServiceFee: taxServiceCalculation.totalServiceFee,
//                 discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
//                 appliedPromos: [],
//                 appliedManualPromo: null,
//                 appliedVoucher: voucherId,
//                 taxAndServiceDetails: taxServiceCalculation.taxAndServiceDetails,
//                 grandTotal: grandTotal,
//                 promotions: [],
//                 source: isGroMode ? 'Gro' : 'App',
//                 reservation: null,
//                 isOpenBill: false,
//                 created_by: createdByData,
//             });

//             try {
//                 await newOrder.save();
//             } catch (saveError) {
//                 console.error('❌ Order save failed, rolling back stock:', saveError.message);
//                 if (stockDeductions.length > 0) {
//                     await rollbackStock(stockDeductions);
//                 }
//                 throw saveError;
//             }
//         }

//         // ✅ Verify order was saved
//         const savedOrder = await Order.findById(newOrder._id);
//         console.log('✅ Verified saved order:', {
//             orderId: savedOrder._id,
//             order_id: savedOrder.order_id,
//             status: savedOrder.status,
//             source: savedOrder.source,
//             totalTax: savedOrder.totalTax,
//             grandTotal: savedOrder.grandTotal,
//             itemsCount: savedOrder.items.length,
//             stockDeducted: stockDeductions.length > 0
//         });

//         // ✅ Reservation creation
//         // ✅ Reservation creation
//         let reservationRecord = null;
//         if (orderType === 'reservation' && !isOpenBill) {
//             try {
//                 let parsedReservationDate;

//                 if (reservationData.reservationDate) {
//                     if (typeof reservationData.reservationDate === 'string') {
//                         parsedReservationDate = reservationData.reservationDate.match(/Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember/)
//                             ? parseIndonesianDate(reservationData.reservationDate)
//                             : new Date(reservationData.reservationDate);
//                     } else {
//                         parsedReservationDate = new Date(reservationData.reservationDate);
//                     }
//                 } else {
//                     parsedReservationDate = new Date();
//                 }

//                 if (isNaN(parsedReservationDate.getTime())) {
//                     await Order.findByIdAndDelete(newOrder._id);
//                     if (stockDeductions.length > 0) {
//                         await rollbackStock(stockDeductions);
//                     }
//                     return res.status(400).json({
//                         success: false,
//                         message: 'Invalid reservation date format. Please use YYYY-MM-DD or standard date format.'
//                     });
//                 }

//                 // ✅ Extract data baru dari reservationData
//                 const servingType = reservationData.serving_type || 'ala carte';
//                 const equipment = Array.isArray(reservationData.equipment)
//                     ? reservationData.equipment
//                     : [];
//                 const agenda = reservationData.agenda || '';
//                 const foodServingOption = reservationData.food_serving_option || 'immediate';
//                 const foodServingTime = reservationData.food_serving_time
//                     ? new Date(reservationData.food_serving_time)
//                     : null;

//                 // 🆕 CHANGED: Tentukan status berdasarkan sumber (GRO atau App)
//                 const reservationStatus = isGroMode ? 'confirmed' : 'pending';

//                 // ✅ Validation untuk serving_type
//                 const validServingTypes = ['ala carte', 'buffet'];
//                 if (!validServingTypes.includes(servingType)) {
//                     await Order.findByIdAndDelete(newOrder._id);
//                     if (stockDeductions.length > 0) {
//                         await rollbackStock(stockDeductions);
//                     }
//                     return res.status(400).json({
//                         success: false,
//                         message: `Invalid serving_type. Must be one of: ${validServingTypes.join(', ')}`
//                     });
//                 }

//                 // ✅ Validation untuk food_serving_option
//                 const validFoodServingOptions = ['immediate', 'scheduled'];
//                 if (!validFoodServingOptions.includes(foodServingOption)) {
//                     await Order.findByIdAndDelete(newOrder._id);
//                     if (stockDeductions.length > 0) {
//                         await rollbackStock(stockDeductions);
//                     }
//                     return res.status(400).json({
//                         success: false,
//                         message: `Invalid food_serving_option. Must be one of: ${validFoodServingOptions.join(', ')}`
//                     });
//                 }

//                 // ✅ Validation: jika scheduled, food_serving_time harus ada
//                 if (foodServingOption === 'scheduled' && !foodServingTime) {
//                     await Order.findByIdAndDelete(newOrder._id);
//                     if (stockDeductions.length > 0) {
//                         await rollbackStock(stockDeductions);
//                     }
//                     return res.status(400).json({
//                         success: false,
//                         message: 'food_serving_time is required when food_serving_option is scheduled'
//                     });
//                 }

//                 console.log('📝 Creating reservation with complete data:', {
//                     serving_type: servingType,
//                     equipment_count: equipment.length,
//                     equipment_items: equipment.join(', ') || 'none',
//                     agenda: agenda || 'none',
//                     food_serving_option: foodServingOption,
//                     food_serving_time: foodServingTime ? foodServingTime.toISOString() : 'immediate',
//                     // 🆕 CHANGED: Log status reservasi
//                     status: reservationStatus,
//                     source: isGroMode ? 'GRO' : 'App'
//                 });

//                 reservationRecord = new Reservation({
//                     reservation_date: parsedReservationDate,
//                     reservation_time: reservationData.reservationTime,
//                     area_id: reservationData.areaIds,
//                     table_id: reservationData.tableIds,
//                     guest_count: reservationData.guestCount,
//                     guest_number: isGroMode ? guestPhone : null,
//                     order_id: newOrder._id,
//                     status: reservationStatus, // 🆕 CHANGED: Gunakan status yang sudah ditentukan
//                     reservation_type: reservationType || 'nonBlocking',
//                     notes: reservationData.notes || '',

//                     // ✅ Fields yang sudah ada sebelumnya
//                     serving_type: servingType,
//                     equipment: equipment,

//                     // ✅ BARU: Agenda
//                     agenda: agenda,

//                     // ✅ BARU: Food serving options
//                     food_serving_option: foodServingOption,
//                     food_serving_time: foodServingTime,

//                     created_by: createdByData
//                 });

//                 await reservationRecord.save();

//                 newOrder.reservation = reservationRecord._id;
//                 await newOrder.save();

//                 console.log('✅ Reservation created successfully:', {
//                     reservationId: reservationRecord._id,
//                     reservation_code: reservationRecord.reservation_code,
//                     status: reservationRecord.status, // 🆕 CHANGED: Log status
//                     serving_type: reservationRecord.serving_type,
//                     equipment_count: reservationRecord.equipment.length,
//                     equipment_list: reservationRecord.equipment.join(', ') || 'none',
//                     agenda: reservationRecord.agenda || 'none',
//                     food_serving_option: reservationRecord.food_serving_option,
//                     food_serving_time: reservationRecord.food_serving_time
//                         ? reservationRecord.food_serving_time.toISOString()
//                         : 'immediate',
//                     guest_count: reservationRecord.guest_count,
//                     createdBy: createdByData.employee_name || 'App User',
//                     // 🆕 CHANGED: Informasi tambahan
//                     isGroMode: isGroMode
//                 });
//             } catch (reservationError) {
//                 console.error('❌ Reservation creation failed:', reservationError.message);
//                 await Order.findByIdAndDelete(newOrder._id);
//                 if (stockDeductions.length > 0) {
//                     await rollbackStock(stockDeductions);
//                 }
//                 return res.status(500).json({
//                     success: false,
//                     message: 'Error creating reservation',
//                     error: reservationError.message
//                 });
//             }
//         }

//         // ✅ Response preparation
//         const responseData = {
//             success: true,
//             message: isOpenBill ?
//                 'Items added to existing order successfully' :
//                 `${orderType === 'reservation' ? 'Reservation' : 'Order'} created successfully`,
//             order: newOrder,
//             isOpenBill: isOpenBill || false,
//             existingReservation: isOpenBill ? existingReservation : null,
//             stockDeductions: stockDeductions.map(d => ({
//                 menuItemName: d.menuItemName,
//                 deductedQty: d.deductedQty,
//                 newStock: d.newStock
//             }))
//         };

//         if (reservationRecord) {
//             responseData.reservation = reservationRecord;
//         }

//         // ✅ Enhanced mapping for frontend response
//         const mappedOrders = {
//             _id: newOrder._id,
//             userId: newOrder.user_id,
//             customerName: newOrder.user,
//             cashierId: newOrder.cashier,
//             groId: newOrder.groId,
//             items: newOrder.items.map(item => ({
//                 _id: item._id,
//                 quantity: item.quantity,
//                 subtotal: item.subtotal,
//                 isPrinted: item.isPrinted,
//                 menuItem: {
//                     ...item.menuItem,
//                     categories: item.menuItem.category,
//                 },
//                 selectedAddons: item.addons.length > 0 ? item.addons.map(addon => ({
//                     name: addon.name,
//                     _id: addon._id,
//                     options: [{
//                         id: addon._id,
//                         label: addon.label || addon.name,
//                         price: addon.price
//                     }]
//                 })) : [],
//                 selectedToppings: item.toppings.length > 0 ? item.toppings.map(topping => ({
//                     id: topping._id || topping.id,
//                     name: topping.name,
//                     price: topping.price
//                 })) : []
//             })),
//             status: newOrder.status,
//             orderType: newOrder.orderType,
//             deliveryAddress: newOrder.deliveryAddress,
//             tableNumber: newOrder.tableNumber,
//             pickupTime: newOrder.pickupTime,
//             type: newOrder.type,
//             paymentMethod: newOrder.paymentMethod || "Cash",
//             totalPrice: newOrder.totalBeforeDiscount,
//             totalAfterDiscount: newOrder.totalAfterDiscount,
//             totalTax: newOrder.totalTax,
//             totalServiceFee: newOrder.totalServiceFee,
//             taxAndServiceDetails: newOrder.taxAndServiceDetails,
//             grandTotal: newOrder.grandTotal,
//             voucher: newOrder.voucher || null,
//             outlet: newOrder.outlet || null,
//             promotions: newOrder.promotions || [],
//             source: newOrder.source,
//             created_by: newOrder.created_by,
//             createdAt: newOrder.createdAt,
//             updatedAt: newOrder.updatedAt,
//             __v: newOrder.__v,
//             isOpenBill: isOpenBill || false
//         };

//         // ✅ Emit to cashier application
//         if (isOpenBill) {
//             io.to('cashier_room').emit('open_bill_order', {
//                 mappedOrders,
//                 originalReservation: existingReservation,
//                 message: 'Additional items added to existing reservation'
//             });
//         } else {
//             io.to('cashier_room').emit('new_order', { mappedOrders });
//         }

//         console.log('✅ Order created successfully with stock protection');
//         res.status(201).json(responseData);

//     } catch (error) {
//         console.error('❌ Error in createAppOrder:', error);

//         // ✅ CRITICAL: Rollback stock jika terjadi error
//         if (stockDeductions.length > 0) {
//             console.log('🔄 Error occurred, rolling back stock deductions...');
//             await rollbackStock(stockDeductions);
//         }

//         res.status(500).json({
//             success: false,
//             message: 'Error creating order',
//             error: error.message,
//             code: 'ORDER_CREATION_FAILED'
//         });
//     }
// };