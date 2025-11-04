// ============================================================================
// OPTIMISTIC LOCKING UNTUK ORDER & PAYMENT
// ============================================================================

import Payment from '../models/Payment.model.js';
import { MenuItem } from "../models/MenuItem.model.js";
import { Order } from "../models/order.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import Reservation from '../models/Reservation.model.js';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { TaxAndService } from '../models/TaxAndService.model.js';
import { coreApi } from '../utils/MidtransConfig.js';
import { io } from '../index.js';

/**
 * ✅ OPTIMISTIC LOCKING CONSTANTS
 */
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

/**
 * ✅ Helper function untuk retry dengan exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = MAX_RETRY_ATTEMPTS) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Jika bukan version conflict, langsung throw
            if (!error.message?.includes('version') &&
                !error.message?.includes('No matching document found') &&
                !error.message?.includes('Version conflict')) {
                throw error;
            }

            if (attempt < maxRetries) {
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                console.log(`⚠️ Version conflict detected, retry ${attempt}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
};

/**
 * ✅ IMPROVED: Add items to existing open bill order with optimistic locking
 */
export const addItemsToOpenBillOrder = async (orderId, newItems, additionalData = {}) => {
    return await retryWithBackoff(async () => {
        // ✅ CRITICAL: Baca order dengan version
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        const orderVersion = order.__v;
        console.log(`📖 Reading order ${orderId}, version: ${orderVersion}`);

        // Calculate new items total
        const newItemsTotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        const updatedTotalBeforeDiscount = order.totalBeforeDiscount + newItemsTotal;

        console.log('💰 Open Bill Totals Update:', {
            previousTotal: order.totalBeforeDiscount,
            newItemsTotal,
            updatedTotalBeforeDiscount
        });

        // Recalculate discount if needed
        let updatedTotalAfterDiscount = updatedTotalBeforeDiscount;
        if (order.voucher) {
            const voucher = await Voucher.findById(order.voucher);
            if (voucher) {
                if (voucher.discountType === 'percentage') {
                    updatedTotalAfterDiscount = updatedTotalBeforeDiscount -
                        (updatedTotalBeforeDiscount * (voucher.discountAmount / 100));
                } else if (voucher.discountType === 'fixed') {
                    updatedTotalAfterDiscount = updatedTotalBeforeDiscount - voucher.discountAmount;
                    if (updatedTotalAfterDiscount < 0) updatedTotalAfterDiscount = 0;
                }
            }
        }

        // Recalculate tax and service
        let updatedTaxCalculation = {
            totalTax: 0,
            totalServiceFee: 0,
            taxAndServiceDetails: []
        };

        if (updatedTotalAfterDiscount > 0) {
            updatedTaxCalculation = await calculateTaxAndService(
                updatedTotalAfterDiscount,
                order.outlet || "67cbc9560f025d897d69f889",
                order.orderType === 'Reservation',
                true // isOpenBill
            );
        }

        const updatedGrandTotal = updatedTotalAfterDiscount +
            updatedTaxCalculation.totalTax +
            updatedTaxCalculation.totalServiceFee;

        // ✅ OPTIMISTIC LOCKING: Update order dengan version check
        const updateResult = await Order.findOneAndUpdate(
            {
                _id: orderId,
                __v: orderVersion  // ✅ Version check
            },
            {
                $push: { items: { $each: newItems } },
                $set: {
                    totalBeforeDiscount: updatedTotalBeforeDiscount,
                    totalAfterDiscount: updatedTotalAfterDiscount,
                    totalTax: updatedTaxCalculation.totalTax,
                    totalServiceFee: updatedTaxCalculation.totalServiceFee,
                    taxAndServiceDetails: updatedTaxCalculation.taxAndServiceDetails,
                    grandTotal: updatedGrandTotal,
                    ...additionalData
                },
                $inc: { __v: 1 }  // ✅ Increment version
            },
            { new: true }
        );

        if (!updateResult) {
            throw new Error('Version conflict: Order was modified by another process');
        }

        console.log('✅ Order updated successfully:', {
            orderId: updateResult._id,
            version: updateResult.__v,
            totalItems: updateResult.items.length,
            grandTotal: updateResult.grandTotal
        });

        return updateResult;
    });
};

/**
 * ✅ IMPROVED: Update payment amount with optimistic locking
 */
export const updatePaymentAmount = async (paymentId, additionalAmount, paymentType = 'cash') => {
    return await retryWithBackoff(async () => {
        // ✅ CRITICAL: Baca payment dengan version
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        const paymentVersion = payment.__v;
        console.log(`📖 Reading payment ${paymentId}, version: ${paymentVersion}`);

        // Calculate new amounts based on payment type
        let newAmount, newTotalAmount, newRemainingAmount;

        if (payment.paymentType === 'Down Payment') {
            // For down payment: recalculate 50:50 split
            newTotalAmount = payment.totalAmount + additionalAmount;
            newAmount = newTotalAmount / 2;
            newRemainingAmount = newTotalAmount - newAmount;

            console.log('Down Payment Update:', {
                previousTotal: payment.totalAmount,
                additionalAmount,
                newTotalAmount,
                newAmount: newAmount,
                newRemainingAmount
            });
        } else if (payment.paymentType === 'Full' || payment.paymentType === 'Final Payment') {
            // For full/final payment: just add the additional amount
            newAmount = payment.amount + additionalAmount;
            newTotalAmount = newAmount;
            newRemainingAmount = 0;

            console.log(`${payment.paymentType} Update:`, {
                previousAmount: payment.amount,
                additionalAmount,
                newAmount
            });
        }

        // Generate new transaction details
        const transactionId = generateTransactionId();
        const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const expiryTime = new Date(Date.now() + 15 * 60 * 1000)
            .toISOString().replace('T', ' ').substring(0, 19);

        let updateData = {
            transaction_id: transactionId,
            amount: newAmount,
            totalAmount: newTotalAmount,
            remainingAmount: newRemainingAmount,
            transaction_time: currentTime,
            expiry_time: expiryTime,
            status: 'pending',
            updatedAt: new Date()
        };

        // For cash payments, update QR code
        if (paymentType === 'cash') {
            const order = await Order.findOne({ order_id: payment.order_id });
            const qrData = { order_id: order._id.toString() };
            const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

            const actions = [{
                name: "generate-qr-code",
                method: "GET",
                url: qrCodeBase64,
            }];

            updateData.actions = actions;
            updateData.raw_response = {
                status_code: "200",
                status_message: `${payment.paymentType} amount updated successfully`,
                transaction_id: transactionId,
                payment_code: payment.payment_code,
                order_id: payment.order_id,
                gross_amount: newAmount.toString() + ".00",
                currency: "IDR",
                payment_type: "cash",
                transaction_time: currentTime,
                transaction_status: "pending",
                fraud_status: "accept",
                actions: actions,
                acquirer: "cash",
                qr_string: JSON.stringify(qrData),
                expiry_time: expiryTime,
            };
        } else {
            // For non-cash, create new charge with Midtrans
            const chargeParams = {
                payment_type: paymentType,
                transaction_details: {
                    gross_amount: parseInt(newAmount),
                    order_id: payment.payment_code,
                },
            };

            // Add payment method specific params
            if (paymentType === 'bank_transfer') {
                chargeParams.bank_transfer = { bank: payment.raw_response?.bank_transfer?.bank || 'bca' };
            } else if (paymentType === 'gopay') {
                chargeParams.gopay = {};
            } else if (paymentType === 'qris') {
                chargeParams.qris = {};
            }

            const response = await coreApi.charge(chargeParams);

            updateData = {
                ...updateData,
                transaction_id: response.transaction_id,
                status: response.transaction_status || 'pending',
                fraud_status: response.fraud_status,
                va_numbers: response.va_numbers || [],
                actions: response.actions || [],
                raw_response: response
            };
        }

        // ✅ OPTIMISTIC LOCKING: Update payment dengan version check
        const updateResult = await Payment.findOneAndUpdate(
            {
                _id: paymentId,
                __v: paymentVersion  // ✅ Version check
            },
            {
                $set: updateData,
                $inc: { __v: 1 }  // ✅ Increment version
            },
            { new: true }
        );

        if (!updateResult) {
            throw new Error('Version conflict: Payment was modified by another process');
        }

        console.log('✅ Payment updated successfully:', {
            paymentId: updateResult._id,
            version: updateResult.__v,
            amount: updateResult.amount,
            totalAmount: updateResult.totalAmount
        });

        return updateResult;
    });
};

/**
 * ✅ IMPROVED: Create order with open bill handling and optimistic locking
 */
export const createAppOrderWithLocking = async (req, res) => {
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
            isGroMode,
            groId,
            userName,
            guestPhone,
        } = req.body;

        console.log('🔄 Received createAppOrder request with locking:', {
            isGroMode,
            groId,
            userName,
            isOpenBill,
            openBillData,
            orderType,
            itemsCount: items ? items.length : 0
        });

        // Validation
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

        // User validation
        let finalUserId = null;
        let finalUserName = userName || 'Guest';
        let groUser = null;

        if (isGroMode) {
            if (!groId) {
                return res.status(400).json({
                    success: false,
                    message: 'GRO ID is required for GRO mode'
                });
            }
            groUser = await User.findById(groId);
            if (!groUser) {
                return res.status(404).json({
                    success: false,
                    message: 'GRO not found'
                });
            }
            finalUserName = userName || 'Guest';
        } else {
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }
            const userExists = await User.findById(userId);
            if (!userExists) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            finalUserId = userId;
            finalUserName = userExists.username || 'Guest';
        }

        // ✅ Enhanced existing order search untuk open bill
        let existingOrder = null;
        let existingReservation = null;

        if (isOpenBill && openBillData) {
            console.log('🔍 Enhanced Open Bill Search:', {
                reservationId: openBillData.reservationId,
                tableNumbers: openBillData.tableNumbers
            });

            // Multiple search strategies
            existingOrder = await Order.findOne({ order_id: openBillData.reservationId });

            if (!existingOrder) {
                try {
                    existingOrder = await Order.findById(openBillData.reservationId);
                } catch (idError) {
                    console.log('🔍 Invalid ObjectId format for direct search');
                }
            }

            if (!existingOrder && openBillData.tableNumbers) {
                existingOrder = await Order.findOne({
                    tableNumber: openBillData.tableNumbers,
                    isOpenBill: true,
                    status: { $in: ['OnProcess', 'Reserved'] }
                }).sort({ createdAt: -1 });
            }
        }

        // Process items
        const orderItems = [];
        if (items && items.length > 0) {
            for (const item of items) {
                const menuItem = await MenuItem.findById(item.productId).populate('availableAt');
                if (!menuItem) {
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

        // ✅ Handle Open Bill scenario WITH OPTIMISTIC LOCKING
        if (isOpenBill && existingOrder) {
            console.log('🔄 Adding items to existing open bill order with locking');

            const additionalData = {};
            if (isGroMode && !existingOrder.groId) {
                additionalData.groId = groId;
                additionalData.source = 'Gro';
                additionalData.created_by = {
                    employee_id: groUser._id,
                    employee_name: groUser.username || 'Unknown GRO',
                    created_at: new Date()
                };
            }

            // ✅ Use optimistic locking function
            const updatedOrder = await addItemsToOpenBillOrder(
                existingOrder._id,
                orderItems,
                additionalData
            );

            // Map updated order for frontend response
            const mappedOrder = {
                _id: updatedOrder._id,
                userId: updatedOrder.user_id,
                customerName: updatedOrder.user,
                cashierId: updatedOrder.cashier,
                groId: updatedOrder.groId,
                items: updatedOrder.items.map(item => ({
                    _id: item._id,
                    quantity: item.quantity,
                    subtotal: item.subtotal,
                    isPrinted: item.isPrinted,
                    menuItem: item.menuItem,
                    selectedAddons: item.addons || [],
                    selectedToppings: item.toppings || []
                })),
                status: updatedOrder.status,
                orderType: updatedOrder.orderType,
                deliveryAddress: updatedOrder.deliveryAddress,
                tableNumber: updatedOrder.tableNumber,
                type: updatedOrder.type,
                paymentMethod: updatedOrder.paymentMethod || "Cash",
                totalPrice: updatedOrder.totalBeforeDiscount,
                totalAfterDiscount: updatedOrder.totalAfterDiscount,
                totalTax: updatedOrder.totalTax,
                totalServiceFee: updatedOrder.totalServiceFee,
                taxAndServiceDetails: updatedOrder.taxAndServiceDetails,
                grandTotal: updatedOrder.grandTotal,
                voucher: updatedOrder.voucher || null,
                outlet: updatedOrder.outlet || null,
                promotions: updatedOrder.promotions || [],
                source: updatedOrder.source,
                created_by: updatedOrder.created_by,
                createdAt: updatedOrder.createdAt,
                updatedAt: updatedOrder.updatedAt,
                __v: updatedOrder.__v,
                isOpenBill: true
            };

            // Emit to cashier application
            if (io) {
                io.to('cashier_room').emit('open_bill_order', {
                    mappedOrders: mappedOrder,
                    originalReservation: existingReservation,
                    message: 'Additional items added to existing reservation'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Items added to existing order successfully',
                order: updatedOrder,
                isOpenBill: true,
                existingReservation
            });
        }

        // ✅ Normal order creation (NEW document - no locking needed)
        const generatedOrderId = await generateOrderId(tableNumber || '');

        // Format orderType
        let formattedOrderType = '';
        switch (orderType) {
            case 'dineIn':
                formattedOrderType = 'Dine-In';
                if (!tableNumber && !isOpenBill) {
                    return res.status(400).json({
                        success: false,
                        message: 'Table number is required for dine-in orders'
                    });
                }
                break;
            case 'delivery':
                formattedOrderType = 'Delivery';
                if (!deliveryAddress) {
                    return res.status(400).json({
                        success: false,
                        message: 'Delivery address is required for delivery orders'
                    });
                }
                break;
            case 'pickup':
                formattedOrderType = 'Pickup';
                if (!pickupTime) {
                    return res.status(400).json({
                        success: false,
                        message: 'Pickup time is required for pickup orders'
                    });
                }
                break;
            case 'takeAway':
                formattedOrderType = 'Take Away';
                break;
            case 'reservation':
                formattedOrderType = 'Reservation';
                if (!reservationData && !isOpenBill) {
                    return res.status(400).json({
                        success: false,
                        message: 'Reservation data is required for reservation orders'
                    });
                }
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order type'
                });
        }

        // Determine order status
        let orderStatus = 'Pending';
        if (isGroMode) {
            if (isOpenBill) {
                orderStatus = 'OnProcess';
            } else if (orderType === 'reservation') {
                orderStatus = 'Reserved';
            } else if (orderType === 'dineIn') {
                orderStatus = 'OnProcess';
            }
        }

        // Created by data
        const createdByData = isGroMode && groUser ? {
            employee_id: groUser._id,
            employee_name: groUser.username || 'Unknown GRO',
            created_at: new Date()
        } : {
            employee_id: null,
            employee_name: null,
            created_at: new Date()
        };

        // Handle pickup time
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

        // Find voucher if provided
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

        // Calculate totals
        let totalBeforeDiscount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

        if (orderType === 'reservation' && !isOpenBill && orderItems.length === 0) {
            totalBeforeDiscount = 25000; // Reservation fee
        }

        // Calculate tax
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

        // Calculate discount
        let totalAfterDiscount = totalBeforeDiscount;
        if (discountType === 'percentage') {
            totalAfterDiscount = totalBeforeDiscount - (totalBeforeDiscount * (voucherAmount / 100));
        } else if (discountType === 'fixed') {
            totalAfterDiscount = totalBeforeDiscount - voucherAmount;
            if (totalAfterDiscount < 0) totalAfterDiscount = 0;
        }

        const grandTotal = totalAfterDiscount + taxServiceCalculation.totalTax + taxServiceCalculation.totalServiceFee;

        // Create new order
        const newOrder = new Order({
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
            discounts: {
                autoPromoDiscount: 0,
                manualDiscount: 0,
                voucherDiscount: 0
            },
            appliedPromos: [],
            appliedManualPromo: null,
            appliedVoucher: voucherId,
            taxAndServiceDetails: taxServiceCalculation.taxAndServiceDetails,
            grandTotal: grandTotal,
            promotions: [],
            source: isGroMode ? 'Gro' : 'App',
            reservation: null,
            created_by: createdByData,
        });

        await newOrder.save();

        console.log('✅ New order created:', {
            orderId: newOrder._id,
            order_id: newOrder.order_id,
            status: newOrder.status,
            grandTotal: newOrder.grandTotal
        });

        // Map order for frontend response
        const mappedOrder = {
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
                menuItem: item.menuItem,
                selectedAddons: item.addons || [],
                selectedToppings: item.toppings || []
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
            isOpenBill: false
        };

        // Emit to cashier application
        if (io) {
            io.to('cashier_room').emit('new_order', { mappedOrders: mappedOrder });
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: newOrder
        });

    } catch (error) {
        console.error('Error in createAppOrderWithLocking:', error);

        // Handle version conflict errors gracefully
        if (error.message?.includes('Version conflict')) {
            return res.status(409).json({
                success: false,
                message: 'Order was modified by another process. Please try again.',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

/**
 * ✅ IMPROVED: Charge function with optimistic locking for payment updates
 */
export const chargeWithLocking = async (req, res) => {
    try {
        const {
            payment_type,
            is_down_payment,
            down_payment_amount,
            transaction_details,
            bank_transfer,
            total_order_amount
        } = req.body;

        const payment_code = generatePaymentCode();
        let order_id, gross_amount;

        if (payment_type === 'cash') {
            order_id = req.body.order_id;
            gross_amount = req.body.gross_amount;
        } else {
            order_id = transaction_details?.order_id;
            gross_amount = transaction_details?.gross_amount;
        }

        // Validate order
        const order = await Order.findOne({ order_id });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // ✅ Check for existing pending payments
        const existingDownPayment = await Payment.findOne({
            order_id: order_id,
            paymentType: 'Down Payment',
            status: { $in: ['pending', 'expire'] }
        }).sort({ createdAt: -1 });

        // ✅ Update existing down payment with optimistic locking
        if (existingDownPayment) {
            console.log('🔄 Updating existing down payment with locking');

            const updatedPayment = await updatePaymentAmount(
                existingDownPayment._id,
                total_order_amount || gross_amount,
                payment_type
            );

            return res.status(200).json({
                ...updatedPayment.raw_response,
                paymentType: updatedPayment.paymentType,
                totalAmount: updatedPayment.totalAmount,
                remainingAmount: updatedPayment.remainingAmount,
                is_down_payment: true,
                isUpdated: true,
                message: "Down payment updated with 50:50 split due to additional order items"
            });
        }

        // Check for existing full payment
        const existingFullPayment = await Payment.findOne({
            order_id: order_id,
            paymentType: 'Full',
            status: { $in: ['pending', 'expire'] }
        }).sort({ createdAt: -1 });

        // ✅ Update existing full payment with optimistic locking
        if (existingFullPayment) {
            console.log('🔄 Updating existing full payment with locking');

            const updatedPayment = await updatePaymentAmount(
                existingFullPayment._id,
                total_order_amount || gross_amount,
                payment_type
            );

            return res.status(200).json({
                ...updatedPayment.raw_response,
                paymentType: updatedPayment.paymentType,
                totalAmount: updatedPayment.totalAmount,
                remainingAmount: 0,
                is_down_payment: false,
                isUpdated: true,
                message: "Full payment updated due to additional order items"
            });
        }

        // Check for existing final payment
        const existingFinalPayment = await Payment.findOne({
            order_id: order_id,
            paymentType: 'Final Payment',
            status: { $in: ['pending', 'expire'] }
        }).sort({ createdAt: -1 });

        // ✅ Update existing final payment with optimistic locking
        if (existingFinalPayment) {
            console.log('🔄 Updating existing final payment with locking');

            const updatedPayment = await updatePaymentAmount(
                existingFinalPayment._id,
                total_order_amount || gross_amount,
                payment_type
            );

            return res.status(200).json({
                ...updatedPayment.raw_response,
                paymentType: updatedPayment.paymentType,
                totalAmount: updatedPayment.totalAmount,
                remainingAmount: 0,
                is_down_payment: false,
                isUpdated: true,
                message: "Final payment updated due to additional order items"
            });
        }

        // ... rest of the create new payment logic (no locking needed for new documents) ...

    } catch (error) {
        console.error('Payment error:', error);

        // Handle version conflict errors gracefully
        if (error.message?.includes('Version conflict')) {
            return res.status(409).json({
                success: false,
                message: 'Payment was modified by another process. Please try again.',
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Payment failed',
            error: error.message || error
        });
    }
};

// Helper functions (keep these the same)
function generateTransactionId() {
    const chars = '0123456789abcdef';
    const sections = [8, 4, 4, 4, 12];
    return sections.map(len =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    ).join('-');
}

function generatePaymentCode() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const HH = String(now.getHours()).padStart(2, '0');
    const MM = String(now.getMinutes()).padStart(2, '0');
    const SS = String(now.getSeconds()).padStart(2, '0');
    return `${dd}${mm}${yyyy}${HH}${MM}${SS}`;
}

async function generateOrderId(tableNumber) {
    // Implementation sama seperti sebelumnya
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
    const { db } = await import('../utils/mongo.js');

    const result = await db.collection('counters').findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );

    const seq = result.value.seq;
    return `ORD-${day}${tableOrDayCode}-${String(seq).padStart(3, '0')}`;
}

async function calculateTaxAndService(subtotal, outlet, isReservation, isOpenBill) {
    // Implementation sama seperti sebelumnya
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

        return { totalTax, totalServiceFee, taxAndServiceDetails };
    } catch (error) {
        console.error('Error calculating tax and service:', error);
        return { totalTax: 0, totalServiceFee: 0, taxAndServiceDetails: [] };
    }
}