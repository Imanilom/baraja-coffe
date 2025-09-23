import Payment from '../models/Payment.model.js';
import { MenuItem } from "../models/MenuItem.model.js";
import { Order } from "../models/order.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import AutoPromo from '../models/AutoPromo.model.js';
import { snap, coreApi } from '../utils/MidtransConfig.js';
import mongoose from 'mongoose';
import axios from 'axios';
import { validateOrderData, sanitizeForRedis, createMidtransCoreTransaction, createMidtransSnapTransaction } from '../validators/order.validator.js';
import { orderQueue } from '../queues/order.queue.js';
import { QueueEvents } from 'bullmq';
import { db } from '../utils/mongo.js';
//io
import { io, broadcastNewOrder } from '../index.js';
import Reservation from '../models/Reservation.model.js';
import QRCode from 'qrcode';
// Import FCM service di bagian atas file
import FCMNotificationService from '../services/fcmNotificationService.js';


const queueEvents = new QueueEvents('orderQueue');

export const createAppOrder = async (req, res) => {
  try {
    let {
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
    } = req.body;

    // if (orderType === 'reservation') {
    //   isOpenBill = "true"; // ✅ aman
    // }


    // if (orderType === 'reservation') {
    //   isOpenBill = true;
    // }


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
      totalBeforeDiscount = 100000; // minimal reservasi tanpa menu
    }

    let totalAfterDiscount = totalBeforeDiscount;
    if (discountType === 'percentage') {
      totalAfterDiscount = totalBeforeDiscount - (totalBeforeDiscount * (voucherAmount / 100));
    } else if (discountType === 'fixed') {
      totalAfterDiscount = totalBeforeDiscount - voucherAmount;
      if (totalAfterDiscount < 0) totalAfterDiscount = 0;
    }

    let newOrder;

    // ✅ Handle Open Bill
    if (isOpenBill && existingOrder) {
      existingOrder.items.push(...orderItems);

      const newItemsTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      existingOrder.totalBeforeDiscount += newItemsTotal;

      let updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount;
      if (discountType === 'percentage') {
        updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount - (existingOrder.totalBeforeDiscount * (voucherAmount / 100));
      } else if (discountType === 'fixed') {
        updatedTotalAfterDiscount = existingOrder.totalBeforeDiscount - voucherAmount;
        if (updatedTotalAfterDiscount < 0) updatedTotalAfterDiscount = 0;
      }

      existingOrder.totalAfterDiscount = updatedTotalAfterDiscount;
      existingOrder.grandTotal = updatedTotalAfterDiscount;

      await existingOrder.save();
      newOrder = existingOrder;
    }
    else if (isOpenBill && !existingOrder) {
      // Gunakan generateOrderId untuk order_id
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
        totalTax: 0,
        totalServiceFee: 0,
        discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
        appliedPromos: [],
        appliedManualPromo: null,
        appliedVoucher: voucherId,
        taxAndServiceDetails: [],
        grandTotal: totalAfterDiscount,
        promotions: [],
        source: 'App',
        reservation: existingReservation._id,
        isOpenBill: "true",
        originalReservationId: openBillData.reservationId,
      });
      await newOrder.save();

      if (!existingReservation.order_id) {
        existingReservation.order_id = newOrder._id;
        await existingReservation.save();
      }

    } else {
      // ✅ Normal order creation
      // Gunakan generateOrderId untuk order_id
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
        totalTax: 0,
        totalServiceFee: 0,
        discounts: { autoPromoDiscount: 0, manualDiscount: 0, voucherDiscount: 0 },
        appliedPromos: [],
        appliedManualPromo: null,
        appliedVoucher: voucherId,
        taxAndServiceDetails: [],
        grandTotal: totalAfterDiscount,
        promotions: [],
        source: 'App',
        reservation: null,
      });
      await newOrder.save();
    }

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

    // ✅ Response
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

    // Mapping data sesuai kebutuhan frontend
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
      voucher: newOrder.voucher || null,
      outlet: newOrder.outlet || null,
      promotions: newOrder.promotions || [],
      createdAt: newOrder.createdAt,
      updatedAt: newOrder.updatedAt,
      __v: newOrder.__v,
      isOpenBill: isOpenBill || false
    };

    // Emit ke aplikasi kasir
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
    const { order_id, source } = req.body;
    // Check if order already exists
    const existingOrder = await Order.findOne({ order_id: order_id });
    if (existingOrder) {
      console.log('Order already exists in the database, confirming order...');
      try {
        const result = await confirmOrderHelper(order_id);

        return res.status(200).json({
          status: 'Completed',
          orderId: order_id, // ✅ Fixed: use order_id from req.body
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
    const { tableNumber, orderType, reservationData } = validated;

    //check existing order

    // Generate order ID
    let orderId;
    if (tableNumber) {
      orderId = await generateOrderId(String(tableNumber));
    } else {
      orderId = `${source.toUpperCase()}-${Date.now()}`;
    }

    // Add reservation-specific processing if needed
    if (orderType === 'reservation' && reservationData) {
      // Validate reservation data
      if (!reservationData.reservationTime || !reservationData.guestCount ||
        !reservationData.areaIds || !reservationData.tableIds) {
        return res.status(400).json({
          success: false,
          message: 'Incomplete reservation data'
        });
      }
    }

    // Create job for order processing
    const job = await orderQueue.add('create_order', {
      type: 'create_order',
      payload: {
        orderId,
        orderData: validated,
        source,
        isReservation: orderType === 'reservation'
      }
    }, { jobId: orderId });

    // Wait for job completion
    let result;
    try {
      result = await job.waitUntilFinished(queueEvents);
    } catch (queueErr) {
      return res.status(500).json({
        success: false,
        message: `Order processing failed: ${queueErr.message}`
      });
    }

    // Handle payment based on source
    if (source === 'Cashier') {
      return res.status(202).json({
        status: 'Completed',
        orderId,
        jobId: job.id,
        message: 'Cashier order processed and paid',
      });
    }

    if (source === 'App') {
      const midtransRes = await createMidtransCoreTransaction(
        orderId,
        validated.paymentDetails.amount,
        validated.paymentDetails.method
      );
      return res.status(200).json({
        status: 'waiting_payment',
        orderId,
        jobId: job.id,
        midtrans: midtransRes,
      });
    }

    if (source === 'Web') {
      const midtransRes = await createMidtransSnapTransaction(
        orderId,
        validated.paymentDetails.amount,
        validated.paymentDetails.method
      );
      return res.status(200).json({
        status: 'waiting_payment',
        orderId,
        jobId: job.id,
        snapToken: midtransRes.token,
        redirectUrl: midtransRes.redirect_url,
      });
    }

    throw new Error('Invalid order source');
  } catch (err) {
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
        merchant_id: 'G711879663',
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

    // Validasi input
    if (!payment_type || !order_id) {
      return res.status(400).json({
        success: false,
        message: 'payment_type dan order_id diperlukan'
      });
    }

    // Generate payment code
    const payment_code = generatePaymentCode();

    // 2. Mencari order berdasarkan order_id
    const order = await Order.findOne({ order_id: order_id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan'
      });
    }

    // *** PERBAIKAN: Cek apakah ada payment yang masih pending ***
    const pendingPayments = await Payment.find({
      order_id: order_id,
      status: 'pending'
    }).sort({ createdAt: -1 });

    // Jika ada payment pending, gunakan yang terakhir untuk dilunasi
    if (pendingPayments.length > 0) {
      const latestPendingPayment = pendingPayments[0];

      console.log("Found pending payment to settle:");
      console.log("Payment Type:", latestPendingPayment.paymentType);
      console.log("Amount:", latestPendingPayment.amount);
      console.log("Status:", latestPendingPayment.status);

      // Untuk pending payment, amount final payment = amount dari pending payment tersebut
      const finalPaymentAmount = latestPendingPayment.amount;

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
          status_message: `Cash final payment transaction is created`,
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

        const payment = new Payment({
          transaction_id: transactionId,
          order_id: order_id,
          payment_code: payment_code,
          amount: finalPaymentAmount,
          totalAmount: finalPaymentAmount,
          method: payment_type,
          status: 'pending',
          fraud_status: 'accept',
          transaction_time: currentTime,
          expiry_time: expiryTime,
          settlement_time: null,
          currency: 'IDR',
          merchant_id: 'G711879663',
          paymentType: 'Final Payment',
          remainingAmount: 0,
          relatedPaymentId: latestPendingPayment._id, // Reference ke pending payment
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
          paymentType: 'Final Payment',
          totalAmount: finalPaymentAmount,
          remainingAmount: 0,
          is_down_payment: false,
          relatedPaymentId: latestPendingPayment._id,
          createdAt: savedPayment.createdAt,
          updatedAt: savedPayment.updatedAt,
          message: `Final payment created for pending ${latestPendingPayment.paymentType} payment`
        });
      }

      // === CASE 2: NON-CASH ===
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

      const payment = new Payment({
        transaction_id: response.transaction_id,
        order_id: order_id,
        payment_code: payment_code,
        amount: parseInt(finalPaymentAmount),
        totalAmount: finalPaymentAmount,
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
        paymentType: 'Final Payment',
        remainingAmount: 0,
        relatedPaymentId: latestPendingPayment._id, // Reference ke pending payment
        raw_response: response
      });

      const savedPayment = await payment.save();

      await Order.updateOne(
        { order_id: order_id },
        { $addToSet: { payment_ids: savedPayment._id } }
      );

      return res.status(200).json({
        ...response,
        paymentType: 'Final Payment',
        totalAmount: finalPaymentAmount,
        remainingAmount: 0,
        is_down_payment: false,
        relatedPaymentId: latestPendingPayment._id,
        message: `Final payment created for pending ${latestPendingPayment.paymentType} payment`
      });
    }

    // *** LOGIKA LAMA: Jika tidak ada pending payment, lanjut cek Down Payment ***

    // 3. Mencari Down Payment dengan ketentuan yang diberikan
    const downPayment = await Payment.findOne({
      order_id: order_id,
      paymentType: 'Down Payment',
      status: 'settlement'
    }).sort({ createdAt: -1 }); // Ambil yang terbaru

    // 4. Validasi status Down Payment
    if (!downPayment) {
      return res.status(400).json({
        success: false,
        message: 'DP belum lunas',
        code: 'DP_NOT_SETTLED'
      });
    }

    if (downPayment.remainingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Pembayaran sudah lunas sepenuhnya',
        code: 'FULLY_PAID'
      });
    }

    // Untuk pelunasan, amount Final Payment = remainingAmount saja
    // Jika ada pesanan baru, maka perlu ditambahkan
    const newOrderTotal = order.grandTotal;

    // Cek apakah ini pelunasan saja atau ada pesanan baru
    // Asumsi: jika user hanya ingin melunasan, maka totalAmount order tidak berubah dari Down Payment
    const isOnlyPayoff = newOrderTotal === downPayment.totalAmount;

    let totalFinalPaymentAmount;
    if (isOnlyPayoff) {
      // Hanya pelunasan, tidak ada pesanan baru
      totalFinalPaymentAmount = downPayment.remainingAmount;
    } else {
      // Ada pesanan baru, tambahkan ke remaining amount
      totalFinalPaymentAmount = downPayment.remainingAmount + (newOrderTotal - downPayment.totalAmount);
    }

    // Cari apakah ada Final Payment yang sudah ada untuk order ini (tidak peduli relatedPaymentId)
    const existingFinalPayment = await Payment.findOne({
      order_id: order_id,
      paymentType: 'Final Payment'
    }).sort({ createdAt: -1 }); // Ambil yang terbaru

    let finalPayment;

    if (existingFinalPayment) {
      // 6. Jika Final Payment sudah ada dan masih pending, update amount
      if (existingFinalPayment.status === 'pending') {

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
            gross_amount: totalFinalPaymentAmount.toString() + ".00",
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
                amount: totalFinalPaymentAmount,
                totalAmount: totalFinalPaymentAmount,
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
            totalAmount: totalFinalPaymentAmount,
            remainingAmount: 0,
            is_down_payment: false,
            relatedPaymentId: downPayment._id,
            createdAt: updatedPayment.createdAt,
            updatedAt: updatedPayment.updatedAt,
            isUpdated: true,
            previousAmount: existingFinalPayment.amount,
            newAmount: totalFinalPaymentAmount,
            message: "Final payment updated successfully"
          });

        } else {
          // === Update untuk NON-CASH ===
          let chargeParams = {
            payment_type: payment_type,
            transaction_details: {
              gross_amount: parseInt(totalFinalPaymentAmount),
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
                amount: totalFinalPaymentAmount,
                totalAmount: totalFinalPaymentAmount,
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
            totalAmount: totalFinalPaymentAmount,
            remainingAmount: 0,
            is_down_payment: false,
            relatedPaymentId: downPayment._id,
            isUpdated: true,
            previousAmount: existingFinalPayment.amount,
            newAmount: totalFinalPaymentAmount,
            message: "Final payment updated successfully"
          });
        }
      }
      // 7. Jika Final Payment sudah settlement, buat data baru
      else if (existingFinalPayment.status === 'settlement') {
        // Lanjutkan ke create baru di bawah
      } else {
        // Status lain (expire, etc) - treat as pending
        // Lanjutkan ke update logic
        return res.status(400).json({
          success: false,
          message: 'Final Payment sudah ada dengan status: ' + existingFinalPayment.status,
          code: 'FINAL_PAYMENT_EXISTS'
        });
      }
    }

    // 5. Buat Final Payment baru untuk pertama kali atau setelah settlement

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
        status_message: `Cash final payment transaction is created`,
        transaction_id: transactionId,
        payment_code: payment_code,
        order_id: order_id,
        gross_amount: totalFinalPaymentAmount.toString() + ".00",
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
        amount: totalFinalPaymentAmount,
        totalAmount: totalFinalPaymentAmount,
        method: payment_type,
        status: 'pending',
        fraud_status: 'accept',
        transaction_time: currentTime,
        expiry_time: expiryTime,
        settlement_time: null,
        currency: 'IDR',
        merchant_id: 'G711879663',
        paymentType: 'Final Payment',
        remainingAmount: 0,
        relatedPaymentId: downPayment._id,
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
        paymentType: 'Final Payment',
        totalAmount: totalFinalPaymentAmount,
        remainingAmount: 0,
        is_down_payment: false,
        relatedPaymentId: downPayment._id,
        createdAt: savedPayment.createdAt,
        updatedAt: savedPayment.updatedAt,
      });
    }

    // === CASE 2: NON-CASH ===
    let chargeParams = {
      payment_type: payment_type,
      transaction_details: {
        gross_amount: parseInt(totalFinalPaymentAmount),
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
      amount: parseInt(totalFinalPaymentAmount),
      totalAmount: totalFinalPaymentAmount,
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
      paymentType: 'Final Payment',
      remainingAmount: 0,
      relatedPaymentId: downPayment._id,
      raw_response: response
    });

    const savedPayment = await payment.save();

    await Order.updateOne(
      { order_id: order_id },
      { $addToSet: { payment_ids: savedPayment._id } }
    );

    return res.status(200).json({
      ...response,
      paymentType: 'Final Payment',
      totalAmount: totalFinalPaymentAmount,
      remainingAmount: 0,
      is_down_payment: false,
      relatedPaymentId: downPayment._id,
    });

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

// ! Start Kitchen sections
export const getKitchenOrder = async (req, res) => {
  try {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // ✅ Update semua order yg masih Waiting & lebih tua dari 15 menit
    await Order.updateMany(
      {
        status: 'Waiting',
        createdAt: { $lt: fifteenMinutesAgo },
      },
      { $set: { status: 'Cancelled' } }
    );

    // ✅ Ambil data order terbaru
    const orders = await Order.find({
      status: { $in: ['Waiting', 'OnProcess', 'Completed', 'Cancelled'] }, // tambahin Cancelled biar kelihatan juga
    })
      .populate('items.menuItem')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch kitchen orders' });
  }
};

export const updateKitchenOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, kitchenId, kitchenName } = req.body; // tambahkan data kitchen user

  console.log('Updating kitchen order status for orderId:', orderId, 'to status:', status);
  if (!orderId || !status) {
    return res.status(400).json({ success: false, message: 'orderId and status are required' });
  }

  try {
    const order = await Order.findOneAndUpdate(
      { order_id: orderId },
      { $set: { status: status } },
      { new: true }
    ).populate('items.menuItem');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 🔥 EMIT SOCKET EVENTS
    const updateData = {
      order_id: orderId,   // ubah ke snake_case
      orderStatus: status, // pakai orderStatus, bukan status
      kitchen: { id: kitchenId, name: kitchenName },
      timestamp: new Date()
    };


    // Emit ke room customer agar tahu progres order
    io.to(`order_${orderId}`).emit('order_status_update', updateData);

    // Emit ke cashier agar kasir tahu kitchen update status
    io.to('cashier_room').emit('kitchen_order_updated', updateData);

    // Emit ke kitchen room juga kalau perlu broadcast antar kitchen
    io.to('kitchen_room').emit('kitchen_order_updated', updateData);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating kitchen order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update kitchen order status' });
  }
};

// ! End Kitchen sections

// Mengambil semua order
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.menuItem')
      .populate('user')
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
    if (!rawOutletId) {
      return res.status(400).json({ message: 'outletId is required' });
    }

    const outletId = rawOutletId.trim();
    const outletObjectId = new mongoose.Types.ObjectId(outletId);

    // Ambil order pending / reserved dari outlet tertentu
    const pendingOrders = await Order.find({
      status: { $in: ['Pending', 'Reserved'] },
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

    console.log('Found payments:', payments);

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
            originalPrice: menuItem.price
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

    // Cari pesanan
    const order = await Order.findById(orderId).populate('items.menuItem');
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

    // Build orderData
    const orderData = {
      _id: order._id.toString(),
      orderId: order.order_id || order._id.toString(),
      orderNumber: generateOrderNumber(order.order_id || order._id),
      orderDate: formatDate(order.createdAt),
      items: formattedItems,
      // total: totalAmountRemaining?.totalAmount || payment?.totalAmount || order?.grandTotal || payment?.amount || 0, // ✅ Update: gunakan totalAmount jika ada
      orderStatus: order.status,
      paymentMethod: paymentDetails.method,
      paymentStatus,
      totalBeforeDiscount: order.totalBeforeDiscount || 0,
      totalAfterDiscount: order.totalAfterDiscount || 0,
      grandTotal: order.grandTotal || 0,

      // ✅ TAMBAHAN: Detail pembayaran yang lebih lengkap
      paymentDetails: paymentDetails,

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
            originalPrice: item.menuItem.price,
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
          })) : []
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

export const cashierCharges = async (req, res) => {
  try {
    const { payment_type, is_down_payment, down_payment_amount, remaining_payment } = req.body;

    console.log('Received payment type:', payment_type);

    if (payment_type === 'cash') {
      // Handle cash payment
      const { order_id, gross_amount } = req.body;
      console.log('Payment type:', payment_type, 'Order ID:', order_id, 'Gross Amount:', gross_amount);

      // Find the order to get the order._id
      const order = await Order.findOne({ order_id: order_id });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if payment already exists for this order
      const existingPayment = await Payment.findOne({ order_id: order_id });
      if (existingPayment) {
        console.log('Payment already exists for order:', order_id);

        // Generate QR code data using order._id only
        const qrData = {
          order_id: order._id.toString(),
        };

        const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

        return res.status(200).json({
          order_id: existingPayment.order_id,
          transaction_id: existingPayment.transaction_id || existingPayment._id.toString(),
          method: existingPayment.method,
          status: existingPayment.status,
          paymentType: existingPayment.paymentType,
          amount: existingPayment.amount,
          remainingAmount: existingPayment.remainingAmount,
          discount: 0,
          fraud_status: "accept",
          transaction_time: existingPayment.transaction_time || existingPayment.createdAt,
          expiry_time: existingPayment.expiry_time || null,
          settlement_time: existingPayment.settlement_time || null,
          va_numbers: existingPayment.va_numbers || [],
          permata_va_number: existingPayment.permata_va_number || null,
          bill_key: existingPayment.bill_key || null,
          biller_code: existingPayment.biller_code || null,
          pdf_url: existingPayment.pdf_url || null,
          currency: existingPayment.currency || "IDR",
          merchant_id: existingPayment.merchant_id || "G711879663",
          signature_key: existingPayment.signature_key || null,
          actions: [
            {
              name: "generate-qr-code",
              method: "GET",
              url: qrCodeBase64,
            }
          ],
          raw_response: existingPayment.raw_response || {
            status_code: "201",
            status_message: "Cash transaction is created",
            transaction_id: existingPayment.transaction_id || existingPayment._id.toString(),
            order_id: existingPayment.order_id,
            merchant_id: "G711879663",
            gross_amount: existingPayment.amount.toString() + ".00",
            currency: "IDR",
            payment_type: "cash",
            transaction_time: existingPayment.transaction_time || existingPayment.createdAt,
            transaction_status: existingPayment.status,
            fraud_status: "accept",
            actions: [
              {
                name: "generate-qr-code",
                method: "GET",
                url: qrCodeBase64,
              }
            ],
            acquirer: "cash",
            qr_string: JSON.stringify(qrData),
            expiry_time: existingPayment.expiry_time || null
          },
          createdAt: existingPayment.createdAt,
          updatedAt: existingPayment.updatedAt,
          __v: 0
        });
      }

      // Log reservation payment details if present
      if (is_down_payment !== undefined) {
        console.log('Is Down Payment:', is_down_payment);
        console.log('Down Payment Amount:', down_payment_amount);
        console.log('Remaining Payment:', remaining_payment);
      }

      // Determine payment type and amounts based on reservation payment
      let paymentType = 'Full';
      let amount = gross_amount;
      let remainingAmount = 0;

      if (is_down_payment === true) {
        paymentType = 'Down Payment';
        amount = down_payment_amount || gross_amount;
        remainingAmount = remaining_payment || 0;
      }

      // Generate transaction_id with UUID-like format
      const generateTransactionId = () => {
        const chars = '0123456789abcdef';
        const sections = [8, 4, 4, 4, 12];
        return sections.map(len =>
          Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        ).join('-');
      };

      const transactionId = generateTransactionId();
      const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

      // Generate QR code data using order._id only
      const qrData = {
        order_id: order._id.toString(),
      };

      const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

      // Create actions array with QR code
      const actions = [
        {
          name: "generate-qr-code",
          method: "GET",
          url: qrCodeBase64,
        }
      ];

      // Create raw_response object
      const rawResponse = {
        status_code: "201",
        status_message: "Cash transaction is created",
        transaction_id: transactionId,
        order_id: order_id,
        merchant_id: "G711879663",
        gross_amount: amount.toString() + ".00",
        currency: "IDR",
        payment_type: "cash",
        transaction_time: currentTime,
        transaction_status: "pending",
        fraud_status: "accept",
        actions: actions,
        acquirer: "cash",
        qr_string: JSON.stringify(qrData),
        expiry_time: expiryTime
      };

      // Create payment with actions and raw_response
      const payment = new Payment({
        transaction_id: transactionId,
        order_id: order_id,
        amount: amount,
        method: payment_type,
        status: 'pending',
        fraud_status: 'accept',
        transaction_time: currentTime,
        expiry_time: expiryTime,
        settlement_time: null,
        va_numbers: [],
        permata_va_number: null,
        bill_key: null,
        biller_code: null,
        pdf_url: null,
        currency: 'IDR',
        merchant_id: 'G711879663',
        signature_key: null,
        paymentType: paymentType,
        remainingAmount: remainingAmount,
        is_down_payment: is_down_payment || false,
        actions: actions,
        raw_response: rawResponse
      });

      // Save payment
      const savedPayment = await payment.save();
      // Update order with payment_id
      await Order.updateOne(
        { order_id: order_id },
        { $set: { "items.$[].payment_id": savedPayment._id } } // update semua item
      );

      console.log('Payment saved with ID:', savedPayment._id);

      // Send response
      return res.status(200).json({
        order_id: order_id,
        transaction_id: transactionId,
        method: payment_type,
        status: 'pending',
        paymentType: paymentType,
        amount: amount,
        remainingAmount: remainingAmount,
        discount: 0,
        fraud_status: 'accept',
        transaction_time: currentTime,
        expiry_time: expiryTime,
        settlement_time: null,
        va_numbers: [],
        permata_va_number: null,
        bill_key: null,
        biller_code: null,
        pdf_url: null,
        currency: 'IDR',
        merchant_id: 'G711879663',
        signature_key: null,
        actions: actions,
        raw_response: rawResponse,
        createdAt: savedPayment.createdAt,
        updatedAt: savedPayment.updatedAt,
        __v: 0
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Payment failed',
        error: 'Order not found'
      });
    }
  } catch (error) {
    console.error('Payment processing error:', error);

    // Enhanced error logging for reservation payments
    if (req.body.is_down_payment !== undefined) {
      console.error('Reservation payment error details:', {
        is_down_payment: req.body.is_down_payment,
        down_payment_amount: req.body.down_payment_amount,
        remaining_payment: req.body.remaining_payment,
      });
    }

    return res.status(500).json({
      success: false,
      message: payment_type === 'cash' ? 'Cash payment failed' : 'Payment failed',
      error: error.message || error
    });
  }
};

export const cashierCharge = async (req, res) => {
  try {
    const {
      payment_type,
      order_id,
      gross_amount,
      is_down_payment,
      down_payment_amount,
      remaining_payment
    } = req.body;

    console.log('Received payment request:', {
      payment_type,
      order_id,
      gross_amount,
      is_down_payment,
      down_payment_amount,
      remaining_payment
    });

    if (order_id === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Cari order berdasarkan order_id
    const order = await Order.findOne({ order_id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Cek apakah pembayaran sudah ada untuk order ini
    const existingPayment = await Payment.findOne({ order_id });
    if (existingPayment) {
      console.log('Existing payment found for order:', order_id);

      // Response untuk existing payment
      return res.status(200).json({
        order_id: existingPayment.order_id,
        transaction_id: existingPayment.transaction_id || existingPayment._id.toString(),
        method: existingPayment.method,
        status: 'finished',
        paymentType: 'full',
        amount: existingPayment.amount,
        remainingAmount: 0,
        discount: 0,
        fraud_status: "accept",
        transaction_time: existingPayment.transaction_time || existingPayment.createdAt,
        currency: "IDR",
        merchant_id: "G711879663",
        createdAt: existingPayment.createdAt,
        updatedAt: existingPayment.updatedAt
      });
    }

    // Logika untuk payment baru
    console.log('Creating new payment for order:', order_id);

    // Tentukan jenis pembayaran dan jumlah
    let paymentType = 'Full';
    let amount = gross_amount;
    let remainingAmount = 0;

    if (is_down_payment === true) {
      paymentType = 'Down Payment';
      amount = down_payment_amount || gross_amount;
      remainingAmount = remaining_payment || 0;
    }

    // Generate transaction ID
    const generateTransactionId = () => {
      const chars = '0123456789abcdef';
      const sections = [8, 4, 4, 4, 12];
      return sections.map(len =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      ).join('-');
    };

    const transactionId = generateTransactionId();
    const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Status berdasarkan jenis pembayaran
    // const status = payment_type === 'cash' ? 'finished' : 'pending';

    // Data pembayaran baru
    const paymentData = {
      transaction_id: transactionId,
      order_id: order_id,
      amount: amount,
      method: payment_type,
      status: 'finished',
      fraud_status: 'accept',
      transaction_time: currentTime,
      currency: 'IDR',
      merchant_id: 'G711879663',
      paymentType: paymentType,
      remainingAmount: remainingAmount,
      is_down_payment: is_down_payment || false
    };

    // Simpan pembayaran baru
    const payment = new Payment(paymentData);
    const savedPayment = await payment.save();
    // Update order with payment_id
    await Order.updateOne(
      { order_id: order_id },
      { $set: { "items.$[].payment_id": savedPayment._id } } // update semua item
    );

    console.log('New payment saved with ID:', savedPayment._id);

    // Response untuk new payment
    const responseData = {
      order_id: order_id,
      transaction_id: transactionId,
      method: payment_type,
      status: 'finished',
      paymentType: paymentType,
      amount: amount,
      remainingAmount: remainingAmount,
      discount: 0,
      fraud_status: 'accept',
      transaction_time: currentTime,
      currency: 'IDR',
      merchant_id: 'G711879663',
      createdAt: savedPayment.createdAt,
      updatedAt: savedPayment.updatedAt
    };

    // Tambahkan field khusus untuk metode tertentu
    // if (payment_type !== 'cash') {
    //   responseData.expiry_time = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 menit kedepan
    // }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Payment processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment failed',
      error: error.message || error.toString()
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
    // order.source = source || order.source; // Update source jika diberikan
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
      if (payment.paymentType === 'Down Payment') {
        payment.amount += payment.remainingAmount;
        payment.remainingAmount = 0;
      }

      // Update status payment menjadi settlement
      payment.status = 'settlement';
      payment.method = payment_method;
      payment.paidAt = new Date();

      await payment.save({ session });
      console.log(payment);
    }


    // Cek apakah semua payment untuk order ini sudah settlement dan remainingAmount 0
    const allPayments = await Payment.find({ order_id }).session(session);
    const isFullyPaid = allPayments.every(p =>
      (p.status === 'settlement' || p.status === 'paid') && p.remainingAmount === 0
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

    if (isFullyPaid) {
      if (order.orderType === 'Reservation') {
        order.status = 'Completed';
      } else {
        order.status = 'Waiting';
      }

      await order.save({ session });
    }

    // Commit transaksi
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        order_id: order.order_id,
        order_status: order.status,
        is_fully_paid: isFullyPaid,
        processed_payments: payments.map(p => ({
          payment_id: p._id,
          payment_type: p.paymentType,
          amount: p.amount,
          remaining_amount: p.remainingAmount,
          status: p.status
        }))
      }
    });

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