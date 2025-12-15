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
import { broadcastCashOrderToKitchen, broadcastNewOrderToAreas, broadcastOrderCreation, triggerImmediatePrint } from '../helpers/broadcast.helper.js';
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
import { LockUtil } from '../utils/lock.util.js';
import { validateAndNormalizePaymentDetails } from '../utils/payment.utils.js';

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

// export const createAppOrder = async (req, res) => {
//   try {
//     const {
//       items,
//       orderType,
//       tableNumber,
//       deliveryAddress,
//       pickupTime,
//       paymentDetails,
//       voucherCode,
//       userId,
//       outlet,
//       reservationData,
//       reservationType,
//       isOpenBill,
//       openBillData,
//       taxDetails,
//       totalTax,
//       subtotal: frontendSubtotal,
//       discount: frontendDiscount,
//       // ✅ TAMBAHAN: Parameter untuk GRO mode
//       isGroMode,
//       groId,
//       userName,
//       guestPhone,
//     } = req.body;

//     console.log('Received createAppOrder request:', {
//       isGroMode,
//       groId,
//       userName,
//       guestPhone,
//       userId,
//     });

//     // Validasi items, kecuali reservasi tanpa open bill
//     if ((!items || items.length === 0) && !(orderType === 'reservation' && !isOpenBill)) {
//       return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
//     }
//     if (!isOpenBill && !orderType) {
//       return res.status(400).json({ success: false, message: 'Order type is required' });
//     }

//     if (!paymentDetails?.method) {
//       return res.status(400).json({ success: false, message: 'Payment method is required' });
//     }

//     // ✅ PERBAIKAN: Validasi user berbeda untuk GRO mode
//     let userExists = null;
//     let finalUserId = null;
//     let finalUserName = userName || 'Guest';

//     if (isGroMode) {
//       // Untuk GRO mode, validasi GRO yang login
//       if (!groId) {
//         return res.status(400).json({ success: false, message: 'GRO ID is required for GRO mode' });
//       }

//       const groExists = await User.findById(groId);
//       if (!groExists) {
//         return res.status(404).json({ success: false, message: 'GRO not found' });
//       }

//       // Untuk order, gunakan guest name yang dimasukkan GRO
//       finalUserId = null; // Biarkan null untuk guest
//       finalUserName = userName || 'Guest';

//       console.log('✅ GRO Mode - Order akan dibuat atas nama guest:', finalUserName);
//     } else {
//       // Normal user flow
//       if (!userId) {
//         return res.status(400).json({ success: false, message: 'User ID is required' });
//       }

//       userExists = await User.findById(userId);
//       if (!userExists) {
//         return res.status(404).json({ success: false, message: 'User not found' });
//       }

//       finalUserId = userId;
//       finalUserName = userExists.username || 'Guest';
//     }

//     // Handle Open Bill scenario - find existing reservation order
//     let existingOrder = null;
//     let existingReservation = null;

//     if (isOpenBill && openBillData) {
//       existingReservation = await Reservation.findById(openBillData.reservationId);
//       if (!existingReservation) {
//         return res.status(404).json({
//           success: false,
//           message: 'Reservation not found for open bill'
//         });
//       }

//       if (existingReservation.order_id) {
//         existingOrder = await Order.findById(existingReservation.order_id);
//       }
//     }

//     // Format orderType
//     let formattedOrderType = '';
//     switch (orderType) {
//       case 'dineIn':
//         formattedOrderType = 'Dine-In';
//         if (!tableNumber && !isOpenBill) {
//           return res.status(400).json({ success: false, message: 'Table number is required for dine-in orders' });
//         }
//         break;
//       case 'delivery':
//         formattedOrderType = 'Delivery';
//         if (!deliveryAddress) {
//           return res.status(400).json({ success: false, message: 'Delivery address is required for delivery orders' });
//         }
//         break;
//       case 'pickup':
//         formattedOrderType = 'Pickup';
//         if (!pickupTime) {
//           return res.status(400).json({ success: false, message: 'Pickup time is required for pickup orders' });
//         }
//         break;
//       case 'takeAway':
//         formattedOrderType = 'Take Away';
//         break;
//       case 'reservation':
//         formattedOrderType = 'Reservation';
//         if (!reservationData && !isOpenBill) {
//           return res.status(400).json({ success: false, message: 'Reservation data is required for reservation orders' });
//         }
//         if (isOpenBill) {
//           formattedOrderType = 'Reservation';
//         }
//         break;
//       default:
//         return res.status(400).json({ success: false, message: 'Invalid order type' });
//     }

//     // Handle pickup time
//     let parsedPickupTime = null;
//     if (orderType === 'pickup') {
//       if (!pickupTime) {
//         return res.status(400).json({ success: false, message: 'Pickup time is required for pickup orders' });
//       }

//       const [hours, minutes] = pickupTime.split(':').map(Number);
//       const now = new Date();
//       parsedPickupTime = new Date(
//         now.getFullYear(),
//         now.getMonth(),
//         now.getDate(),
//         hours,
//         minutes
//       );
//     }

//     // Find voucher if provided
//     let voucherId = null;
//     let voucherAmount = 0;
//     let discountType = null;
//     if (voucherCode) {
//       const voucher = await Voucher.findOneAndUpdate(
//         { code: voucherCode },
//         { $inc: { quota: -1 } },
//         { new: true }
//       );
//       if (voucher) {
//         voucherId = voucher._id;
//         voucherAmount = voucher.discountAmount;
//         discountType = voucher.discountType;
//       }
//     }

//     // Process items (jika ada)
//     const orderItems = [];
//     if (items && items.length > 0) {
//       for (const item of items) {
//         const menuItem = await MenuItem.findById(item.productId).populate('availableAt');
//         if (!menuItem) {
//           return res.status(404).json({
//             success: false,
//             message: `Menu item not found: ${item.productId}`
//           });
//         }

//         const processedAddons = item.addons?.map(addon => ({
//           name: addon.name,
//           price: addon.price
//         })) || [];

//         const processedToppings = item.toppings?.map(topping => ({
//           name: topping.name,
//           price: topping.price
//         })) || [];

//         const addonsTotal = processedAddons.reduce((sum, addon) => sum + addon.price, 0);
//         const toppingsTotal = processedToppings.reduce((sum, topping) => sum + topping.price, 0);
//         const itemSubtotal = item.quantity * (menuItem.price + addonsTotal + toppingsTotal);

//         orderItems.push({
//           menuItem: menuItem._id,
//           quantity: item.quantity,
//           subtotal: itemSubtotal,
//           addons: processedAddons,
//           toppings: processedToppings,
//           notes: item.notes || '',
//           outletId: menuItem.availableAt?.[0]?._id || null,
//           outletName: menuItem.availableAt?.[0]?.name || null,
//           isPrinted: false,
//           payment_id: null,
//         });
//       }
//     }

//     // Perhitungan konsisten
//     let totalBeforeDiscount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
//     if (orderType === 'reservation' && !isOpenBill && orderItems.length === 0) {
//       totalBeforeDiscount = 25000;
//     }

//     let totalAfterDiscount = totalBeforeDiscount;
//     if (discountType === 'percentage') {
//       totalAfterDiscount = totalBeforeDiscount - (totalBeforeDiscount * (voucherAmount / 100));
//     } else if (discountType === 'fixed') {
//       totalAfterDiscount = totalBeforeDiscount - voucherAmount;
//       if (totalAfterDiscount < 0) totalAfterDiscount = 0;
//     }

//     // Calculate tax and service fees
//     const isReservationOrder = orderType === 'reservation';
//     const isOpenBillOrder = isOpenBill || false;

//     const taxServiceCalculation = await calculateTaxAndService(
//       totalAfterDiscount,
//       outlet || "67cbc9560f025d897d69f889",
//       isReservationOrder,
//       isOpenBillOrder
//     );

//     const grandTotal = totalAfterDiscount + taxServiceCalculation.totalTax + taxServiceCalculation.totalServiceFee;

//     let newOrder;

//     // Handle Open Bill scenario
//     if (isOpenBill && existingOrder) {
//       existingOrder.items.push(...orderItems);
//       const newItemsTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
//       existingOrder.totalBeforeDiscount += newItemsTotal;

//       let updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount;
//       if (discountType === 'percentage') {
//         updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount - (existingOrder.totalBeforeDiscount * (voucherAmount / 100));
//       } else if (discountType === 'fixed') {
//         updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount - voucherAmount;
//         if (updatedTotalAfterDiscount < 0) updatedTotalAfterDiscount = 0;
//       }

//       const updatedTaxCalculation = await calculateTaxAndService(
//         updatedTotalAfterDiscount,
//         outlet || "67cbc9560f025d897d69f889",
//         isReservationOrder,
//         true
//       );

//       existingOrder.totalAfterDiscount = updatedTotalAfterDiscount;
//       existingOrder.totalTax = updatedTaxCalculation.totalTax;
//       existingOrder.totalServiceFee = updatedTaxCalculation.totalServiceFee;
//       existingOrder.taxAndServiceDetails = updatedTaxCalculation.taxAndServiceDetails;
//       existingOrder.grandTotal = updatedTotalAfterDiscount + updatedTaxCalculation.totalTax + updatedTaxCalculation.totalServiceFee;

//       await existingOrder.save();
//       newOrder = existingOrder;
//     }
//     else if (isOpenBill && !existingOrder) {
//       const generatedOrderId = await generateOrderId(openBillData.tableNumbers || tableNumber || '');
//       newOrder = new Order({
//         order_id: generatedOrderId,
//         user_id: finalUserId,
//         user: finalUserName,
//         cashier: null,
//         groId: isGroMode ? groId : null, // ✅ Simpan GRO ID jika dari GRO mode
//         items: orderItems,
//         status: 'Reserved',
//         paymentMethod: paymentDetails.method,
//         orderType: formattedOrderType,
//         deliveryAddress: deliveryAddress || '',
//         tableNumber: openBillData.tableNumbers || tableNumber || '',
//         type: 'Indoor',
//         voucher: voucherId,
//         outlet: outlet && outlet !== "" ? outlet : "67cbc9560f025d897d69f889",
//         totalBeforeDiscount,
//         totalAfterDiscount,
//         totalTax: taxServiceCalculation.totalTax,
//         totalServiceFee: taxServiceCalculation.totalServiceFee,
//         discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
//         appliedPromos: [],
//         appliedManualPromo: null,
//         appliedVoucher: voucherId,
//         taxAndServiceDetails: taxServiceCalculation.taxAndServiceDetails,
//         grandTotal: grandTotal,
//         promotions: [],
//         source: 'App',
//         reservation: existingReservation._id,
//         isOpenBill: true,
//         originalReservationId: openBillData.reservationId,
//       });
//       await newOrder.save();

//       if (!existingReservation.order_id) {
//         existingReservation.order_id = newOrder._id;
//         await existingReservation.save();
//       }
//     } else {
//       // Normal order creation
//       const generatedOrderId = await generateOrderId(tableNumber || '');
//       newOrder = new Order({
//         order_id: generatedOrderId,
//         user_id: finalUserId,
//         user: finalUserName,
//         cashier: null,
//         groId: isGroMode ? groId : null, // ✅ Simpan GRO ID jika dari GRO mode
//         items: orderItems,
//         status: orderType === 'reservation' ? 'Reserved' : 'Pending',
//         paymentMethod: paymentDetails.method,
//         orderType: formattedOrderType,
//         deliveryAddress: deliveryAddress || '',
//         tableNumber: tableNumber || '',
//         pickupTime: parsedPickupTime,
//         type: 'Indoor',
//         voucher: voucherId,
//         outlet: outlet && outlet !== "" ? outlet : "67cbc9560f025d897d69f889",
//         totalBeforeDiscount,
//         totalAfterDiscount,
//         totalTax: taxServiceCalculation.totalTax,
//         totalServiceFee: taxServiceCalculation.totalServiceFee,
//         discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
//         appliedPromos: [],
//         appliedManualPromo: null,
//         appliedVoucher: voucherId,
//         taxAndServiceDetails: taxServiceCalculation.taxAndServiceDetails,
//         grandTotal: grandTotal,
//         promotions: [],
//         source: 'App',
//         reservation: null,
//       });
//       await newOrder.save();
//     }

//     // ✅ RESERVATION CREATION - Update untuk include GRO data
//     let reservationRecord = null;
//     if (orderType === 'reservation' && !isOpenBill) {
//       try {
//         let parsedReservationDate;

//         if (reservationData.reservationDate) {
//           if (typeof reservationData.reservationDate === 'string') {
//             parsedReservationDate = reservationData.reservationDate.match(/Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember/)
//               ? parseIndonesianDate(reservationData.reservationDate)
//               : new Date(reservationData.reservationDate);
//           } else {
//             parsedReservationDate = new Date(reservationData.reservationDate);
//           }
//         } else {
//           parsedReservationDate = new Date();
//         }

//         if (isNaN(parsedReservationDate.getTime())) {
//           return res.status(400).json({
//             success: false,
//             message: 'Invalid reservation date format. Please use YYYY-MM-DD or standard date format.'
//           });
//         }

//         // ✅ PERBAIKAN UTAMA: Simpan data GRO di created_by
//         const createdByData = isGroMode && groId ? {
//           employee_id: groId,
//           employee_name: (await User.findById(groId))?.username || 'Unknown GRO',
//           created_at: new Date()
//         } : {
//           employee_id: null,
//           employee_name: null,
//           created_at: new Date()
//         };

//         reservationRecord = new Reservation({
//           reservation_date: parsedReservationDate,
//           reservation_time: reservationData.reservationTime,
//           area_id: reservationData.areaIds,
//           table_id: reservationData.tableIds,
//           guest_count: reservationData.guestCount,
//           guest_number: isGroMode ? guestPhone : null, // ✅ Simpan nomor telepon guest
//           order_id: newOrder._id,
//           status: 'pending',
//           reservation_type: reservationType || 'nonBlocking',
//           notes: reservationData.notes || '',
//           created_by: createdByData // ✅ Simpan data GRO yang membuat
//         });

//         await reservationRecord.save();

//         newOrder.reservation = reservationRecord._id;
//         await newOrder.save();

//         console.log('✅ Reservation created with GRO data:', {
//           reservationId: reservationRecord._id,
//           createdBy: createdByData,
//           guestNumber: guestPhone
//         });
//       } catch (reservationError) {
//         console.error('Error creating reservation:', reservationError);
//         await Order.findByIdAndDelete(newOrder._id);
//         return res.status(500).json({
//           success: false,
//           message: 'Error creating reservation',
//           error: reservationError.message
//         });
//       }
//     }

//     // Response preparation
//     const responseData = {
//       success: true,
//       message: isOpenBill ?
//         'Items added to existing order successfully' :
//         `${orderType === 'reservation' ? 'Reservation' : 'Order'} created successfully`,
//       order: newOrder,
//       isOpenBill: isOpenBill || false,
//       existingReservation: isOpenBill ? existingReservation : null
//     };

//     if (reservationRecord) {
//       responseData.reservation = reservationRecord;
//     }

//     // Enhanced mapping for frontend response
//     const mappedOrders = {
//       _id: newOrder._id,
//       userId: newOrder.user_id,
//       customerName: newOrder.user,
//       cashierId: newOrder.cashier,
//       groId: newOrder.groId, // ✅ Include GRO ID in response
//       items: newOrder.items.map(item => ({
//         _id: item._id,
//         quantity: item.quantity,
//         subtotal: item.subtotal,
//         isPrinted: item.isPrinted,
//         menuItem: {
//           ...item.menuItem,
//           categories: item.menuItem.category,
//         },
//         selectedAddons: item.addons.length > 0 ? item.addons.map(addon => ({
//           name: addon.name,
//           _id: addon._id,
//           options: [{
//             id: addon._id,
//             label: addon.label || addon.name,
//             price: addon.price
//           }]
//         })) : [],
//         selectedToppings: item.toppings.length > 0 ? item.toppings.map(topping => ({
//           id: topping._id || topping.id,
//           name: topping.name,
//           price: topping.price
//         })) : []
//       })),
//       status: newOrder.status,
//       orderType: newOrder.orderType,
//       deliveryAddress: newOrder.deliveryAddress,
//       tableNumber: newOrder.tableNumber,
//       pickupTime: newOrder.pickupTime,
//       type: newOrder.type,
//       paymentMethod: newOrder.paymentMethod || "Cash",
//       totalPrice: newOrder.totalBeforeDiscount,
//       totalAfterDiscount: newOrder.totalAfterDiscount,
//       totalTax: newOrder.totalTax,
//       totalServiceFee: newOrder.totalServiceFee,
//       taxAndServiceDetails: newOrder.taxAndServiceDetails,
//       grandTotal: newOrder.grandTotal,
//       voucher: newOrder.voucher || null,
//       outlet: newOrder.outlet || null,
//       promotions: newOrder.promotions || [],
//       createdAt: newOrder.createdAt,
//       updatedAt: newOrder.updatedAt,
//       __v: newOrder.__v,
//       isOpenBill: isOpenBill || false
//     };

//     // Emit to cashier application
//     if (isOpenBill) {
//       io.to('cashier_room').emit('open_bill_order', {
//         mappedOrders,
//         originalReservation: existingReservation,
//         message: 'Additional items added to existing reservation'
//       });
//     } else {
//       io.to('cashier_room').emit('new_order', { mappedOrders });
//     }

//     res.status(201).json(responseData);
//   } catch (error) {
//     console.error('Error in createAppOrder:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating order',
//       error: error.message
//     });
//   }
// };

// export const createAppOrder = async (req, res) => {
//   try {
//     const {
//       items,
//       orderType,
//       tableNumber,
//       deliveryAddress,
//       pickupTime,
//       paymentDetails,
//       voucherCode,
//       userId,
//       outlet,
//       reservationData,
//       reservationType,
//       isOpenBill,
//       openBillData,
//       // Add new parameters from frontend
//       taxDetails,
//       totalTax,
//       subtotal: frontendSubtotal,
//       discount: frontendDiscount
//     } = req.body;

//     console.log('Received createAppOrder request:', req.body);

//     //  Validasi items, kecuali reservasi tanpa open bill
//     if ((!items || items.length === 0) && !(orderType === 'reservation' && !isOpenBill)) {
//       return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
//     }
//     if (!isOpenBill && !orderType) {
//       return res.status(400).json({ success: false, message: 'Order type is required' });
//     }

//     if (!paymentDetails?.method) {
//       return res.status(400).json({ success: false, message: 'Payment method is required' });
//     }
//     if (!userId) {
//       return res.status(400).json({ success: false, message: 'User ID is required' });
//     }

//     // Verify user exists
//     const userExists = await User.findById(userId);
//     if (!userExists) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     // Handle Open Bill scenario - find existing reservation order
//     let existingOrder = null;
//     let existingReservation = null;

//     if (isOpenBill && openBillData) {
//       existingReservation = await Reservation.findById(openBillData.reservationId);
//       if (!existingReservation) {
//         return res.status(404).json({
//           success: false,
//           message: 'Reservation not found for open bill'
//         });
//       }

//       if (existingReservation.order_id) {
//         existingOrder = await Order.findById(existingReservation.order_id);
//       }
//     }

//     //  Format orderType
//     let formattedOrderType = '';
//     switch (orderType) {
//       case 'dineIn':
//         formattedOrderType = 'Dine-In';
//         if (!tableNumber && !isOpenBill) {
//           return res.status(400).json({ success: false, message: 'Table number is required for dine-in orders' });
//         }
//         break;
//       case 'delivery':
//         formattedOrderType = 'Delivery';
//         if (!deliveryAddress) {
//           return res.status(400).json({ success: false, message: 'Delivery address is required for delivery orders' });
//         }
//         break;
//       case 'pickup':
//         formattedOrderType = 'Pickup';
//         if (!pickupTime) {
//           return res.status(400).json({ success: false, message: 'Pickup time is required for pickup orders' });
//         }
//         break;
//       case 'takeAway':
//         formattedOrderType = 'Take Away';
//         //  Tidak perlu validasi tambahan
//         break;
//       case 'reservation':
//         formattedOrderType = 'Reservation';
//         if (!reservationData && !isOpenBill) {
//           return res.status(400).json({ success: false, message: 'Reservation data is required for reservation orders' });
//         }
//         if (isOpenBill) {
//           formattedOrderType = 'Reservation';
//         }
//         break;
//       default:
//         return res.status(400).json({ success: false, message: 'Invalid order type' });
//     }

//     // Handle pickup time
//     let parsedPickupTime = null;
//     if (orderType === 'pickup') {
//       if (!pickupTime) {
//         return res.status(400).json({ success: false, message: 'Pickup time is required for pickup orders' });
//       }

//       // Convert "HH:mm" -> Date
//       const [hours, minutes] = pickupTime.split(':').map(Number);
//       const now = new Date();
//       parsedPickupTime = new Date(
//         now.getFullYear(),
//         now.getMonth(),
//         now.getDate(),
//         hours,
//         minutes
//       );
//     }


//     // Find voucher if provided
//     let voucherId = null;
//     let voucherAmount = 0;
//     let discountType = null;
//     if (voucherCode) {
//       const voucher = await Voucher.findOneAndUpdate(
//         { code: voucherCode },
//         { $inc: { quota: -1 } },
//         { new: true }
//       );
//       if (voucher) {
//         voucherId = voucher._id;
//         voucherAmount = voucher.discountAmount;
//         discountType = voucher.discountType;
//       }
//     }

//     // Process items (jika ada)
//     const orderItems = [];
//     if (items && items.length > 0) {
//       for (const item of items) {
//         const menuItem = await MenuItem.findById(item.productId).populate('availableAt');
//         if (!menuItem) {
//           return res.status(404).json({
//             success: false,
//             message: `Menu item not found: ${item.productId}`
//           });
//         }

//         const processedAddons = item.addons?.map(addon => ({
//           name: addon.name,
//           price: addon.price
//         })) || [];

//         const processedToppings = item.toppings?.map(topping => ({
//           name: topping.name,
//           price: topping.price
//         })) || [];

//         const addonsTotal = processedAddons.reduce((sum, addon) => sum + addon.price, 0);
//         const toppingsTotal = processedToppings.reduce((sum, topping) => sum + topping.price, 0);
//         const itemSubtotal = item.quantity * (menuItem.price + addonsTotal + toppingsTotal);

//         orderItems.push({
//           menuItem: menuItem._id,
//           quantity: item.quantity,
//           subtotal: itemSubtotal,
//           addons: processedAddons,
//           toppings: processedToppings,
//           notes: item.notes || '',
//           outletId: menuItem.availableAt?.[0]?._id || null,
//           outletName: menuItem.availableAt?.[0]?.name || null,
//           isPrinted: false,
//           payment_id: null,
//         });
//       }
//     }

//     //  Perhitungan konsisten
//     let totalBeforeDiscount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
//     if (orderType === 'reservation' && !isOpenBill && orderItems.length === 0) {
//       totalBeforeDiscount = 25000; // minimal reservasi tanpa menu
//     }

//     let totalAfterDiscount = totalBeforeDiscount;
//     if (discountType === 'percentage') {
//       totalAfterDiscount = totalBeforeDiscount - (totalBeforeDiscount * (voucherAmount / 100));
//     } else if (discountType === 'fixed') {
//       totalAfterDiscount = totalBeforeDiscount - voucherAmount;
//       if (totalAfterDiscount < 0) totalAfterDiscount = 0;
//     }

//     // Calculate tax and service fees
//     const isReservationOrder = orderType === 'reservation';
//     const isOpenBillOrder = isOpenBill || false;

//     console.log('Tax calculation parameters:', {
//       totalAfterDiscount,
//       outlet: outlet || "67cbc9560f025d897d69f889",
//       isReservationOrder,
//       isOpenBillOrder
//     });

//     const taxServiceCalculation = await calculateTaxAndService(
//       totalAfterDiscount,
//       outlet || "67cbc9560f025d897d69f889",
//       isReservationOrder,
//       isOpenBillOrder
//     );

//     console.log('Backend tax calculation result:', taxServiceCalculation);

//     // Calculate grand total including tax and service
//     const grandTotal = totalAfterDiscount + taxServiceCalculation.totalTax + taxServiceCalculation.totalServiceFee;

//     console.log('Final totals:', {
//       totalAfterDiscount,
//       taxAmount: taxServiceCalculation.totalTax,
//       serviceAmount: taxServiceCalculation.totalServiceFee,
//       grandTotal
//     });

//     let newOrder;

//     // Handle Open Bill scenario - NOW WITH TAX CALCULATION
//     if (isOpenBill && existingOrder) {
//       existingOrder.items.push(...orderItems);

//       const newItemsTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
//       existingOrder.totalBeforeDiscount += newItemsTotal;

//       // Recalculate discount
//       let updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount;
//       if (discountType === 'percentage') {
//         updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount - (existingOrder.totalBeforeDiscount * (voucherAmount / 100));
//       } else if (discountType === 'fixed') {
//         updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount - voucherAmount;
//         if (updatedTotalAfterDiscount < 0) updatedTotalAfterDiscount = 0;
//       }

//       // Recalculate tax for open bill (now applies tax)
//       const updatedTaxCalculation = await calculateTaxAndService(
//         updatedTotalAfterDiscount,
//         outlet || "67cbc9560f025d897d69f889",
//         isReservationOrder,
//         true // isOpenBill = true
//       );

//       existingOrder.totalAfterDiscount = updatedTotalAfterDiscount;
//       existingOrder.totalTax = updatedTaxCalculation.totalTax;
//       existingOrder.totalServiceFee = updatedTaxCalculation.totalServiceFee;
//       existingOrder.taxAndServiceDetails = updatedTaxCalculation.taxAndServiceDetails;
//       existingOrder.grandTotal = updatedTotalAfterDiscount + updatedTaxCalculation.totalTax + updatedTaxCalculation.totalServiceFee;

//       await existingOrder.save();
//       newOrder = existingOrder;

//       console.log('Updated existing order with tax:', {
//         totalTax: existingOrder.totalTax,
//         totalServiceFee: existingOrder.totalServiceFee,
//         grandTotal: existingOrder.grandTotal
//       });
//     }
//     else if (isOpenBill && !existingOrder) {
//       // Create new order for open bill WITH TAX
//       const generatedOrderId = await generateOrderId(openBillData.tableNumbers || tableNumber || '');
//       newOrder = new Order({
//         order_id: generatedOrderId,
//         user_id: userId,
//         user: userExists.username || 'Guest',
//         cashier: null,
//         items: orderItems,
//         status: 'Reserved',
//         paymentMethod: paymentDetails.method,
//         orderType: formattedOrderType,
//         deliveryAddress: deliveryAddress || '',
//         tableNumber: openBillData.tableNumbers || tableNumber || '',
//         type: 'Indoor',
//         voucher: voucherId,
//         outlet: outlet && outlet !== "" ? outlet : "67cbc9560f025d897d69f889",
//         totalBeforeDiscount,
//         totalAfterDiscount,
//         totalTax: taxServiceCalculation.totalTax, // Now includes tax for open bill
//         totalServiceFee: taxServiceCalculation.totalServiceFee, // Now includes service fee
//         discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
//         appliedPromos: [],
//         appliedManualPromo: null,
//         appliedVoucher: voucherId,
//         taxAndServiceDetails: taxServiceCalculation.taxAndServiceDetails, // Tax details for open bill
//         grandTotal: grandTotal, // Grand total with tax
//         promotions: [],
//         source: 'App',
//         reservation: existingReservation._id,
//         isOpenBill: true,
//         originalReservationId: openBillData.reservationId,
//       });
//       await newOrder.save();

//       if (!existingReservation.order_id) {
//         existingReservation.order_id = newOrder._id;
//         await existingReservation.save();
//       }

//       console.log('Created new open bill order with tax:', {
//         totalTax: newOrder.totalTax,
//         totalServiceFee: newOrder.totalServiceFee,
//         grandTotal: newOrder.grandTotal
//       });
//     } else {
//       // Normal order creation with tax calculation
//       const generatedOrderId = await generateOrderId(tableNumber || '');
//       newOrder = new Order({
//         order_id: generatedOrderId,
//         user_id: userId,
//         user: userExists.username || 'Guest',
//         cashier: null,
//         items: orderItems,
//         status: orderType === 'reservation' ? 'Reserved' : 'Pending',
//         paymentMethod: paymentDetails.method,
//         orderType: formattedOrderType,
//         deliveryAddress: deliveryAddress || '',
//         tableNumber: tableNumber || '',
//         pickupTime: parsedPickupTime,
//         type: 'Indoor',
//         voucher: voucherId,
//         outlet: outlet && outlet !== "" ? outlet : "67cbc9560f025d897d69f889",
//         totalBeforeDiscount,
//         totalAfterDiscount,
//         totalTax: taxServiceCalculation.totalTax,
//         totalServiceFee: taxServiceCalculation.totalServiceFee,
//         discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
//         appliedPromos: [],
//         appliedManualPromo: null,
//         appliedVoucher: voucherId,
//         taxAndServiceDetails: taxServiceCalculation.taxAndServiceDetails,
//         grandTotal: grandTotal,
//         promotions: [],
//         source: 'App',
//         reservation: null,
//       });
//       await newOrder.save();

//       console.log('Created new order with tax:', {
//         totalTax: newOrder.totalTax,
//         totalServiceFee: newOrder.totalServiceFee,
//         grandTotal: newOrder.grandTotal
//       });
//     }

//     // Verify order was saved with tax data
//     const savedOrder = await Order.findById(newOrder._id);
//     console.log('Verified saved order tax data:', {
//       orderId: savedOrder._id,
//       totalTax: savedOrder.totalTax,
//       totalServiceFee: savedOrder.totalServiceFee,
//       taxAndServiceDetails: savedOrder.taxAndServiceDetails,
//       grandTotal: savedOrder.grandTotal
//     });


//     // Reservation creation (existing code remains the same)
//     let reservationRecord = null;
//     if (orderType === 'reservation' && !isOpenBill) {
//       try {
//         let parsedReservationDate;

//         if (reservationData.reservationDate) {
//           if (typeof reservationData.reservationDate === 'string') {
//             parsedReservationDate = reservationData.reservationDate.match(/Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember/)
//               ? parseIndonesianDate(reservationData.reservationDate)
//               : new Date(reservationData.reservationDate);
//           } else {
//             parsedReservationDate = new Date(reservationData.reservationDate);
//           }
//         } else {
//           parsedReservationDate = new Date();
//         }

//         if (isNaN(parsedReservationDate.getTime())) {
//           return res.status(400).json({
//             success: false,
//             message: 'Invalid reservation date format. Please use YYYY-MM-DD or standard date format.'
//           });
//         }

//         reservationRecord = new Reservation({
//           reservation_date: parsedReservationDate,
//           reservation_time: reservationData.reservationTime,
//           area_id: reservationData.areaIds,
//           table_id: reservationData.tableIds,
//           guest_count: reservationData.guestCount,
//           order_id: newOrder._id,
//           status: 'pending',
//           reservation_type: reservationType || 'nonBlocking',
//           notes: reservationData.notes || ''
//         });

//         await reservationRecord.save();

//         newOrder.reservation = reservationRecord._id;
//         await newOrder.save();

//         console.log('Reservation created:', reservationRecord);
//       } catch (reservationError) {
//         console.error('Error creating reservation:', reservationError);
//         await Order.findByIdAndDelete(newOrder._id);
//         return res.status(500).json({
//           success: false,
//           message: 'Error creating reservation',
//           error: reservationError.message
//         });
//       }
//     }

//     // Response preparation
//     const responseData = {
//       success: true,
//       message: isOpenBill ?
//         'Items added to existing order successfully' :
//         `${orderType === 'reservation' ? 'Reservation' : 'Order'} created successfully`,
//       order: newOrder,
//       isOpenBill: isOpenBill || false,
//       existingReservation: isOpenBill ? existingReservation : null
//     };

//     if (reservationRecord) {
//       responseData.reservation = reservationRecord;
//     }

//     // Enhanced mapping for frontend response with tax information
//     const mappedOrders = {
//       _id: newOrder._id,
//       userId: newOrder.user_id,
//       customerName: newOrder.user,
//       cashierId: newOrder.cashier,
//       items: newOrder.items.map(item => ({
//         _id: item._id,
//         quantity: item.quantity,
//         subtotal: item.subtotal,
//         isPrinted: item.isPrinted,
//         menuItem: {
//           ...item.menuItem,
//           categories: item.menuItem.category,
//         },
//         selectedAddons: item.addons.length > 0 ? item.addons.map(addon => ({
//           name: addon.name,
//           _id: addon._id,
//           options: [{
//             id: addon._id,
//             label: addon.label || addon.name,
//             price: addon.price
//           }]
//         })) : [],
//         selectedToppings: item.toppings.length > 0 ? item.toppings.map(topping => ({
//           id: topping._id || topping.id,
//           name: topping.name,
//           price: topping.price
//         })) : []
//       })),
//       status: newOrder.status,
//       orderType: newOrder.orderType,
//       deliveryAddress: newOrder.deliveryAddress,
//       tableNumber: newOrder.tableNumber,
//       pickupTime: newOrder.pickupTime,
//       type: newOrder.type,
//       paymentMethod: newOrder.paymentMethod || "Cash",
//       totalPrice: newOrder.totalBeforeDiscount,
//       totalAfterDiscount: newOrder.totalAfterDiscount,
//       totalTax: newOrder.totalTax,
//       totalServiceFee: newOrder.totalServiceFee,
//       taxAndServiceDetails: newOrder.taxAndServiceDetails,
//       grandTotal: newOrder.grandTotal,
//       voucher: newOrder.voucher || null,
//       outlet: newOrder.outlet || null,
//       promotions: newOrder.promotions || [],
//       createdAt: newOrder.createdAt,
//       updatedAt: newOrder.updatedAt,
//       __v: newOrder.__v,
//       isOpenBill: isOpenBill || false
//     };

//     // Emit to cashier application
//     if (isOpenBill) {
//       io.to('cashier_room').emit('open_bill_order', {
//         mappedOrders,
//         originalReservation: existingReservation,
//         message: 'Additional items added to existing reservation'
//       });
//     } else {
//       io.to('cashier_room').emit('new_order', { mappedOrders });
//     }

//     res.status(201).json(responseData);
//   } catch (error) {
//     console.error('Error in createAppOrder:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating order',
//       error: error.message
//     });
//   }
// };

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

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      userId,         // Diubah dari customerId menjadi userId
      customerName,   // Nama yang akan diubah menjadi user
      cashierId,
      phoneNumber,
      items,
      orderType,
      tableNumber,
      paymentMethod,
      totalPrice
    } = req.body;

    // Tentukan apakah order dilakukan melalui kasir atau aplikasi
    let finalUserId = null;
    let userName = "Guest";

    if (cashierId) {
      // Order dilakukan melalui kasir
      // Cari informasi kasir
      const cashier = await User.findById(cashierId).session(session);
      if (!cashier) {
        throw new Error("Kasir tidak ditemukan");
      }

      // Untuk order melalui kasir, gunakan nama pelanggan yang disediakan
      userName = customerName || "Guest";

      // Buat ID user jika tidak disediakan
      finalUserId = userId || `USER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Opsional: Simpan informasi dasar pelanggan jika Anda ingin melacak mereka
      if (phoneNumber) {
        // Di sini Anda bisa menyimpan informasi pelanggan ke koleksi terpisah jika diperlukan
        // Contoh: await CashierCustomer.findOneAndUpdate(
        //   { phoneNumber },
        //   { name: userName, phoneNumber },
        //   { upsert: true, new: true, session }
        // );
      }
    } else {
      // Order dilakukan melalui aplikasi - user seharusnya sudah ada
      if (!userId) {
        throw new Error("ID user diperlukan untuk order melalui aplikasi");
      }

      // Verifikasi user ada di database
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error("User tidak ditemukan");
      }

      finalUserId = userId;
      userName = user.name || "Pengguna Aplikasi";
    }

    // Validasi dasar
    if (!items || items.length === 0) {
      throw new Error("Item order tidak boleh kosong");
    }

    // Proses item order
    const orderItems = [];
    let calculatedTotalPrice = 0;

    for (const item of items) {
      // Ambil detail menu item
      const menuItem = await MenuItem.findById(item.id).session(session);
      if (!menuItem) {
        throw new Error(`Menu item ${item.id} tidak ditemukan`);
      }

      // Hitung harga item termasuk addons dan toppings
      let itemPrice = menuItem.price;
      let addons = [];
      let toppings = [];

      // Proses addon yang dipilih
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        for (const addon of item.selectedAddons) {
          const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
          if (!addonInfo) continue;

          // Proses opsi yang dipilih
          if (addon.options && addon.options.length > 0) {
            for (const option of addon.options) {
              const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
              if (optionInfo) {
                addons.push({
                  name: `${addonInfo.name}: ${optionInfo.name}`,
                  price: optionInfo.price || 0
                });
                itemPrice += optionInfo.price || 0;
              }
            }
          }
        }
      }

      // Proses topping yang dipilih
      if (item.selectedToppings && item.selectedToppings.length > 0) {
        for (const topping of item.selectedToppings) {
          const toppingInfo = menuItem.toppings.find(t => t._id.toString() === topping.id);
          if (toppingInfo) {
            toppings.push({
              name: toppingInfo.name,
              price: toppingInfo.price || 0
            });
            itemPrice += toppingInfo.price || 0;
          }
        }
      }

      // Hitung subtotal untuk item ini
      const subtotal = itemPrice * item.quantity;
      calculatedTotalPrice += subtotal;

      // Tambahkan ke item order
      orderItems.push({
        menuItem: item.id,
        quantity: item.quantity,
        subtotal,
        addons,
        toppings,
        isPrinted: false
      });
    }

    // Buat ID order unik
    // const order_id = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Buat dokumen order
    const order = new Order({
      order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // ID order unik
      user: userName,                           // Sesuai dengan model, ini adalah nama user
      cashier: cashierId || null,               // ID kasir jika order melalui kasir
      items: orderItems,
      paymentMethod,
      orderType,
      tableNumber: orderType === 'Dine-In' ? tableNumber : null,
      type: orderType === 'Dine-In' ? 'Indoor' : null, // Default ke Indoor
      status: "Completed",
      source: "Cashier",
    });

    await order.save({ session });

    // Proses pembayaran
    let paymentResponse = {};
    let payment;


    if (paymentMethod === "Cash" || paymentMethod === "EDC") {
      payment = new Payment({
        order_id: order.order_id,
        amount: parseInt(totalPrice) || calculatedTotalPrice,
        method: paymentMethod,
        status: "Completed",
      });
      await payment.save({ session });
      paymentResponse = { cashPayment: "Menunggu konfirmasi" };
    } else {
      // Kode pemrosesan pembayaran yang ada
      // Parameter transaksi
      const parameter = {
        transaction_details: {
          order_id: order.order_id.toString(),
          gross_amount: parseInt(totalPrice) || calculatedTotalPrice,
        },
        customer_details: {
          first_name: userName || 'Customer',
          email: 'customer@example.com', // Tambahkan email jika tersedia
        }
      };

      // Tentukan payment type
      switch (paymentMethod.toLowerCase()) {
        case 'qris':
          parameter.payment_type = 'qris';
          break;
        case 'gopay':
          parameter.payment_type = 'gopay';
          parameter.gopay = {
            enable_callback: true,
            callback_url: 'yourapp://callback'
          };
          break;
        case 'credit_card':
          parameter.payment_type = 'credit_card';
          parameter.credit_card = {
            secure: true
          };
          break;
        default:
          throw new Error('Metode pembayaran tidak didukung');
      }

      // Buat transaksi Midtrans
      // Asumsikan coreApi telah diimpor dan dikonfigurasi sebelumnya
      const midtransResponse = await coreApi.charge(parameter);

      // Simpan detail pembayaran
      payment = new Payment({
        order: order.order_id,
        amount: parseInt(totalPrice) || calculatedTotalPrice,
        paymentMethod,
        status: "Pending",
        paymentDate: new Date(),
        transactionId: midtransResponse.transaction_id,
        paymentDetails: midtransResponse,
      });

      await payment.save({ session });
      paymentResponse = midtransResponse;
    }

    // Perbarui stok jika diperlukan
    // await updateStock(order, session);

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      order: order.toJSON(),
      payment: paymentResponse
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Order Error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

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
    tableOrDayCode = `${dayCode}${day}`; // NOTE: This logic uses day twice? Original was `${dayCode}${day}`
  }

  // Kunci sequence unik per tableOrDayCode dan tanggal
  const key = `order_seq_${tableOrDayCode}_${dateStr}`;

  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    attempts++;

    // Atomic increment dengan upsert dan reset setiap hari
    const result = await db.collection('counters').findOneAndUpdate(
      { _id: key },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );

    // Support both driver versions (result.value.seq or result.seq)
    const seq = result.value ? result.value.seq : result.seq;

    // Format orderId
    const candidateId = `ORD-${day}${tableOrDayCode}-${String(seq).padStart(3, '0')}`;

    // Check if ID already exists in Orders collection
    // We use mongoose.models.Order to allow decoupled usage if needed, or Order from imports
    const existing = await Order.findOne({ order_id: candidateId }).select('_id').lean();

    if (!existing) {
      return candidateId;
    }

    console.warn(`⚠️ Duplicate Order ID generated: ${candidateId}. Retrying... (Attempt ${attempts}/${maxAttempts})`);
  }

  throw new Error(`Failed to generate unique Order ID after ${maxAttempts} attempts. Counter key: ${key}`);
}

const confirmOrderHelper = async (orderId) => {
  try {
    console.log('🔍 confirmOrderHelper - Searching for order:', orderId);

    // PERBAIKAN 1: Cari order dengan query yang lebih aman
    let order = await Order.findOne({
      $or: [
        { order_id: orderId },
        { _id: orderId }
      ]
    })
      .populate('items.menuItem', 'name price')
      .populate('outlet', 'name address')
      .populate('user_id', 'name email phone')
      .populate('cashierId', 'name email') // PERBAIKAN: Populate cashierId
      .lean(); // PERBAIKAN: Gunakan lean() untuk avoid mongoose document issues

    if (!order) {
      console.error('❌ confirmOrderHelper - Order not found:', orderId);
      throw new Error(`Order ${orderId} not found`);
    }

    console.log('✅ confirmOrderHelper - Order found:', {
      orderId: order.order_id,
      status: order.status,
      hasUser: !!order.user_id,
      hasCashier: !!order.cashierId,
      source: order.source
    });

    // PERBAIKAN 2: Update order status dengan findByIdAndUpdate (lebih safe)
    let updatedOrder;
    if (order.status !== 'Reserved') {
      updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            status: 'Waiting',
            updatedAt: new Date()
          }
        },
        { new: true, runValidators: true }
      ).lean();
    } else {
      updatedOrder = order;
    }

    if (!updatedOrder) {
      throw new Error('Failed to update order status');
    }

    // PERBAIKAN 3: Cari payment dengan query yang lebih aman
    const payment = await Payment.findOne({
      $or: [
        { order_id: orderId },
        { order_id: order.order_id }
      ]
    });

    if (!payment) {
      console.error('❌ confirmOrderHelper - Payment not found for order:', orderId);
      throw new Error(`Payment not found for order ${orderId}`);
    }

    console.log('✅ confirmOrderHelper - Payment found:', {
      paymentId: payment._id,
      status: payment.status,
      paymentType: payment.paymentType
    });

    // PERBAIKAN 4: Tentukan status pembayaran dengan logic yang lebih aman
    let updatedStatus = 'settlement';
    if (payment.paymentType === 'Down Payment') {
      updatedStatus = payment.remainingAmount > 0 ? 'partial' : 'settlement';
    }

    // Update payment document
    payment.status = updatedStatus;
    payment.paidAt = new Date();
    await payment.save();

    // PERBAIKAN 5: Handle cashier data dengan safe access
    const cashierData = order.cashierId ? {
      id: order.cashierId._id?.toString() || order.cashierId.toString(),
      name: order.cashierId.name || 'Kasir'
    } : {
      id: 'unknown',
      name: 'Kasir'
    };

    console.log('👤 Cashier data:', cashierData);

    // PERBAIKAN 6: Prepare status update data
    const statusUpdateData = {
      order_id: order.order_id, // PERBAIKAN: Gunakan order.order_id yang sudah dipopulate
      orderStatus: 'Waiting',
      paymentStatus: updatedStatus,
      message: 'Pesanan dikonfirmasi kasir, menunggu kitchen',
      timestamp: new Date(),
      cashier: cashierData
    };

    // PERBAIKAN 7: Get io instance dengan safe check
    const io = getIO();
    if (io) {
      // Emit ke room spesifik untuk order tracking
      io.to(`order_${order.order_id}`).emit('order_status_update', statusUpdateData);

      // Emit event khusus untuk konfirmasi kasir
      io.to(`order_${order.order_id}`).emit('order_confirmed', {
        orderId: order.order_id,
        orderStatus: 'Waiting',
        paymentStatus: updatedStatus,
        cashier: cashierData,
        message: 'Your order is now being prepared',
        timestamp: new Date()
      });

      console.log(`🔔 Emitted order status update to room: order_${order.order_id}`, {
        order_id: statusUpdateData.order_id,
        orderStatus: statusUpdateData.orderStatus,
        paymentStatus: statusUpdateData.paymentStatus
      });
    } else {
      console.warn('⚠️ Socket.IO not available for emitting order status update');
    }

    // PERBAIKAN 8: FCM Notification dengan safe user check
    console.log('📱 Preparing FCM notification:', {
      user: order.user,
      userId: order.user_id?._id,
      hasUser: !!order.user_id
    });

    if (order.user_id && order.user_id._id) {
      try {
        const orderData = {
          orderId: order.order_id,
          cashier: cashierData
        };

        const notificationResult = await FCMNotificationService.sendOrderConfirmationNotification(
          order.user_id._id.toString(),
          orderData
        );

        console.log('📱 FCM Notification result:', notificationResult);
      } catch (notificationError) {
        console.error('❌ Failed to send FCM notification:', notificationError);
        // Jangan throw error, lanjutkan proses
      }
    } else {
      console.log('ℹ️ No user data available for FCM notification');
    }

    // PERBAIKAN 9: Broadcast to cashier dashboard dengan safe checks
    if (order.source === 'Web' || order.source === 'App') {
      const orderData = {
        orderId: order.order_id,
        source: order.source,
        orderType: order.orderType,
        tableNumber: order.tableNumber || null,
        items: (order.items || []).map(item => ({
          name: item.menuItem?.name || 'Unknown Item',
          quantity: item.quantity || 1
        })),
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        totalAmount: order.grandTotal,
        outletId: order.outlet?._id || order.outletId
      };

      try {
        // PERBAIKAN: Check if broadcastNewOrder exists dan panggil dengan safe
        if (typeof broadcastNewOrder === 'function') {
          const outletId = order.outlet?._id?.toString() || order.outletId?.toString();
          if (outletId) {
            broadcastNewOrder(outletId, orderData);
            console.log('📢 Broadcasted new order to outlet:', outletId);
          } else {
            console.warn('⚠️ No outlet ID available for broadcasting');
          }
        } else {
          console.warn('⚠️ broadcastNewOrder function not available');
        }
      } catch (broadcastError) {
        console.error('❌ Failed to broadcast new order:', broadcastError);
        // Jangan throw error, lanjutkan proses
      }
    }

    // PERBAIKAN 10: Return response yang konsisten
    return {
      success: true,
      order: updatedOrder,
      payment: payment,
      message: 'Order confirmed successfully'
    };

  } catch (error) {
    console.error('❌ Error in confirmOrderHelper:', {
      orderId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const createUnifiedOrder = async (req, res) => {
  let orderId = null;
  let lockAcquired = false;

  try {
    const {
      order_id,
      source,
      tableNumber,
      orderType,
      customerId,
      outletId,
      loyaltyPointsToRedeem,
      delivery_option,
      recipient_data,
      customAmountItems,
      paymentDetails,
      user,
      contact,
      cashierId,
      device_id,
      isSplitPayment = false
    } = req.body;

    // ========== VALIDASI AWAL ==========

    // Validasi outletId
    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID diperlukan'
      });
    }

    // Validasi source
    if (!['Web', 'App', 'Cashier'].includes(source)) {
      return res.status(400).json({
        success: false,
        message: 'Source tidak valid. Harus Web, App, atau Cashier'
      });
    }

    // Validasi khusus untuk Web: TIDAK BOLEH split payment
    if (source === 'Web' && isSplitPayment) {
      return res.status(400).json({
        success: false,
        message: 'Split payment tidak diizinkan untuk Web source'
      });
    }

    // Validasi khusus untuk Web: cashierId harus null
    if (source === 'Web' && cashierId) {
      console.warn('cashierId provided for Web source, ignoring:', cashierId);
      cashierId = null;
    }

    // Validasi user/contact untuk Web
    if (source === 'Web') {
      if (!user || typeof user !== 'string' || user.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Nama pelanggan diperlukan untuk Web orders'
        });
      }

      if (!contact || !contact.phone || typeof contact.phone !== 'string' || contact.phone.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Nomor telepon pelanggan diperlukan untuk Web orders'
        });
      }
    }

    // Validasi khusus untuk Cashier: cashierId harus ada
    if (source === 'Cashier' && !cashierId) {
      return res.status(400).json({
        success: false,
        message: 'cashierId diperlukan untuk Cashier source'
      });
    }

    // Generate order ID early
    if (tableNumber) {
      orderId = await generateOrderId(String(tableNumber));
    } else {
      orderId = `${source.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    console.log(`📝 Creating order from ${source}:`, {
      orderId,
      source,
      outletId,
      tableNumber,
      isSplitPayment,
      useLocking: source !== 'Cashier',
      paymentDetailsType: Array.isArray(paymentDetails) ? 'array' : 'object'
    });

    // ========== CASHIER: LANGSUNG TANPA LOCK ==========
    if (source === 'Cashier') {
      console.log('💰 Processing Cashier order directly (no lock needed)');

      const result = await processCashierOrderDirect({
        req,
        orderId,
        outletId,
        customAmountItems,
        paymentDetails,
        isSplitPayment,
        cashierId,
        tableNumber,
        device_id,
        customerId,
        loyaltyPointsToRedeem,
        orderType
      });

      return res.status(200).json(result);
    }

    // ========== WEB & APP: GUNAKAN LOCK ==========
    console.log('🔒 Processing with atomic lock for Web/App order:', {
      orderId,
      source,
      outletId
    });

    // PRE-CHECK: Cek order existence SEBELUM lock (optimization)
    const existingOrderCheck = await Order.findOne({
      order_id: orderId,
      outletId: outletId
    });

    if (existingOrderCheck) {
      console.log('🔄 Order already exists, returning existing order:', {
        orderId,
        status: existingOrderCheck.status
      });

      try {
        const result = await confirmOrderHelper(orderId);
        return res.status(200).json({
          status: 'Completed',
          orderId: orderId,
          message: 'Order already exists and confirmed',
          order: result.order
        });
      } catch (confirmError) {
        return res.status(200).json({
          success: false,
          error: `Order exists but confirmation failed: ${confirmError.message}`,
          orderId: orderId,
          existingOrder: true
        });
      }
    }

    // Execute dengan atomic lock untuk Web & App
    const result = await LockUtil.withOrderLock(orderId, async () => {
      lockAcquired = true;

      // DOUBLE-CHECK: Cek order existence dalam lock
      const existingOrderInLock = await Order.findOne({
        order_id: orderId,
        outletId: outletId
      });

      if (existingOrderInLock) {
        console.log('🔄 Order created by another process during lock acquisition:', {
          orderId,
          existingOrderId: existingOrderInLock._id
        });

        try {
          const result = await confirmOrderHelper(orderId);
          return {
            type: 'existing_order',
            data: {
              status: 'Completed',
              orderId: orderId,
              message: 'Order processed by another process',
              order: result.order
            }
          };
        } catch (confirmError) {
          return {
            type: 'existing_order_error',
            data: {
              success: false,
              error: `Order exists but confirmation failed: ${confirmError.message}`,
              orderId: orderId
            }
          };
        }
      }

      // Process Web/App order
      return await processWebAppOrder({
        req,
        orderId,
        source,
        outletId,
        customAmountItems,
        paymentDetails,
        isSplitPayment,
        tableNumber,
        device_id,
        customerId,
        loyaltyPointsToRedeem,
        orderType,
        delivery_option,
        recipient_data,
        user,
        contact
      });
    }, {
      owner: `order-${source}-${process.pid}-${Date.now()}`,
      ttlMs: 30000,
      retryDelayMs: 300,
      maxRetries: 5
    });

    // Handle different response types
    switch (result.type) {
      case 'existing_order':
      case 'app_cash_order':
      case 'app_payment_order':
      case 'web_cash_order':
      case 'web_payment_order':
        return res.status(200).json(result.data);
      default:
        return res.status(200).json(result.data);
    }

  } catch (err) {
    console.error('Error in createUnifiedOrder:', err);

    // Lock-related errors (hanya untuk Web/App)
    if (err.message.includes('Failed to acquire lock') || err.message.includes('Lock busy')) {
      return res.status(429).json({
        success: false,
        error: 'System sedang sibuk memproses pesanan lain, silakan coba lagi dalam 5 detik',
        orderId: orderId,
        retryAfter: 5
      });
    }

    // Specific errors
    if (err.message.includes('Outlet tidak ditemukan')) {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }

    if (err.message.includes('Outlet sedang tutup') ||
      err.message.includes('Fitur delivery hanya tersedia') ||
      err.message.includes('Data penerima diperlukan') ||
      err.message.includes('Koordinat lokasi penerima diperlukan') ||
      err.message.includes('Payment method is required')) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    return res.status(400).json({
      success: false,
      error: err.message,
      orderId: orderId,
      retrySuggested: true
    });
  }
};

// ========== HELPER: CASHIER ORDER (TANPA LOCK) ==========
const processCashierOrderDirect = async ({
  req,
  orderId,
  outletId,
  customAmountItems,
  paymentDetails,
  isSplitPayment,
  cashierId,
  tableNumber,
  device_id,
  customerId,
  loyaltyPointsToRedeem,
  orderType
}) => {
  // Cek outlet
  const outlet = await Outlet.findById(outletId);
  if (!outlet) {
    throw new Error('Outlet tidak ditemukan');
  }

  const isOutletOpen = checkOutletOperatingHours(outlet);
  if (!isOutletOpen.isOpen) {
    throw new Error(`Outlet sedang tutup. ${isOutletOpen.message}`);
  }

  // Prepare custom amount items
  let finalCustomAmountItems = [];
  if (customAmountItems && customAmountItems.length > 0) {
    finalCustomAmountItems = customAmountItems.map(item => ({
      amount: Number(item.amount) || 0,
      name: item.name || 'Penyesuaian Pembayaran',
      description: item.description || '',
      dineType: item.dineType || 'Dine-In',
      appliedAt: new Date()
    }));
  }

  // Validate payment details
  console.log("coba cek payment details sebelum validate:", paymentDetails);
  const validatedPaymentDetails = validateAndNormalizePaymentDetails(
    paymentDetails,
    isSplitPayment,
    'Cashier'
  );
  console.log("coba cek payment details setelah validate:", validatedPaymentDetails);
  // Prepare validation data
  const validationData = {
    ...req.body,
    customAmountItems: finalCustomAmountItems,
    isSplitPayment: isSplitPayment,
    paymentDetails: validatedPaymentDetails,
    source: 'Cashier',
    outletId: outletId,
    user: req.body.user || 'Cashier',
    contact: req.body.contact || { phone: '081234567890' }
  };

  const validated = validateOrderData(validationData, 'Cashier');

  validated.outletId = outletId;
  validated.outlet = outletId;
  validated.device_id = device_id;
  validated.customerId = customerId;
  validated.loyaltyPointsToRedeem = loyaltyPointsToRedeem;
  validated.cashierId = cashierId;

  // Broadcast order creation
  const areaCode = tableNumber?.charAt(0).toUpperCase();
  const areaGroup = getAreaGroup(areaCode);

  if (areaGroup) {
    io.to(areaGroup).emit('new_order_created', {
      orderId,
      tableNumber,
      areaCode,
      areaGroup,
      source: 'Cashier',
      timestamp: new Date()
    });

    const areaRoom = `area_${areaCode}`;
    io.to(areaRoom).emit('new_order_in_area', {
      orderId,
      tableNumber,
      areaCode,
      source: 'Cashier',
      timestamp: new Date()
    });
  }

  // Create order
  console.log('🔄 Creating Cashier order directly...');

  const orderResult = await createOrderHandler({
    orderId,
    orderData: validated,
    source: 'Cashier',
    isOpenBill: validated.isOpenBill,
    isReservation: orderType === 'reservation',
    requiresDelivery: false,
    recipientData: null,
    paymentDetails: validatedPaymentDetails
  });

  console.log('✅ Cashier order created:', {
    orderId,
    orderNumber: orderResult.orderNumber,
    grandTotal: orderResult.grandTotal,
    isSplitPayment: orderResult.isSplitPayment
  });

  await broadcastOrderCreation(orderId, {
    ...validated,
    tableNumber,
    source: 'Cashier',
    outletId,
    paymentDetails: validatedPaymentDetails,
    hasCustomAmountItems: finalCustomAmountItems.length > 0,
    isSplitPayment: orderResult.isSplitPayment
  });

  // Process payment
  console.log("validated payment data:", validatedPaymentDetails);
  const paymentResult = await processCashierPayment(
    orderId,
    validatedPaymentDetails,
    orderResult
  );

  await broadcastCashOrderToKitchen({
    orderId,
    tableNumber,
    orderData: validated,
    outletId,
    hasCustomAmountItems: finalCustomAmountItems.length > 0,
    isSplitPayment: Array.isArray(validatedPaymentDetails)
  });

  return {
    status: 'Completed',
    orderId,
    hasCustomAmountItems: finalCustomAmountItems.length > 0,
    customAmountItems: finalCustomAmountItems,
    orderNumber: orderResult.orderNumber,
    grandTotal: orderResult.grandTotal,
    isSplitPayment: orderResult.isSplitPayment,
    message: Array.isArray(validatedPaymentDetails)
      ? `Cashier order processed with ${validatedPaymentDetails.length} split payments`
      : 'Cashier order processed and paid',
    paymentData: paymentResult.data,
    paymentStatus: paymentResult.data.payment_status,
    paymentCount: Array.isArray(validatedPaymentDetails) ? validatedPaymentDetails.length : 1,
    ...(orderResult.loyalty?.isApplied && {
      loyalty: {
        pointsEarned: orderResult.loyalty.pointsEarned,
        pointsUsed: orderResult.loyalty.pointsUsed,
        discountAmount: orderResult.loyalty.discountAmount
      }
    })
  };
};

// ========== HELPER: CASHIER PAYMENT PROCESSING ==========
const processCashierPayment = async (orderId, paymentDetails, orderResult) => {
  if (!paymentDetails) {
    throw new Error('Payment details are required');
  }

  // Handle split payment
  if (Array.isArray(paymentDetails)) {
    console.log('Processing split payment for Cashier:', {
      orderId,
      paymentCount: paymentDetails.length,
      totalAmount: paymentDetails.reduce((sum, p) => sum + (p.amount || 0), 0)
    });

    const paymentResults = [];

    for (const [index, payment] of paymentDetails.entries()) {
      if (!payment.amount || payment.amount <= 0) {
        throw new Error(`Invalid payment amount for ${payment.method}: ${payment.amount}`);
      }

      const chargeRequest = {
        body: {
          method: payment.method || 'Cash',
          order_id: orderId,
          gross_amount: payment.amount,
          is_down_payment: false,
          tendered_amount: payment.tenderedAmount || payment.amount,
          change_amount: payment.changeAmount || 0,
          is_split_payment: true,
          split_payment_index: index,
          va_numbers: payment.vaNumbers,
          actions: payment.actions,
          method_type: payment.methodType
        }
      };

      try {
        const paymentResult = await new Promise((resolve, reject) => {
          const mockRes = {
            status: (code) => ({
              json: (data) => {
                if (code === 200 && data.success) {
                  resolve(data);
                } else {
                  reject(new Error(data.message || 'Payment failed'));
                }
              }
            })
          };

          cashierCharge(chargeRequest, mockRes).catch(reject);
        });

        paymentResults.push({
          method: payment.method,
          amount: payment.amount,
          status: paymentResult.data?.payment_status || 'completed',
          transactionId: paymentResult.data?.transaction_id,
          index: index
        });

      } catch (paymentError) {
        throw new Error(`Split payment failed for ${payment.method}: ${paymentError.message}`);
      }
    }

    return {
      success: true,
      data: {
        payment_status: 'completed',
        is_split_payment: true,
        payments: paymentResults,
        total_paid: paymentResults.reduce((sum, p) => sum + p.amount, 0),
        payment_count: paymentResults.length
      }
    };
  } else {
    // Single payment
    const chargeRequest = {
      body: {
        method: paymentDetails?.method || 'Cash',
        order_id: orderId,
        gross_amount: paymentDetails?.amount || 0,
        is_down_payment: paymentDetails?.is_down_payment || false,
        down_payment_amount: paymentDetails?.down_payment_amount,
        remaining_payment: paymentDetails?.remainingPayment,
        tendered_amount: paymentDetails?.tenderedAmount,
        change_amount: paymentDetails?.changeAmount,
        is_split_payment: false,
        va_numbers: paymentDetails?.vaNumbers,
        actions: paymentDetails?.actions,
        method_type: paymentDetails?.methodType
      }
    };
    console.log("coba cek va numbers in single payment:", chargeRequest);
    return new Promise((resolve, reject) => {
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            if (code === 200 && data.success) {
              resolve(data);
            } else {
              reject(new Error(data.message || 'Payment failed'));
            }
          }
        })
      };

      cashierCharge(chargeRequest, mockRes).catch(reject);
    });
  }
};

// ========== HELPER: WEB/APP ORDER (DENGAN LOCK) ==========
const processWebAppOrder = async ({
  req,
  orderId,
  source,
  outletId,
  customAmountItems,
  paymentDetails,
  isSplitPayment,
  tableNumber,
  device_id,
  customerId,
  loyaltyPointsToRedeem,
  orderType,
  delivery_option,
  recipient_data,
  user,
  contact
}) => {
  // [Sisa kode sama seperti yang ada di dalam lock sebelumnya untuk Web/App]
  // Implementasi lengkap untuk Web & App order processing...

  // Cek outlet
  const outlet = await Outlet.findById(outletId);
  if (!outlet) {
    throw new Error('Outlet tidak ditemukan');
  }

  const isOutletOpen = checkOutletOperatingHours(outlet);
  if (!isOutletOpen.isOpen) {
    throw new Error(`Outlet sedang tutup. ${isOutletOpen.message}`);
  }

  // Validasi delivery untuk App
  if (source !== 'App' && delivery_option === 'delivery') {
    throw new Error('Fitur delivery hanya tersedia untuk pesanan dari App');
  }

  if (source === 'App' && delivery_option === 'delivery') {
    if (!recipient_data || !recipient_data.coordinates) {
      throw new Error('Data penerima dan koordinat diperlukan untuk delivery');
    }
  }

  // Prepare dan validasi order data
  let finalCustomAmountItems = [];
  if (customAmountItems && customAmountItems.length > 0) {
    finalCustomAmountItems = customAmountItems.map(item => ({
      amount: Number(item.amount) || 0,
      name: item.name || 'Penyesuaian Pembayaran',
      description: item.description || '',
      dineType: item.dineType || 'Dine-In',
      appliedAt: new Date()
    }));
  }

  const validatedPaymentDetails = validateAndNormalizePaymentDetails(
    paymentDetails,
    isSplitPayment,
    source
  );

  const validationData = {
    ...req.body,
    customAmountItems: finalCustomAmountItems,
    isSplitPayment: isSplitPayment,
    paymentDetails: validatedPaymentDetails,
    source: source,
    outletId: outletId,
    user: user || 'Customer',
    contact: contact || { phone: '081234567890', email: 'example@mail.com' }
  };

  const validated = validateOrderData(validationData, source);

  validated.outletId = outletId;
  validated.outlet = outletId;
  validated.device_id = device_id;
  validated.customerId = customerId;
  validated.loyaltyPointsToRedeem = loyaltyPointsToRedeem;

  if (source === 'App') {
    validated.delivery_option = delivery_option || 'pickup';
    validated.recipient_data = recipient_data;
  }

  // Broadcast dan create order
  const areaCode = tableNumber?.charAt(0).toUpperCase();
  const areaGroup = getAreaGroup(areaCode);

  if (areaGroup) {
    io.to(areaGroup).emit('new_order_created', {
      orderId,
      tableNumber,
      areaCode,
      areaGroup,
      source,
      timestamp: new Date()
    });
  }

  const orderResult = await createOrderHandler({
    orderId,
    orderData: validated,
    source,
    isOpenBill: validated.isOpenBill,
    isReservation: orderType === 'reservation',
    requiresDelivery: source === 'App' && delivery_option === 'delivery',
    recipientData: source === 'App' && delivery_option === 'delivery' ? recipient_data : null,
    paymentDetails: validatedPaymentDetails
  });

  await broadcastOrderCreation(orderId, {
    ...validated,
    tableNumber,
    source,
    outletId,
    paymentDetails: validatedPaymentDetails,
    hasCustomAmountItems: finalCustomAmountItems.length > 0,
    isSplitPayment: orderResult.isSplitPayment
  });

  const baseResponse = {
    orderId,
    hasCustomAmountItems: finalCustomAmountItems.length > 0,
    customAmountItems: finalCustomAmountItems,
    orderNumber: orderResult.orderNumber,
    grandTotal: orderResult.grandTotal,
    isSplitPayment: orderResult.isSplitPayment
  };

  // Handle App orders
  if (source === 'App') {
    let deliveryResult = null;
    if (delivery_option === 'delivery' && recipient_data) {
      try {
        deliveryResult = await processGoSendDelivery({
          orderId,
          outlet,
          recipient_data,
          orderData: validated
        });
      } catch (deliveryError) {
        throw new Error(`Gagal membuat pesanan delivery: ${deliveryError.message}`);
      }
    }

    const isCashPayment = validated.paymentDetails?.method?.toLowerCase() === 'cash';

    if (isCashPayment) {
      await broadcastCashOrderToKitchen({
        orderId,
        tableNumber,
        orderData: validated,
        outletId,
        isAppOrder: true,
        deliveryOption: delivery_option,
        hasCustomAmountItems: finalCustomAmountItems.length > 0
      });

      return {
        type: 'app_cash_order',
        data: {
          ...baseResponse,
          status: 'Pending',
          message: 'App cash order processed and paid',
          delivery_option: delivery_option || 'pickup',
          ...(orderResult.loyalty?.isApplied && {
            loyalty: orderResult.loyalty
          }),
          ...(deliveryResult && { delivery: deliveryResult })
        }
      };
    } else {
      let paymentAmount = Array.isArray(validatedPaymentDetails)
        ? validatedPaymentDetails.reduce((sum, p) => sum + (p.amount || 0), 0)
        : validatedPaymentDetails?.amount || 0;

      const midtransRes = await createMidtransCoreTransaction(
        orderId,
        Number(paymentAmount),
        Array.isArray(validatedPaymentDetails)
          ? validatedPaymentDetails[0]?.method || 'other'
          : validatedPaymentDetails?.method || 'other'
      );

      return {
        type: 'app_payment_order',
        data: {
          ...baseResponse,
          status: 'waiting_payment',
          midtrans: midtransRes,
          delivery_option: delivery_option || 'pickup',
          ...(orderResult.loyalty?.isApplied && { loyalty: orderResult.loyalty }),
          ...(deliveryResult && { delivery: deliveryResult })
        }
      };
    }
  }

  // Handle Web orders
  if (source === 'Web') {
    const newOrder = await Order.findOne({ order_id: orderId });

    const paymentData = {
      order_id: orderId,
      payment_code: generatePaymentCode(),
      transaction_id: generateTransactionId(),
      method: validatedPaymentDetails?.method || 'Cash',
      status: 'pending',
      paymentType: 'Full',
      amount: validatedPaymentDetails?.amount || newOrder.grandTotal,
      totalAmount: newOrder.grandTotal,
      remainingAmount: newOrder.grandTotal,
    };

    const payment = await Payment.create(paymentData);

    const isCashPayment = validatedPaymentDetails?.method?.toLowerCase() === 'cash';

    if (isCashPayment) {
      await broadcastCashOrderToKitchen({
        orderId,
        tableNumber,
        orderData: validated,
        outletId,
        isWebOrder: true,
        hasCustomAmountItems: finalCustomAmountItems.length > 0
      });

      return {
        type: 'web_cash_order',
        data: {
          ...baseResponse,
          status: 'pending',
          message: 'Web cash order processed successfully',
          paymentId: payment._id,
          ...(orderResult.loyalty?.isApplied && { loyalty: orderResult.loyalty })
        }
      };
    } else {
      const customerData = {
        name: user || 'Customer',
        email: contact?.email || 'example@mail.com',
        phone: contact?.phone || '081234567890'
      };

      const paymentAmount = validatedPaymentDetails?.amount || 0;

      const midtransRes = await createMidtransSnapTransaction(
        orderId,
        Number(paymentAmount),
        customerData,
        validatedPaymentDetails?.method || 'other'
      );

      await Payment.findByIdAndUpdate(payment._id, {
        transaction_id: midtransRes.transaction_id || payment.transaction_id,
        midtransRedirectUrl: midtransRes.redirect_url,
        status: 'pending',
        updatedAt: new Date()
      });

      return {
        type: 'web_payment_order',
        data: {
          ...baseResponse,
          status: 'waiting_payment',
          snapToken: midtransRes.token,
          redirectUrl: midtransRes.redirect_url,
          paymentId: payment._id,
          ...(orderResult.loyalty?.isApplied && { loyalty: orderResult.loyalty })
        }
      };
    }
  }

  throw new Error('Invalid order source');
};


const calculateCustomAmount = (paymentAmount, orderTotalFromItems) => {
  // Validasi input
  if (typeof paymentAmount !== 'number' || typeof orderTotalFromItems !== 'number') {
    console.warn('Invalid input types for calculateCustomAmount:', {
      paymentAmount: typeof paymentAmount,
      orderTotalFromItems: typeof orderTotalFromItems
    });
    return null;
  }

  // Jika payment amount kurang dari atau sama dengan order total, tidak perlu custom amount
  if (paymentAmount <= orderTotalFromItems) {
    return null;
  }

  const excessAmount = paymentAmount - orderTotalFromItems;

  // Hanya buat custom amount jika kelebihan signifikan (lebih dari 1000)
  if (excessAmount > 1000) {
    return {
      amount: excessAmount,
      name: "Excess Payment",
      description: "Additional amount paid beyond order total",
      dineType: "Dine-In"
    };
  }

  return null;
};

// HELPER FUNCTION UNTUK CEK JAM OPERASIONAL OUTLET
const checkOutletOperatingHours = (outlet) => {
  // Jika outlet tidak memiliki jam operasional, dianggap buka 24 jam
  if (!outlet.openTime || !outlet.closeTime) {
    return {
      isOpen: true,
      message: 'Outlet buka 24 jam'
    };
  }

  const parseToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const s = String(timeStr).trim().toUpperCase();
    const m = s.match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;

    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);

    // Handle AM/PM if present
    const hasAM = /\bAM\b/.test(s);
    const hasPM = /\bPM\b/.test(s);
    if (hasAM || hasPM) {
      if (hh === 12) hh = hasAM ? 0 : 12;
      else if (hasPM) hh += 12;
    }

    // Validasi jam (0-23) dan menit (0-59)
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      return null;
    }

    return hh * 60 + mm;
  };

  // PERBAIKAN: Gunakan Date object biasa untuk WIB
  const getWIBCurrentTime = () => {
    const now = new Date();
    // Convert to WIB (UTC+7)
    const wibOffset = 7 * 60; // 7 hours in minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const wibTime = new Date(utc + (3600000 * 7));
    return wibTime;
  };

  const wibNow = getWIBCurrentTime();
  const currentMinutes = wibNow.getHours() * 60 + wibNow.getMinutes();

  const openMinutes = parseToMinutes(outlet.openTime);
  const closeMinutes = parseToMinutes(outlet.closeTime);

  // Jika parsing gagal, skip validation (defensive)
  if (openMinutes === null || closeMinutes === null) {
    console.warn('Invalid time format for outlet operating hours:', {
      outletId: outlet._id,
      openTime: outlet.openTime,
      closeTime: outlet.closeTime
    });
    return {
      isOpen: true,
      message: 'Format jam operasional tidak valid, dianggap buka'
    };
  }

  let isOpen = false;
  let message = '';

  if (openMinutes < closeMinutes) {
    // same-day window (e.g. 09:00 - 18:00)
    isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    message = `Jam operasional: ${outlet.openTime} - ${outlet.closeTime}`;
  } else {
    // overnight window (e.g. 06:00 - 03:00 next day)
    isOpen = currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    message = `Jam operasional: ${outlet.openTime} - ${outlet.closeTime} (buka semalam)`;
  }

  // Tambahkan informasi waktu saat ini dalam response untuk debugging
  const currentTimeFormatted = `${String(wibNow.getHours()).padStart(2, '0')}:${String(wibNow.getMinutes()).padStart(2, '0')}`;

  return {
    isOpen,
    message: isOpen ?
      `Outlet buka. ${message} (Waktu sekarang: ${currentTimeFormatted})` :
      `Outlet tutup. ${message} (Waktu sekarang: ${currentTimeFormatted})`
  };
};

export const confirmOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await confirmOrderHelper(orderId);

    return res.status(200).json({
      success: true,
      message: 'Order confirmed and being processed',
      order: result.order,
      payment: result.payment
    });

  } catch (err) {
    console.error('Error in confirmOrder:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// GET /api/orders/queued
export const getQueuedOrders = async (req, res) => {
  try {
    // Get all waiting and active jobs with pagination
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get jobs with additional status details
    const jobs = await orderQueue.getJobs(['waiting', 'active'], skip, skip + limit - 1);

    // Format response with more detailed order information
    const orders = await Promise.all(jobs.map(async job => {
      const orderDetails = await Order.findOne({ order_id: job.data?.order_id })
        .select('status source tableNumber createdAt')
        .lean();

      return {
        jobId: job.id,
        orderId: job.data?.order_id,
        status: job.data?.status || 'queued',
        attemptsMade: job.attemptsMade,
        claimedBy: job.data?.cashierId || null,
        timestamp: new Date(job.timestamp),
        orderDetails,
        data: {
          ...job.data,
          // Remove sensitive data if any
          paymentDetails: undefined
        }
      };
    }));

    // Get counts for pagination metadata
    const waitingCount = await orderQueue.getJobCountByTypes('waiting');
    const activeCount = await orderQueue.getJobCountByTypes('active');

    res.status(200).json({
      success: true,
      data: orders,
      meta: {
        total: waitingCount + activeCount,
        page: parseInt(page),
        limit: parseInt(limit),
        waitingCount,
        activeCount
      }
    });
  } catch (error) {
    console.error('Failed to get queued orders:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date()
    });
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil daftar order antrian',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const confirmOrderByCashier = async (req, res) => {
  const { jobId } = req.params;
  const { cashierId, cashierName } = req.body;

  // Enhanced validation
  if (!cashierId || !cashierName) {
    return res.status(400).json({
      success: false,
      error: 'cashierId dan cashierName wajib diisi',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  try {
    // Get job with lock to prevent race conditions
    const job = await orderQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job tidak ditemukan',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Validate job data
    const orderId = job.data?.order_id;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Data order tidak valid',
        code: 'INVALID_JOB_DATA'
      });
    }

    // Check if already claimed
    if (job.data?.cashierId) {
      const currentCashier = job.data.cashierId === cashierId ?
        'Anda' : `Kasir ${job.data.cashierName || job.data.cashierId}`;
      return res.status(409).json({
        success: false,
        error: `${currentCashier} sudah mengambil order ini`,
        code: 'ORDER_ALREADY_CLAIMED'
      });
    }

    // Start transaction for atomic updates
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update order status and assign cashier
      const order = await Order.findOneAndUpdate(
        { order_id: orderId },
        {
          status: 'OnProcess',
          cashier: {
            id: cashierId,
            name: cashierName
          },
          processingStartedAt: new Date()
        },
        { new: true, session }
      );

      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: 'Order tidak ditemukan di database',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Update job data with cashier info
      await job.update({
        ...job.data,
        cashierId,
        cashierName,
        status: 'processing'
      });

      await session.commitTransaction();

      // Log the claim event
      console.log('Order claimed by cashier:', {
        orderId,
        jobId,
        cashierId,
        cashierName,
        timestamp: new Date()
      });

      //  EMIT SOCKET EVENTS FOR ORDER STATUS CHANGE
      const statusUpdateData = {
        order_id: orderId, // Use string order_id for consistency
        status: 'OnProcess',
        paymentStatus: order.paymentStatus || 'Pending',
        cashier: { id: cashierId, name: cashierName },
        processingStartedAt: new Date(),
        timestamp: new Date()
      };

      // Emit to customer app (order room)
      io.to(`order_${orderId}`).emit('order_status_update', statusUpdateData);

      // Emit to all cashier rooms for real-time updates
      io.to('cashier_room').emit('order_confirmed', {
        orderId,
        status: 'OnProcess',
        cashier: { id: cashierId, name: cashierName },
        timestamp: new Date()
      });

      // Emit to kitchen if order has kitchen items
      const hasKitchenItems = order.items.some(item =>
        item.menuItem && item.menuItem.workstation === 'kitchen'
      );

      if (hasKitchenItems) {
        io.to('kitchen_room').emit('new_kitchen_order', {
          orderId,
          items: order.items.filter(item =>
            item.menuItem && item.menuItem.workstation === 'kitchen'
          ),
          cashier: { id: cashierId, name: cashierName },
          timestamp: new Date()
        });
      }

      res.status(200).json({
        success: true,
        message: 'Order berhasil diklaim dan akan diproses',
        data: {
          orderId,
          status: order.status,
          cashier: order.cashier,
          estimatedTime: '10-15 menit'
        }
      });

    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Failed to confirm order:', {
      jobId,
      cashierId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date()
    });

    const statusCode = error.code === 'ORDER_ALREADY_CLAIMED' ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      error: 'Gagal mengkonfirmasi order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code || 'INTERNAL_SERVER_ERROR'
    });
  }
};

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

// Constant untuk expired time (optional, untuk memudahkan maintenance)
const CASH_PAYMENT_EXPIRY_MINUTES = 30;

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
        // PERUBAHAN: 30 menit expired time
        const expiryTime = new Date(Date.now() + CASH_PAYMENT_EXPIRY_MINUTES * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

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
        // PERUBAHAN: 30 menit expired time
        const expiryTime = new Date(Date.now() + CASH_PAYMENT_EXPIRY_MINUTES * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

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
          // PERUBAHAN: 30 menit expired time
          const expiryTime = new Date(Date.now() + CASH_PAYMENT_EXPIRY_MINUTES * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

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
                payment_code: payment_code,
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
      // PERUBAHAN: 30 menit expired time
      const expiryTime = new Date(Date.now() + CASH_PAYMENT_EXPIRY_MINUTES * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

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

// export const charge = async (req, res) => {
//   try {
//     const {
//       payment_type,
//       is_down_payment,
//       down_payment_amount,
//       remaining_payment,
//       transaction_details,
//       bank_transfer,
//       total_order_amount
//     } = req.body;

//     const payment_code = generatePaymentCode();
//     let order_id, gross_amount;

//     // === Ambil order_id & gross_amount sesuai tipe ===
//     if (payment_type === 'cash') {
//       order_id = req.body.order_id;
//       gross_amount = req.body.gross_amount;
//     } else {
//       order_id = transaction_details?.order_id;
//       gross_amount = transaction_details?.gross_amount;
//     }

//     // === Validasi order ===
//     const order = await Order.findOne({ order_id });
//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     // === Cek apakah ada down payment yang masih pending ===
//     const existingDownPayment = await Payment.findOne({
//       order_id: order_id,
//       paymentType: 'Down Payment',
//       status: { $in: ['pending', 'expire'] } // belum dibayar
//     }).sort({ createdAt: -1 });

//     // === PERBAIKAN: Jika ada down payment pending, SELALU update (tidak perlu cek is_down_payment) ===
//     if (existingDownPayment) {
//       // Tambahkan ke total amount dulu
//       const newTotalAmount = existingDownPayment.totalAmount + (total_order_amount || gross_amount);

//       // Hitung proporsi amount dan remaining amount (50:50 dari total)
//       const newDownPaymentAmount = newTotalAmount / 2;
//       const newRemainingAmount = newTotalAmount - newDownPaymentAmount;

//       console.log("Updating existing down payment:");
//       console.log("Previous total amount:", existingDownPayment.totalAmount);
//       console.log("Added total amount:", total_order_amount || gross_amount);
//       console.log("New total amount:", newTotalAmount);
//       console.log("New down payment amount (50%):", newDownPaymentAmount);
//       console.log("New remaining amount (50%):", newRemainingAmount);

//       // === Update untuk CASH ===
//       if (payment_type === 'cash') {
//         const transactionId = generateTransactionId();
//         const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
//         const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

//         const qrData = { order_id: order._id.toString() };
//         const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

//         const actions = [{
//           name: "generate-qr-code",
//           method: "GET",
//           url: qrCodeBase64,
//         }];

//         const rawResponse = {
//           status_code: "200",
//           status_message: "Down payment amount updated successfully",
//           transaction_id: transactionId,
//           payment_code: payment_code,
//           order_id: order_id,
//           gross_amount: newDownPaymentAmount.toString() + ".00",
//           currency: "IDR",
//           payment_type: "cash",
//           transaction_time: currentTime,
//           transaction_status: "pending",
//           fraud_status: "accept",
//           actions: actions,
//           acquirer: "cash",
//           qr_string: JSON.stringify(qrData),
//           expiry_time: expiryTime,
//         };

//         // Update existing down payment
//         await Payment.updateOne(
//           { _id: existingDownPayment._id },
//           {
//             $set: {
//               transaction_id: transactionId,
//               payment_code: payment_code,
//               amount: newDownPaymentAmount,
//               totalAmount: newTotalAmount,
//               remainingAmount: newRemainingAmount,
//               method: payment_type,
//               status: 'pending',
//               fraud_status: 'accept',
//               transaction_time: currentTime,
//               expiry_time: expiryTime,
//               actions: actions,
//               raw_response: rawResponse,
//               updatedAt: new Date()
//             }
//           }
//         );

//         const updatedPayment = await Payment.findById(existingDownPayment._id);

//         return res.status(200).json({
//           ...rawResponse,
//           paymentType: 'Down Payment',
//           totalAmount: newTotalAmount,
//           remainingAmount: newRemainingAmount,
//           is_down_payment: true,
//           relatedPaymentId: null,
//           createdAt: updatedPayment.createdAt,
//           updatedAt: updatedPayment.updatedAt,
//           isUpdated: true,
//           previousAmount: existingDownPayment.amount,
//           previousTotalAmount: existingDownPayment.totalAmount,
//           addedTotalAmount: total_order_amount || gross_amount,
//           newAmount: newDownPaymentAmount,
//           newTotalAmount: newTotalAmount,
//           message: "Down payment updated with 50:50 split due to additional order items"
//         });

//       } else {
//         // === Update untuk NON-CASH ===
//         let chargeParams = {
//           payment_type: payment_type,
//           transaction_details: {
//             gross_amount: parseInt(newDownPaymentAmount),
//             order_id: payment_code,
//           },
//         };

//         // Setup payment method specific params
//         if (payment_type === 'bank_transfer') {
//           if (!bank_transfer?.bank) {
//             return res.status(400).json({ success: false, message: 'Bank is required' });
//           }
//           chargeParams.bank_transfer = { bank: bank_transfer.bank };
//         } else if (payment_type === 'gopay') {
//           chargeParams.gopay = {};
//         } else if (payment_type === 'qris') {
//           chargeParams.qris = {};
//         } else if (payment_type === 'shopeepay') {
//           chargeParams.shopeepay = {};
//         } else if (payment_type === 'credit_card') {
//           chargeParams.credit_card = { secure: true };
//         }

//         const response = await coreApi.charge(chargeParams);

//         // Update existing down payment
//         await Payment.updateOne(
//           { _id: existingDownPayment._id },
//           {
//             $set: {
//               transaction_id: response.transaction_id,
//               payment_code: payment_code,
//               amount: newDownPaymentAmount,
//               totalAmount: newTotalAmount,
//               remainingAmount: newRemainingAmount,
//               method: payment_type,
//               status: response.transaction_status || 'pending',
//               fraud_status: response.fraud_status,
//               transaction_time: response.transaction_time,
//               expiry_time: response.expiry_time,
//               settlement_time: response.settlement_time || null,
//               va_numbers: response.va_numbers || [],
//               permata_va_number: response.permata_va_number || null,
//               bill_key: response.bill_key || null,
//               biller_code: response.biller_code || null,
//               pdf_url: response.pdf_url || null,
//               currency: response.currency || 'IDR',
//               merchant_id: response.merchant_id || null,
//               signature_key: response.signature_key || null,
//               actions: response.actions || [],
//               raw_response: response,
//               updatedAt: new Date()
//             }
//           }
//         );

//         return res.status(200).json({
//           ...response,
//           paymentType: 'Down Payment',
//           totalAmount: newTotalAmount,
//           remainingAmount: newRemainingAmount,
//           is_down_payment: true,
//           relatedPaymentId: null,
//           isUpdated: true,
//           previousAmount: existingDownPayment.amount,
//           previousTotalAmount: existingDownPayment.totalAmount,
//           addedTotalAmount: total_order_amount || gross_amount,
//           newAmount: newDownPaymentAmount,
//           newTotalAmount: newTotalAmount,
//           message: "Down payment updated with 50:50 split due to additional order items"
//         });
//       }
//     }

//     // === NEW: Cek apakah ada full payment yang masih pending ===
//     const existingFullPayment = await Payment.findOne({
//       order_id: order_id,
//       paymentType: 'Full',
//       status: { $in: ['pending', 'expire'] } // belum dibayar
//     }).sort({ createdAt: -1 });

//     // === NEW: Jika ada full payment pending, update dengan pesanan baru ===
//     if (existingFullPayment) {
//       // Hitung total full payment baru
//       const additionalAmount = total_order_amount || gross_amount;
//       const newFullPaymentAmount = existingFullPayment.amount + additionalAmount;

//       console.log("Updating existing full payment:");
//       console.log("Previous full payment amount:", existingFullPayment.amount);
//       console.log("Added order amount:", additionalAmount);
//       console.log("New full payment amount:", newFullPaymentAmount);

//       // === Update untuk CASH ===
//       if (payment_type === 'cash') {
//         const transactionId = generateTransactionId();
//         const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
//         const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

//         const qrData = { order_id: order._id.toString() };
//         const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

//         const actions = [{
//           name: "generate-qr-code",
//           method: "GET",
//           url: qrCodeBase64,
//         }];

//         const rawResponse = {
//           status_code: "200",
//           status_message: "Full payment amount updated successfully",
//           transaction_id: transactionId,
//           payment_code: payment_code,
//           order_id: order_id,
//           gross_amount: newFullPaymentAmount.toString() + ".00",
//           currency: "IDR",
//           payment_type: "cash",
//           transaction_time: currentTime,
//           transaction_status: "pending",
//           fraud_status: "accept",
//           actions: actions,
//           acquirer: "cash",
//           qr_string: JSON.stringify(qrData),
//           expiry_time: expiryTime,
//         };

//         // Update existing full payment
//         await Payment.updateOne(
//           { _id: existingFullPayment._id },
//           {
//             $set: {
//               transaction_id: transactionId,
//               payment_code: payment_code,
//               amount: newFullPaymentAmount,
//               totalAmount: newFullPaymentAmount,
//               method: payment_type,
//               status: 'pending',
//               fraud_status: 'accept',
//               transaction_time: currentTime,
//               expiry_time: expiryTime,
//               actions: actions,
//               raw_response: rawResponse,
//               updatedAt: new Date()
//             }
//           }
//         );

//         const updatedPayment = await Payment.findById(existingFullPayment._id);

//         return res.status(200).json({
//           ...rawResponse,
//           paymentType: 'Full',
//           totalAmount: newFullPaymentAmount,
//           remainingAmount: 0,
//           is_down_payment: false,
//           relatedPaymentId: null,
//           createdAt: updatedPayment.createdAt,
//           updatedAt: updatedPayment.updatedAt,
//           isUpdated: true,
//           previousAmount: existingFullPayment.amount,
//           addedTotalAmount: additionalAmount,
//           newAmount: newFullPaymentAmount,
//           message: "Full payment updated due to additional order items"
//         });

//       } else {
//         // === Update untuk NON-CASH ===
//         let chargeParams = {
//           payment_type: payment_type,
//           transaction_details: {
//             gross_amount: parseInt(newFullPaymentAmount),
//             order_id: payment_code,
//           },
//         };

//         // Setup payment method specific params
//         if (payment_type === 'bank_transfer') {
//           if (!bank_transfer?.bank) {
//             return res.status(400).json({ success: false, message: 'Bank is required' });
//           }
//           chargeParams.bank_transfer = { bank: bank_transfer.bank };
//         } else if (payment_type === 'gopay') {
//           chargeParams.gopay = {};
//         } else if (payment_type === 'qris') {
//           chargeParams.qris = {};
//         } else if (payment_type === 'shopeepay') {
//           chargeParams.shopeepay = {};
//         } else if (payment_type === 'credit_card') {
//           chargeParams.credit_card = { secure: true };
//         }

//         const response = await coreApi.charge(chargeParams);

//         // Update existing full payment
//         await Payment.updateOne(
//           { _id: existingFullPayment._id },
//           {
//             $set: {
//               transaction_id: response.transaction_id,
//               payment_code: payment_code,
//               amount: newFullPaymentAmount,
//               totalAmount: newFullPaymentAmount,
//               method: payment_type,
//               status: response.transaction_status || 'pending',
//               fraud_status: response.fraud_status,
//               transaction_time: response.transaction_time,
//               expiry_time: response.expiry_time,
//               settlement_time: response.settlement_time || null,
//               va_numbers: response.va_numbers || [],
//               permata_va_number: response.permata_va_number || null,
//               bill_key: response.bill_key || null,
//               biller_code: response.biller_code || null,
//               pdf_url: response.pdf_url || null,
//               currency: response.currency || 'IDR',
//               merchant_id: response.merchant_id || null,
//               signature_key: response.signature_key || null,
//               actions: response.actions || [],
//               raw_response: response,
//               updatedAt: new Date()
//             }
//           }
//         );

//         return res.status(200).json({
//           ...response,
//           paymentType: 'Full',
//           totalAmount: newFullPaymentAmount,
//           remainingAmount: 0,
//           is_down_payment: false,
//           relatedPaymentId: null,
//           isUpdated: true,
//           previousAmount: existingFullPayment.amount,
//           addedTotalAmount: additionalAmount,
//           newAmount: newFullPaymentAmount,
//           message: "Full payment updated due to additional order items"
//         });
//       }
//     }

//     // === NEW: Cek apakah ada final payment yang masih pending ===
//     const existingFinalPayment = await Payment.findOne({
//       order_id: order_id,
//       paymentType: 'Final Payment',
//       status: { $in: ['pending', 'expire'] } // belum dibayar
//     }).sort({ createdAt: -1 });

//     // === NEW: Jika ada final payment pending, update dengan pesanan baru ===
//     if (existingFinalPayment) {
//       // Ambil down payment yang sudah settlement untuk kalkulasi
//       const settledDownPayment = await Payment.findOne({
//         order_id: order_id,
//         paymentType: 'Down Payment',
//         status: 'settlement'
//       });

//       if (settledDownPayment) {
//         // Hitung total final payment baru
//         const additionalAmount = total_order_amount || gross_amount;
//         const newFinalPaymentAmount = existingFinalPayment.amount + additionalAmount;

//         console.log("Updating existing final payment:");
//         console.log("Previous final payment amount:", existingFinalPayment.amount);
//         console.log("Added order amount:", additionalAmount);
//         console.log("New final payment amount:", newFinalPaymentAmount);

//         // === Update untuk CASH ===
//         if (payment_type === 'cash') {
//           const transactionId = generateTransactionId();
//           const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
//           const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

//           const qrData = { order_id: order._id.toString() };
//           const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

//           const actions = [{
//             name: "generate-qr-code",
//             method: "GET",
//             url: qrCodeBase64,
//           }];

//           const rawResponse = {
//             status_code: "200",
//             status_message: "Final payment amount updated successfully",
//             transaction_id: transactionId,
//             payment_code: payment_code,
//             order_id: order_id,
//             gross_amount: newFinalPaymentAmount.toString() + ".00",
//             currency: "IDR",
//             payment_type: "cash",
//             transaction_time: currentTime,
//             transaction_status: "pending",
//             fraud_status: "accept",
//             actions: actions,
//             acquirer: "cash",
//             qr_string: JSON.stringify(qrData),
//             expiry_time: expiryTime,
//           };

//           // Update existing final payment
//           await Payment.updateOne(
//             { _id: existingFinalPayment._id },
//             {
//               $set: {
//                 transaction_id: transactionId,
//                 payment_code: payment_code,
//                 amount: newFinalPaymentAmount,
//                 totalAmount: newFinalPaymentAmount,
//                 method: payment_type,
//                 status: 'pending',
//                 fraud_status: 'accept',
//                 transaction_time: currentTime,
//                 expiry_time: expiryTime,
//                 actions: actions,
//                 raw_response: rawResponse,
//                 updatedAt: new Date()
//               }
//             }
//           );

//           const updatedPayment = await Payment.findById(existingFinalPayment._id);

//           return res.status(200).json({
//             ...rawResponse,
//             paymentType: 'Final Payment',
//             totalAmount: newFinalPaymentAmount,
//             remainingAmount: 0,
//             is_down_payment: false,
//             relatedPaymentId: settledDownPayment._id,
//             createdAt: updatedPayment.createdAt,
//             updatedAt: updatedPayment.updatedAt,
//             isUpdated: true,
//             previousAmount: existingFinalPayment.amount,
//             addedTotalAmount: additionalAmount,
//             newAmount: newFinalPaymentAmount,
//             message: "Final payment updated due to additional order items"
//           });

//         } else {
//           // === Update untuk NON-CASH ===
//           let chargeParams = {
//             payment_type: payment_type,
//             transaction_details: {
//               gross_amount: parseInt(newFinalPaymentAmount),
//               order_id: payment_code,
//             },
//           };

//           // Setup payment method specific params
//           if (payment_type === 'bank_transfer') {
//             if (!bank_transfer?.bank) {
//               return res.status(400).json({ success: false, message: 'Bank is required' });
//             }
//             chargeParams.bank_transfer = { bank: bank_transfer.bank };
//           } else if (payment_type === 'gopay') {
//             chargeParams.gopay = {};
//           } else if (payment_type === 'qris') {
//             chargeParams.qris = {};
//           } else if (payment_type === 'shopeepay') {
//             chargeParams.shopeepay = {};
//           } else if (payment_type === 'credit_card') {
//             chargeParams.credit_card = { secure: true };
//           }

//           const response = await coreApi.charge(chargeParams);

//           // Update existing final payment
//           await Payment.updateOne(
//             { _id: existingFinalPayment._id },
//             {
//               $set: {
//                 transaction_id: response.transaction_id,
//                 payment_code: response_code,
//                 amount: newFinalPaymentAmount,
//                 totalAmount: newFinalPaymentAmount,
//                 method: payment_type,
//                 status: response.transaction_status || 'pending',
//                 fraud_status: response.fraud_status,
//                 transaction_time: response.transaction_time,
//                 expiry_time: response.expiry_time,
//                 settlement_time: response.settlement_time || null,
//                 va_numbers: response.va_numbers || [],
//                 permata_va_number: response.permata_va_number || null,
//                 bill_key: response.bill_key || null,
//                 biller_code: response.biller_code || null,
//                 pdf_url: response.pdf_url || null,
//                 currency: response.currency || 'IDR',
//                 merchant_id: response.merchant_id || null,
//                 signature_key: response.signature_key || null,
//                 actions: response.actions || [],
//                 raw_response: response,
//                 updatedAt: new Date()
//               }
//             }
//           );

//           return res.status(200).json({
//             ...response,
//             paymentType: 'Final Payment',
//             totalAmount: newFinalPaymentAmount,
//             remainingAmount: 0,
//             is_down_payment: false,
//             relatedPaymentId: settledDownPayment._id,
//             isUpdated: true,
//             previousAmount: existingFinalPayment.amount,
//             addedTotalAmount: additionalAmount,
//             newAmount: newFinalPaymentAmount,
//             message: "Final payment updated due to additional order items"
//           });
//         }
//       }
//     }

//     // === Lanjutkan dengan logika create baru HANYA jika tidak ada existing payment pending ===

//     // === Cari pembayaran terakhir ===
//     const lastPayment = await Payment.findOne({ order_id }).sort({ createdAt: -1 });
//     let relatedPaymentId = lastPayment ? lastPayment._id : null;

//     // === Tentukan payment type ===
//     let paymentType, amount, remainingAmount, totalAmount;

//     if (is_down_payment === true) {
//       paymentType = 'Down Payment';
//       amount = down_payment_amount || gross_amount;
//       totalAmount = total_order_amount || gross_amount;
//       remainingAmount = totalAmount - amount;
//     } else {
//       // Cek untuk final payment logic - HANYA yang sudah settlement
//       const settledDownPayment = await Payment.findOne({
//         order_id: order_id,
//         paymentType: 'Down Payment',
//         status: 'settlement' // HANYA yang sudah dibayar
//       });

//       if (settledDownPayment) {
//         // Cek apakah ada Final Payment yang sudah settlement juga
//         const settledFinalPayment = await Payment.findOne({
//           order_id: order_id,
//           paymentType: 'Final Payment',
//           status: 'settlement'
//         });

//         if (settledFinalPayment) {
//           // Jika DP dan Final Payment sudah settlement, buat payment baru sebagai Full Payment
//           paymentType = 'Full';
//           amount = gross_amount; // Hanya amount pesanan baru
//           totalAmount = gross_amount; // Tidak tambahkan data lama yang sudah settlement
//           remainingAmount = 0;

//           console.log("Creating new full payment (previous payments already settled):");
//           console.log("New order amount:", gross_amount);

//           // Tetap reference ke Final Payment terakhir untuk pemetaan
//           relatedPaymentId = settledFinalPayment._id;
//         } else {
//           // Jika hanya DP yang settlement, lanjutkan logic Final Payment seperti biasa
//           paymentType = 'Final Payment';
//           amount = gross_amount; // Gunakan amount yang dikirim user
//           totalAmount = settledDownPayment.amount + gross_amount; // DP amount + final payment amount
//           remainingAmount = 0;

//           console.log("Creating final payment:");
//           console.log("Down payment amount:", settledDownPayment.amount);
//           console.log("Final payment amount:", gross_amount);
//           console.log("Total amount:", totalAmount);

//           // Final payment → selalu link ke DP utama
//           relatedPaymentId = settledDownPayment._id;
//         }
//       } else {
//         // Jika tidak ada settled down payment, berarti full payment
//         paymentType = 'Full';
//         amount = gross_amount;
//         totalAmount = gross_amount;
//         remainingAmount = 0;
//       }
//     }

//     // === Sisanya sama seperti kode sebelumnya untuk create payment baru ===

//     // === CASE 1: CASH ===
//     if (payment_type === 'cash') {
//       const transactionId = generateTransactionId();
//       const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
//       const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

//       const qrData = { order_id: order._id.toString() };
//       const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

//       const actions = [{
//         name: "generate-qr-code",
//         method: "GET",
//         url: qrCodeBase64,
//       }];

//       const rawResponse = {
//         status_code: "201",
//         status_message: `Cash ${paymentType.toLowerCase()} transaction is created`,
//         transaction_id: transactionId,
//         payment_code: payment_code,
//         order_id: order_id,
//         gross_amount: amount.toString() + ".00",
//         currency: "IDR",
//         payment_type: "cash",
//         transaction_time: currentTime,
//         transaction_status: "pending",
//         fraud_status: "accept",
//         actions: actions,
//         acquirer: "cash",
//         qr_string: JSON.stringify(qrData),
//         expiry_time: expiryTime,
//       };

//       const payment = new Payment({
//         transaction_id: transactionId,
//         order_id: order_id,
//         payment_code: payment_code,
//         amount: amount,
//         totalAmount: totalAmount,
//         method: payment_type,
//         status: 'pending',
//         fraud_status: 'accept',
//         transaction_time: currentTime,
//         expiry_time: expiryTime,
//         settlement_time: null,
//         currency: 'IDR',
//         merchant_id: 'G055993835',
//         paymentType: paymentType,
//         remainingAmount: remainingAmount,
//         relatedPaymentId: relatedPaymentId,
//         actions: actions,
//         raw_response: rawResponse
//       });

//       const savedPayment = await payment.save();

//       await Order.updateOne(
//         { order_id: order_id },
//         { $addToSet: { payment_ids: savedPayment._id } }
//       );

//       return res.status(200).json({
//         ...rawResponse,
//         paymentType,
//         totalAmount,
//         remainingAmount,
//         is_down_payment: is_down_payment || false,
//         relatedPaymentId,
//         createdAt: savedPayment.createdAt,
//         updatedAt: savedPayment.updatedAt,
//       });
//     }

//     // === CASE 2: NON-CASH ===
//     if (!order_id || !gross_amount) {
//       return res.status(400).json({
//         success: false,
//         message: 'Order ID and gross amount are required'
//       });
//     }

//     let chargeParams = {
//       payment_type: payment_type,
//       transaction_details: {
//         gross_amount: parseInt(amount),
//         order_id: payment_code,
//       },
//     };

//     if (payment_type === 'bank_transfer') {
//       if (!bank_transfer?.bank) {
//         return res.status(400).json({ success: false, message: 'Bank is required' });
//       }
//       chargeParams.bank_transfer = { bank: bank_transfer.bank };
//     } else if (payment_type === 'gopay') {
//       chargeParams.gopay = {};
//     } else if (payment_type === 'qris') {
//       chargeParams.qris = {};
//     } else if (payment_type === 'shopeepay') {
//       chargeParams.shopeepay = {};
//     } else if (payment_type === 'credit_card') {
//       chargeParams.credit_card = { secure: true };
//     }

//     const response = await coreApi.charge(chargeParams);

//     const payment = new Payment({
//       transaction_id: response.transaction_id,
//       order_id: order_id,
//       payment_code: payment_code,
//       amount: parseInt(amount),
//       totalAmount: totalAmount,
//       method: payment_type,
//       status: response.transaction_status || 'pending',
//       fraud_status: response.fraud_status,
//       transaction_time: response.transaction_time,
//       expiry_time: response.expiry_time,
//       settlement_time: response.settlement_time || null,
//       va_numbers: response.va_numbers || [],
//       permata_va_number: response.permata_va_number || null,
//       bill_key: response.bill_key || null,
//       biller_code: response.biller_code || null,
//       pdf_url: response.pdf_url || null,
//       currency: response.currency || 'IDR',
//       merchant_id: response.merchant_id || null,
//       signature_key: response.signature_key || null,
//       actions: response.actions || [],
//       paymentType: paymentType,
//       remainingAmount: remainingAmount,
//       relatedPaymentId: relatedPaymentId,
//       raw_response: response
//     });

//     const savedPayment = await payment.save();

//     await Order.updateOne(
//       { order_id: order_id },
//       { $addToSet: { payment_ids: savedPayment._id } }
//     );

//     return res.status(200).json({
//       ...response,
//       paymentType,
//       totalAmount,
//       remainingAmount,
//       is_down_payment: is_down_payment || false,
//       relatedPaymentId,
//       down_payment_amount: is_down_payment ? down_payment_amount : null,
//     });

//   } catch (error) {
//     console.error('Payment error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Payment failed',
//       error: error.message || error
//     });
//   }
// };

export const createFinalPayment = async (req, res) => {
  try {
    const { payment_type, order_id, bank_transfer } = req.body;

    if (!payment_type || !order_id) {
      return res.status(400).json({
        success: false,
        message: 'payment_type dan order_id diperlukan'
      });
    }

    const order = await Order.findOne({ order_id: order_id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan'
      });
    }

    // Cek apakah ada Final Payment yang masih pending
    const pendingFinalPayment = await Payment.findOne({
      order_id: order_id,
      paymentType: 'Final Payment',
      status: 'pending'
    }).sort({ createdAt: -1 });

    //  JIKA ADA PENDING, UPDATE SAJA
    if (pendingFinalPayment) {
      console.log("Found existing pending Final Payment, updating...");

      // Generate payment code baru jika diperlukan
      const payment_code = generatePaymentCode();
      const finalPaymentAmount = pendingFinalPayment.amount; // atau recalculate jika perlu

      // === UPDATE UNTUK CASH ===
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
          status_message: "Final payment updated successfully",
          transaction_id: transactionId,
          payment_code: payment_code,
          order_id: order_id,
          gross_amount: finalPaymentAmount.toString() + ".00",
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

        //  UPDATE existing payment
        await Payment.updateOne(
          { _id: pendingFinalPayment._id },
          {
            $set: {
              transaction_id: transactionId,
              payment_code: payment_code,
              method: payment_type,
              transaction_time: currentTime,
              expiry_time: expiryTime,
              actions: actions,
              raw_response: rawResponse,
              updatedAt: new Date()
            }
          }
        );

        const updatedPayment = await Payment.findById(pendingFinalPayment._id);

        return res.status(200).json({
          ...rawResponse,
          paymentType: 'Final Payment',
          totalAmount: finalPaymentAmount,
          remainingAmount: 0,
          is_down_payment: false,
          relatedPaymentId: pendingFinalPayment.relatedPaymentId,
          createdAt: updatedPayment.createdAt,
          updatedAt: updatedPayment.updatedAt,
          message: "Existing pending Final Payment updated successfully"
        });
      }

      // === UPDATE UNTUK NON-CASH ===
      let chargeParams = {
        payment_type: payment_type,
        transaction_details: {
          gross_amount: parseInt(finalPaymentAmount),
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

      //  UPDATE existing payment
      await Payment.updateOne(
        { _id: pendingFinalPayment._id },
        {
          $set: {
            transaction_id: response.transaction_id,
            payment_code: payment_code,
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

      const updatedPayment = await Payment.findById(pendingFinalPayment._id);

      return res.status(200).json({
        ...response,
        paymentType: 'Final Payment',
        totalAmount: finalPaymentAmount,
        remainingAmount: 0,
        is_down_payment: false,
        relatedPaymentId: pendingFinalPayment.relatedPaymentId,
        createdAt: updatedPayment.createdAt,
        updatedAt: updatedPayment.updatedAt,
        message: "Existing pending Final Payment updated successfully"
      });
    }

    //  JIKA TIDAK ADA PENDING, LANJUT KE LOGIKA BUAT BARU
    // ... sisanya tetap sama seperti kode original Anda
    // (kode untuk cari downPayment, create Final Payment baru, dll)

  } catch (error) {
    console.error('Error creating final payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment failed',
      error: error.message || error
    });
  }
};

// Helper function untuk mendapatkan status pembayaran order
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('Fetching payment status for orderId:', orderId);

    const relatedOrder = await Order.findOne({ order_id: orderId });
    if (!relatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Ambil semua payment terkait order
    const relatedPayments = await Payment.find({ order_id: orderId });
    // console.log('Related order:', relatedOrder);
    // console.log('Related payments:', relatedPayments);

    // Case 1: Bukan Reservation → cari payment pending/settlement
    if (relatedOrder.orderType !== "Reservation") {
      const payment = await Payment.findOne({
        order_id: orderId,
        status: { $in: ['pending', 'settlement'] }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'No pending or settlement payment found for this order',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Payment status fetched successfully',
        data: payment,
      });
    }

    // Case 2: Reservation → cek apakah masih ada payment pending
    if (relatedOrder.orderType === "Reservation") {
      const pendingPayment = relatedPayments.find(p => p.status === "pending");

      if (pendingPayment) {
        return res.status(200).json({
          success: true,
          message: 'Pending payment found for reservation order',
          data: pendingPayment,
        });
      }

      const settledPayment = relatedPayments.find(p => p.status === "settlement");
      if (settledPayment) {
        return res.status(200).json({
          success: true,
          message: 'Settlement payment found for reservation order',
          data: settledPayment,
        });
      }

      // Case 3: Final Payment (jika tidak ada pending/settlement biasa)
      const relatedFinalPayment = await Payment.findOne({
        order_id: orderId,
        paymentType: 'Final Payment',
        relatedPaymentId: { $ne: null },
        status: { $in: ['pending', 'settlement'] }
      });

      if (!relatedFinalPayment) {
        return res.status(404).json({
          success: false,
          message: 'No valid payment found for this reservation order',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Final payment status fetched successfully',
        data: relatedFinalPayment,
      });
    }

  } catch (error) {
    console.error('Get payment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message || error,
    });
  }
};

// Helper function untuk validasi apakah order bisa menerima final payment
export const canReceiveFinalPayment = async (req, res) => {
  try {
    const { order_id } = req.params;

    const canReceive = await Payment.canReceiveFinalPayment(order_id);
    const requiredAmount = await Payment.getRequiredFinalPaymentAmount(order_id);

    return res.status(200).json({
      success: true,
      data: {
        canReceiveFinalPayment: canReceive,
        requiredFinalPaymentAmount: requiredAmount
      }
    });

  } catch (error) {
    console.error('Error checking final payment eligibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Update webhook handler untuk handle Final Payment
export const handlePaymentWebhook = async (req, res) => {
  try {
    const notification = req.body;
    const transactionId = notification.transaction_id;
    const transactionStatus = notification.transaction_status;

    console.log('=== PAYMENT WEBHOOK ===');
    console.log('Transaction ID:', transactionId);
    console.log('Status:', transactionStatus);

    const payment = await Payment.findOne({ transaction_id: transactionId });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment status
    const oldStatus = payment.status;
    payment.status = transactionStatus;

    if (transactionStatus === 'settlement') {
      payment.paidAt = new Date();
      payment.settlement_time = notification.settlement_time || new Date().toISOString();
    }

    await payment.save();

    console.log(`Payment ${payment.paymentType} updated: ${oldStatus} -> ${transactionStatus}`);

    // Handle berdasarkan payment type
    if (payment.paymentType === 'Final Payment' && transactionStatus === 'settlement') {
      // Update Down Payment remaining amount
      if (payment.relatedPaymentId) {
        const downPayment = await Payment.findById(payment.relatedPaymentId);
        if (downPayment) {
          downPayment.remainingAmount = 0;
          await downPayment.save();
          console.log('Down payment remaining amount updated to 0');
        }
      }

      // Update order status
      const order = await Order.findOne({ order_id: payment.order_id });
      if (order && order.status === 'Reserved') {
        order.status = 'Pending';
        await order.save();
        console.log('Order status updated to Pending');
      }

      // Emit socket event
      if (global.io) {
        global.io.emit('paymentUpdate', {
          order_id: payment.order_id,
          payment_type: 'Final Payment',
          transaction_status: transactionStatus,
          remaining_amount: 0,
          is_fully_paid: true
        });
        console.log('Socket event emitted for final payment completion');
      }
    }

    return res.status(200).json({ message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const paymentNotification = async (req, res) => {
  const notification = req.body;

  // Log the notification for debugging
  console.log('ini adalah notifikasi dari function paymentNotification', notification);

  // Extract relevant information from the notification
  const { transaction_status, order_id, gross_amount, payment_type } = notification;

  try {
    // Update the payment record in the database based on the transaction status
    let status;
    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        // Payment has been captured or settled
        status = 'Success';
        break;
      case 'pending':
        // Payment is pending
        status = 'Pending';
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        // Payment was denied, canceled, or expired
        status = 'Failed';
        break;
      default:
        console.log('Unknown transaction status:', transaction_status);
        return res.status(400).json({ message: 'Unknown transaction status' });
    }

    // Update or create a payment record
    await Payment.updateOne(
      { order_id: order_id },
      {
        $set: {
          amount: parseFloat(gross_amount),
          paymentDate: new Date(),
          paymentMethod: payment_type,
          status: status,
        },
        $setOnInsert: {
          order_id: order_id, // Insert if not exists
        },
      },
      { upsert: true }
    );

    // console.log('Payment record updated successfully for order:', order_id);
    res.status(200).json({ message: 'Notification processed and database updated' });

  } catch (error) {
    console.error('Error updating payment record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mengambil semua order
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.menuItem')
      .populate({
        path: 'items.menuItem',
        populate:
        {
          path: 'category',
          model: 'Category',
          select: 'name'
        }
      })
      .populate('outlet')
      .populate('user_id')
      .populate({
        path: 'cashierId',
        populate: {
          path: 'outlet.outletId',
          model: 'Outlet',
          select: 'name address', // field yang mau ditampilkan
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

function makeLogger(route, reqId) {
  const base = { route, reqId };
  return {
    info: (msg, extra = {}) =>
      console.log(JSON.stringify({ level: 'info', msg, ...base, ...extra })),
    warn: (msg, extra = {}) =>
      console.warn(JSON.stringify({ level: 'warn', msg, ...base, ...extra })),
    error: (msg, extra = {}) =>
      console.error(JSON.stringify({ level: 'error', msg, ...base, ...extra })),
    timeStart: (label) => console.time(`[${route}][${reqId}] ${label}`),
    timeEnd: (label) => console.timeEnd(`[${route}][${reqId}] ${label}`),
  };
}

export const getPendingOrders = async (req, res) => {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const log = makeLogger('getPendingOrders', reqId);

  try {
    const { rawOutletId } = req.params;
    const { sources } = req.body;

    log.info('incoming_request', {
      params: { rawOutletId },
      body: { sources },
      method: req.method,
      path: req.originalUrl,
    });

    if (!rawOutletId) {
      log.warn('missing_outlet_id');
      return res.status(400).json({ message: 'outletId is required' });
    }

    let outletObjectId;
    try {
      outletObjectId = new mongoose.Types.ObjectId(rawOutletId.trim());
    } catch {
      log.warn('invalid_outlet_id', { rawOutletId });
      return res.status(400).json({ message: 'Invalid outletId' });
    }

    const sourceFilter =
      Array.isArray(sources) && sources.length
        ? { source: { $in: sources } }
        : {};

    // ===== Query Orders =====
    log.timeStart('query_orders');
    const pendingOrders = await Order.find({
      $and: [
        { ...sourceFilter, outlet: outletObjectId },
        { $or: [{ status: { $in: ['Pending', 'Reserved', 'Waiting', 'Completed'] } }, { status: 'OnProcess' }] },
      ],
    })
      .lean()
      .sort({ createdAt: -1 });
    log.timeEnd('query_orders');
    log.info('orders_fetched', {
      totalOrders: pendingOrders.length,
      hasSourceFilter: !!(sourceFilter.source),
    });

    if (!pendingOrders.length) {
      log.info('no_orders_for_outlet', { outletId: rawOutletId.trim() });
      return res.status(200).json({ message: 'No online order found.', orders: [] });
    }

    const orderIds = pendingOrders.map((o) => o.order_id);

    // ===== Query Payments =====
    log.timeStart('query_payments');
    const payments = await Payment.find({
      order_id: { $in: orderIds },
      status: { $ne: 'void' },
    })
      .lean()
      .sort({ createdAt: -1 });
    log.timeEnd('query_payments');
    log.info('payments_fetched', { totalPayments: payments.length });

    // Map payments per order (dan pastikan urut terbaru → lama)
    const paymentDetailsMap = new Map();
    for (const p of payments) {
      const k = String(p.order_id);
      if (!paymentDetailsMap.has(k)) paymentDetailsMap.set(k, []);
      paymentDetailsMap.get(k).push(p);
    }
    for (const [k, arr] of paymentDetailsMap.entries()) {
      arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      paymentDetailsMap.set(k, arr);
    }

    // ===== Seleksi Final =====
    log.timeStart('select_orders');
    const selectedOrders = pendingOrders.filter((order) => {
      if (order.status === 'Pending' || order.status === 'Reserved') return true;
      console.log('bukan pending order');
      if (order.status === 'OnProcess' || order.status === 'Waiting' || order.status === 'Completed') {
        const details = paymentDetailsMap.get(String(order.order_id)) || [];
        const hasPendingPayment = details.some(
          (p) => String(p.status).toLowerCase() === 'pending'
        );
        // const totalPaid = details.reduce((sum, p) => sum + (p.amount || 0), 0);
        // const notFullyPaid = totalPaid < (order.grandTotal || 0);
        // console.log('cek pending payment', { hasPendingPayment, notFullyPaid });
        return hasPendingPayment;
      }
      console.log('bukan onprocess paid order');

      return false;
    });
    log.timeEnd('select_orders');
    log.info('orders_selected', {
      totalSelected: selectedOrders.length,
      totalDropped: pendingOrders.length - selectedOrders.length,
    });

    // ===== Enrichment Menu Items =====
    const menuItemIds = [
      ...new Set(
        selectedOrders
          .flatMap((order) => order.items.map((item) => item.menuItem?.toString()))
          .filter(Boolean)
      ),
    ];
    log.info('menu_ids_collected', { uniqueMenuIds: menuItemIds.length });

    log.timeStart('query_menu_items');
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } }).lean();
    log.timeEnd('query_menu_items');
    log.info('menu_items_fetched', { totalMenuItems: menuItems.length });

    const menuItemMap = new Map(menuItems.map((it) => [it._id.toString(), it]));

    // ===== Enrichment & Summary =====
    log.timeStart('enrich_orders');
    const enrichedOrders = selectedOrders.map((order) => {
      const orderId = String(order.order_id);
      const paymentDetails = paymentDetailsMap.get(orderId) || [];

      const updatedItems = order.items.map((item) => {
        const menuItem = menuItemMap.get(item.menuItem?.toString());

        const enrichedAddons = (item.addons || []).map((addon) => {
          const matchedAddon = menuItem?.addons?.find((ma) => ma.name === addon.name);
          const matchedOption =
            matchedAddon?.options?.find((opt) => opt._id?.toString() === addon?.options?.[0]?.id?.toString()) ||
            matchedAddon?.options?.find((opt) => opt.price === addon.price);

          return {
            id: addon._id,
            name: addon.name,
            options: matchedOption
              ? [{ id: matchedOption._id, price: matchedOption.price, label: matchedOption.label }]
              : addon.options || [],
          };
        });

        return {
          menuItem: menuItem
            ? {
              id: menuItem._id,
              name: menuItem.name,
              originalPrice: menuItem.price,
              workstation: menuItem.workstation,
            }
            : null,
          selectedToppings: item.toppings || [],
          selectedAddons: enrichedAddons,
          subtotal: item.subtotal,
          quantity: item.quantity,
          isPrinted: item.isPrinted,
          notes: item.notes,
        };
      });

      const totalPaid = paymentDetails.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
      const isFullyPaid = totalPaid >= (order.grandTotal || 0);
      const isUnpaid = totalPaid === 0;
      const isPartiallyPaid = !isUnpaid && !isFullyPaid;
      const hasPendingPayment = paymentDetails.some(
        (p) => String(p.status || '').toLowerCase() === 'pending'
      );

      const paymentStatus = paymentDetails.length > 1
        ? paymentDetails.every(p => p.status === 'Success' || p.status === 'settlement')
          ? 'Settlement'
          : paymentDetails.some(p => p.status === 'Success' || p.status === 'settlement')
            ? 'Partial'
            : 'Pending'
        : paymentDetails.length === 1
          ? paymentDetails[0].status === 'Success' || paymentDetails[0].status === 'settlement'
            ? 'Settlement'
            : paymentDetails[0].payment_type === 'Down Payment' ? 'Partial' : 'Pending'
          : 'Pending';

      const latestPayment = paymentDetails[0] || null;

      return {
        ...order,
        items: updatedItems,
        payment_details: paymentDetails,
        paymentStatus,
        paymentSummary: {
          totalAmount: order.grandTotal,
          totalPaid,
          totalRemaining: Math.max(0, (order.grandTotal || 0) - totalPaid),
          paymentCount: paymentDetails.length,
          hasDownPayment: paymentDetails.some((p) => p.paymentType === 'Down Payment'),
          latestPaymentDate: latestPayment?.paymentDate || null,
          latestPaymentMethod: latestPayment?.paymentMethod || null,
          latestTransactionId: latestPayment?.transactionId || null,
          isFullyPaid,
          isPartiallyPaid,
          isUnpaid,
        },
      };
    });
    log.timeEnd('enrich_orders');

    // ===== Statistik =====
    log.timeStart('aggregate_statistics');
    const statistics = {
      totalOrders: enrichedOrders.length,
      totalUnpaid: enrichedOrders.filter((o) => o.paymentSummary.isUnpaid).length,
      totalPartiallyPaid: enrichedOrders.filter((o) => o.paymentSummary.isPartiallyPaid).length,
      totalFullyPaid: enrichedOrders.filter((o) => o.paymentSummary.isFullyPaid).length,
      totalAmount: enrichedOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0),
      totalPaidAmount: enrichedOrders.reduce((sum, o) => sum + o.paymentSummary.totalPaid, 0),
      totalRemainingAmount: enrichedOrders.reduce(
        (sum, o) => sum + o.paymentSummary.totalRemaining,
        0
      ),
    };
    log.timeEnd('aggregate_statistics');
    log.info('stats_ready', statistics);

    log.info('response_success', {
      count: enrichedOrders.length,
      outletId: rawOutletId.trim(),
    });

    return res.status(200).json({
      orders: enrichedOrders,
      statistics,
      meta: {
        count: enrichedOrders.length,
        timestamp: new Date().toISOString(),
        outletId: rawOutletId.trim(),
        reqId,
      },
    });
  } catch (error) {
    const safe = { message: error?.message, name: error?.name };
    // Hindari log payload sensitif
    log.error('unhandled_error', safe);
    return res.status(500).json({
      message: 'Error fetching pending orders',
      error: error.message,
      reqId,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};


// Get User Orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

export const getUserOrderHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Cari semua order user
    const orderHistorys = await Order.find({ user_id: userId })
      .populate('items.menuItem')
      .lean();


    if (!orderHistorys || orderHistorys.length === 0) {
      return res.status(404).json({ message: 'No order history found for this user.' });
    }

    // Ambil semua order_id untuk cari payment
    const orderIds = orderHistorys.map(order => order.order_id);
    const payments = await Payment.find({ order_id: { $in: orderIds } }).lean();

    // Grouping payment berdasarkan order_id
    const paymentMap = {};
    payments.forEach(payment => {
      if (!paymentMap[payment.order_id]) {
        paymentMap[payment.order_id] = [];
      }
      paymentMap[payment.order_id].push(payment);
    });

    // Mapping data untuk response
    const customOrderHistory = orderHistorys.map(order => {
      const relatedPayments = paymentMap[order.order_id] || [];

      // Tentukan payment status berdasarkan aturan
      let paymentStatus = 'expire';
      for (const p of relatedPayments) {
        if (
          p.status === 'settlement' &&
          p.paymentType === 'Down Payment' &&
          p.remainingAmount > 0
        ) {
          paymentStatus = 'partial';
          break;
        } else if (
          p.status === 'settlement' &&
          p.paymentType === 'Down Payment' &&
          p.remainingAmount === 0
        ) {
          paymentStatus = 'settlement';
          break;
        } else if (p.status === 'settlement') {
          paymentStatus = 'settlement';
          break;
        } else if (p.status === 'pending') {
          paymentStatus = 'pending';
        }
      }

      return {
        _id: order._id,
        order_id: order.order_id,
        user_id: order.user_id,
        items: order.items.map(item => ({
          _id: item._id,
          menuItem: {
            _id: item.menuItem._id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            category: item.menuItem.category,
            imageURL: item.menuItem.imageURL
          },
          quantity: item.quantity,
          subtotal: item.subtotal,
          addons: item.addons,
          toppings: item.toppings
        })),
        status: order.status,
        paymentStatus,
        grandTotal: order.grandTotal
      };
    });

    res.status(200).json({
      success: true,
      count: customOrderHistory.length,
      orderHistory: customOrderHistory
    });
  } catch (error) {
    console.error('Error fetching user order history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

export const getCashierOrderById = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required.' });
    }
    console.log('Fetching order with ID:', orderId);

    // Mencari pesanan berdasarkan ID
    const order = await Order.findById(orderId)
      .populate('items.menuItem')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    console.log('Order ID:', order);

    // Mencari payment dan reservation
    const payment = await Payment.findOne({ order_id: order.order_id }).lean();
    const reservation = await Reservation.findOne({ order_id: orderId })
      .populate('area_id')
      .populate('table_id')
      .lean();

    console.log('Payment:', payment);
    console.log('Order:', orderId);
    console.log('Reservation:', reservation);

    // Format tanggal
    const formatDate = (date) => {
      const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      };
      return new Intl.DateTimeFormat('id-ID', options).format(new Date(date));
    };

    // Format tanggal untuk reservasi (tanpa jam)
    const formatReservationDate = (dateString) => {
      const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      };
      return new Intl.DateTimeFormat('id-ID', options).format(new Date(dateString));
    };

    // Generate order number dari order_id atau _id
    const generateOrderNumber = (orderId) => {
      if (typeof orderId === 'string' && orderId.includes('ORD-')) {
        const parts = orderId.split('-');
        return parts.length > 2 ? `#${parts[parts.length - 1]}` : `#${orderId.slice(-4)}`;
      }
      return `#${orderId.toString().slice(-4)}`;
    };

    // Format items mengikuti struktur getPendingOrders
    const formattedItems = order.items.map(item => {
      const menuItem = item.menuItem;
      const basePrice = item.price || menuItem?.price || 0;
      const quantity = item.quantity || 1;

      // Enrich addons seperti di getPendingOrders
      const enrichedAddons = (item.addons || []).map(addon => {
        const matchedAddon = menuItem?.addons?.find(ma => ma.name === addon.name);
        const matchedOption = matchedAddon?.options?.find(opt => opt.price === addon.price);
        return {
          id: addon._id,
          name: addon.name,
          options: matchedOption
            ? [{ id: matchedOption._id, price: addon.price, label: matchedOption.label }]
            : addon.options || [],
        };
      });

      console.log({ history_addon: enrichedAddons });

      return {
        menuItem: menuItem ? {
          id: menuItem._id,
          name: menuItem.name,
          originalPrice: menuItem.price,
          workstation: menuItem.workstation
        } : null,
        selectedToppings: item.toppings || [],
        selectedAddons: enrichedAddons,
        subtotal: item.subtotal || (basePrice * quantity),
        quantity: quantity,
        isPrinted: item.isPrinted || false,
        notes: item.notes,
      };
    });

    // Prepare reservation data jika ada
    let reservationData = null;
    if (reservation) {
      reservationData = {
        _id: reservation._id.toString(),
        reservationCode: reservation.reservation_code,
        reservationDate: formatReservationDate(reservation.reservation_date),
        reservationTime: reservation.reservation_time,
        guestCount: reservation.guest_count,
        status: reservation.status,
        reservationType: reservation.reservation_type,
        notes: reservation.notes,
        area: {
          _id: reservation.area_id?._id,
          name: reservation.area_id?.area_name || 'Unknown Area'
        },
        tables: Array.isArray(reservation.table_id) ? reservation.table_id.map(table => ({
          _id: table._id.toString(),
          tableNumber: table.table_number || 'Unknown Table',
          seats: table.seats,
          tableType: table.table_type,
          isAvailable: table.is_available,
          isActive: table.is_active
        })) : []
      };

      console.log('Tables detail:', JSON.stringify(reservationData.tables, null, 2));
    }

    console.log("Permata VA Number:", payment?.permata_va_number || 'N/A');

    // Struktur return mengikuti getPendingOrders dengan fitur khusus tetap ada
    const enrichedOrder = {
      ...order,
      orderNumber: generateOrderNumber(order.order_id || order._id),
      orderDate: formatDate(order.createdAt),
      items: formattedItems,
      // total: payment?.amount || 0,
      orderStatus: order.status,
      paymentMethod: payment
        ? (payment?.permata_va_number || payment?.va_numbers?.[0]?.bank || payment?.method || 'Unknown').toUpperCase()
        : 'Unknown',
      paymentStatus: payment?.status || 'Unpaid',
      reservation: reservationData
    };

    console.log('Order Data:', JSON.stringify(enrichedOrder, null, 2));

    // Return format mengikuti getPendingOrders
    res.status(200).json({ order: enrichedOrder });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal server error.', error });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required.' });
    }
    console.log('Fetching order with ID:', orderId);

    // Cari pesanan dengan populate voucher dan tax details
    const order = await Order.findById(orderId)
      .populate('items.menuItem')
      .populate('appliedVoucher')
      .populate('taxAndServiceDetails');
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Cari pembayaran
    const payment = await Payment.findOne({ order_id: order.order_id });


    // Cari reservasi
    const reservation = await Reservation.findOne({ order_id: orderId })
      .populate('area_id')
      .populate('table_id');

    console.log('Payment:', payment);
    console.log('Order:', orderId);
    console.log('Reservation:', reservation);
    console.log('controller yang digunakan masih dari orderController getOrderById');

    // Format tanggal
    const formatDate = (date) => {
      const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      };
      return new Intl.DateTimeFormat('id-ID', options).format(new Date(date));
    };

    const formatReservationDate = (dateString) => {
      const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      };
      return new Intl.DateTimeFormat('id-ID', options).format(new Date(dateString));
    };

    // Format items
    const formattedItems = order.items.map(item => {
      const basePrice = item.price || item.menuItem?.price || 0;
      const quantity = item.quantity || 1;

      return {
        menuItemId: item.menuItem?._id || item.menuItem || item._id,
        name: item.menuItem?.name || item.name || 'Unknown Item',
        price: basePrice,
        quantity,
        addons: item.addons || [],
        toppings: item.toppings || [],
        notes: item.notes,
        outletId: item.outletId || null,
        outletName: item.outletName || null,
      };
    });

    // Generate order number
    const generateOrderNumber = (orderId) => {
      if (typeof orderId === 'string' && orderId.includes('ORD-')) {
        const parts = orderId.split('-');
        return parts.length > 2 ? `#${parts[parts.length - 1]}` : `#${orderId.slice(-4)}`;
      }
      return `#${orderId.toString().slice(-4)}`;
    };

    // Reservation data
    let reservationData = null;
    if (reservation) {
      reservationData = {
        _id: reservation._id.toString(),
        reservationCode: reservation.reservation_code,
        reservationDate: formatReservationDate(reservation.reservation_date),
        reservationTime: reservation.reservation_time,
        guestCount: reservation.guest_count,
        status: reservation.status,
        reservationType: reservation.reservation_type,
        notes: reservation.notes,
        area: {
          _id: reservation.area_id?._id,
          name: reservation.area_id?.area_name || 'Unknown Area'
        },
        tables: Array.isArray(reservation.table_id) ? reservation.table_id.map(table => ({
          _id: table._id.toString(),
          tableNumber: table.table_number || 'Unknown Table',
          seats: table.seats,
          tableType: table.table_type,
          isAvailable: table.is_available,
          isActive: table.is_active
        })) : []
      };
    }

    console.log("orderType:", order.orderType);
    console.log('Tables detail:', JSON.stringify(reservationData?.tables || [], null, 2));
    console.log("Dine In Data:", order.orderType === 'Dine-In' ? { tableNumber: order.tableNumber } : 'N/A');
    console.log("Pickup Data:", order.orderType === 'Pickup' ? { pickupTime: order.pickupTime } : 'N/A');
    console.log("Delivery Data:", order.orderType === 'Delivery' ? { deliveryAddress: order.deliveryAddress } : 'N/A');
    console.log("Take Away Data:", order.orderType === 'Take Away' ? { note: "Take Away order" } : 'N/A');
    console.log("Ini adalah data order di getORderById:", order)

    // Payment status logic
    const paymentStatus = (() => {
      if (
        payment?.status === 'settlement' &&
        payment?.paymentType === 'Down Payment' &&
        payment?.remainingAmount !== 0
      ) {
        return 'partial';
      } else if (
        payment?.status === 'settlement' &&
        payment?.paymentType === 'Down Payment' &&
        payment?.remainingAmount == 0
      ) {
        return 'settlement';
      }
      return payment?.status || 'Unpaid';
    })();

    const totalAmountRemaining = await Payment.findOne({
      order_id: order.order_id,
      relatedPaymentId: { $ne: null },
      status: { $in: ['pending', 'expire'] } // hanya update yang belum settlement
    }).sort({ createdAt: -1 });

    console.log('Total Amount Remaining:', totalAmountRemaining);
    console.log('Total Amount Remaining (amount):', totalAmountRemaining?.amount || 'N/A');

    //  TAMBAHAN: Payment details untuk down payment
    const paymentDetails = {
      totalAmount: totalAmountRemaining?.amount || payment?.totalAmount || order.grandTotal || 0,
      paidAmount: payment?.amount || 0,
      remainingAmount: totalAmountRemaining?.totalAmount || payment?.remainingAmount || 0,
      paymentType: payment?.paymentType || 'Full',
      isDownPayment: payment?.paymentType === 'Down Payment',
      downPaymentPaid: payment?.paymentType === 'Down Payment' && payment?.status === 'settlement',
      method: payment
        ? (payment?.permata_va_number || payment?.va_numbers?.[0]?.bank || payment?.method || 'Unknown').toUpperCase()
        : 'Unknown',
      status: paymentStatus,
    };

    //  DEBUG: Log semua data order untuk melihat struktur sebenarnya
    console.log('=== DEBUGGING ORDER DATA ===');
    console.log('Order keys:', Object.keys(order.toObject()));
    console.log('Applied Voucher:', JSON.stringify(order.appliedVoucher, null, 2));
    console.log('Tax And Service Details:', JSON.stringify(order.taxAndServiceDetails, null, 2));
    console.log('Discounts:', JSON.stringify(order.discounts, null, 2));
    console.log('Applied Promos:', order.appliedPromos);
    console.log('Applied Manual Promo:', order.appliedManualPromo);
    console.log('Total Tax:', order.totalTax);
    console.log('============================');

    //  TAMBAHAN: Format voucher data - sekarang sudah ter-populate
    let voucherData = null;

    if (order.appliedVoucher && typeof order.appliedVoucher === 'object') {
      // Jika sudah ter-populate, ambil data langsung
      if (order.appliedVoucher.code) {
        voucherData = {
          _id: order.appliedVoucher._id,
          code: order.appliedVoucher.code,
          name: order.appliedVoucher.name,
          description: order.appliedVoucher.description,
          discountAmount: order.appliedVoucher.discountAmount,
          discountType: order.appliedVoucher.discountType,
          validFrom: order.appliedVoucher.validFrom,
          validTo: order.appliedVoucher.validTo,
          quota: order.appliedVoucher.quota,
          applicableOutlets: order.appliedVoucher.applicableOutlets || [],
          customerType: order.appliedVoucher.customerType,
          printOnReceipt: order.appliedVoucher.printOnReceipt || false,
          isActive: order.appliedVoucher.isActive || true
        };
      } else {
        // Jika hanya ObjectId, coba manual query
        console.log('Voucher not populated, trying manual query for ID:', order.appliedVoucher._id);
        try {
          // Assumsi Anda punya model Voucher
          const Voucher = require('../models/Voucher'); // sesuaikan path model
          const voucherDetails = await Voucher.findById(order.appliedVoucher._id || order.appliedVoucher);
          if (voucherDetails) {
            voucherData = {
              _id: voucherDetails._id,
              code: voucherDetails.code,
              name: voucherDetails.name,
              description: voucherDetails.description,
              discountAmount: voucherDetails.discountAmount,
              discountType: voucherDetails.discountType,
              validFrom: voucherDetails.validFrom,
              validTo: voucherDetails.validTo,
              quota: voucherDetails.quota,
              applicableOutlets: voucherDetails.applicableOutlets || [],
              customerType: voucherDetails.customerType,
              printOnReceipt: voucherDetails.printOnReceipt || false,
              isActive: voucherDetails.isActive || true
            };
          }
        } catch (voucherError) {
          console.log('Error fetching voucher details:', voucherError.message);
        }
      }
    }

    //  TAMBAHAN: Format tax and service details - sekarang sudah ter-populate  
    let taxAndServiceDetails = [];

    if (order.taxAndServiceDetails && Array.isArray(order.taxAndServiceDetails)) {
      taxAndServiceDetails = order.taxAndServiceDetails.map(tax => {
        // Jika tax adalah object dengan data lengkap
        if (tax.type && tax.name) {
          return {
            _id: tax._id,
            type: tax.type,
            name: tax.name,
            percentage: tax.percentage,
            amount: tax.amount
          };
        }
        // Jika tax hanya ObjectId, return minimal data
        return {
          _id: tax._id || tax,
          type: 'unknown',
          name: 'Tax/Service',
          percentage: 0,
          amount: 0
        };
      });
    }

    console.log('Formatted Voucher Data:', JSON.stringify(voucherData, null, 2));
    console.log('Formatted Tax Data:', JSON.stringify(taxAndServiceDetails, null, 2));

    // Calculate total tax amount
    const totalTax = order.totalTax || 0;

    // Build orderData
    const orderData = {
      _id: order._id.toString(),
      orderId: order.order_id || order._id.toString(),
      orderNumber: generateOrderNumber(order.order_id || order._id),
      orderDate: formatDate(order.createdAt),
      items: formattedItems,
      orderStatus: order.status,
      paymentMethod: paymentDetails.method,
      paymentStatus,
      totalBeforeDiscount: order.totalBeforeDiscount || 0,
      totalAfterDiscount: order.totalAfterDiscount || 0,
      grandTotal: order.grandTotal || 0,

      //  TAMBAHAN: Detail pembayaran yang lebih lengkap
      paymentDetails: paymentDetails,

      //  TAMBAHAN: Data voucher
      voucher: voucherData,

      //  TAMBAHAN: Data tax dan service details
      taxAndServiceDetails: taxAndServiceDetails,
      totalTax: totalTax,

      reservation: reservationData,

      // Data untuk frontend
      dineInData: order.orderType === 'Dine-In' ? {
        tableNumber: order.tableNumber,
      } : null,

      pickupData: order.orderType === 'Pickup' ? {
        pickupTime: order.pickupTime,
      } : null,

      takeAwayData: order.orderType === 'Take Away' ? {
        note: "Take Away order",
      } : null,

      deliveryData: order.orderType === 'Delivery' ? {
        deliveryAddress: order.deliveryAddress,
      } : null,
    };

    console.log('Order Data:', JSON.stringify(orderData, null, 2));
    res.status(200).json({ orderData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1️⃣ Cari order-nya
    const order = await Order.findOne({ order_id: orderId })
      .populate('user_id', 'name email')
      .populate('cashierId', 'name email')
      .populate('items.menuItem', 'name price category')
      .populate('outlet', 'name location')
      .populate('reservation')
      .populate('appliedPromos')
      .populate('appliedManualPromo')
      .populate('appliedVoucher');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan'
      });
    }

    // 2️⃣ Ambil ringkasan pembayaran (payment summary)
    const paymentSummary = await Payment.getPaymentSummary(order.order_id);

    // 3️⃣ Tentukan status pembayaran global
    let paymentStatus = 'unpaid';
    if (paymentSummary) {
      if (paymentSummary.summary.isFullyPaid) paymentStatus = 'settlement';
      else if (paymentSummary.summary.totalPaid > 0) paymentStatus = 'partial';
      else paymentStatus = 'pending';
    }

    // 4️⃣ Kirim response dengan gabungan data
    res.status(200).json({
      success: true,
      data: {
        order,
        payment: {
          status: paymentStatus,
          summary: paymentSummary?.summary || null,
          history: paymentSummary?.summary?.paymentHistory || [],
          details: paymentSummary?.payments || [],
        }
      }
    });

  } catch (error) {
    console.error('Error getOrderById:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail order',
      error: error.message
    });
  }
};

export const getPendingPaymentOrders = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required.' });
    }
    console.log('Fetching order with ID:', orderId);

    // Mencari order berdasarkan kode order, bukan ObjectId
    const order = await Order.findOne({ order_id: orderId })
      .populate('items.menuItem');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const payment = await Payment.findOne({ order_id: order.order_id });

    res.status(200).json({ payment });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

const formatToWIB = (date) => {
  if (!date) return null;

  // Ambil waktu WIB lalu convert balik ke Date
  return new Date(
    new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  );
};
const toISOJakartaWithOffset = (date) => {
  if (!date) return null;
  const d = new Date(date);

  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d).reduce((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});

  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${ms}+07:00`;
};
// Get Cashier Order History
export const getCashierOrderHistory = async (req, res) => {
  try {
    const cashierId = req.params.cashierId;
    console.log(cashierId);

    if (!cashierId) {
      return res.status(400).json({ message: 'Cashier ID is required.' });
    }

    // Hitung tanggal 7 hari yang lalu
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const baseFilter = {
      $and: [
        { cashierId: { $exists: true } },
        { cashierId: { $ne: null } },
        { cashierId: cashierId }, // Langsung tambahkan di sini
        { createdAt: { $gte: sevenDaysAgo } } // Filter 7 hari terakhir
      ],
    };

    // Mencari semua pesanan dengan field "cashier" yang sesuai dengan ID kasir
    const orders = await Order.find(baseFilter)
      .populate({
        path: 'cashierId',
        model: 'User',
        select: 'username profilePicture'
      })
      .populate('items.menuItem')
      .sort({ updatedAt: -1 })
      .lean();

    console.log(orders.length);

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        message: 'No order history found for this cashier in the last 7 days.',
        orders: []
      });
    }

    const orderIds = orders.map(order => order.order_id);

    // Ambil payment details untuk orders yang ditemukan
    const payments = await Payment.find({
      order_id: { $in: orderIds },
      status: { $ne: 'void' }
    })
      .lean()
      .sort({ updatedAt: -1, createdAt: -1 });

    // 🔧 Enhanced Payment Processing with Full Details
    const paymentDetailsMap = new Map();
    const paymentStatusMap = new Map();

    payments.forEach(payment => {
      const orderId = payment.order_id.toString();

      // Determine payment status with DP logic
      let status = payment?.status || 'Unpaid';
      if (payment?.paymentType === 'Down Payment') {
        if (payment?.status === 'settlement' && payment?.remainingAmount !== 0) {
          status = 'partial';
        } else if (payment?.status === 'settlement' && payment?.remainingAmount === 0) {
          status = 'settlement';
        }
      }

      // Store payment status
      paymentStatusMap.set(orderId, status);

      // Store complete payment details
      if (!paymentDetailsMap.has(orderId)) {
        paymentDetailsMap.set(orderId, []);
      }
      paymentDetailsMap.get(orderId).push(payment);
    });

    // Mapping data sesuai kebutuhan frontend
    const mappedOrders = orders.map(order => {
      const orderIdString = order.order_id.toString();

      const updatedItems = order.items.map(item => {
        return {
          _id: item._id,
          quantity: item.quantity,
          subtotal: item.subtotal,
          isPrinted: item.isPrinted,
          menuItem: {
            ...item.menuItem,
            category: item.category ? {
              id: item.category._id,
              name: item.category.name
            } : null,
            subCategory: item.subCategory ? {
              id: item.subCategory._id,
              name: item.subCategory.name
            } : null,
            originalPrice: item.menuItem.price ?? 0,
            discountedprice: item.menuItem.discountedPrice ?? item.menuItem.price,
          },
          selectedAddons: item.addons.length > 0 ? item.addons.map(
            addon => {
              const options = addon.options ? addon.options.length > 0 ? addon.options.map(option => ({
                id: option._id || option.id,
                label: option.label,
                price: option.price
              })) : [] : [];

              return {
                name: addon.name,
                id: addon._id,
                options: options ?? []
              }
            }
          ) : [],
          selectedToppings: item.toppings.length > 0 ? item.toppings.map(topping => ({
            id: topping._id || topping.id,
            name: topping.name,
            price: topping.price
          })) : [],
          notes: item.notes,
          dineType: item.dineType
        }
      });

      const paymentDetails = paymentDetailsMap.get(orderIdString) || [];

      // Tentukan payment status (logika yang sama seperti sebelumnya)
      const paymentStatus = paymentDetails.length > 1
        ? paymentDetails.every(p => p.status === 'Success' || p.status === 'settlement')
          ? 'Settlement'
          : paymentDetails.some(p => p.status === 'Success' || p.status === 'settlement')
            ? 'Partial'
            : 'Pending'
        : paymentDetails.length === 1
          ? paymentDetails[0].status === 'Success' || paymentDetails[0].status === 'settlement'
            ? 'Settlement'
            : paymentDetails[0].payment_type === 'Down Payment' ? 'Partial' : 'Pending'
          : 'Pending';

      // const lastPayment = paymentDetails.reduce((latest, p) => {
      //   const t = new Date(p.updatedAt || p.createdAt || 0).getTime();
      //   const lt = latest ? new Date(latest.updatedAt || latest.createdAt || 0).getTime() : -1;
      //   return t > lt ? p : latest;
      // }, null);

      // karena query payments sudah di-sort desc by updatedAt,
      // paymentDetails[0] adalah payment terbaru untuk order tsb (kalau mapping kamu push sesuai urutan payments)
      const lastPayment = paymentDetails[0] || null;

      const updatedAtFromPayment = lastPayment?.updatedAt || lastPayment?.createdAt || null;
      const baseUpdatedAt = updatedAtFromPayment;
      return {
        ...order,
        updatedAtWIB: toISOJakartaWithOffset(baseUpdatedAt),
        cashierId: undefined,
        cashier: order.cashierId,
        items: updatedItems,
        payment_details: paymentDetails,
        paymentStatus: paymentStatusMap.get(orderIdString) || paymentStatus
      };
    });

    res.status(200).json({
      orders: mappedOrders,
      message: `Found ${mappedOrders.length} orders in the last 7 days`
    });

  } catch (error) {
    console.error('Error in getCashierOrderHistory:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// test socket
export const testSocket = async (req, res) => {
  console.log('Emitting order created to cashier room...');
  // const cashierRoom = io.to('cashier_room').emit('order_created', { message: 'Order created' });
  // const areaRoom = io.to('group_1').emit('order_created', { message: 'Order created' });
  // const areaRoom2 = io.to('group_2').emit('order_created', { message: 'Order created' });
  const updateStock = io.to('cashier_rooms').emit('update_stock', { message: 'Stock Updated' });

  console.log('Emitting order created to cashier room success.');

  // res.status(200).json({ success: { areaRoom, areaRoom2 } });
  // res.status(200).json({ success: { cashierRoom } });
  // res.status(200).json({ success: { cashierRoom, areaRoom } });
  res.status(200).json({ success: { updateStock } });
}
async function _autoConfirmOrderInBackground(orderId) {
  try {
    const order = await Order.findOne({ order_id: orderId });
    if (!order) {
      console.warn(`⚠️ Order ${orderId} not found for auto-confirm`);
      return;
    }

    // Update status
    await Order.updateOne(
      { order_id: orderId },
      { $set: { status: 'OnProcess' } }
    );

    // Broadcast status update
    global.io.to(`order_${orderId}`).emit('status_confirmed', {
      order_id: orderId,
      orderStatus: 'OnProcess',
      timestamp: new Date()
    });

    console.log(`✅ [AUTO-CONFIRM] Order ${orderId} confirmed to OnProcess`);
  } catch (err) {
    console.error(`❌ Auto-confirm error for ${orderId}:`, err);
  }
}
export const cashierCharge = async (req, res) => {
  try {
    const {
      method,
      order_id,
      gross_amount,
      is_down_payment = false,
      down_payment_amount,
      remaining_payment,
      tendered_amount,
      change_amount,
      is_split_payment = false,
      split_payment_index = 0,
      va_numbers,
      actions,
      method_type
    } = req.body;

    console.log('Cashier Charge - Processing Payment:', {
      order_id,
      method,
      gross_amount,
      is_down_payment,
      is_split_payment,
      split_payment_index,
      tendered_amount,
      change_amount,
      va_numbers,
      actions
    });

    // Cari order
    const order = await Order.findOne({ order_id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan'
      });
    }

    // Untuk split payment, update payment yang spesifik
    if (is_split_payment && order.isSplitPayment) {
      console.log('Processing split payment update:', {
        order_id,
        split_payment_index,
        currentPayments: order.payments.length
      });

      if (split_payment_index >= order.payments.length) {
        return res.status(400).json({
          success: false,
          message: `Invalid split payment index: ${split_payment_index}`
        });
      }

      // Update payment spesifik
      order.payments[split_payment_index].status = 'completed';
      order.payments[split_payment_index].processedAt = new Date();

      if (order.payments[split_payment_index].paymentMethod === 'Cash') {
        order.payments[split_payment_index].paymentDetails = {
          cashTendered: tendered_amount || gross_amount,
          change: change_amount || 0
        };
      }

      await order.save();

      console.log('Split payment updated successfully:', {
        order_id,
        split_payment_index,
        method: order.payments[split_payment_index].paymentMethod,
        amount: order.payments[split_payment_index].amount,
        status: order.payments[split_payment_index].status
      });

    } else {
      // Legacy single payment processing
      if (order.payments && order.payments.length > 0) {
        order.payments[0].status = 'completed';
        order.payments[0].processedAt = new Date();

        if (order.payments[0].paymentMethod === 'Cash') {
          order.payments[0].paymentDetails = {
            cashTendered: tendered_amount || gross_amount,
            change: change_amount || 0
          };
        }

        await order.save();
      }
    }

    // Reload order untuk mendapatkan data terbaru
    const updatedOrder = await Order.findOne({ order_id });

    // Hitung total paid
    const totalPaid = updatedOrder.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const paymentStatus = totalPaid >= updatedOrder.grandTotal ? 'settlement' : 'partial';

    // Buat record di collection Payment
    const paymentData = {
      order_id: order_id,
      payment_code: generatePaymentCode(),
      transaction_id: generateTransactionId(),
      method: method,
      status: paymentStatus,
      paymentType: is_down_payment ? 'Down Payment' : 'Full',
      amount: gross_amount,
      totalAmount: updatedOrder.grandTotal,
      remainingAmount: Math.max(0, updatedOrder.grandTotal - totalPaid),
      tendered_amount: tendered_amount || gross_amount,
      change_amount: change_amount || 0,
      fraud_status: 'accept',
      transaction_time: new Date().toLocaleString('id-ID'),
      paidAt: new Date(),
      currency: "IDR",
      merchant_id: "G055993835",
      va_numbers: va_numbers,
      actions: actions,
      method_type: method_type
    };

    const payment = await Payment.create(paymentData);

    console.log('Payment record created:', {
      payment_id: payment._id,
      order_id,
      status: paymentStatus,
      amount: gross_amount,
      remainingAmount: payment.remainingAmount,
      is_split_payment,
      split_payment_index
    });

    return res.status(200).json({
      success: true,
      message: is_split_payment ?
        `Split payment ${split_payment_index + 1} processed successfully` :
        'Payment processed successfully',
      data: {
        payment_status: paymentStatus,
        transaction_id: payment.transaction_id,
        order_id: order_id,
        total_paid: totalPaid,
        grand_total: updatedOrder.grandTotal,
        remaining_balance: Math.max(0, updatedOrder.grandTotal - totalPaid),
        is_split_payment: is_split_payment,
        split_payment_index: split_payment_index,
        payments: updatedOrder.payments.map(p => ({
          method: p.paymentMethod,
          amount: p.amount,
          status: p.status
        }))
      }
    });

  } catch (error) {
    console.error('Error in cashierCharge:', error);
    return res.status(500).json({
      success: false,
      message: `Payment processing failed: ${error.message}`
    });
  }
};


// export const cashierCharge = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const {
//       payment_type,         // 'cash' | 'qris' | 'transfer' | ...
//       order_id,             // string order_id
//       gross_amount,         // total yang dibayarkan saat ini (atau total order untuk full)
//       is_down_payment,      // boolean
//       down_payment_amount,  // optional
//       remaining_payment,    // optional (tidak dipakai, kita hitung ulang agar konsisten)
//       tendered_amount,       // optional
//       change_amount,        // optional
//     } = req.body;

//     if (!order_id) {
//       await session.abortTransaction(); session.endSession();
//       return res.status(400).json({ success: false, message: 'Order ID is required' });
//     }
//     if (typeof gross_amount !== 'number' || isNaN(gross_amount) || gross_amount < 0) {
//       await session.abortTransaction(); session.endSession();
//       return res.status(400).json({ success: false, message: 'gross_amount must be a valid number ≥ 0' });
//     }

//     // Ambil order
//     const order = await Order.findOne({ order_id }).session(session);
//     if (!order) {
//       await session.abortTransaction(); session.endSession();
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     // Hitung total order (fallback ke gross_amount kalau field total tidak ada)
//     const orderTotal = Number(
//       order.grandTotal ?? gross_amount ?? 0
//     );

//     // Ambil payment yang sudah ada
//     const existingPayments = await Payment.find({ order_id }).session(session);

//     // Cegah DP ganda: kalau sudah ada DP 'settlement' dan masih ada Final Payment 'pending', jangan bikin DP lagi
//     const hasSettledDP = existingPayments.some(p => p.paymentType === 'Down Payment' && (p.status === 'settlement' || p.status === 'paid'));
//     const hasPendingFinal = existingPayments.some(p => p.paymentType === 'Final Payment' && p.status === 'pending');

//     if (is_down_payment === true && (hasSettledDP || hasPendingFinal)) {
//       await session.abortTransaction(); session.endSession();
//       return res.status(409).json({
//         success: false,
//         message: 'Down Payment already exists or pending Final Payment is present for this order'
//       });
//     }

//     // === MODE DP → buat 2 payment (DP settled + Final pending) ===
//     if (is_down_payment === true) {
//       const dpAmount = Number(down_payment_amount ?? gross_amount ?? 0);
//       if (dpAmount <= 0) {
//         await session.abortTransaction(); session.endSession();
//         console.log('Down Payment amount must be > 0');
//         return res.status(400).json({ success: false, message: 'Down Payment amount must be > 0' });
//       }
//       if (dpAmount >= orderTotal) {
//         await session.abortTransaction(); session.endSession();
//         console.log('Down Payment must be less than total order');
//         return res.status(400).json({ success: false, message: 'Down Payment must be less than total order' });
//       }

//       const remaining = Math.max(0, orderTotal - dpAmount);

//       // Build common fields
//       const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
//       const merchantId = 'G711879663';

//       // 1) Payment DP (settlement)
//       const dpPayment = new Payment({
//         payment_code: generatePaymentCode(),
//         transaction_id: generateTransactionId(),
//         order_id,
//         method: payment_type,
//         status: 'settlement',
//         paymentType: 'Down Payment',
//         amount: dpAmount,
//         totalAmount: orderTotal,
//         remainingAmount: 0,               // ← tidak digunakan lagi, set 0
//         relatedPaymentId: null,
//         fraud_status: 'accept',
//         transaction_time: nowStr,
//         currency: 'IDR',
//         merchant_id: merchantId,
//         paidAt: new Date(),
//         tendered_amount: tendered_amount,
//         change_amount: change_amount
//       });

//       const savedDP = await dpPayment.save({ session });

//       // 2) Payment Final (pending) dengan amount = sisa
//       const finalPayment = new Payment({
//         payment_code: generatePaymentCode(),
//         transaction_id: generateTransactionId(),
//         order_id,
//         method: payment_type,             // boleh set 'cash' atau channel rencana pelunasan; bisa juga null
//         status: 'pending',
//         paymentType: 'Final Payment',
//         amount: remaining,
//         totalAmount: orderTotal,
//         remainingAmount: 0,               // ← tidak digunakan lagi, set 0
//         relatedPaymentId: savedDP._id,    // link ke DP
//         fraud_status: 'accept',
//         transaction_time: nowStr,
//         currency: 'IDR',
//         merchant_id: merchantId,
//       });

//       const savedFinal = await finalPayment.save({ session });

//       // Update order.items.* → set payment_id = DP (opsional: saat final settle, bisa update ulang)
//       await Order.updateOne(
//         { order_id },
//         { $set: { "items.$[].payment_id": savedDP._id } },
//         { session }
//       );

//       // (Opsional) Karena belum lunas total, jangan ubah status order ke 'Waiting/Finished' dulu

//       await session.commitTransaction();
//       session.endSession();

//       return res.status(200).json({
//         success: true,
//         message: 'Down Payment created and remaining Final Payment scheduled',
//         data: {
//           order_id,
//           totalAmount: orderTotal,
//           payments: [
//             {
//               role: 'down_payment',
//               _id: savedDP._id,
//               transaction_id: savedDP.transaction_id,
//               status: savedDP.status,               // 'settlement'
//               paymentType: savedDP.paymentType,     // 'Down Payment'
//               amount: savedDP.amount,
//               remainingAmount: savedDP.remainingAmount, // 0
//               relatedPaymentId: savedDP.relatedPaymentId,
//               createdAt: savedDP.createdAt,
//               updatedAt: savedDP.updatedAt,
//             },
//             {
//               role: 'final_payment',
//               _id: savedFinal._id,
//               transaction_id: savedFinal.transaction_id,
//               status: savedFinal.status,            // 'pending'
//               paymentType: savedFinal.paymentType,  // 'Final Payment'
//               amount: savedFinal.amount,            // sisa
//               remainingAmount: savedFinal.remainingAmount, // 0
//               relatedPaymentId: savedFinal.relatedPaymentId, // id DP
//               createdAt: savedFinal.createdAt,
//               updatedAt: savedFinal.updatedAt,
//             },
//           ],
//         },
//       });
//     }
//     console.log('membuat payment mode non DP');
//     // === MODE NON-DP (Full langsung atau pelunasan tanpa DP) ===
//     // Jika tidak DP, biasakan 1 payment saja. Bisa full settlement,
//     // atau kalau mau “pending” untuk non-cash, statusnya bisa diubah di sini.
//     const amount = Math.min(Number(gross_amount ?? 0), orderTotal);
//     const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

//     const paymentDoc = new Payment({
//       payment_code: generatePaymentCode(),
//       transaction_id: generateTransactionId(),
//       order_id,
//       method: payment_type,
//       status: 'settlement',                 // dari kasir: langsung settled
//       paymentType: 'Full',
//       amount: orderTotal,
//       totalAmount: orderTotal,
//       remainingAmount: 0,                   // ← tidak digunakan lagi, set 0
//       relatedPaymentId: null,
//       fraud_status: 'accept',
//       transaction_time: nowStr,
//       currency: 'IDR',
//       merchant_id: 'G055993835',
//       paidAt: new Date(),
//       tendered_amount: tendered_amount,
//       change_amount: change_amount
//     });

//     const saved = await paymentDoc.save({ session });

//     // Update payment_id di items
//     await Order.updateOne(
//       { order_id },
//       { $set: { "items.$[].payment_id": saved._id } },
//       { session }
//     );

//     // Order bisa dianggap lunas jika amount >= orderTotal
//     const fullyPaid = amount >= orderTotal;
//     if (fullyPaid) {
//       order.status = order.orderType === 'Reservation' ? 'Finished' : 'Waiting';
//       await order.save({ session });
//     }

//     await session.commitTransaction();
//     session.endSession();
//     console.log('Payment created');
//     return res.status(200).json({
//       success: true,
//       message: 'Payment created',
//       paymentStatus: fullyPaid ? 'settlement' : 'partial',
//       data: {
//         order_id,
//         totalAmount: orderTotal,
//         payments: [
//           {
//             role: 'full_payment',
//             _id: saved._id,
//             transaction_id: saved.transaction_id,
//             status: saved.status,
//             paymentType: saved.paymentType,
//             amount: saved.amount,
//             remainingAmount: saved.remainingAmount, // 0
//             relatedPaymentId: saved.relatedPaymentId,
//             createdAt: saved.createdAt,
//             updatedAt: saved.updatedAt,
//           }
//         ]
//       }
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error('cashierCharge error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Payment failed',
//       error: error.message || String(error),
//     });
//   }
// };

export const confirmOrderViaCashier = async (req, res) => {
  try {
    const { order_id, source, cashier_id } = req.body;

    // Validasi input
    if (!order_id || !cashier_id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Cashier ID is required'
      });
    }

    // Temukan order berdasarkan order_id
    const order = await Order.findOne({ order_id })
      .populate('items.menuItem')
      .populate('user_id', 'name email')
      .populate('cashierId', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validasi status order saat ini
    console.log(order.status);
    if (order.status !== 'Pending' && order.status !== 'Reserved') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be confirmed. Current status: ${order.status}`
      });
    }

    // Cek status pembayaran
    const payment = await Payment.findOne({ order_id });

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: 'No payment record found for this order'
      });
    }

    // Validasi apakah pembayaran sudah lunas
    const isFullyPaid = await checkPaymentStatus(order_id, order.grandTotal);

    if (!isFullyPaid) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be confirmed. Payment is not completed',
        payment_status: payment.status,
        amount_paid: payment.amount,
        amount_due: order.grandTotal - payment.amount
      });
    }

    //find cashier
    const cashier = await User.findOne({ _id: cashier_id });
    console.log(cashier);

    // Update status order menjadi "Waiting"
    order.cashierId = cashier._id;
    // await order.save({ session });
    if (order.orderType === 'Reservation') {
      order.status = 'Completed';
    } else {
      order.status = 'Waiting';
    }

    await order.save();

    const statusUpdateData = {
      order_id: order_id,  // Gunakan string order_id
      orderStatus: 'Waiting',
      paymentStatus: 'Settlement',
      message: 'Pesanan dikonfirmasi kasir, menunggu kitchen',
      timestamp: new Date(),
      cashier: {
        id: cashier._id,  // Ganti dengan ID kasir yang sebenarnya
        name: cashier.username, // Ganti dengan nama kasir yang sebenarnya
      }
    };

    // Emit ke room spesifik untuk order tracking
    io.to(`order_${order_id}`).emit('order_status_update', statusUpdateData);

    // Emit event khusus untuk konfirmasi kasir
    io.to(`order_${order_id}`).emit('order_confirmed', {
      orderId: order_id,
      orderStatus: 'Waiting',
      paymentStatus: "Settlement",
      cashier: statusUpdateData.cashier,
      message: 'Your order is now being prepared',
      timestamp: new Date()
    });

    console.log(`🔔 Emitted order status update to room: order_${order_id}`, statusUpdateData);

    // 3. Send FCM notification to customer
    if (order.source === 'App') {
      console.log('📱 Sending FCM notification to customer:', order.user, order.user_id._id);
      if (order.user && order.user_id._id) {
        try {
          const orderData = {
            orderId: order.order_id,
            cashier: statusUpdateData.cashier
          };

          const notificationResult = await FCMNotificationService.sendOrderConfirmationNotification(
            order.user_id._id.toString(),
            orderData
          );

          console.log('📱 FCM Notification result:', notificationResult);
        } catch (notificationError) {
          console.error('❌ Failed to send FCM notification:', notificationError);
        }
      }
    }

    // 4. Send notification to cashier dashboard if order is from Web/App
    if (order.source === 'Web' || order.source === 'App') {
      const orderData = {
        orderId: order.order_id,
        source: order.source,
        orderType: order.orderType,
        tableNumber: order.tableNumber || null,
        items: order.items.map(item => ({
          name: item.menuItem?.name || 'Unknown Item',
          quantity: item.quantity
        })),
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        totalAmount: order.grandTotal,
        outletId: order.outlet._id
      };

      try {
        if (typeof broadcastNewOrder === 'function') {
          broadcastNewOrder(order.outlet._id.toString(), orderData);
        }
      } catch (broadcastError) {
        console.error('Failed to broadcast new order:', broadcastError);
      }
    }

    console.log('order berhasil di update');

    // Response sukses to cashier
    res.status(200).json({
      success: true,
      message: 'Order confirmed successfully',
      data: {
        order_id: order.order_id,
        status: order.status,
        grandTotal: order.grandTotal,
        payment_status: payment.status
      }
    });

  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const checkPaymentStatus = async (order_id, grandTotal) => {
  try {
    // Cari semua pembayaran untuk order ini
    const payments = await Payment.find({ order_id });

    if (payments.length === 0) {
      return false;
    }

    // Hitung total amount yang sudah dibayar
    const paidAmount = payments
      .filter(p => p.status === 'settlement' || p.status === 'paid')
      .reduce((total, payment) => total + payment.amount, 0);

    // Bandingkan dengan grand total order
    return paidAmount >= grandTotal;
  } catch (error) {
    console.error('Error checking payment status:', error);
    return false;
  }
};

// proceess payment via cashier
export const processPaymentCashier = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { order_id, selected_payment_id, payment_method, cashier_id, payment_type, device_id } = req.body;

    // Validasi input
    if (!order_id || !selected_payment_id || !Array.isArray(selected_payment_id)) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: 'Order ID and selected payment IDs array are required'
      });
    }

    // Filter hanya ID yang valid + konversi ke ObjectId
    // const validObjectIds = selected_payment_id
    //   .filter((id) => typeof id === 'string')
    //   .map((id) => new mongoose.Types.ObjectId(id));

    // if (validObjectIds.length === 0) {
    //   await session.abortTransaction();
    //   session.endSession();
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Semua selected_payment_id tidak valid sebagai ObjectId',
    //   });
    // }

    // Cari order berdasarkan order_id
    const order = await Order.findOne({ order_id }).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Cari semua payment yang dipilih
    const payments = await Payment.find({
      transaction_id: { $in: selected_payment_id },
      order_id: order_id
    }).session(session);

    if (payments.length === 0) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: 'No valid payments found for this order'
      });
    }

    // Proses setiap payment
    for (const payment of payments) {
      // Jika paymentType adalah "Down Payment", pindahkan remainingAmount ke amount
      // if (payment.paymentType === 'Down Payment') {
      //   payment.amount += payment.remainingAmount;
      //   payment.remainingAmount = 0;
      // }
      const paymentMethodandtype =
        [payment_type, payment_method]
          .filter(Boolean)
          .join(' ')
          .trim();

      // Update status payment menjadi settlement
      payment.status = 'settlement';
      payment.method = payment_method;
      payment.method_type = paymentMethodandtype;
      payment.paidAt = new Date();

      // Handle penyimpanan payment_type berdasarkan payment_method
      if (payment_type) {
        if (payment_method === 'Debit' || payment_method === 'Bank Transfer') {
          // Simpan payment_type di va_numbers untuk Debit dan Bank Transfer
          if (payment.va_numbers && payment.va_numbers.length > 0) {
            // Jika sudah ada va_numbers, update bank dengan payment_type
            payment.va_numbers[0].bank = payment_type;
          } else {
            // Jika belum ada, buat baru
            payment.va_numbers = [{
              bank: payment_type,
              va_number: '' // Diisi kosong karena cashier tidak memiliki va_number
            }];
          }
        } else if (payment_method === 'QRIS') {
          // Simpan payment_type di actions untuk QRIS
          if (payment.actions && payment.actions.length > 0) {
            // Jika sudah ada actions, update name dengan payment_type
            payment.actions[0].name = payment_type;
          } else {
            // Jika belum ada, buat baru
            payment.actions = [{
              name: payment_type,
              method: "QRIS", // Diisi kosong karena cashier tidak memiliki method detail
              url: '' // Diisi kosong karena cashier tidak memiliki URL
            }];
          }
        }
      }

      await payment.save({ session });
      // console.log(payment);
    }


    // Cek apakah semua payment untuk order ini sudah settlement dan remainingAmount 0
    const allPayments = await Payment.find({ order_id }).session(session);
    const isFullyPaid = allPayments.every(p =>
      p.status === 'settlement'
    );
    const cashier = await User.findOne({ _id: cashier_id });
    if (!cashier) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Cashier not found'
      });
    }
    // Update status order jika semua pembayaran sudah lunas
    order.cashierId = cashier._id;
    order.paymentMethod = payment_method;
    if (device_id) {
      order.device_id = device_id;
    }
    await order.save({ session });
    console.log('is fully paid:', isFullyPaid);
    if (isFullyPaid) {
      if (order.orderType === 'Reservation') {
        order.status = 'Completed';
      } else if (order.status.toLowerCase() === 'onprocess') {
        order.status = 'OnProcess';
      } else {
        console.log('ordered waiting');
        order.status = 'Waiting';
      }

      await order.save({ session });
    }

    if (isFullyPaid && order.orderType === 'Dine-In') {
      updateTableStatusAfterPayment(order);
      console.log('mejaa berhasil di ubah');
    }
    const statusUpdateData = {
      order_id: order_id,  // Gunakan string order_id
      orderStatus: 'Waiting',
      paymentStatus: 'settlement',
      message: 'Pesanan dikonfirmasi kasir, menunggu kitchen',
      timestamp: new Date(),
      cashier: {
        id: cashier._id,  // Ganti dengan ID kasir yang sebenarnya
        name: cashier.username, // Ganti dengan nama kasir yang sebenarnya
      }
    };

    // Emit ke room spesifik untuk order tracking
    io.to(`order_${order_id}`).emit('order_status_update', statusUpdateData);

    // Emit event khusus untuk konfirmasi kasir
    io.to(`order_${order_id}`).emit('order_confirmed', {
      orderId: order_id,
      orderStatus: 'Waiting',
      paymentStatus: "settlement",
      cashier: statusUpdateData.cashier,
      message: 'Your order is now being prepared',
      timestamp: new Date()
    });

    console.log(`🔔 Emitted order status update to room: order_${order_id}`, statusUpdateData);

    // 3. Send FCM notification to customer
    if (order.source === "App") {
      console.log('📱 Sending FCM notification to customer:', order.user, order.user_id._id);
      if (order.user && order.user_id._id) {
        try {
          const orderData = {
            orderId: order.order_id,
            cashier: statusUpdateData.cashier
          };

          const notificationResult = await FCMNotificationService.sendOrderConfirmationNotification(
            order.user_id._id.toString(),
            orderData
          );

          console.log('📱 FCM Notification result:', notificationResult);
        } catch (notificationError) {
          console.error('❌ Failed to send FCM notification:', notificationError);
        }
      }
    }

    // 4. Send notification to cashier dashboard if order is from Web/App
    if (order.source === 'Web' || order.source === 'App') {
      const orderData = {
        orderId: order.order_id,
        source: order.source,
        orderType: order.orderType,
        tableNumber: order.tableNumber || null,
        items: order.items.map(item => ({
          name: item.menuItem?.name || 'Unknown Item',
          quantity: item.quantity
        })),
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        totalAmount: order.grandTotal,
        outletId: order.outlet._id
      };

      try {
        if (typeof broadcastNewOrder === 'function') {
          broadcastNewOrder(order.outlet._id.toString(), orderData);
        }
      } catch (broadcastError) {
        console.error('Failed to broadcast new order:', broadcastError);
      }
    }

    // Commit transaksi
    await session.commitTransaction();
    session.endSession();


    const result = {
      success: true,
      message: 'Payment processed successfully',
      data: {
        order_id: order.order_id,
        order_status: order.status,
        order_type: order.orderType,
        is_fully_paid: isFullyPaid,
        processed_payments: payments.map(p => ({
          payment_id: p._id,
          payment_type: p.paymentType,
          // amount: p.amount,
          // remaining_amount: p.remainingAmount,
          status: p.status
        }))
      }
    };

    console.log('order berhasil di update', result);

    res.status(200).json(result);

  } catch (error) {
    // Rollback transaksi jika terjadi error
    await session.abortTransaction();
    session.endSession();

    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const deleteOrderItemAtOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { order_id, menu_item_id, cashier_id } = req.body;
    console.log('order_id and menu_item_id:', order_id, menu_item_id);
    // 1) Validasi awal
    if (!order_id || !menu_item_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'order_id dan menu_item_id wajib diisi',
      });
    }

    // 2) Ambil order
    const order = await Order.findOne({ order_id })
      .populate({ path: 'items.menuItem', select: '_id name price workstation' })
      .session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }

    // 3) Cari item target di dalam order
    const idx = order.items.findIndex((item) => {
      return item.menuItem._id.toString() === menu_item_id;
    });

    console.log('cari item target', idx);

    if (idx === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Item dengan menu_item_id tersebut tidak ada dalam order',
      });
    }

    // 4) Simpan salinan item yang akan dihapus (untuk logging/response)
    const removedItem = order.items[idx];

    // 5) Hapus item
    order.items.splice(idx, 1);

    // 6) Hitung ulang total2 secara defensif
    recomputeOrderTotals(order);

    // 7) Jika items kosong, Anda bisa menandai status khusus (opsional)
    if (order.items.length === 0) {
      // Pilihan: 'Canceled' atau 'Empty' sesuai alur bisnis Anda
      order.status = 'Canceled';
      // Jika perlu, nolkan total agar rapi:
      order.totalBeforeDiscount = 0;
      order.totalAfterDiscount = 0;
      order.totalTax = 0;
      order.totalServiceFee = 0;
      order.grandTotal = 0;
    }

    order.cashier_id = cashier_id;
    // 8) Simpan order
    await order.save({ session });

    // (Opsional) Emit notifikasi ke UI real-time
    try {
      const payload = {
        order_id: order.order_id,
        removed_menu_item_id: menu_item_id,
        order_status: order.status,
        grand_total: order.grandTotal,
        items_count: order.items.length,
        message: 'Satu item dihapus dari order karena stok habis',
        timestamp: new Date(),
      };
      io.to(`order_${order.order_id}`).emit('order_item_removed', payload);
    } catch (emitErr) {
      // Jangan gagalkan transaksi hanya karena emit gagal
      console.error('Emit order_item_removed gagal:', emitErr);
    }

    // 9) Commit transaksi
    await session.commitTransaction();
    session.endSession();

    // 10) Respons
    return res.status(200).json({
      success: true,
      message: 'Item berhasil dihapus dari order',
      data: {
        order_id: order.order_id,
        // removed_item: {
        //   menu_item_id:
        //     removedItem?.menuItem?._id?.toString?.() ??
        //     removedItem?.menuItem?.toString?.() ??
        //     null,
        //   name:
        //     removedItem?.menuItem?.name ??
        //     removedItem?.name ??
        //     'Unknown Item',
        //   quantity: removedItem?.quantity ?? 0,
        //   // estimasi total item yang dihapus (berguna untuk audit)
        //   estimated_total:
        //     removedItem?.totalAfterDiscount ??
        //     removedItem?.total ??
        //     removedItem?.lineTotal ??
        //     num(removedItem?.price) * num(removedItem?.quantity),
        // },
        // order_summary: {
        //   items_count: order.items.length,
        //   total_before_discount: order.totalBeforeDiscount,
        //   total_tax: order.totalTax,
        //   total_service_fee: order.totalServiceFee,
        //   total_after_discount: order.totalAfterDiscount,
        //   order_level_discounts: {
        //     autoPromoDiscount,
        //     manualDiscount,
        //     voucherDiscount,
        //   },
        //   grand_total: order.grandTotal,
        //   status: order.status,
        // },
      },
    });
  } catch (error) {
    // Rollback bila ada error
    await session.abortTransaction();
    session.endSession();
    console.error('deleteOrderItemAtOrder error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const getOrderByIdAfterItemDelete = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Cari berdasarkan order_id (string), bukan _id
    // Populate minimal agar UI dapat nama & harga
    const order = await Order.findOne({ order_id: orderId })
      .populate({
        path: 'items.menuItem',
        select: '_id name price workstation',
      })
      .populate({ path: 'user_id', select: '_id name' })
      .populate({ path: 'outlet', select: '_id name' })
      .exec();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Pastikan agregat up-to-date (kalau totals tersimpan mentah)
    recomputeOrderTotals(order);

    // (Opsional) turunkan paymentStatus dari collection Payment jika tidak tersimpan di order
    const payments = await Payment.find({ order_id: orderId });
    const anyPending = payments.some(p => (p.status || '').toLowerCase() !== 'settlement');
    order.paymentStatus = anyPending ? 'partial' : 'settlement';

    await order.save(); // simpan jika kita recompute

    const dto = toOrderDTO(order, payments);
    return res.status(200).json({
      success: true,
      data: { order: dto },
    });
  } catch (err) {
    console.error('getOrderById error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Helper: hitung ulang agregat order agar rapi */
function recomputeOrderTotals(order) {
  const items = order.items ?? [];

  const sumBy = (arr, pick) => arr.reduce((acc, x) => acc + num(pick(x)), 0);

  const totalBeforeDiscount = sumBy(items, (i) =>
    i.totalBeforeDiscount ?? i.subtotal ?? (num(i.price) * num(i.quantity))
  );

  const itemsTotalAfterDiscount = sumBy(items, (i) =>
    i.totalAfterDiscount ?? i.total ?? i.lineTotal ?? (num(i.price) * num(i.quantity))
  );

  // Jika pajak & service disimpan per item:
  const totalTax = sumBy(items, (i) => i.taxAmount ?? 0);
  const totalServiceFee = sumBy(items, (i) => i.serviceFeeAmount ?? 0);

  const discounts = order.discounts || {};
  const orderLevelDiscount =
    num(discounts.autoPromoDiscount) + num(discounts.manualDiscount) + num(discounts.voucherDiscount);

  order.totalBeforeDiscount = totalBeforeDiscount;
  order.totalAfterDiscount = Math.max(0, itemsTotalAfterDiscount);
  order.totalTax = totalTax;
  order.totalServiceFee = totalServiceFee;
  order.grandTotal = Math.max(0, order.totalAfterDiscount + order.totalTax + order.totalServiceFee - orderLevelDiscount);

  return order;
}
// utils/toOrderDTO.js
const toStr = (v) => (v == null ? '' : v.toString());

export function toOrderDTO(orderDoc, paymentDocs = []) {
  const o = orderDoc.toObject ? orderDoc.toObject() : orderDoc;

  // ITEMS → { menuItem:{id,name,originalPrice}, selectedToppings, selectedAddons, subtotal, quantity, isPrinted, notes }
  const items = (o.items ?? []).map((it) => {
    // menuItem bisa ObjectId atau populated object
    const mi = it.menuItem && typeof it.menuItem === 'object' ? it.menuItem : null;

    return {
      menuItem: {
        id: mi ? toStr(mi._id ?? mi.id) : toStr(it.menuItem),
        name: mi?.name ?? it.name ?? '',
        originalPrice: Number(mi?.price ?? it.price ?? 0), // biarkan number (bisa int/float)
      },
      selectedToppings: Array.isArray(it.toppings)
        ? it.toppings.map((t) => ({
          id: toStr(t._id ?? t.id ?? ''),
          name: t.name ?? '',
          price: Number(t.price ?? 0),
        }))
        : [],
      selectedAddons: Array.isArray(it.addons)
        ? it.addons.map((a) => ({
          id: toStr(a._id ?? a.id ?? ''),
          name: a.name ?? '',
          type: a.type ?? '',
          options: Array.isArray(a.options)
            ? a.options.map((op) => ({
              id: toStr(op._id ?? op.id ?? ''),
              label: op.label ?? op.name ?? '',
              price: Number(op.price ?? 0),
            }))
            : [],
        }))
        : [],
      subtotal: Number(it.subtotal ?? it.total ?? 0),
      quantity: Number(it.quantity ?? 1),
      isPrinted: !!it.isPrinted,
      notes: it.notes ?? '',
    };
  });

  // DISCOUNTS
  const discounts = {
    autoPromoDiscount: Number(o.discounts?.autoPromoDiscount ?? 0),
    manualDiscount: Number(o.discounts?.manualDiscount ?? 0),
    voucherDiscount: Number(o.discounts?.voucherDiscount ?? 0),
  };

  // TAX & SERVICE DETAILS (amount boleh float seperti contoh)
  const taxAndServiceDetails = Array.isArray(o.taxAndServiceDetails)
    ? o.taxAndServiceDetails.map((t) => ({
      type: t.type ?? '',
      name: t.name ?? '',
      amount: Number(t.amount ?? 0),
      _id: toStr(t._id ?? ''),
    }))
    : [];

  // OUTLET → string id (bukan object)
  const outlet =
    o.outlet && typeof o.outlet === 'object'
      ? toStr(o.outlet._id ?? '')
      : toStr(o.outlet ?? '');

  // PAYMENT DETAILS → biarkan number apa adanya (bisa float seperti 233822.6)
  const payment_details = Array.isArray(paymentDocs)
    ? paymentDocs.map((p) => {
      const pp = p.toObject ? p.toObject() : p;
      return {
        _id: toStr(pp._id ?? ''),
        order_id: toStr(pp.order_id ?? ''),
        payment_code: toStr(pp.payment_code ?? ''),
        transaction_id: toStr(pp.transaction_id ?? ''),
        method: pp.method ?? '',
        status: pp.status ?? '',
        paymentType: pp.paymentType ?? '',
        amount: Number(pp.amount ?? 0),
        totalAmount: Number(pp.totalAmount ?? pp.amount ?? 0),
        remainingAmount: Number(pp.remainingAmount ?? 0),
        relatedPaymentId: pp.relatedPaymentId ? toStr(pp.relatedPaymentId) : null,
        discount: Number(pp.discount ?? 0),
        currency: pp.currency ?? 'IDR',
        va_numbers: Array.isArray(pp.va_numbers) ? pp.va_numbers : [],
        actions: Array.isArray(pp.actions) ? pp.actions : [],
        createdAt: pp.createdAt ?? null,
        updatedAt: pp.updatedAt ?? null,
        __v: Number(pp.__v ?? 0),
      };
    })
    : [];

  return {
    _id: toStr(o._id),
    order_id: o.order_id ?? '',
    user: o.user?.name ?? o.user ?? '',
    items,

    status: o.status ?? 'Pending',
    paymentMethod: o.paymentMethod ?? '',
    orderType: o.orderType ?? 'Dine-In',
    tableNumber: o.tableNumber ?? '',
    type: o.type ?? 'Indoor',
    isOpenBill: !!o.isOpenBill,

    discounts,
    appliedPromos: Array.isArray(o.appliedPromos) ? o.appliedPromos : [],
    appliedManualPromo: o.appliedManualPromo ?? null,
    appliedVoucher: o.appliedVoucher ?? null,

    taxAndServiceDetails,
    totalTax: Number(o.totalTax ?? 0),
    totalServiceFee: Number(o.totalServiceFee ?? 0),
    outlet, // ← string id

    totalBeforeDiscount: Number(o.totalBeforeDiscount ?? 0),
    totalAfterDiscount: Number(o.totalAfterDiscount ?? 0),
    grandTotal: Number(o.grandTotal ?? 0),

    source: o.source ?? 'Web',
    currentBatch: Number(o.currentBatch ?? 1),
    createdAt: o.createdAt ?? null,
    updatedAt: o.updatedAt ?? null,
    kitchenNotifications: Array.isArray(o.kitchenNotifications) ? o.kitchenNotifications : [],
    __v: Number(o.__v ?? 0),

    paymentStatus: o.paymentStatus ?? 'pending',
    payment_details,
  };
}

export async function patchEditOrder(req, res) {
  const { orderId } = req.params;
  const { reason, items } = req.body;
  console.log('items at edit order', items);
  try {
    const result = await replaceOrderItemsAndAllocate({
      orderId,
      items,
      reason,
      userId: req.user?.id,
      idempotencyKey: req.headers['x-idempotency-key'],
    });

    res.status(200).json({ success: true, message: 'Order updated', data: result });
  } catch (err) {
    console.error('patchEditOrder error:', err);
    return res.status(500).json({ message: err.message || 'internal error' });
  }
}

// POST /payments/:id/refund-settle
export async function markRefundPaid({ paymentId, method, reference, session, cashierId }) {
  const p = await Payment.findById(paymentId).session(session);
  if (!p) throw new Error("Payment not found");
  if (!(p.status === "refund" && p.direction === "refund")) {
    throw new Error("Payment is not a refund liability");
  }

  p.status = "settlement";        // <-- sekarang dianggap sudah diserahkan ke customer
  p.method = method || p.method;  // opsional update cara bayar refund
  p.refundReference = reference;  // opsional catat referensi (no transfer, dsb.)
  p.refundPaidAt = new Date();    // opsional timestamp
  p.refundPaidBy = cashierId || p.refundPaidBy; // opsional

  await p.save({ session });

  await PaymentAdjustment.create([{
    orderId: p.order_id,
    paymentId: p._id,
    revisionId: null,
    kind: "refund_paid",
    direction: "refund",
    amount: p.amount,
    note: `refund paid ${method || ""} ${reference || ""}`.trim(),
  }], { session });

  return p;
}
