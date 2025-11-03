import Payment from '../models/Payment.model.js';
import { MenuItem } from "../models/MenuItem.model.js";
import { Order } from "../models/order.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import { snap, coreApi } from '../utils/MidtransConfig.js';
import mongoose from 'mongoose';
import { validateOrderData, createMidtransCoreTransaction, createMidtransSnapTransaction } from '../validators/order.validator.js';
import { orderQueue, queueEvents } from '../queues/order.queue.js';
import { db } from '../utils/mongo.js';
//io
import { io, broadcastNewOrder } from '../index.js';
import { broadcastCashOrderToKitchen, broadcastNewOrderToAreas, broadcastOrderCreation } from '../helpers/broadcast.helper.js';
import Reservation from '../models/Reservation.model.js';
import QRCode from 'qrcode';
// Import FCM service di bagian atas file
import FCMNotificationService from '../services/fcmNotificationService.js';
import { TaxAndService } from '../models/TaxAndService.model.js';
import { updateTableStatusAfterPayment } from './webhookController.js';
import { getAreaGroup } from '../utils/areaGrouping.js';
import { Outlet } from '../models/Outlet.model.js';
import dayjs from 'dayjs'
import { processGoSendDelivery } from '../helpers/deliveryHelper.js';
import { replaceOrderItemsAndAllocate } from '../services/orderEdit.service.js';
import { createOrderHandler } from '../workers/handlers/createOrderHandler.js';


const calculateTaxAndService = async (subtotal, outlet, isReservation, isOpenBill) => {
    try {
        // Fetch tax and service data
        const taxAndServices = await TaxAndService.find({
            isActive: true,
            appliesToOutlets: outlet
        });

        console.log('Found tax and service items:', taxAndServices);

        let totalTax = 0;
        let totalServiceFee = 0;
        const taxAndServiceDetails = [];

        for (const item of taxAndServices) {
            console.log(`Processing item: ${item.name}, type: ${item.type}, percentage: ${item.percentage}`);

            if (item.type === 'tax') {
                // Apply PPN to all orders (including open bill)
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
                    console.log(`Applied tax: ${item.name}, amount: ${amount}`);
                }
            } else if (item.type === 'service') {
                // Apply service fees to all orders (including open bill if needed)
                const amount = subtotal * (item.percentage / 100);
                totalServiceFee += amount;
                taxAndServiceDetails.push({
                    id: item._id,
                    name: item.name,
                    type: item.type,
                    percentage: item.percentage,
                    amount: amount
                });
                console.log(`Applied service fee: ${item.name}, amount: ${amount}`);
            }
        }

        console.log('Tax calculation result:', { totalTax, totalServiceFee, taxAndServiceDetails });

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

export const createAppOrder = async (req, res) => {
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
            // ✅ TAMBAHAN: Parameter untuk GRO mode
            isGroMode,
            groId,
            userName,
            guestPhone,
        } = req.body;

        console.log('Received createAppOrder request:', {
            isGroMode,
            groId,
            userName,
            guestPhone,
            userId,
            isOpenBill,
            openBillData,
            orderType,
            itemsCount: items ? items.length : 0
        });

        // ✅ PERBAIKAN: Validasi items yang lebih fleksibel untuk open bill
        const shouldSkipItemValidation =
            (orderType === 'reservation' && !isOpenBill) ||
            (orderType === 'reservation' && isOpenBill) ||
            isOpenBill; // ✅ TAMBAHAN: Skip validasi untuk SEMUA open bill

        console.log('🔍 Item validation check:', {
            orderType,
            isOpenBill,
            hasItems: items && items.length > 0,
            shouldSkipItemValidation,
            itemsCount: items ? items.length : 0
        });

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

        // ✅ PERBAIKAN: Validasi user berbeda untuk GRO mode
        let userExists = null;
        let finalUserId = null;
        let finalUserName = userName || 'Guest';
        let groUser = null; // ✅ TAMBAHAN: Simpan data GRO

        if (isGroMode) {
            // Untuk GRO mode, validasi GRO yang login
            if (!groId) {
                return res.status(400).json({ success: false, message: 'GRO ID is required for GRO mode' });
            }

            groUser = await User.findById(groId);
            if (!groUser) {
                return res.status(404).json({ success: false, message: 'GRO not found' });
            }

            // Untuk order, gunakan guest name yang dimasukkan GRO
            finalUserId = null; // Biarkan null untuk guest
            finalUserName = userName || 'Guest';

            console.log('✅ GRO Mode - Order akan dibuat atas nama guest:', finalUserName);
        } else {
            // Normal user flow
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

        // ✅ PERBAIKAN UTAMA: Enhanced existing order search untuk open bill
        let existingOrder = null;
        let existingReservation = null;

        if (isOpenBill && openBillData) {
            console.log('🔍 Enhanced Open Bill Search:', {
                reservationId: openBillData.reservationId,
                tableNumbers: openBillData.tableNumbers
            });

            // Strategy 1: Cari by reservationId sebagai order_id
            existingOrder = await Order.findOne({ order_id: openBillData.reservationId });
            console.log('🔍 Search by order_id result:', existingOrder ? `Found: ${existingOrder._id}` : 'Not found');

            // Strategy 2: Cari by reservationId sebagai _id
            if (!existingOrder) {
                try {
                    existingOrder = await Order.findById(openBillData.reservationId);
                    console.log('🔍 Search by _id result:', existingOrder ? `Found: ${existingOrder._id}` : 'Not found');
                } catch (idError) {
                    console.log('🔍 Invalid ObjectId format for direct search');
                }
            }

            // Strategy 3: Cari via reservation
            if (!existingOrder) {
                existingReservation = await Reservation.findById(openBillData.reservationId);
                console.log('🔍 Reservation search result:', existingReservation ? `Found: ${existingReservation._id}` : 'Not found');

                if (existingReservation && existingReservation.order_id) {
                    existingOrder = await Order.findById(existingReservation.order_id);
                    console.log('🔍 Search via reservation order_id:', existingOrder ? `Found: ${existingOrder._id}` : 'Not found');
                }
            }

            // Strategy 4: Cari by table number untuk dine-in open bill
            if (!existingOrder && openBillData.tableNumbers) {
                existingOrder = await Order.findOne({
                    tableNumber: openBillData.tableNumbers,
                    isOpenBill: true,
                    status: { $in: ['OnProcess', 'Reserved'] }
                }).sort({ createdAt: -1 }); // Ambil yang terbaru

                console.log('🔍 Search by tableNumber result:', existingOrder ? `Found: ${existingOrder._id}` : 'Not found');
            }

            // ✅ FALLBACK: Jika tidak ada existing order, buat baru untuk open bill
            if (!existingOrder) {
                console.log('⚠️ No existing order found for open bill, creating new one...');

                const generatedOrderId = await generateOrderId(openBillData.tableNumbers || tableNumber || 'OPENBILL');

                // Buat order baru untuk open bill
                existingOrder = new Order({
                    order_id: generatedOrderId,
                    user_id: finalUserId,
                    user: finalUserName,
                    groId: isGroMode ? groId : null,
                    items: [], // Mulai dengan items kosong
                    status: 'OnProcess', // Langsung OnProcess untuk open bill
                    paymentMethod: paymentDetails.method || 'Cash',
                    orderType: 'Reservation', // Default untuk open bill reservasi
                    deliveryAddress: deliveryAddress || '',
                    tableNumber: openBillData.tableNumbers || tableNumber || '',
                    type: 'Indoor',
                    isOpenBill: true,
                    outlet: outlet && outlet !== "" ? outlet : "67cbc9560f025d897d69f889",
                    totalBeforeDiscount: 0, // Mulai dari 0
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
                console.log('✅ Created new order for open bill:', existingOrder._id);

                // Link dengan reservation jika ada
                if (existingReservation && !existingReservation.order_id) {
                    existingReservation.order_id = existingOrder._id;
                    await existingReservation.save();
                    console.log('✅ Linked new order to reservation');
                }
            }
        }

        // Format orderType
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
                    return res.status(400).json({ success: false, message: 'Delivery address is required for delivery orders' });
                }
                break;
            case 'pickup':
                formattedOrderType = 'Pickup';
                if (!pickupTime) {
                    return res.status(400).json({ success: false, message: 'Pickup time is required for pickup orders' });
                }
                break;
            case 'takeAway':
                formattedOrderType = 'Take Away';
                break;
            case 'reservation':
                formattedOrderType = 'Reservation';
                if (!reservationData && !isOpenBill) {
                    return res.status(400).json({ success: false, message: 'Reservation data is required for reservation orders' });
                }
                if (isOpenBill) {
                    formattedOrderType = 'Reservation';
                }
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid order type' });
        }

        // ✅ PERBAIKAN: Tentukan status order berdasarkan GRO mode dan tipe order
        let orderStatus = 'Pending'; // Default status untuk semua order dari App

        if (isGroMode) {
            if (isOpenBill) {
                // Untuk open bill, pertahankan status existing atau gunakan OnProcess
                orderStatus = existingOrder ? existingOrder.status : 'OnProcess';
            } else if (orderType === 'reservation') {
                orderStatus = 'Reserved';
            } else if (orderType === 'dineIn') {
                orderStatus = 'OnProcess';
            } else {
                orderStatus = 'Pending';
            }
            console.log('✅ GRO Mode - Status order:', orderStatus);
        } else {
            orderStatus = 'Pending';
            console.log('✅ App Mode - Status order: Pending (including reservations)');
        }

        // ✅ TAMBAHAN: Siapkan data created_by
        const createdByData = isGroMode && groUser ? {
            employee_id: groUser._id,
            employee_name: groUser.username || 'Unknown GRO',
            created_at: new Date()
        } : {
            employee_id: null,
            employee_name: null,
            created_at: new Date()
        };

        console.log('✅ Created by data:', createdByData);

        // Handle pickup time
        let parsedPickupTime = null;
        if (orderType === 'pickup') {
            if (!pickupTime) {
                return res.status(400).json({ success: false, message: 'Pickup time is required for pickup orders' });
            }

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

        // Process items (jika ada)
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

        // ✅ PERBAIKAN: Handle tax calculation untuk order tanpa items
        let totalBeforeDiscount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

        // Untuk open bill dengan items kosong (baik baru atau existing)
        if (isOpenBill && totalBeforeDiscount === 0 && orderItems.length === 0) {
            console.log('ℹ️ Open bill with no items, tax calculation will be 0');
        }

        // Untuk reservation biasa tanpa items
        if (orderType === 'reservation' && !isOpenBill && orderItems.length === 0) {
            totalBeforeDiscount = 25000; // Reservation fee
        }

        // Calculate tax hanya jika ada amount
        let taxServiceCalculation = {
            totalTax: 0,
            totalServiceFee: 0,
            taxAndServiceDetails: []
        };

        if (totalBeforeDiscount > 0) {
            taxServiceCalculation = await calculateTaxAndService(
                totalBeforeDiscount, // Gunakan totalBeforeDiscount untuk calculation
                outlet || "67cbc9560f025d897d69f889",
                orderType === 'reservation',
                isOpenBill
            );
        }

        console.log('💰 Final Tax Calculation:', {
            totalBeforeDiscount,
            totalTax: taxServiceCalculation.totalTax,
            totalServiceFee: taxServiceCalculation.totalServiceFee,
            hasItems: orderItems.length > 0
        });

        let totalAfterDiscount = totalBeforeDiscount;
        if (discountType === 'percentage') {
            totalAfterDiscount = totalBeforeDiscount - (totalBeforeDiscount * (voucherAmount / 100));
        } else if (discountType === 'fixed') {
            totalAfterDiscount = totalBeforeDiscount - voucherAmount;
            if (totalAfterDiscount < 0) totalAfterDiscount = 0;
        }

        const grandTotal = totalAfterDiscount + taxServiceCalculation.totalTax + taxServiceCalculation.totalServiceFee;

        console.log('Final totals:', {
            totalAfterDiscount,
            taxAmount: taxServiceCalculation.totalTax,
            serviceAmount: taxServiceCalculation.totalServiceFee,
            grandTotal
        });

        let newOrder;

        // Handle Open Bill scenario - WITH IMPROVED ITEMS HANDLING
        if (isOpenBill && existingOrder) {
            console.log('📝 Adding items to existing open bill order:', {
                orderId: existingOrder._id,
                existingItemsCount: existingOrder.items.length,
                newItemsCount: orderItems.length
            });

            // ✅ PERBAIKAN: Tambahkan items baru ke existing order
            if (orderItems.length > 0) {
                existingOrder.items.push(...orderItems);

                // Calculate new totals
                const newItemsTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
                const updatedTotalBeforeDiscount = existingOrder.totalBeforeDiscount + newItemsTotal;

                console.log('💰 Open Bill Totals Update:', {
                    previousTotal: existingOrder.totalBeforeDiscount,
                    newItemsTotal,
                    updatedTotalBeforeDiscount
                });

                // Recalculate discount
                let updatedTotalAfterDiscount = updatedTotalBeforeDiscount;
                if (voucherId && discountType === 'percentage') {
                    updatedTotalAfterDiscount = updatedTotalBeforeDiscount - (updatedTotalBeforeDiscount * (voucherAmount / 100));
                } else if (voucherId && discountType === 'fixed') {
                    updatedTotalAfterDiscount = updatedTotalBeforeDiscount - voucherAmount;
                    if (updatedTotalAfterDiscount < 0) updatedTotalAfterDiscount = 0;
                }

                // Recalculate tax hanya jika ada amount
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
                        true // isOpenBill = true
                    );
                }

                // Update order totals
                existingOrder.totalBeforeDiscount = updatedTotalBeforeDiscount;
                existingOrder.totalAfterDiscount = updatedTotalAfterDiscount;
                existingOrder.totalTax = updatedTaxCalculation.totalTax;
                existingOrder.totalServiceFee = updatedTaxCalculation.totalServiceFee;
                existingOrder.taxAndServiceDetails = updatedTaxCalculation.taxAndServiceDetails;
                existingOrder.grandTotal = updatedTotalAfterDiscount + updatedTaxCalculation.totalTax + updatedTaxCalculation.totalServiceFee;

                // Update voucher jika ada
                if (voucherId) {
                    existingOrder.appliedVoucher = voucherId;
                    existingOrder.voucher = voucherId;
                }
            }

            // ✅ Update GRO data jika dari GRO mode
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

            console.log('✅ Open bill order updated:', {
                orderId: newOrder._id,
                totalItems: newOrder.items.length,
                totalBeforeDiscount: newOrder.totalBeforeDiscount,
                totalTax: newOrder.totalTax,
                grandTotal: newOrder.grandTotal
            });
        }
        else if (isOpenBill && !existingOrder) {
            // Fallback - should not happen after our fix
            console.log('⚠️ Open bill requested but no existing order found, using normal creation');

            const generatedOrderId = await generateOrderId(openBillData.tableNumbers || tableNumber || '');
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
                tableNumber: openBillData.tableNumbers || tableNumber || '',
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
                reservation: existingReservation?._id || null,
                isOpenBill: true,
                originalReservationId: openBillData.reservationId,
                created_by: createdByData,
            });
            await newOrder.save();

            if (existingReservation && !existingReservation.order_id) {
                existingReservation.order_id = newOrder._id;
                await existingReservation.save();
            }
        } else {
            // Normal order creation with tax calculation
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
                created_by: createdByData,
            });
            await newOrder.save();
        }

        // Verify order was saved
        const savedOrder = await Order.findById(newOrder._id);
        console.log('✅ Verified saved order:', {
            orderId: savedOrder._id,
            order_id: savedOrder.order_id,
            status: savedOrder.status,
            source: savedOrder.source,
            created_by: savedOrder.created_by,
            totalTax: savedOrder.totalTax,
            totalServiceFee: savedOrder.totalServiceFee,
            grandTotal: savedOrder.grandTotal,
            itemsCount: savedOrder.items.length,
            isOpenBill: savedOrder.isOpenBill
        });

        // Reservation creation
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
                console.error('Error creating reservation:', reservationError);
                await Order.findByIdAndDelete(newOrder._id);
                return res.status(500).json({
                    success: false,
                    message: 'Error creating reservation',
                    error: reservationError.message
                });
            }
        }

        // Response preparation
        const responseData = {
            success: true,
            message: isOpenBill ?
                'Items added to existing order successfully' :
                `${orderType === 'reservation' ? 'Reservation' : 'Order'} created successfully`,
            order: newOrder,
            isOpenBill: isOpenBill || false,
            existingReservation: isOpenBill ? existingReservation : null
        };

        if (reservationRecord) {
            responseData.reservation = reservationRecord;
        }

        // Enhanced mapping for frontend response
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

        // Emit to cashier application
        if (isOpenBill) {
            io.to('cashier_room').emit('open_bill_order', {
                mappedOrders,
                originalReservation: existingReservation,
                message: 'Additional items added to existing reservation'
            });
        } else {
            io.to('cashier_room').emit('new_order', { mappedOrders });
        }

        res.status(201).json(responseData);
    } catch (error) {
        console.error('Error in createAppOrder:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

// Helper function to parse Indonesian date format
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

// Fungsi untuk generate order ID dengan sequence harian per tableNumber
export async function generateOrderId(tableNumber) {
    // Dapatkan tanggal sekarang
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`; // misal "20250605"

    // Jika tidak ada tableNumber, gunakan hari dan tanggal
    let tableOrDayCode = tableNumber;
    if (!tableNumber) {
        const days = ['MD', 'TU', 'WD', 'TH', 'FR', 'ST', 'SN'];
        // getDay: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const dayCode = days[now.getDay()];
        tableOrDayCode = `${dayCode}${day}`;
    }

    // Kunci sequence unik per tableOrDayCode dan tanggal
    const key = `order_seq_${tableOrDayCode}_${dateStr}`;

    // Atomic increment dengan upsert dan reset setiap hari
    const result = await db.collection('counters').findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );

    const seq = result.value.seq;

    // Format orderId
    return `ORD-${day}${tableOrDayCode}-${String(seq).padStart(3, '0')}`;
}

const generatePaymentCode = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const HH = String(now.getHours()).padStart(2, '0');
    const MM = String(now.getMinutes()).padStart(2, '0');
    const SS = String(now.getSeconds()).padStart(2, '0');
    return `${dd}${mm}${yyyy}${HH}${MM}${SS}`;
};

function generateTransactionId() {
    const chars = '0123456789abcdef';
    const sections = [8, 4, 4, 4, 12];
    return sections.map(len =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    ).join('-');
}

export const charge = async (req, res) => {
    try {
        const {
            payment_type,
            is_down_payment,
            down_payment_amount,
            remaining_payment,
            transaction_details,
            bank_transfer,
            total_order_amount
        } = req.body;

        const payment_code = generatePaymentCode();
        let order_id, gross_amount;

        // === Ambil order_id & gross_amount sesuai tipe ===
        if (payment_type === 'cash') {
            order_id = req.body.order_id;
            gross_amount = req.body.gross_amount;
        } else {
            order_id = transaction_details?.order_id;
            gross_amount = transaction_details?.gross_amount;
        }

        // === Validasi order ===
        const order = await Order.findOne({ order_id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // === Cek apakah ada down payment yang masih pending ===
        const existingDownPayment = await Payment.findOne({
            order_id: order_id,
            paymentType: 'Down Payment',
            status: { $in: ['pending', 'expire'] } // belum dibayar
        }).sort({ createdAt: -1 });

        // === PERBAIKAN: Jika ada down payment pending, SELALU update (tidak perlu cek is_down_payment) ===
        if (existingDownPayment) {
            // Tambahkan ke total amount dulu
            const newTotalAmount = existingDownPayment.totalAmount + (total_order_amount || gross_amount);

            // Hitung proporsi amount dan remaining amount (50:50 dari total)
            const newDownPaymentAmount = newTotalAmount / 2;
            const newRemainingAmount = newTotalAmount - newDownPaymentAmount;

            console.log("Updating existing down payment:");
            console.log("Previous total amount:", existingDownPayment.totalAmount);
            console.log("Added total amount:", total_order_amount || gross_amount);
            console.log("New total amount:", newTotalAmount);
            console.log("New down payment amount (50%):", newDownPaymentAmount);
            console.log("New remaining amount (50%):", newRemainingAmount);

            // === Update untuk CASH ===
            if (payment_type === 'cash') {
                const transactionId = generateTransactionId();
                const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
                const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

                const qrData = { order_id: order._id.toString() };
                const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

                const actions = [{
                    name: "generate-qr-code",
                    method: "GET",
                    url: qrCodeBase64,
                }];

                const rawResponse = {
                    status_code: "200",
                    status_message: "Down payment amount updated successfully",
                    transaction_id: transactionId,
                    payment_code: payment_code,
                    order_id: order_id,
                    gross_amount: newDownPaymentAmount.toString() + ".00",
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

                // Update existing down payment
                await Payment.updateOne(
                    { _id: existingDownPayment._id },
                    {
                        $set: {
                            transaction_id: transactionId,
                            payment_code: payment_code,
                            amount: newDownPaymentAmount,
                            totalAmount: newTotalAmount,
                            remainingAmount: newRemainingAmount,
                            method: payment_type,
                            status: 'pending',
                            fraud_status: 'accept',
                            transaction_time: currentTime,
                            expiry_time: expiryTime,
                            actions: actions,
                            raw_response: rawResponse,
                            updatedAt: new Date()
                        }
                    }
                );

                const updatedPayment = await Payment.findById(existingDownPayment._id);

                return res.status(200).json({
                    ...rawResponse,
                    paymentType: 'Down Payment',
                    totalAmount: newTotalAmount,
                    remainingAmount: newRemainingAmount,
                    is_down_payment: true,
                    relatedPaymentId: null,
                    createdAt: updatedPayment.createdAt,
                    updatedAt: updatedPayment.updatedAt,
                    isUpdated: true,
                    previousAmount: existingDownPayment.amount,
                    previousTotalAmount: existingDownPayment.totalAmount,
                    addedTotalAmount: total_order_amount || gross_amount,
                    newAmount: newDownPaymentAmount,
                    newTotalAmount: newTotalAmount,
                    message: "Down payment updated with 50:50 split due to additional order items"
                });

            } else {
                // === Update untuk NON-CASH ===
                let chargeParams = {
                    payment_type: payment_type,
                    transaction_details: {
                        gross_amount: parseInt(newDownPaymentAmount),
                        order_id: payment_code,
                    },
                };

                // Setup payment method specific params
                if (payment_type === 'bank_transfer') {
                    if (!bank_transfer?.bank) {
                        return res.status(400).json({ success: false, message: 'Bank is required' });
                    }
                    chargeParams.bank_transfer = { bank: bank_transfer.bank };
                } else if (payment_type === 'gopay') {
                    chargeParams.gopay = {};
                } else if (payment_type === 'qris') {
                    chargeParams.qris = {};
                } else if (payment_type === 'shopeepay') {
                    chargeParams.shopeepay = {};
                } else if (payment_type === 'credit_card') {
                    chargeParams.credit_card = { secure: true };
                }

                const response = await coreApi.charge(chargeParams);

                // Update existing down payment
                await Payment.updateOne(
                    { _id: existingDownPayment._id },
                    {
                        $set: {
                            transaction_id: response.transaction_id,
                            payment_code: payment_code,
                            amount: newDownPaymentAmount,
                            totalAmount: newTotalAmount,
                            remainingAmount: newRemainingAmount,
                            method: payment_type,
                            status: response.transaction_status || 'pending',
                            fraud_status: response.fraud_status,
                            transaction_time: response.transaction_time,
                            expiry_time: response.expiry_time,
                            settlement_time: response.settlement_time || null,
                            va_numbers: response.va_numbers || [],
                            permata_va_number: response.permata_va_number || null,
                            bill_key: response.bill_key || null,
                            biller_code: response.biller_code || null,
                            pdf_url: response.pdf_url || null,
                            currency: response.currency || 'IDR',
                            merchant_id: response.merchant_id || null,
                            signature_key: response.signature_key || null,
                            actions: response.actions || [],
                            raw_response: response,
                            updatedAt: new Date()
                        }
                    }
                );

                return res.status(200).json({
                    ...response,
                    paymentType: 'Down Payment',
                    totalAmount: newTotalAmount,
                    remainingAmount: newRemainingAmount,
                    is_down_payment: true,
                    relatedPaymentId: null,
                    isUpdated: true,
                    previousAmount: existingDownPayment.amount,
                    previousTotalAmount: existingDownPayment.totalAmount,
                    addedTotalAmount: total_order_amount || gross_amount,
                    newAmount: newDownPaymentAmount,
                    newTotalAmount: newTotalAmount,
                    message: "Down payment updated with 50:50 split due to additional order items"
                });
            }
        }

        // === NEW: Cek apakah ada full payment yang masih pending ===
        const existingFullPayment = await Payment.findOne({
            order_id: order_id,
            paymentType: 'Full',
            status: { $in: ['pending', 'expire'] } // belum dibayar
        }).sort({ createdAt: -1 });

        // === NEW: Jika ada full payment pending, update dengan pesanan baru ===
        if (existingFullPayment) {
            // Hitung total full payment baru
            const additionalAmount = total_order_amount || gross_amount;
            const newFullPaymentAmount = existingFullPayment.amount + additionalAmount;

            console.log("Updating existing full payment:");
            console.log("Previous full payment amount:", existingFullPayment.amount);
            console.log("Added order amount:", additionalAmount);
            console.log("New full payment amount:", newFullPaymentAmount);

            // === Update untuk CASH ===
            if (payment_type === 'cash') {
                const transactionId = generateTransactionId();
                const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
                const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

                const qrData = { order_id: order._id.toString() };
                const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

                const actions = [{
                    name: "generate-qr-code",
                    method: "GET",
                    url: qrCodeBase64,
                }];

                const rawResponse = {
                    status_code: "200",
                    status_message: "Full payment amount updated successfully",
                    transaction_id: transactionId,
                    payment_code: payment_code,
                    order_id: order_id,
                    gross_amount: newFullPaymentAmount.toString() + ".00",
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

                // Update existing full payment
                await Payment.updateOne(
                    { _id: existingFullPayment._id },
                    {
                        $set: {
                            transaction_id: transactionId,
                            payment_code: payment_code,
                            amount: newFullPaymentAmount,
                            totalAmount: newFullPaymentAmount,
                            method: payment_type,
                            status: 'pending',
                            fraud_status: 'accept',
                            transaction_time: currentTime,
                            expiry_time: expiryTime,
                            actions: actions,
                            raw_response: rawResponse,
                            updatedAt: new Date()
                        }
                    }
                );

                const updatedPayment = await Payment.findById(existingFullPayment._id);

                return res.status(200).json({
                    ...rawResponse,
                    paymentType: 'Full',
                    totalAmount: newFullPaymentAmount,
                    remainingAmount: 0,
                    is_down_payment: false,
                    relatedPaymentId: null,
                    createdAt: updatedPayment.createdAt,
                    updatedAt: updatedPayment.updatedAt,
                    isUpdated: true,
                    previousAmount: existingFullPayment.amount,
                    addedTotalAmount: additionalAmount,
                    newAmount: newFullPaymentAmount,
                    message: "Full payment updated due to additional order items"
                });

            } else {
                // === Update untuk NON-CASH ===
                let chargeParams = {
                    payment_type: payment_type,
                    transaction_details: {
                        gross_amount: parseInt(newFullPaymentAmount),
                        order_id: payment_code,
                    },
                };

                // Setup payment method specific params
                if (payment_type === 'bank_transfer') {
                    if (!bank_transfer?.bank) {
                        return res.status(400).json({ success: false, message: 'Bank is required' });
                    }
                    chargeParams.bank_transfer = { bank: bank_transfer.bank };
                } else if (payment_type === 'gopay') {
                    chargeParams.gopay = {};
                } else if (payment_type === 'qris') {
                    chargeParams.qris = {};
                } else if (payment_type === 'shopeepay') {
                    chargeParams.shopeepay = {};
                } else if (payment_type === 'credit_card') {
                    chargeParams.credit_card = { secure: true };
                }

                const response = await coreApi.charge(chargeParams);

                // Update existing full payment
                await Payment.updateOne(
                    { _id: existingFullPayment._id },
                    {
                        $set: {
                            transaction_id: response.transaction_id,
                            payment_code: payment_code,
                            amount: newFullPaymentAmount,
                            totalAmount: newFullPaymentAmount,
                            method: payment_type,
                            status: response.transaction_status || 'pending',
                            fraud_status: response.fraud_status,
                            transaction_time: response.transaction_time,
                            expiry_time: response.expiry_time,
                            settlement_time: response.settlement_time || null,
                            va_numbers: response.va_numbers || [],
                            permata_va_number: response.permata_va_number || null,
                            bill_key: response.bill_key || null,
                            biller_code: response.biller_code || null,
                            pdf_url: response.pdf_url || null,
                            currency: response.currency || 'IDR',
                            merchant_id: response.merchant_id || null,
                            signature_key: response.signature_key || null,
                            actions: response.actions || [],
                            raw_response: response,
                            updatedAt: new Date()
                        }
                    }
                );

                return res.status(200).json({
                    ...response,
                    paymentType: 'Full',
                    totalAmount: newFullPaymentAmount,
                    remainingAmount: 0,
                    is_down_payment: false,
                    relatedPaymentId: null,
                    isUpdated: true,
                    previousAmount: existingFullPayment.amount,
                    addedTotalAmount: additionalAmount,
                    newAmount: newFullPaymentAmount,
                    message: "Full payment updated due to additional order items"
                });
            }
        }

        // === NEW: Cek apakah ada final payment yang masih pending ===
        const existingFinalPayment = await Payment.findOne({
            order_id: order_id,
            paymentType: 'Final Payment',
            status: { $in: ['pending', 'expire'] } // belum dibayar
        }).sort({ createdAt: -1 });

        // === NEW: Jika ada final payment pending, update dengan pesanan baru ===
        if (existingFinalPayment) {
            // Ambil down payment yang sudah settlement untuk kalkulasi
            const settledDownPayment = await Payment.findOne({
                order_id: order_id,
                paymentType: 'Down Payment',
                status: 'settlement'
            });

            if (settledDownPayment) {
                // Hitung total final payment baru
                const additionalAmount = total_order_amount || gross_amount;
                const newFinalPaymentAmount = existingFinalPayment.amount + additionalAmount;

                console.log("Updating existing final payment:");
                console.log("Previous final payment amount:", existingFinalPayment.amount);
                console.log("Added order amount:", additionalAmount);
                console.log("New final payment amount:", newFinalPaymentAmount);

                // === Update untuk CASH ===
                if (payment_type === 'cash') {
                    const transactionId = generateTransactionId();
                    const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
                    const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

                    const qrData = { order_id: order._id.toString() };
                    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

                    const actions = [{
                        name: "generate-qr-code",
                        method: "GET",
                        url: qrCodeBase64,
                    }];

                    const rawResponse = {
                        status_code: "200",
                        status_message: "Final payment amount updated successfully",
                        transaction_id: transactionId,
                        payment_code: payment_code,
                        order_id: order_id,
                        gross_amount: newFinalPaymentAmount.toString() + ".00",
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

                    // Update existing final payment
                    await Payment.updateOne(
                        { _id: existingFinalPayment._id },
                        {
                            $set: {
                                transaction_id: transactionId,
                                payment_code: payment_code,
                                amount: newFinalPaymentAmount,
                                totalAmount: newFinalPaymentAmount,
                                method: payment_type,
                                status: 'pending',
                                fraud_status: 'accept',
                                transaction_time: currentTime,
                                expiry_time: expiryTime,
                                actions: actions,
                                raw_response: rawResponse,
                                updatedAt: new Date()
                            }
                        }
                    );

                    const updatedPayment = await Payment.findById(existingFinalPayment._id);

                    return res.status(200).json({
                        ...rawResponse,
                        paymentType: 'Final Payment',
                        totalAmount: newFinalPaymentAmount,
                        remainingAmount: 0,
                        is_down_payment: false,
                        relatedPaymentId: settledDownPayment._id,
                        createdAt: updatedPayment.createdAt,
                        updatedAt: updatedPayment.updatedAt,
                        isUpdated: true,
                        previousAmount: existingFinalPayment.amount,
                        addedTotalAmount: additionalAmount,
                        newAmount: newFinalPaymentAmount,
                        message: "Final payment updated due to additional order items"
                    });

                } else {
                    // === Update untuk NON-CASH ===
                    let chargeParams = {
                        payment_type: payment_type,
                        transaction_details: {
                            gross_amount: parseInt(newFinalPaymentAmount),
                            order_id: payment_code,
                        },
                    };

                    // Setup payment method specific params
                    if (payment_type === 'bank_transfer') {
                        if (!bank_transfer?.bank) {
                            return res.status(400).json({ success: false, message: 'Bank is required' });
                        }
                        chargeParams.bank_transfer = { bank: bank_transfer.bank };
                    } else if (payment_type === 'gopay') {
                        chargeParams.gopay = {};
                    } else if (payment_type === 'qris') {
                        chargeParams.qris = {};
                    } else if (payment_type === 'shopeepay') {
                        chargeParams.shopeepay = {};
                    } else if (payment_type === 'credit_card') {
                        chargeParams.credit_card = { secure: true };
                    }

                    const response = await coreApi.charge(chargeParams);

                    // Update existing final payment
                    await Payment.updateOne(
                        { _id: existingFinalPayment._id },
                        {
                            $set: {
                                transaction_id: response.transaction_id,
                                payment_code: response_code,
                                amount: newFinalPaymentAmount,
                                totalAmount: newFinalPaymentAmount,
                                method: payment_type,
                                status: response.transaction_status || 'pending',
                                fraud_status: response.fraud_status,
                                transaction_time: response.transaction_time,
                                expiry_time: response.expiry_time,
                                settlement_time: response.settlement_time || null,
                                va_numbers: response.va_numbers || [],
                                permata_va_number: response.permata_va_number || null,
                                bill_key: response.bill_key || null,
                                biller_code: response.biller_code || null,
                                pdf_url: response.pdf_url || null,
                                currency: response.currency || 'IDR',
                                merchant_id: response.merchant_id || null,
                                signature_key: response.signature_key || null,
                                actions: response.actions || [],
                                raw_response: response,
                                updatedAt: new Date()
                            }
                        }
                    );

                    return res.status(200).json({
                        ...response,
                        paymentType: 'Final Payment',
                        totalAmount: newFinalPaymentAmount,
                        remainingAmount: 0,
                        is_down_payment: false,
                        relatedPaymentId: settledDownPayment._id,
                        isUpdated: true,
                        previousAmount: existingFinalPayment.amount,
                        addedTotalAmount: additionalAmount,
                        newAmount: newFinalPaymentAmount,
                        message: "Final payment updated due to additional order items"
                    });
                }
            }
        }

        // === Lanjutkan dengan logika create baru HANYA jika tidak ada existing payment pending ===

        // === Cari pembayaran terakhir ===
        const lastPayment = await Payment.findOne({ order_id }).sort({ createdAt: -1 });
        let relatedPaymentId = lastPayment ? lastPayment._id : null;

        // === Tentukan payment type ===
        let paymentType, amount, remainingAmount, totalAmount;

        if (is_down_payment === true) {
            paymentType = 'Down Payment';
            amount = down_payment_amount || gross_amount;
            totalAmount = total_order_amount || gross_amount;
            remainingAmount = totalAmount - amount;
        } else {
            // Cek untuk final payment logic - HANYA yang sudah settlement
            const settledDownPayment = await Payment.findOne({
                order_id: order_id,
                paymentType: 'Down Payment',
                status: 'settlement' // HANYA yang sudah dibayar
            });

            if (settledDownPayment) {
                // Cek apakah ada Final Payment yang sudah settlement juga
                const settledFinalPayment = await Payment.findOne({
                    order_id: order_id,
                    paymentType: 'Final Payment',
                    status: 'settlement'
                });

                if (settledFinalPayment) {
                    // Jika DP dan Final Payment sudah settlement, buat payment baru sebagai Full Payment
                    paymentType = 'Full';
                    amount = gross_amount; // Hanya amount pesanan baru
                    totalAmount = gross_amount; // Tidak tambahkan data lama yang sudah settlement
                    remainingAmount = 0;

                    console.log("Creating new full payment (previous payments already settled):");
                    console.log("New order amount:", gross_amount);

                    // Tetap reference ke Final Payment terakhir untuk pemetaan
                    relatedPaymentId = settledFinalPayment._id;
                } else {
                    // Jika hanya DP yang settlement, lanjutkan logic Final Payment seperti biasa
                    paymentType = 'Final Payment';
                    amount = gross_amount; // Gunakan amount yang dikirim user
                    totalAmount = settledDownPayment.amount + gross_amount; // DP amount + final payment amount
                    remainingAmount = 0;

                    console.log("Creating final payment:");
                    console.log("Down payment amount:", settledDownPayment.amount);
                    console.log("Final payment amount:", gross_amount);
                    console.log("Total amount:", totalAmount);

                    // Final payment → selalu link ke DP utama
                    relatedPaymentId = settledDownPayment._id;
                }
            } else {
                // Jika tidak ada settled down payment, berarti full payment
                paymentType = 'Full';
                amount = gross_amount;
                totalAmount = gross_amount;
                remainingAmount = 0;
            }
        }

        // === Sisanya sama seperti kode sebelumnya untuk create payment baru ===

        // === CASE 1: CASH ===
        if (payment_type === 'cash') {
            const transactionId = generateTransactionId();
            const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
            const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

            const qrData = { order_id: order._id.toString() };
            const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

            const actions = [{
                name: "generate-qr-code",
                method: "GET",
                url: qrCodeBase64,
            }];

            const rawResponse = {
                status_code: "201",
                status_message: `Cash ${paymentType.toLowerCase()} transaction is created`,
                transaction_id: transactionId,
                payment_code: payment_code,
                order_id: order_id,
                gross_amount: amount.toString() + ".00",
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

            const payment = new Payment({
                transaction_id: transactionId,
                order_id: order_id,
                payment_code: payment_code,
                amount: amount,
                totalAmount: totalAmount,
                method: payment_type,
                status: 'pending',
                fraud_status: 'accept',
                transaction_time: currentTime,
                expiry_time: expiryTime,
                settlement_time: null,
                currency: 'IDR',
                merchant_id: 'G055993835',
                paymentType: paymentType,
                remainingAmount: remainingAmount,
                relatedPaymentId: relatedPaymentId,
                actions: actions,
                raw_response: rawResponse
            });

            const savedPayment = await payment.save();

            await Order.updateOne(
                { order_id: order_id },
                { $addToSet: { payment_ids: savedPayment._id } }
            );

            return res.status(200).json({
                ...rawResponse,
                paymentType,
                totalAmount,
                remainingAmount,
                is_down_payment: is_down_payment || false,
                relatedPaymentId,
                createdAt: savedPayment.createdAt,
                updatedAt: savedPayment.updatedAt,
            });
        }

        // === CASE 2: NON-CASH ===
        if (!order_id || !gross_amount) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and gross amount are required'
            });
        }

        let chargeParams = {
            payment_type: payment_type,
            transaction_details: {
                gross_amount: parseInt(amount),
                order_id: payment_code,
            },
        };

        if (payment_type === 'bank_transfer') {
            if (!bank_transfer?.bank) {
                return res.status(400).json({ success: false, message: 'Bank is required' });
            }
            chargeParams.bank_transfer = { bank: bank_transfer.bank };
        } else if (payment_type === 'gopay') {
            chargeParams.gopay = {};
        } else if (payment_type === 'qris') {
            chargeParams.qris = {};
        } else if (payment_type === 'shopeepay') {
            chargeParams.shopeepay = {};
        } else if (payment_type === 'credit_card') {
            chargeParams.credit_card = { secure: true };
        }

        const response = await coreApi.charge(chargeParams);

        const payment = new Payment({
            transaction_id: response.transaction_id,
            order_id: order_id,
            payment_code: payment_code,
            amount: parseInt(amount),
            totalAmount: totalAmount,
            method: payment_type,
            status: response.transaction_status || 'pending',
            fraud_status: response.fraud_status,
            transaction_time: response.transaction_time,
            expiry_time: response.expiry_time,
            settlement_time: response.settlement_time || null,
            va_numbers: response.va_numbers || [],
            permata_va_number: response.permata_va_number || null,
            bill_key: response.bill_key || null,
            biller_code: response.biller_code || null,
            pdf_url: response.pdf_url || null,
            currency: response.currency || 'IDR',
            merchant_id: response.merchant_id || null,
            signature_key: response.signature_key || null,
            actions: response.actions || [],
            paymentType: paymentType,
            remainingAmount: remainingAmount,
            relatedPaymentId: relatedPaymentId,
            raw_response: response
        });

        const savedPayment = await payment.save();

        await Order.updateOne(
            { order_id: order_id },
            { $addToSet: { payment_ids: savedPayment._id } }
        );

        return res.status(200).json({
            ...response,
            paymentType,
            totalAmount,
            remainingAmount,
            is_down_payment: is_down_payment || false,
            relatedPaymentId,
            down_payment_amount: is_down_payment ? down_payment_amount : null,
        });

    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Payment failed',
            error: error.message || error
        });
    }
};