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
import Reservation from '../models/Reservation.model.js';
import QRCode from 'qrcode';
// Import FCM service di bagian atas file
import FCMNotificationService from '../services/fcmNotificationService.js';
import { TaxAndService } from '../models/TaxAndService.model.js';
import { updateTableStatusAfterPayment } from './webhookController.js';
import { getAreaGroup } from '../utils/areaGrouping.js';
import { Outlet } from '../models/Outlet.model.js';
import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { processGoSendDelivery } from '../helpers/deliveryHelper.js';

dayjs.extend(utc);
dayjs.extend(timezone);

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
      // Add new parameters from frontend
      taxDetails,
      totalTax,
      subtotal: frontendSubtotal,
      discount: frontendDiscount
    } = req.body;

    console.log('Received createAppOrder request:', req.body);

    // ✅ Validasi items, kecuali reservasi tanpa open bill
    if ((!items || items.length === 0) && !(orderType === 'reservation' && !isOpenBill)) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }
    if (!isOpenBill && !orderType) {
      return res.status(400).json({ success: false, message: 'Order type is required' });
    }

    if (!paymentDetails?.method) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Verify user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Handle Open Bill scenario - find existing reservation order
    let existingOrder = null;
    let existingReservation = null;

    if (isOpenBill && openBillData) {
      existingReservation = await Reservation.findById(openBillData.reservationId);
      if (!existingReservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found for open bill'
        });
      }

      if (existingReservation.order_id) {
        existingOrder = await Order.findById(existingReservation.order_id);
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
        // ✅ Tidak perlu validasi tambahan
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

    // Handle pickup time
    let parsedPickupTime = null;
    if (orderType === 'pickup') {
      if (!pickupTime) {
        return res.status(400).json({ success: false, message: 'Pickup time is required for pickup orders' });
      }

      // Convert "HH:mm" -> Date
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

    // ✅ Perhitungan konsisten
    let totalBeforeDiscount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    if (orderType === 'reservation' && !isOpenBill && orderItems.length === 0) {
      totalBeforeDiscount = 25000; // minimal reservasi tanpa menu
    }

    let totalAfterDiscount = totalBeforeDiscount;
    if (discountType === 'percentage') {
      totalAfterDiscount = totalBeforeDiscount - (totalBeforeDiscount * (voucherAmount / 100));
    } else if (discountType === 'fixed') {
      totalAfterDiscount = totalBeforeDiscount - voucherAmount;
      if (totalAfterDiscount < 0) totalAfterDiscount = 0;
    }

    // Calculate tax and service fees
    const isReservationOrder = orderType === 'reservation';
    const isOpenBillOrder = isOpenBill || false;

    console.log('Tax calculation parameters:', {
      totalAfterDiscount,
      outlet: outlet || "67cbc9560f025d897d69f889",
      isReservationOrder,
      isOpenBillOrder
    });

    const taxServiceCalculation = await calculateTaxAndService(
      totalAfterDiscount,
      outlet || "67cbc9560f025d897d69f889",
      isReservationOrder,
      isOpenBillOrder
    );

    console.log('Backend tax calculation result:', taxServiceCalculation);

    // Calculate grand total including tax and service
    const grandTotal = totalAfterDiscount + taxServiceCalculation.totalTax + taxServiceCalculation.totalServiceFee;

    console.log('Final totals:', {
      totalAfterDiscount,
      taxAmount: taxServiceCalculation.totalTax,
      serviceAmount: taxServiceCalculation.totalServiceFee,
      grandTotal
    });

    let newOrder;

    // Handle Open Bill scenario - NOW WITH TAX CALCULATION
    if (isOpenBill && existingOrder) {
      existingOrder.items.push(...orderItems);

      const newItemsTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      existingOrder.totalBeforeDiscount += newItemsTotal;

      // Recalculate discount
      let updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount;
      if (discountType === 'percentage') {
        updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount - (existingOrder.totalBeforeDiscount * (voucherAmount / 100));
      } else if (discountType === 'fixed') {
        updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount - voucherAmount;
        if (updatedTotalAfterDiscount < 0) updatedTotalAfterDiscount = 0;
      }

      // Recalculate tax for open bill (now applies tax)
      const updatedTaxCalculation = await calculateTaxAndService(
        updatedTotalAfterDiscount,
        outlet || "67cbc9560f025d897d69f889",
        isReservationOrder,
        true // isOpenBill = true
      );

      existingOrder.totalAfterDiscount = updatedTotalAfterDiscount;
      existingOrder.totalTax = updatedTaxCalculation.totalTax;
      existingOrder.totalServiceFee = updatedTaxCalculation.totalServiceFee;
      existingOrder.taxAndServiceDetails = updatedTaxCalculation.taxAndServiceDetails;
      existingOrder.grandTotal = updatedTotalAfterDiscount + updatedTaxCalculation.totalTax + updatedTaxCalculation.totalServiceFee;

      await existingOrder.save();
      newOrder = existingOrder;

      console.log('Updated existing order with tax:', {
        totalTax: existingOrder.totalTax,
        totalServiceFee: existingOrder.totalServiceFee,
        grandTotal: existingOrder.grandTotal
      });
    }
    else if (isOpenBill && !existingOrder) {
      // Create new order for open bill WITH TAX
      const generatedOrderId = await generateOrderId(openBillData.tableNumbers || tableNumber || '');
      newOrder = new Order({
        order_id: generatedOrderId,
        user_id: userId,
        user: userExists.username || 'Guest',
        cashier: null,
        items: orderItems,
        status: 'Reserved',
        paymentMethod: paymentDetails.method,
        orderType: formattedOrderType,
        deliveryAddress: deliveryAddress || '',
        tableNumber: openBillData.tableNumbers || tableNumber || '',
        type: 'Indoor',
        voucher: voucherId,
        outlet: outlet && outlet !== "" ? outlet : "67cbc9560f025d897d69f889",
        totalBeforeDiscount,
        totalAfterDiscount,
        totalTax: taxServiceCalculation.totalTax, // Now includes tax for open bill
        totalServiceFee: taxServiceCalculation.totalServiceFee, // Now includes service fee
        discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
        appliedPromos: [],
        appliedManualPromo: null,
        appliedVoucher: voucherId,
        taxAndServiceDetails: taxServiceCalculation.taxAndServiceDetails, // Tax details for open bill
        grandTotal: grandTotal, // Grand total with tax
        promotions: [],
        source: 'App',
        reservation: existingReservation._id,
        isOpenBill: true,
        originalReservationId: openBillData.reservationId,
      });
      await newOrder.save();

      if (!existingReservation.order_id) {
        existingReservation.order_id = newOrder._id;
        await existingReservation.save();
      }

      console.log('Created new open bill order with tax:', {
        totalTax: newOrder.totalTax,
        totalServiceFee: newOrder.totalServiceFee,
        grandTotal: newOrder.grandTotal
      });
    } else {
      // Normal order creation with tax calculation
      const generatedOrderId = await generateOrderId(tableNumber || '');
      newOrder = new Order({
        order_id: generatedOrderId,
        user_id: userId,
        user: userExists.username || 'Guest',
        cashier: null,
        items: orderItems,
        status: orderType === 'reservation' ? 'Reserved' : 'Pending',
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
        source: 'App',
        reservation: null,
      });
      await newOrder.save();

      console.log('Created new order with tax:', {
        totalTax: newOrder.totalTax,
        totalServiceFee: newOrder.totalServiceFee,
        grandTotal: newOrder.grandTotal
      });
    }

    // Verify order was saved with tax data
    const savedOrder = await Order.findById(newOrder._id);
    console.log('Verified saved order tax data:', {
      orderId: savedOrder._id,
      totalTax: savedOrder.totalTax,
      totalServiceFee: savedOrder.totalServiceFee,
      taxAndServiceDetails: savedOrder.taxAndServiceDetails,
      grandTotal: savedOrder.grandTotal
    });


    // Reservation creation (existing code remains the same)
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
          order_id: newOrder._id,
          status: 'pending',
          reservation_type: reservationType || 'nonBlocking',
          notes: reservationData.notes || ''
        });

        await reservationRecord.save();

        newOrder.reservation = reservationRecord._id;
        await newOrder.save();

        console.log('Reservation created:', reservationRecord);
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

    // Enhanced mapping for frontend response with tax information
    const mappedOrders = {
      _id: newOrder._id,
      userId: newOrder.user_id,
      customerName: newOrder.user,
      cashierId: newOrder.cashier,
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

const confirmOrderHelper = async (orderId) => {
  try {
    // 1. Find order and update status
    let order = await Order.findOne({ order_id: orderId })
      .populate('items.menuItem')
      .populate('outlet')
      .populate('user_id', 'name email phone');

    if (!order) {
      throw new Error('Order not found');
    }

    // 🔧 Hanya update kalau status BUKAN Reserved
    if (order.status !== 'Reserved') {
      order.status = 'Waiting';
      await order.save();
    }

    if (!order) {
      throw new Error('Order not found');
    }

    // 2. Update payment status
    const payment = await Payment.findOne({ order_id: orderId });

    if (!payment) {
      throw new Error('Payment not found for this order');
    }

    // 🔧 Tentukan status pembayaran (DP / Partial / Settlement)
    let updatedStatus = 'settlement';
    if (payment?.paymentType === 'Down Payment') {
      if (payment?.remainingAmount !== 0) {
        updatedStatus = 'partial';
      } else {
        updatedStatus = 'settlement';
      }
    }

    // Update payment document
    payment.status = updatedStatus;
    payment.paidAt = new Date();
    await payment.save();

    // 🔥 EMIT STATUS UPDATE KE CLIENT
    const statusUpdateData = {
      order_id: orderId,  // Gunakan string order_id
      orderStatus: 'Waiting',
      paymentStatus: updatedStatus,
      message: 'Pesanan dikonfirmasi kasir, menunggu kitchen',
      timestamp: new Date(),
      cashier: {
        id: 'kasir123',  // Ganti dengan ID kasir yang sebenarnya
        name: 'Kasir' // Ganti dengan nama kasir yang sebenarnya
      }
    };

    // Emit ke room spesifik untuk order tracking
    io.to(`order_${orderId}`).emit('order_status_update', statusUpdateData);

    // Emit event khusus untuk konfirmasi kasir
    io.to(`order_${orderId}`).emit('order_confirmed', {
      orderId: orderId,
      orderStatus: 'Waiting',
      paymentStatus: updatedStatus,
      cashier: statusUpdateData.cashier,
      message: 'Your order is now being prepared',
      timestamp: new Date()
    });

    console.log(`🔔 Emitted order status update to room: order_${orderId}`, statusUpdateData);

    // 3. Send FCM notification to customer
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

    return {
      success: true,
      order,
      payment
    };

  } catch (error) {
    console.error('Error in confirmOrderHelper:', error);
    throw error;
  }
};

export const createUnifiedOrder = async (req, res) => {
  try {
    const {
      order_id,
      source,
      customerId,
      outletId,
      loyaltyPointsToRedeem,
      // OPSIONAL: field untuk delivery - HANYA UNTUK APP
      delivery_option, // 'pickup' atau 'delivery' (opsional, default 'pickup')
      recipient_data // data penerima untuk delivery (opsional)
    } = req.body;

    // Cek jam buka/tutup outlet 
    const outlet = await Outlet.findById(outletId);
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet tidak ditemukan'
      });
    }

    const now = dayjs().tz("Asia/Jakarta");
    const parseToMinutes = (timeStr) => {
      if (!timeStr) return null;
      const s = String(timeStr).trim().toUpperCase();
      const m = s.match(/(\d{1,2}):(\d{2})/);
      if (!m) return null;

      let hh = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);

      // Deteksi AM/PM (kalau format 12 jam)
      const hasAM = /\bAM\b/.test(s);
      const hasPM = /\bPM\b/.test(s);
      if (hasAM || hasPM) {
        if (hh === 12) hh = hasAM ? 0 : 12;
        else if (hasPM) hh += 12;
      }

      return hh * 60 + mm;
    };

    const currentMinutes = now.hour() * 60 + now.minute();
    const openMinutes = parseToMinutes(outlet.openTime);
    const closeMinutes = parseToMinutes(outlet.closeTime);

    if (openMinutes != null && closeMinutes != null) {
      let isOpen = false;

      if (openMinutes < closeMinutes) {
        // contoh: 06:00 - 23:00
        isOpen =
          currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
      } else {
        // contoh: 18:00 - 03:00 (lewat tengah malam)
        isOpen =
          currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
      }

      if (!isOpen) {
        return res.status(400).json({
          success: false,
          message: `Outlet sedang tutup. Jam buka: ${outlet.openTime} - ${outlet.closeTime}`,
        });
      }
    }
    
    // VALIDASI: Hanya App yang boleh melakukan delivery
    if (source !== 'App' && delivery_option === 'delivery') {
      return res.status(400).json({
        success: false,
        message: 'Fitur delivery hanya tersedia untuk pesanan dari App'
      });
    }

    // Validasi data recipient HANYA JIKA delivery_option adalah 'delivery'
    if (source === 'App' && delivery_option === 'delivery') {
      if (!recipient_data) {
        return res.status(400).json({
          success: false,
          message: 'Data penerima diperlukan untuk pesanan delivery'
        });
      }

      if (!recipient_data.coordinates) {
        return res.status(400).json({
          success: false,
          message: 'Koordinat lokasi penerima diperlukan untuk delivery'
        });
      }
    }

    // Loyalty program OPSIONAL - tidak perlu validasi strict
    if (customerId && !mongoose.Types.ObjectId.isValid(customerId)) {
      console.warn('Invalid customer ID format for loyalty program:', customerId);
    }

    if (loyaltyPointsToRedeem && (!customerId || (source !== 'app' && source !== 'cashier'))) {
      console.warn('Loyalty points redemption skipped - not eligible:', {
        customerId,
        source,
        loyaltyPointsToRedeem
      });
    }

    // Check if order already exists
    const existingOrder = await Order.findOne({ order_id: order_id });
    if (existingOrder) {
      console.log('Order already exists in the database, confirming order...');
      try {
        const result = await confirmOrderHelper(order_id);
        return res.status(200).json({
          status: 'Completed',
          orderId: order_id,
          message: 'Cashier order processed and paid',
          order: result.order
        });
      } catch (confirmError) {
        console.error('Failed to confirm existing order:', confirmError);
        return res.status(500).json({
          success: false,
          message: `Failed to confirm order: ${confirmError.message}`
        });
      }
    }

    const validated = validateOrderData(req.body, source);

    // Tambahkan customerId dan loyaltyPointsToRedeem ke validated data
    validated.customerId = customerId;
    validated.loyaltyPointsToRedeem = loyaltyPointsToRedeem;

    // Hanya tambahkan delivery info untuk App JIKA delivery_option ada
    if (source === 'App') {
      validated.delivery_option = delivery_option || 'pickup'; // default ke pickup
      validated.recipient_data = recipient_data;
    }

    const { tableNumber, orderType, reservationData } = validated;
    const areaGroup = getAreaGroup(tableNumber);

    // Generate order ID
    let orderId;
    if (tableNumber) {
      orderId = await generateOrderId(String(tableNumber));
      io.to(`area_${tableNumber}`).emit('new_order', { orderId });
    } else {
      orderId = `${source.toUpperCase()}-${Date.now()}`;
    }

    if (areaGroup) {
      io.to(areaGroup).emit('new_order', { orderId });
    }

    // Add reservation-specific processing if needed
    if (orderType === 'reservation' && reservationData) {
      if (!reservationData.reservationTime || !reservationData.guestCount ||
        !reservationData.areaIds || !reservationData.tableIds) {
        return res.status(400).json({
          success: false,
          message: 'Incomplete reservation data'
        });
      }
    }

    // Log delivery information (HANYA UNTUK APP JIKA DELIVERY)
    if (source === 'App' && delivery_option === 'delivery') {
      console.log('Creating App Order with Delivery Option:', {
        orderId,
        delivery_option,
        hasRecipientData: !!recipient_data
      });
    }

    // Create job for order processing
    const job = await orderQueue.add('create_order', {
      type: 'create_order',
      payload: {
        orderId,
        orderData: validated,
        source,
        isOpenBill: validated.isOpenBill,
        isReservation: orderType === 'reservation',
        // Tambahkan flag untuk delivery - HANYA UNTUK APP JIKA DELIVERY
        requiresDelivery: source === 'App' && delivery_option === 'delivery',
        recipientData: source === 'App' && delivery_option === 'delivery' ? recipient_data : null
      }
    }, {
      jobId: orderId,
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });

    console.log(`Job created: ${job.id} for order: ${orderId}`);

    // Wait for job completion dengan timeout
    let result;
    try {
      result = await job.waitUntilFinished(queueEvents, 30000);
      console.log(`Job ${job.id} completed successfully`);

    } catch (queueErr) {
      console.error(`Job ${job.id} failed:`, queueErr);
      const jobState = await job.getState();
      return res.status(500).json({
        success: false,
        message: `Order processing failed: ${queueErr.message}`,
        jobState: jobState,
        orderId: orderId
      });
    }

    // Base response tanpa loyalty
    const baseResponse = {
      status: '',
      orderId,
      jobId: job.id
    };

    // Handle payment based on source
    if (source === 'Cashier') {
      return res.status(200).json({
        ...baseResponse,
        status: 'Completed',
        message: 'Cashier order processed and paid',
        ...(result.loyalty?.isApplied && {
          loyalty: {
            pointsEarned: result.loyalty.pointsEarned,
            pointsUsed: result.loyalty.pointsUsed,
            discountAmount: result.loyalty.discountAmount
          }
        })
      });
    }

    if (source === 'App') {
      // PROSES DELIVERY HANYA JIKA orderType adalah 'delivery'
      let deliveryResult = null;
      if (delivery_option === 'delivery' && recipient_data) {
        try {
          deliveryResult = await processGoSendDelivery({
            orderId,
            outlet,
            recipient_data,
            orderData: validated
          });

          console.log('GoSend delivery created for App:', deliveryResult);
        } catch (deliveryError) {
          console.error('Failed to create GoSend delivery for App:', deliveryError);
          // Return error karena delivery mandatory untuk App yang pilih delivery
          return res.status(500).json({
            success: false,
            message: `Gagal membuat pesanan delivery: ${deliveryError.message}`,
            orderId: orderId
          });
        }
      }

      const midtransRes = await createMidtransCoreTransaction(
        orderId,
        validated.paymentDetails.amount,
        validated.paymentDetails.method
      );

      // Response untuk App dengan atau tanpa delivery
      const appResponse = {
        ...baseResponse,
        status: 'waiting_payment',
        midtrans: midtransRes,
        // Tambahkan delivery_option ke response
        delivery_option: delivery_option || 'pickup',
        // Loyalty info opsional
        ...(result.loyalty?.isApplied && {
          loyalty: {
            pointsEarned: result.loyalty.pointsEarned,
            pointsUsed: result.loyalty.pointsUsed,
            discountAmount: result.loyalty.discountAmount
          }
        })
      };

      // Tambahkan delivery info hanya jika ada deliveryResult
      if (deliveryResult) {
        appResponse.delivery = {
          provider: 'GoSend',
          status: 'pending',
          tracking_number: deliveryResult.goSend_order_no,
          estimated_price: deliveryResult.estimated_price,
          live_tracking_url: deliveryResult.live_tracking_url,
          shipment_method: deliveryResult.shipment_method
        };
      }

      return res.status(200).json(appResponse);
    }

    if (source === 'Web') {
      // Always create a pending Payment record first
      const order = await Order.findOne({ order_id: orderId });
      if (!order) {
        throw new Error(`Order ${orderId} not found after job completion`);
      }

      const paymentData = {
        order_id: order.order_id,
        payment_code: generatePaymentCode(),
        transaction_id: generateTransactionId(),
        method: validated.paymentDetails?.method || 'Cash',
        status: 'pending',
        paymentType: validated.paymentDetails?.paymentType || 'Full',
        amount: validated.paymentDetails?.amount || order.grandTotal,
        totalAmount: order.grandTotal,
        remainingAmount: order.grandTotal,
      };
      const payment = await Payment.create(paymentData);

      // WEB TIDAK BISA DELIVERY - skip delivery processing

      // If payment method is cash, do not create Midtrans Snap
      if (validated.paymentDetails.method?.toLowerCase() === 'cash') {
        return res.status(200).json({
          ...baseResponse,
          status: 'waiting_payment',
          message: 'Cash payment, no Midtrans Snap required',
          ...(result.loyalty?.isApplied && {
            loyalty: {
              pointsEarned: result.loyalty.pointsEarned,
              pointsUsed: result.loyalty.pointsUsed
            }
          })
        });
      }

      // Otherwise, create Midtrans Snap transaction
      const midtransRes = await createMidtransSnapTransaction(
        orderId,
        validated.paymentDetails.amount,
        validated.paymentDetails.method
      );

      return res.status(200).json({
        ...baseResponse,
        status: 'waiting_payment',
        snapToken: midtransRes.token,
        redirectUrl: midtransRes.redirect_url,
        ...(result.loyalty?.isApplied && {
          loyalty: {
            pointsEarned: result.loyalty.pointsEarned,
            pointsUsed: result.loyalty.pointsUsed
          }
        })
      });
    }

    throw new Error('Invalid order source');

  } catch (err) {
    console.error('Error in createUnifiedOrder:', err);
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
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

      // ✅ EMIT SOCKET EVENTS FOR ORDER STATUS CHANGE
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

    // ✅ JIKA ADA PENDING, UPDATE SAJA
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

        // ✅ UPDATE existing payment
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

      // ✅ UPDATE existing payment
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

    // ✅ JIKA TIDAK ADA PENDING, LANJUT KE LOGIKA BUAT BARU
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
    console.log('Related order:', relatedOrder);
    console.log('Related payments:', relatedPayments);

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

export const getPendingOrders = async (req, res) => {
  try {
    const { rawOutletId } = req.params;
    const { sources } = req.body;
    console.log("rawOutletId:", rawOutletId, "sources:", sources);
    if (!rawOutletId) {
      return res.status(400).json({ message: 'outletId is required' });
    }

    const outletId = rawOutletId.trim();
    const outletObjectId = new mongoose.Types.ObjectId(outletId);

    // Ambil order pending / reserved dari outlet tertentu
    const pendingOrders = await Order.find({
      status: { $in: ['Pending', 'Reserved'] },
      source: { $in: sources },
      outlet: outletObjectId
    })
      .lean()
      .sort({ createdAt: -1 });

    if (!pendingOrders.length || pendingOrders.length === 0) {
      return res.status(200).json({ message: 'No online order found.', orders: pendingOrders });
    }

    const orderIds = pendingOrders.map(order => order.order_id);

    // Enhanced: Ambil semua payment details untuk orders
    const payments = await Payment.find({
      order_id: { $in: orderIds }
    })
      .lean()
      .sort({ createdAt: -1 }); // Sort by latest payment first

    // console.log('Found payments:', payments);

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

      // const paymentDetail = {
      //   paymentId: payment._id,
      //   paymentMethod: payment.paymentMethod || payment.payment_method,
      //   paymentType: payment.paymentType || 'Full',
      //   amount: payment.amount,
      //   paidAmount: payment.paidAmount || payment.amount,
      //   remainingAmount: payment.remainingAmount || 0,
      //   status: payment.status,
      //   transactionId: payment.transactionId || payment.transaction_id,
      //   paymentGateway: payment.paymentGateway || payment.payment_gateway,
      //   paymentDate: payment.paymentDate || payment.createdAt,
      //   paymentReference: payment.paymentReference || payment.reference,

      //   // Midtrans/Payment Gateway specific fields
      //   grossAmount: payment.gross_amount,
      //   fraudStatus: payment.fraud_status,
      //   transactionStatus: payment.transaction_status,
      //   transactionTime: payment.transaction_time,
      //   settlementTime: payment.settlement_time,

      //   // Bank/Card details (if available)
      //   bank: payment.bank,
      //   vaNumber: payment.va_number,
      //   cardType: payment.card_type,
      //   maskedCard: payment.masked_card,

      //   // Additional metadata
      //   metadata: payment.metadata || {},
      //   notes: payment.notes || '',

      //   createdAt: payment.createdAt,
      //   updatedAt: payment.updatedAt
      // };

      paymentDetailsMap.get(orderId).push(payment);
    });

    // Identify successful payments
    const successfulPaymentOrderIds = new Set(
      payments
        .filter(p =>
          p.status === 'Success' ||
          p.status === 'settlement'
        )
        .map(p => p.order_id.toString())
    );

    // Filter unpaid orders (optional - you might want to include all for admin view)
    const unpaidOrders = pendingOrders.filter(
      order => !successfulPaymentOrderIds.has(order._id.toString())
    );

    // Get menu items for enrichment
    const menuItemIds = [
      ...new Set(
        unpaidOrders
          .flatMap(order =>
            order.items.map(item => item.menuItem?.toString())
          )
          .filter(Boolean)
      )
    ];

    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } }).lean();
    const menuItemMap = new Map(menuItems.map(item => [item._id.toString(), item]));

    // Enhanced order enrichment with payment details
    const enrichedOrders = unpaidOrders.map(order => {
      // const orderId = order._id.toString();
      const orderIdString = order.order_id.toString();

      // Enrich items as before
      const updatedItems = order.items.map(item => {
        const menuItem = menuItemMap.get(item.menuItem?.toString());

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

        return {
          menuItem: menuItem ? {
            id: menuItem._id,
            name: menuItem.name,
            originalPrice: menuItem.price,
            workstation: menuItem.workstation
          } : null,
          selectedToppings: item.toppings || [],
          selectedAddons: enrichedAddons,
          subtotal: item.subtotal,
          quantity: item.quantity,
          isPrinted: item.isPrinted,
          notes: item.notes,
        };
      });

      // Get payment details for this order
      const paymentDetails = paymentDetailsMap.get(orderIdString) || [];
      const paymentStatus = paymentStatusMap.get(orderIdString) || 'pending';

      // Calculate payment summary
      const totalPaid = paymentDetails.reduce((sum, payment) =>
        sum + (payment.paidAmount || 0), 0);
      const totalRemaining = paymentDetails.reduce((sum, payment) =>
        sum + (payment.remainingAmount || 0), 0);
      const latestPayment = paymentDetails[0]; // Since we sorted by latest first

      return {
        ...order,
        paymentStatus,
        items: updatedItems,

        // Enhanced Payment Information
        payment_details: paymentDetails,
        paymentSummary: {
          totalAmount: order.grandTotal,
          totalPaid: totalPaid,
          totalRemaining: Math.max(0, order.grandTotal - totalPaid),
          paymentCount: paymentDetails.length,
          hasDownPayment: paymentDetails.some(p => p.paymentType === 'Down Payment'),
          latestPaymentDate: latestPayment?.paymentDate || null,
          latestPaymentMethod: latestPayment?.paymentMethod || null,
          latestTransactionId: latestPayment?.transactionId || null,
          isFullyPaid: totalPaid >= order.grandTotal,
          isPartiallyPaid: totalPaid > 0 && totalPaid < order.grandTotal,
          isUnpaid: totalPaid === 0
        }
      };
    });

    // Add overall statistics
    const statistics = {
      totalOrders: enrichedOrders.length,
      totalUnpaid: enrichedOrders.filter(o => o.paymentSummary.isUnpaid).length,
      totalPartiallyPaid: enrichedOrders.filter(o => o.paymentSummary.isPartiallyPaid).length,
      totalFullyPaid: enrichedOrders.filter(o => o.paymentSummary.isFullyPaid).length,
      totalAmount: enrichedOrders.reduce((sum, order) => sum + order.grandTotal, 0),
      totalPaidAmount: enrichedOrders.reduce((sum, order) => sum + order.paymentSummary.totalPaid, 0),
      totalRemainingAmount: enrichedOrders.reduce((sum, order) => sum + order.paymentSummary.totalRemaining, 0)
    };

    res.status(200).json({
      orders: enrichedOrders,
      statistics: statistics,
      meta: {
        count: enrichedOrders.length,
        timestamp: new Date().toISOString(),
        outletId: outletId
      }
    });

  } catch (error) {
    console.error('Error fetching pending unpaid orders:', error);
    res.status(500).json({
      message: 'Error fetching pending orders',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

    // ✅ TAMBAHAN: Payment details untuk down payment
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

    // ✅ DEBUG: Log semua data order untuk melihat struktur sebenarnya
    console.log('=== DEBUGGING ORDER DATA ===');
    console.log('Order keys:', Object.keys(order.toObject()));
    console.log('Applied Voucher:', JSON.stringify(order.appliedVoucher, null, 2));
    console.log('Tax And Service Details:', JSON.stringify(order.taxAndServiceDetails, null, 2));
    console.log('Discounts:', JSON.stringify(order.discounts, null, 2));
    console.log('Applied Promos:', order.appliedPromos);
    console.log('Applied Manual Promo:', order.appliedManualPromo);
    console.log('Total Tax:', order.totalTax);
    console.log('============================');

    // ✅ TAMBAHAN: Format voucher data - sekarang sudah ter-populate
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

    // ✅ TAMBAHAN: Format tax and service details - sekarang sudah ter-populate  
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

      // ✅ TAMBAHAN: Detail pembayaran yang lebih lengkap
      paymentDetails: paymentDetails,

      // ✅ TAMBAHAN: Data voucher
      voucher: voucherData,

      // ✅ TAMBAHAN: Data tax dan service details
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

    res.status(200).json({
      success: true,
      data: order
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

// Get Cashier Order History
export const getCashierOrderHistory = async (req, res) => {
  try {
    const cashierId = req.params.cashierId; // Mengambil ID kasir dari parameter URL
    console.log(cashierId);
    if (!cashierId) {
      return res.status(400).json({ message: 'Cashier ID is required.' });
    }

    // Mencari semua pesanan dengan field "cashier" yang sesuai dengan ID kasir
    const orders = await Order.find({ cashierId: cashierId })
      .lean()
      // const orders = await Order.find();
      .populate('items.menuItem') // Mengisi detail menu item (opsional)
      // .populate('voucher')
      .sort({ createdAt: -1 }); // Mengisi detail voucher (opsional)
    console.log(orders.length);
    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: 'No order history found for this cashier.', orders });
    }

    // Mapping data sesuai kebutuhan frontend
    const mappedOrders = orders.map(order => {
      const updatedItems = order.items.map(item => {
        return {
          _id: item._id,
          quantity: item.quantity,
          subtotal: item.subtotal,
          isPrinted: item.isPrinted,
          menuItem: {
            ...item.menuItem,
            category: item.category ? { id: item.category._id, name: item.category.name } : null,
            subCategory: item.subCategory ? { id: item.subCategory._id, name: item.subCategory.name } : null,
            originalPrice: item.menuItem.price ?? 0,
            discountedprice: item.menuItem.discountedPrice ?? item.menuItem.price,
            // _id: item.menuItem._id,
            // name: item.menuItem.name,
            // description: item.menuItem.description,
            // workstation: item.menuItem.workstation,
            // categories: item.menuItem.category, // renamed
          },
          selectedAddons: item.addons.length > 0 ? item.addons.map(addon => ({
            name: addon.name,
            _id: addon._id,
            options: [{
              id: addon._id, // assuming _id as id for options
              label: addon.label || addon.name, // fallback
              price: addon.price
            }]
          })) : [],
          selectedToppings: item.toppings.length > 0 ? item.toppings.map(topping => ({
            id: topping._id || topping.id, // fallback if structure changes
            name: topping.name,
            price: topping.price
          })) : [],
          notes: item.notes,
          dineType: item.dineType
        }
      });

      return {
        ...order,
        items: updatedItems,
        // userId: order.user_id,
        // cashierId: order.cashierId,
        // customerName: order.user,
        // user: undefined,
        // user_id: undefined,
        // cashier: undefined,
      };
      // _id: order._id,
      // userId: order.user_id, // renamed
      // user: order.user, // renamed
      // cashierId: order.cashierId, // renamed
      // items: order.items.map(item => ({
      //   _id: item._id,
      //   quantity: item.quantity,
      //   subtotal: item.subtotal,
      //   isPrinted: item.isPrinted,
      //   menuItem: {
      //     // ...item.menuItem.toObject(),
      //     _id: item.menuItem._id,
      //     name: item.menuItem.name,
      //     originalPrice: item.menuItem.price,
      //     discountedprice: item.menuItem.discountedPrice,
      //     description: item.menuItem.description,
      //     workstation: item.menuItem.workstation,
      //     categories: item.menuItem.category, // renamed
      //   },
      //   selectedAddons: item.addons.length > 0 ? item.addons.map(addon => ({
      //     name: addon.name,
      //     _id: addon._id,
      //     options: [{
      //       id: addon._id, // assuming _id as id for options
      //       label: addon.label || addon.name, // fallback
      //       price: addon.price
      //     }]
      //   })) : [],
      //   selectedToppings: item.toppings.length > 0 ? item.toppings.map(topping => ({
      //     id: topping._id || topping.id, // fallback if structure changes
      //     name: topping.name,
      //     price: topping.price
      //   })) : []
      // })),
      // status: order.status,
      // orderType: order.orderType,
      // deliveryAddress: order.deliveryAddress,
      // tableNumber: order.tableNumber,
      // type: order.type,
      // paymentMethod: order.paymentMethod, // default value
      // totalPrice: order.items.reduce((total, item) => total + item.subtotal, 0), // dihitung dari item subtotal
      // voucher: order.voucher,
      // outlet: order.outlet,
      // promotions: order.promotions || [],
      // createdAt: order.createdAt,
      // updatedAt: order.updatedAt,
      // __v: order.__v
    });
    // console.log(mappedOrders);
    res.status(200).json({ orders: mappedOrders });
    // res.status(200).json({ orders: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// test socket
export const testSocket = async (req, res) => {
  console.log('Emitting order created to cashier room...');
  const cashierRoom = io.to('cashier_room').emit('order_created', { message: 'Order created' });
  console.log('Emitting order created to cashier room success.');

  res.status(200).json({ success: cashierRoom });
}


export const cashierCharge = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      payment_type,         // 'cash' | 'qris' | 'transfer' | ...
      order_id,             // string order_id
      gross_amount,         // total yang dibayarkan saat ini (atau total order untuk full)
      is_down_payment,      // boolean
      down_payment_amount,  // optional
      remaining_payment     // optional (tidak dipakai, kita hitung ulang agar konsisten)
    } = req.body;

    if (!order_id) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }
    if (typeof gross_amount !== 'number' || isNaN(gross_amount) || gross_amount < 0) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ success: false, message: 'gross_amount must be a valid number ≥ 0' });
    }

    // Ambil order
    const order = await Order.findOne({ order_id }).session(session);
    if (!order) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Hitung total order (fallback ke gross_amount kalau field total tidak ada)
    const orderTotal = Number(
      order.grandTotal ?? gross_amount ?? 0
    );

    // Ambil payment yang sudah ada
    const existingPayments = await Payment.find({ order_id }).session(session);

    // Cegah DP ganda: kalau sudah ada DP 'settlement' dan masih ada Final Payment 'pending', jangan bikin DP lagi
    const hasSettledDP = existingPayments.some(p => p.paymentType === 'Down Payment' && (p.status === 'settlement' || p.status === 'paid'));
    const hasPendingFinal = existingPayments.some(p => p.paymentType === 'Final Payment' && p.status === 'pending');

    if (is_down_payment === true && (hasSettledDP || hasPendingFinal)) {
      await session.abortTransaction(); session.endSession();
      return res.status(409).json({
        success: false,
        message: 'Down Payment already exists or pending Final Payment is present for this order'
      });
    }

    // === MODE DP → buat 2 payment (DP settled + Final pending) ===
    if (is_down_payment === true) {
      const dpAmount = Number(down_payment_amount ?? gross_amount ?? 0);
      if (dpAmount <= 0) {
        await session.abortTransaction(); session.endSession();
        console.log('Down Payment amount must be > 0');
        return res.status(400).json({ success: false, message: 'Down Payment amount must be > 0' });
      }
      if (dpAmount >= orderTotal) {
        await session.abortTransaction(); session.endSession();
        console.log('Down Payment must be less than total order');
        return res.status(400).json({ success: false, message: 'Down Payment must be less than total order' });
      }

      const remaining = Math.max(0, orderTotal - dpAmount);

      // Build common fields
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const merchantId = 'G711879663';

      // 1) Payment DP (settlement)
      const dpPayment = new Payment({
        payment_code: generatePaymentCode(),
        transaction_id: generateTransactionId(),
        order_id,
        method: payment_type,
        status: 'settlement',
        paymentType: 'Down Payment',
        amount: dpAmount,
        totalAmount: orderTotal,
        remainingAmount: 0,               // ← tidak digunakan lagi, set 0
        relatedPaymentId: null,
        fraud_status: 'accept',
        transaction_time: nowStr,
        currency: 'IDR',
        merchant_id: merchantId,
        paidAt: new Date(),
      });

      const savedDP = await dpPayment.save({ session });

      // 2) Payment Final (pending) dengan amount = sisa
      const finalPayment = new Payment({
        payment_code: generatePaymentCode(),
        transaction_id: generateTransactionId(),
        order_id,
        method: payment_type,             // boleh set 'cash' atau channel rencana pelunasan; bisa juga null
        status: 'pending',
        paymentType: 'Final Payment',
        amount: remaining,
        totalAmount: orderTotal,
        remainingAmount: 0,               // ← tidak digunakan lagi, set 0
        relatedPaymentId: savedDP._id,    // link ke DP
        fraud_status: 'accept',
        transaction_time: nowStr,
        currency: 'IDR',
        merchant_id: merchantId,
      });

      const savedFinal = await finalPayment.save({ session });

      // Update order.items.* → set payment_id = DP (opsional: saat final settle, bisa update ulang)
      await Order.updateOne(
        { order_id },
        { $set: { "items.$[].payment_id": savedDP._id } },
        { session }
      );

      // (Opsional) Karena belum lunas total, jangan ubah status order ke 'Waiting/Finished' dulu

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: 'Down Payment created and remaining Final Payment scheduled',
        data: {
          order_id,
          totalAmount: orderTotal,
          payments: [
            {
              role: 'down_payment',
              _id: savedDP._id,
              transaction_id: savedDP.transaction_id,
              status: savedDP.status,               // 'settlement'
              paymentType: savedDP.paymentType,     // 'Down Payment'
              amount: savedDP.amount,
              remainingAmount: savedDP.remainingAmount, // 0
              relatedPaymentId: savedDP.relatedPaymentId,
              createdAt: savedDP.createdAt,
              updatedAt: savedDP.updatedAt,
            },
            {
              role: 'final_payment',
              _id: savedFinal._id,
              transaction_id: savedFinal.transaction_id,
              status: savedFinal.status,            // 'pending'
              paymentType: savedFinal.paymentType,  // 'Final Payment'
              amount: savedFinal.amount,            // sisa
              remainingAmount: savedFinal.remainingAmount, // 0
              relatedPaymentId: savedFinal.relatedPaymentId, // id DP
              createdAt: savedFinal.createdAt,
              updatedAt: savedFinal.updatedAt,
            },
          ],
        },
      });
    }
    console.log('membuat payment mode non DP');
    // === MODE NON-DP (Full langsung atau pelunasan tanpa DP) ===
    // Jika tidak DP, biasakan 1 payment saja. Bisa full settlement,
    // atau kalau mau “pending” untuk non-cash, statusnya bisa diubah di sini.
    const amount = Math.min(Number(gross_amount ?? 0), orderTotal);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const paymentDoc = new Payment({
      payment_code: generatePaymentCode(),
      transaction_id: generateTransactionId(),
      order_id,
      method: payment_type,
      status: 'settlement',                 // dari kasir: langsung settled
      paymentType: 'Full',
      amount: amount,
      totalAmount: orderTotal,
      remainingAmount: 0,                   // ← tidak digunakan lagi, set 0
      relatedPaymentId: null,
      fraud_status: 'accept',
      transaction_time: nowStr,
      currency: 'IDR',
      merchant_id: 'G055993835',
      paidAt: new Date(),
    });

    const saved = await paymentDoc.save({ session });

    // Update payment_id di items
    await Order.updateOne(
      { order_id },
      { $set: { "items.$[].payment_id": saved._id } },
      { session }
    );

    // Order bisa dianggap lunas jika amount >= orderTotal
    const fullyPaid = amount >= orderTotal;
    if (fullyPaid) {
      order.status = order.orderType === 'Reservation' ? 'Finished' : 'Waiting';
      await order.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
    console.log('Payment created');
    return res.status(200).json({
      success: true,
      message: 'Payment created',
      data: {
        order_id,
        totalAmount: orderTotal,
        payments: [
          {
            role: 'full_payment',
            _id: saved._id,
            transaction_id: saved.transaction_id,
            status: saved.status,
            paymentType: saved.paymentType,
            amount: saved.amount,
            remainingAmount: saved.remainingAmount, // 0
            relatedPaymentId: saved.relatedPaymentId,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
          }
        ]
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('cashierCharge error:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment failed',
      error: error.message || String(error),
    });
  }
};

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
    const { order_id, selected_payment_id, payment_method, cashier_id } = req.body;

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

      // Update status payment menjadi settlement
      payment.status = 'settlement';
      payment.method = payment_method;
      payment.paidAt = new Date();

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
    await order.save({ session });
    console.log('is fully paid:', isFullyPaid);
    if (isFullyPaid) {
      if (order.orderType === 'Reservation') {
        order.status = 'Completed';
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

