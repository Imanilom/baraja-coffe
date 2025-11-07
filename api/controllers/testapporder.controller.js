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
 * ✅ OPTIMISTIC LOCKING CONSTANTS
 */
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

/**
 * ✅ Helper: Retry dengan exponential backoff
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
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                console.log(`⚠️ Conflict detected, retry ${attempt}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
};

/**
 * ✅ CRITICAL: Validate dan reserve stock dengan optimistic locking
 */
const validateAndReserveStock = async (items) => {
    const stockReservations = [];
    const session = await mongoose.startSession();

    try {
        await session.startTransaction();

        for (const item of items) {
            const menuItem = await MenuItem.findById(item.productId)
                .session(session)
                .select('_id name price availableStock isActive __v');

            if (!menuItem) {
                throw new Error(`Menu item not found: ${item.productId}`);
            }

            if (!menuItem.isActive) {
                throw new Error(`Menu item "${menuItem.name}" is not available`);
            }

            const menuStock = await MenuStock.findOne({ menuItemId: menuItem._id })
                .session(session)
                .select('currentStock manualStock calculatedStock __v');

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

            stockReservations.push({
                menuItemId: menuItem._id,
                menuItemName: menuItem.name,
                menuItemVersion: menuItem.__v,
                menuStockId: menuStock._id,
                menuStockVersion: menuStock.__v,
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
 * ✅ CRITICAL: Deduct stock dengan optimistic locking
 */
const deductStockWithLocking = async (stockReservations) => {
    const deductionResults = [];

    for (const reservation of stockReservations) {
        const result = await retryWithBackoff(async () => {
            const updatedStock = await MenuStock.findOneAndUpdate(
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
            );

            if (!updatedStock) {
                throw new Error(
                    `Stock conflict for "${reservation.menuItemName}". Please retry.`
                );
            }

            const updatedMenuItem = await MenuItem.findOneAndUpdate(
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
            );

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
 * ✅ CRITICAL: Rollback stock jika order gagal
 */
const rollbackStock = async (deductionResults) => {
    console.log('🔄 Rolling back stock deductions...');

    for (const result of deductionResults) {
        if (result.success) {
            try {
                await MenuStock.findOneAndUpdate(
                    { menuItemId: result.menuItemId },
                    {
                        $inc: {
                            currentStock: result.deductedQty,
                            calculatedStock: result.deductedQty
                        }
                    }
                );

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

const calculateTaxAndService = async (subtotal, outlet, isReservation, isOpenBill) => {
    try {
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

export async function generateOrderId(tableNumber) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    let tableOrDayCode = tableNumber;
    if (!tableNumber) {
        const days = ['MD', 'TU', 'WD', 'TH', 'FR', 'ST', 'SN'];
        const dayCode = days[now.getDay()];
        tableOrDayCode = `${dayCode}${day}`;
    }

    const key = `order_seq_${tableOrDayCode}_${dateStr}`;

    const result = await db.collection('counters').findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );

    const seq = result.value.seq;
    return `ORD-${day}${tableOrDayCode}-${String(seq).padStart(3, '0')}`;
}

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

export const createAppOrder = async (req, res) => {
    let stockDeductions = [];

    try {
        const {
            items,
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
            taxDetails,
            totalTax,
            subtotal: frontendSubtotal,
            discount: frontendDiscount,
            isGroMode,
            groId,
            userName,
            guestPhone,
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

        // ✅ Validasi items
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

        // ✅ Validasi user
        let userExists = null;
        let finalUserId = null;
        let finalUserName = userName || 'Guest';
        let groUser = null;

        if (isGroMode) {
            if (!groId) {
                return res.status(400).json({ success: false, message: 'GRO ID is required for GRO mode' });
            }

            groUser = await User.findById(groId);
            if (!groUser) {
                return res.status(404).json({ success: false, message: 'GRO not found' });
            }

            finalUserId = null;
            finalUserName = userName || 'Guest';
        } else {
            if (!userId) {
                return res.status(400).json({ success: false, message: 'User ID is required' });
            }

            userExists = await User.findById(userId);
            if (!userExists) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            finalUserId = userId;
            finalUserName = userExists.username || 'Guest';
        }

        // ✅ CRITICAL: Validate and reserve stock BEFORE creating order
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

        // ✅ Enhanced existing order search untuk open bill
        let existingOrder = null;
        let existingReservation = null;

        if (isOpenBill && openBillData) {
            console.log('🔍 Enhanced Open Bill Search:', {
                reservationId: openBillData.reservationId,
                tableNumbers: openBillData.tableNumbers
            });

            existingOrder = await Order.findOne({ order_id: openBillData.reservationId });

            if (!existingOrder) {
                try {
                    existingOrder = await Order.findById(openBillData.reservationId);
                } catch (idError) {
                    console.log('🔍 Invalid ObjectId format');
                }
            }

            if (!existingOrder) {
                existingReservation = await Reservation.findById(openBillData.reservationId);
                if (existingReservation && existingReservation.order_id) {
                    existingOrder = await Order.findById(existingReservation.order_id);
                }
            }

            if (!existingOrder && openBillData.tableNumbers) {
                existingOrder = await Order.findOne({
                    tableNumber: openBillData.tableNumbers,
                    isOpenBill: true,
                    status: { $in: ['OnProcess', 'Reserved'] }
                }).sort({ createdAt: -1 });
            }

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

        // ✅ Format orderType
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

        // ✅ Tentukan status order
        let orderStatus = 'Pending';

        if (isGroMode) {
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

        const createdByData = isGroMode && groUser ? {
            employee_id: groUser._id,
            employee_name: groUser.username || 'Unknown GRO',
            created_at: new Date()
        } : {
            employee_id: null,
            employee_name: null,
            created_at: new Date()
        };

        // ✅ Handle pickup time
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

        // ✅ Find voucher
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

        // ✅ CRITICAL: Deduct stock setelah validasi berhasil
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

        // ✅ Process items
        const orderItems = [];
        if (items && items.length > 0) {
            for (const item of items) {
                const menuItem = await MenuItem.findById(item.productId).populate('availableAt');
                if (!menuItem) {
                    if (stockDeductions.length > 0) {
                        await rollbackStock(stockDeductions);
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

        // ✅ Calculate totals
        let totalBeforeDiscount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

        if (isOpenBill && totalBeforeDiscount === 0 && orderItems.length === 0) {
            console.log('ℹ️ Open bill with no items');
        }

        if (orderType === 'reservation' && !isOpenBill && orderItems.length === 0) {
            totalBeforeDiscount = 25000;
        }

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

        let totalAfterDiscount = totalBeforeDiscount;
        if (discountType === 'percentage') {
            totalAfterDiscount = totalBeforeDiscount - (totalBeforeDiscount * (voucherAmount / 100));
        } else if (discountType === 'fixed') {
            totalAfterDiscount = totalBeforeDiscount - voucherAmount;
            if (totalAfterDiscount < 0) totalAfterDiscount = 0;
        }

        const grandTotal = totalAfterDiscount + taxServiceCalculation.totalTax + taxServiceCalculation.totalServiceFee;

        let newOrder;

        // ✅ Handle Open Bill scenario
        if (isOpenBill && existingOrder) {
            console.log('📝 Adding items to existing open bill order');

            if (orderItems.length > 0) {
                existingOrder.items.push(...orderItems);

                const newItemsTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
                const updatedTotalBeforeDiscount = existingOrder.totalBeforeDiscount + newItemsTotal;

                let updatedTotalAfterDiscount = updatedTotalBeforeDiscount;
                if (voucherId && discountType === 'percentage') {
                    updatedTotalAfterDiscount = updatedTotalBeforeDiscount - (updatedTotalBeforeDiscount * (voucherAmount / 100));
                } else if (voucherId && discountType === 'fixed') {
                    updatedTotalAfterDiscount = updatedTotalBeforeDiscount - voucherAmount;
                    if (updatedTotalAfterDiscount < 0) updatedTotalAfterDiscount = 0;
                }

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

                existingOrder.totalBeforeDiscount = updatedTotalBeforeDiscount;
                existingOrder.totalAfterDiscount = updatedTotalAfterDiscount;
                existingOrder.totalTax = updatedTaxCalculation.totalTax;
                existingOrder.totalServiceFee = updatedTaxCalculation.totalServiceFee;
                existingOrder.taxAndServiceDetails = updatedTaxCalculation.taxAndServiceDetails;
                existingOrder.grandTotal = updatedTotalAfterDiscount + updatedTaxCalculation.totalTax + updatedTaxCalculation.totalServiceFee;

                if (voucherId) {
                    existingOrder.appliedVoucher = voucherId;
                    existingOrder.voucher = voucherId;
                }
            }

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
        else {
            // ✅ Normal order creation
            const generatedOrderId = await generateOrderId(tableNumber || '');
            newOrder = new Order({
                order_id: generatedOrderId,
                user_id: finalUserId,
                user: finalUserName,
                cashier: null,
                groId: isGroMode ? groId : null,
                items: orderItems,
                status: orderStatus,
                paymentMethod: paymentDetails.method,
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
                source: isGroMode ? 'Gro' : 'App',
                reservation: null,
                isOpenBill: false,
                created_by: createdByData,
            });

            try {
                await newOrder.save();
            } catch (saveError) {
                console.error('❌ Order save failed, rolling back stock:', saveError.message);
                if (stockDeductions.length > 0) {
                    await rollbackStock(stockDeductions);
                }
                throw saveError;
            }
        }

        // ✅ Verify order was saved
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

        // ✅ Reservation creation
        let reservationRecord = null;
        if (orderType === 'reservation' && !isOpenBill) {
            try {
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

                reservationRecord = new Reservation({
                    reservation_date: parsedReservationDate,
                    reservation_time: reservationData.reservationTime,
                    area_id: reservationData.areaIds,
                    table_id: reservationData.tableIds,
                    guest_count: reservationData.guestCount,
                    guest_number: isGroMode ? guestPhone : null,
                    order_id: newOrder._id,
                    status: 'pending',
                    reservation_type: reservationType || 'nonBlocking',
                    notes: reservationData.notes || '',
                    created_by: createdByData
                });

                await reservationRecord.save();

                newOrder.reservation = reservationRecord._id;
                await newOrder.save();

                console.log('✅ Reservation created with GRO data:', {
                    reservationId: reservationRecord._id,
                    createdBy: createdByData,
                    guestNumber: guestPhone
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

        // ✅ Response preparation
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

        // ✅ Enhanced mapping for frontend response
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
            isOpenBill: isOpenBill || false
        };

        // ✅ Emit to cashier application
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

        // ✅ CRITICAL: Rollback stock jika terjadi error
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