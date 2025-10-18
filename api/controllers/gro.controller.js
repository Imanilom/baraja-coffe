// controllers/groController.js
import { Order } from '../models/order.model.js';
import Table from '../models/Table.model.js';
import Area from '../models/Area.model.js';
import Payment from '../models/Payment.model.js';
import { io } from '../index.js';
import mongoose from "mongoose";
import Reservation from '../models/Reservation.model.js';
import User from '../models/user.model.js';
import moment from 'moment-timezone';
import Voucher from '../models/voucher.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import { db } from '../utils/mongo.js';

// ! GRO Apps Controller start

// Helper: Get WIB date range for today
const getTodayWIBRange = () => {
  const startOfDay = moment.tz('Asia/Jakarta').startOf('day').toDate();
  const endOfDay = moment.tz('Asia/Jakarta').endOf('day').toDate();
  return { startOfDay, endOfDay };
};

// Helper: Get WIB now
const getWIBNow = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

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

// GET /api/gro/tables/:tableNumber/order - Get active order detail for specific table
export const getTableOrderDetail = async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const { date } = req.query;

    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: 'Table number is required'
      });
    }

    // Build query
    const query = {
      tableNumber: tableNumber.toUpperCase(),
      status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
      orderType: 'Dine-In'
    };

    // If date provided, filter by date
    if (date) {
      const targetDate = new Date(date);
      query.createdAtWIB = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    }

    // Find active order for this table
    const order = await Order.findOne(query)
      .populate('user_id', 'name phone email')
      .populate({
        path: 'items.menuItem',
        select: 'name price imageURL category mainCategory'
      })
      .sort({ createdAtWIB: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No active order found for this table'
      });
    }

    // Format response
    const formattedOrder = {
      _id: order._id,
      order_id: order.order_id,
      customerName: order.user_id?.name || order.user,
      customerPhone: order.user_id?.phone,
      customerEmail: order.user_id?.email,
      tableNumber: order.tableNumber,
      status: order.status,
      orderType: order.orderType,
      items: order.items.map(item => ({
        _id: item._id,
        menuItem: {
          _id: item.menuItem?._id,
          name: item.menuItem?.name,
          price: item.menuItem?.price,
          imageURL: item.menuItem?.imageURL,
          category: item.menuItem?.category,
          mainCategory: item.menuItem?.mainCategory
        },
        quantity: item.quantity,
        subtotal: item.subtotal,
        addons: item.addons || [],
        toppings: item.toppings || [],
        notes: item.notes || '',
        kitchenStatus: item.kitchenStatus,
        batchNumber: item.batchNumber
      })),
      totalBeforeDiscount: order.totalBeforeDiscount,
      totalAfterDiscount: order.totalAfterDiscount,
      totalTax: order.totalTax,
      totalServiceFee: order.totalServiceFee,
      grandTotal: order.grandTotal,
      discounts: order.discounts,
      appliedVoucher: order.appliedVoucher,
      paymentMethod: order.paymentMethod,
      isOpenBill: order.isOpenBill,
      createdAt: order.createdAt,
      createdAtWIB: order.createdAtWIB,
      updatedAt: order.updatedAt,
      updatedAtWIB: order.updatedAtWIB
    };

    res.json({
      success: true,
      data: formattedOrder
    });

  } catch (error) {
    console.error('Error fetching table order detail:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching table order detail',
      error: error.message
    });
  }
};

// PUT /api/gro/orders/:orderId/complete - Complete order and free up table
export const completeTableOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { orderId } = req.params;
    const userId = req.user?.id; // GRO employee ID

    // Find the order
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate order type
    if (order.orderType !== 'Dine-In') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Only Dine-In orders can be completed through this endpoint'
      });
    }

    // Check if order is already completed
    if (order.status === 'Completed' || order.status === 'Canceled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status.toLowerCase()}`
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    // Update order status
    order.status = 'Completed';
    order.updatedAtWIB = getWIBNow();

    // Add completion info to notes
    const completionNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Order diselesaikan oleh GRO: ${employee?.username || 'Unknown'}`;
    order.notes = (order.notes || '') + completionNote;

    await order.save({ session });

    // Update table status to available
    if (order.tableNumber) {
      const table = await Table.findOne({
        table_number: order.tableNumber.toUpperCase()
      }).session(session);

      if (table) {
        table.status = 'available';
        table.updatedAt = new Date();

        // Add to status history
        if (!table.statusHistory) {
          table.statusHistory = [];
        }

        table.statusHistory.push({
          fromStatus: 'occupied',
          toStatus: 'available',
          updatedBy: employee?.username || 'GRO System',
          notes: `Order ${order.order_id} completed`,
          updatedAt: getWIBNow()
        });

        await table.save({ session });

        // Emit socket event for table status update
        if (typeof io !== 'undefined' && io) {
          io.to(`area_${table.area_id?.area_code}`).emit('table_status_updated', {
            tableId: table._id,
            tableNumber: table.table_number,
            oldStatus: 'occupied',
            newStatus: 'available',
            updatedBy: employee?.username || 'GRO System',
            timestamp: getWIBNow()
          });
        }
      }
    }

    // If there's a related reservation, update it too
    if (order.reservation) {
      const reservation = await Reservation.findById(order.reservation).session(session);
      if (reservation && reservation.status !== 'completed') {

        // Auto check-out if not already done
        if (!reservation.check_out_time) {
          reservation.check_out_time = getWIBNow();
          reservation.checked_out_by = {
            employee_id: userId,
            employee_name: employee?.username || 'Unknown',
            checked_out_at: getWIBNow()
          };
        }

        reservation.status = 'completed';
        await reservation.save({ session });
      }
    }

    await session.commitTransaction();

    // Emit socket event for order completion
    if (typeof io !== 'undefined' && io) {
      io.to('gro_room').emit('order_completed', {
        orderId: order._id,
        order_id: order.order_id,
        tableNumber: order.tableNumber,
        completedBy: employee?.username || 'GRO',
        timestamp: getWIBNow()
      });

      io.to('cashier_room').emit('order_status_updated', {
        orderId: order._id,
        order_id: order.order_id,
        status: 'Completed',
        timestamp: getWIBNow()
      });
    }

    console.log(`✅ Order ${order.order_id} completed by GRO. Table ${order.tableNumber} is now available.`);

    res.json({
      success: true,
      message: `Order ${order.order_id} berhasil diselesaikan. Meja ${order.tableNumber} sekarang tersedia.`,
      data: {
        order: {
          id: order._id,
          order_id: order.order_id,
          status: order.status,
          tableNumber: order.tableNumber
        },
        completedBy: employee?.username || 'GRO',
        completedAt: getWIBNow()
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error completing table order:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing table order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// GET /api/gro/dashboard-stats - Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const wibDate = new Date(now.getTime() + wibOffset);
    const todayStr = wibDate.toISOString().split('T')[0];

    console.log('Looking for reservations on date:', todayStr);

    const todayReservations = await Reservation.aggregate([
      {
        $addFields: {
          dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$reservation_date" } }
        }
      },
      {
        $match: { dateStr: todayStr }
      }
    ]);

    console.log('Found reservations:', todayReservations.length);

    const pendingReservations = todayReservations.filter(r => r.status === 'pending').length;
    const activeReservations = todayReservations.filter(r =>
      r.status === 'confirmed' &&
      r.check_in_time != null &&
      r.check_out_time == null
    ).length;

    const allReservationsCount = await Reservation.countDocuments();
    const completedReservations = await Reservation.countDocuments({ status: 'completed' });
    const cancelledReservations = await Reservation.countDocuments({ status: 'cancelled' });

    const allActiveTables = await Table.countDocuments({ is_active: true });
    const occupiedTableIds = new Set();

    todayReservations.forEach(reservation => {
      if (['confirmed', 'pending'].includes(reservation.status) && !reservation.check_out_time) {
        reservation.table_id.forEach(tableId => {
          occupiedTableIds.add(tableId.toString());
        });
      }
    });

    const availableTables = allActiveTables - occupiedTableIds.size;

    const stats = {
      allReservations: allReservationsCount,
      pendingReservations,
      activeReservations,
      completedReservations,
      cancelledReservations,
      availableTables,
      occupiedTables: occupiedTableIds.size,
      totalTables: allActiveTables
    };

    console.log('Dashboard stats:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

export const createReservation = async (req, res) => {
  try {
    const {
      guest_name,
      guest_phone,
      guest_count,
      reservation_date,
      reservation_time,
      table_ids,
      area_id,
      notes,
      items = [], // Optional menu items
      voucherCode,
      outlet,
      reservation_type = 'nonBlocking',
      serving_food = false,
      equipment = [],
      food_serving_option = 'immediate',
      food_serving_time = null
    } = req.body;

    const userId = req.user?.id; // GRO employee ID dari auth middleware

    console.log('Received createReservation request:', req.body);

    // Validasi input
    if (!guest_name || !guest_phone || !guest_count || !reservation_date ||
      !reservation_time || !table_ids || !area_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!Array.isArray(table_ids) || table_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one table must be selected'
      });
    }

    // Validasi area exists
    const area = await Area.findById(area_id);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }

    // Validasi tables exist dan active
    const tables = await Table.find({
      _id: { $in: table_ids },
      area_id: area_id,
      is_active: true
    });

    if (tables.length !== table_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Some tables are not found, inactive, or not in the selected area'
      });
    }

    // Parse reservation date dan time
    const reservationDateTime = new Date(`${reservation_date}T${reservation_time}:00`);

    // Cek konflik reservasi pada tanggal dan waktu yang sama
    const conflictingReservations = await Reservation.find({
      reservation_date: reservationDateTime,
      reservation_time: reservation_time,
      status: { $in: ['confirmed', 'pending'] },
      table_id: { $in: table_ids }
    });

    if (conflictingReservations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more tables are already reserved for this date and time'
      });
    }

    // Generate reservation code
    const dateStr = moment(reservationDateTime).format('YYYYMMDD');
    const lastReservation = await Reservation.findOne({
      reservation_code: { $regex: `^RSV${dateStr}` }
    }).sort({ reservation_code: -1 });

    let sequence = 1;
    if (lastReservation) {
      const lastSequence = parseInt(lastReservation.reservation_code.slice(-4));
      sequence = lastSequence + 1;
    }

    // Get employee info
    const employee = await User.findById(userId).select('username email');

    // Find voucher if provided
    let voucherId = null;
    let voucherAmount = 0;
    let discountType = null;
    if (voucherCode) {
      const voucher = await Voucher.findOneAndUpdate(
        { code: voucherCode, isActive: true },
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
          batchNumber: 1,
          addedAt: getWIBNow(),
          kitchenStatus: 'pending',
          isPrinted: false,
          dineType: 'Dine-In',
          outletId: menuItem.availableAt?.[0]?._id || null,
          outletName: menuItem.availableAt?.[0]?.name || null,
          payment_id: null,
        });
      }
    }

    // Perhitungan konsisten dengan createAppOrder
    let totalBeforeDiscount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Jika tidak ada item, set minimal reservasi (opsional, bisa 0 atau nilai tertentu)
    if (orderItems.length === 0) {
      totalBeforeDiscount = 0; // Atau 25000 jika ada biaya minimal
    }

    let totalAfterDiscount = totalBeforeDiscount;
    let voucherDiscount = 0;

    if (voucherAmount > 0) {
      if (discountType === 'percentage') {
        voucherDiscount = totalBeforeDiscount * (voucherAmount / 100);
        totalAfterDiscount = totalBeforeDiscount - voucherDiscount;
      } else if (discountType === 'fixed') {
        voucherDiscount = voucherAmount;
        totalAfterDiscount = totalBeforeDiscount - voucherAmount;
        if (totalAfterDiscount < 0) totalAfterDiscount = 0;
      }
    }

    // Calculate tax and service fees (sesuai dengan createAppOrder)
    const isReservationOrder = true;
    const isOpenBillOrder = false;

    console.log('Tax calculation parameters:', {
      totalAfterDiscount,
      outlet: outlet || area.outlet_id || "67cbc9560f025d897d69f889",
      isReservationOrder,
      isOpenBillOrder
    });

    const taxServiceCalculation = await calculateTaxAndService(
      totalAfterDiscount,
      outlet || area.outlet_id || "67cbc9560f025d897d69f889",
      isReservationOrder,
      isOpenBillOrder
    );

    console.log('Backend tax calculation result:', taxServiceCalculation);

    // Calculate grand total including tax and service
    const grandTotal = totalAfterDiscount + taxServiceCalculation.totalTax + taxServiceCalculation.totalServiceFee;

    console.log('Final totals:', {
      totalBeforeDiscount,
      voucherDiscount,
      totalAfterDiscount,
      taxAmount: taxServiceCalculation.totalTax,
      serviceAmount: taxServiceCalculation.totalServiceFee,
      grandTotal
    });



    // Buat reservasi baru sesuai model
    const newReservation = new Reservation({
      reservation_date: reservationDateTime,
      reservation_time: reservation_time,
      area_id: area_id,
      table_id: table_ids,
      guest_count: guest_count,
      guest_number: guest_phone,
      reservation_type: reservation_type,
      status: 'pending',
      notes: notes || '',
      serving_food: serving_food,
      equipment: equipment,
      food_serving_option: food_serving_option,
      food_serving_time: food_serving_time ? new Date(food_serving_time) : null,
      created_by: {
        employee_id: userId,
        employee_name: employee?.username || 'Unknown GRO',
        created_at: getWIBNow()
      },
      createdAtWIB: getWIBNow(),
      updatedAtWIB: getWIBNow()
    });

    await newReservation.save();

    console.log('Reservation created:', {
      id: newReservation._id,
      code: newReservation.reservation_code
    });

    // Buat order untuk reservasi dengan format sesuai Order model
    const generatedOrderId = await generateOrderId(tables.map(t => t.table_number).join(', ') || tables.map(t => t.table_number).join(', ') || '');

    const newOrder = new Order({
      order_id: generatedOrderId,
      user_id: null, // Tidak ada user_id karena walk-in reservation
      user: guest_name, // Nama tamu sebagai user
      cashierId: null, // Tidak ada kasir untuk reservasi GRO
      groId: userId, // GRO yang handle
      items: orderItems,
      status: 'Reserved',
      paymentMethod: 'No Payment',
      orderType: 'Reservation',
      deliveryAddress: '',
      tableNumber: tables.map(t => t.table_number).join(', '),
      pickupTime: null,
      type: 'Indoor',
      isOpenBill: false,
      originalReservationId: null,

      // Diskon & Promo
      discounts: {
        autoPromoDiscount: 0,
        manualDiscount: 0,
        voucherDiscount: voucherDiscount
      },
      appliedPromos: [],
      appliedManualPromo: null,
      appliedVoucher: voucherId,

      // Pajak dan Service Fee
      taxAndServiceDetails: taxServiceCalculation.taxAndServiceDetails || [],
      totalTax: taxServiceCalculation.totalTax || 0,
      totalServiceFee: taxServiceCalculation.totalServiceFee || 0,
      outlet: outlet || area.outlet_id || "67cbc9560f025d897d69f889",

      // Total akhir
      totalBeforeDiscount: totalBeforeDiscount,
      totalAfterDiscount: totalAfterDiscount,
      grandTotal: grandTotal,

      // Sumber order
      source: 'Cashier', // Tetap 'Cashier' karena dibuat dari sistem internal GRO
      currentBatch: 1,
      lastItemAddedAt: orderItems.length > 0 ? getWIBNow() : null,
      kitchenNotifications: [],

      // Reservation reference
      reservation: newReservation._id,

      // Waktu WIB
      createdAtWIB: getWIBNow(),
      updatedAtWIB: getWIBNow(),

      // Transfer history (empty initially)
      transferHistory: []
    });

    await newOrder.save();

    console.log('Order created with tax:', {
      orderId: newOrder._id,
      generatedOrderId: newOrder.order_id,
      totalTax: newOrder.totalTax,
      totalServiceFee: newOrder.totalServiceFee,
      grandTotal: newOrder.grandTotal
    });

    // Update reservation dengan order_id
    newReservation.order_id = newOrder._id;
    await newReservation.save();

    // Verify order was saved with tax data
    const savedOrder = await Order.findById(newOrder._id);
    console.log('Verified saved order tax data:', {
      orderId: savedOrder._id,
      totalTax: savedOrder.totalTax,
      totalServiceFee: savedOrder.totalServiceFee,
      taxAndServiceDetails: savedOrder.taxAndServiceDetails,
      grandTotal: savedOrder.grandTotal
    });

    // Populate data untuk response
    const populatedReservation = await Reservation.findById(newReservation._id)
      .populate('area_id', 'area_name area_code capacity')
      .populate('table_id', 'table_number seats table_type')
      .populate({
        path: 'order_id',
        populate: {
          path: 'items.menuItem',
          select: 'name price imageURL category'
        }
      })
      .populate('created_by.employee_id', 'username email');

    // Enhanced mapping untuk response (konsisten dengan createAppOrder)
    const mappedOrder = {
      _id: newOrder._id,
      userId: newOrder.user_id,
      customerName: newOrder.user,
      cashierId: null, // Tidak ada kasir untuk reservasi GRO
      groId: newOrder.groId,
      items: newOrder.items.map(item => ({
        _id: item._id,
        quantity: item.quantity,
        subtotal: item.subtotal,
        kitchenStatus: item.kitchenStatus,
        isPrinted: item.isPrinted,
        dineType: item.dineType,
        batchNumber: item.batchNumber,
        addedAt: item.addedAt,
        menuItem: item.menuItem,
        notes: item.notes,
        selectedAddons: item.addons.length > 0 ? item.addons.map(addon => ({
          name: addon.name,
          _id: addon._id,
          options: [{
            id: addon._id,
            label: addon.name,
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
      paymentMethod: newOrder.paymentMethod,
      isOpenBill: newOrder.isOpenBill,

      // Financial details
      totalPrice: newOrder.totalBeforeDiscount,
      totalBeforeDiscount: newOrder.totalBeforeDiscount,
      totalAfterDiscount: newOrder.totalAfterDiscount,
      totalTax: newOrder.totalTax,
      totalServiceFee: newOrder.totalServiceFee,
      taxAndServiceDetails: newOrder.taxAndServiceDetails,
      grandTotal: newOrder.grandTotal,

      // Discounts
      discounts: newOrder.discounts,
      appliedPromos: newOrder.appliedPromos,
      appliedManualPromo: newOrder.appliedManualPromo,
      appliedVoucher: newOrder.appliedVoucher,

      voucher: newOrder.appliedVoucher || null,
      outlet: newOrder.outlet || null,
      promotions: newOrder.appliedPromos || [],
      source: newOrder.source,
      currentBatch: newOrder.currentBatch,
      reservation: newOrder.reservation,

      createdAt: newOrder.createdAt,
      updatedAt: newOrder.updatedAt,
      createdAtWIB: newOrder.createdAtWIB,
      updatedAtWIB: newOrder.updatedAtWIB,
      __v: newOrder.__v
    };

    // Emit ke GRO application (bukan cashier)
    if (typeof io !== 'undefined' && io) {
      io.to('gro_room').emit('new_reservation', {
        reservation: populatedReservation,
        order: mappedOrder,
        message: 'New reservation created'
      });
      console.log('Emitted new_reservation to gro_room');
    }

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: populatedReservation,
      order: mappedOrder
    });

  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating reservation',
      error: error.message
    });
  }
};

// GET /api/gro/reservations - Get all reservations with filters
export const getReservations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      date,
      area_id,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};

    if (status) {
      if (status === 'active') {
        filter.status = 'confirmed';
        filter.check_in_time = { $ne: null };
        filter.check_out_time = null;
      } else {
        filter.status = status;
      }
    }

    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        filter.reservation_date = {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lt: new Date(targetDate.setHours(23, 59, 59, 999))
        };
      }
    } else {
      const { startOfDay, endOfDay } = getTodayWIBRange();
      filter.reservation_date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    if (area_id) {
      filter.area_id = area_id;
    }

    if (search) {
      filter.reservation_code = { $regex: search, $options: 'i' };
    }

    const total = await Reservation.countDocuments(filter);

    const reservations = await Reservation.find(filter)
      .populate('area_id', 'area_name area_code capacity')
      .populate('table_id', 'table_number seats')
      .populate('order_id', 'order_id grandTotal status')
      .populate('created_by.employee_id', 'username')
      .populate('checked_in_by.employee_id', 'username')
      .populate('checked_out_by.employee_id', 'username')
      .sort({ reservation_date: 1, reservation_time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: reservations,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_records: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservations',
      error: error.message
    });
  }
};

// GET /api/gro/reservations/:id - Get single reservation detail
export const getReservationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code capacity description')
      .populate('table_id', 'table_number seats table_type')
      .populate('created_by.employee_id', 'username email')
      .populate('checked_in_by.employee_id', 'username email')
      .populate('checked_out_by.employee_id', 'username email')
      .populate({
        path: 'order_id',
        select: 'order_id items grandTotal totalBeforeDiscount totalAfterDiscount totalTax totalServiceFee status paymentMethod',
        populate: {
          path: 'items.menuItem',
          select: 'name price imageURL'
        }
      });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Error fetching reservation detail:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservation detail',
      error: error.message
    });
  }
};

// PUT /api/gro/reservations/:id/confirm - Confirm reservation

export const confirmReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Dari auth middleware

    console.log('Confirming reservation ID:', id, 'by user ID:', userId);

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot confirm cancelled reservation'
      });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Reservation already completed'
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    reservation.status = 'confirmed';
    reservation.confirm_by = {
      employee_id: userId,
      employee_name: employee?.username || 'Unknown',
      confirmed_at: getWIBNow()
    };

    await reservation.save();

    const updated = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .populate('confirm_by.employee_id', 'username');

    res.json({
      success: true,
      message: 'Reservation confirmed successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error confirming reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming reservation',
      error: error.message
    });
  }
};
// PUT /api/gro/reservations/:id/check-in - Check-in reservation
export const checkInReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Dari auth middleware

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot check-in cancelled reservation'
      });
    }

    if (reservation.check_in_time) {
      return res.status(400).json({
        success: false,
        message: 'Reservation already checked in'
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    reservation.check_in_time = getWIBNow();
    reservation.checked_in_by = {
      employee_id: userId,
      employee_name: employee?.username || 'Unknown',
      checked_in_at: getWIBNow()
    };
    reservation.status = 'confirmed';

    await reservation.save();

    const updated = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .populate('checked_in_by.employee_id', 'username');

    res.json({
      success: true,
      message: 'Reservation checked in successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error checking in reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking in reservation',
      error: error.message
    });
  }
};

// PUT /api/gro/reservations/:id/check-out - Check-out reservation
export const checkOutReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (!reservation.check_in_time) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check-out before check-in'
      });
    }

    if (reservation.check_out_time) {
      return res.status(400).json({
        success: false,
        message: 'Reservation already checked out'
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    reservation.check_out_time = getWIBNow();
    reservation.checked_out_by = {
      employee_id: userId,
      employee_name: employee?.username || 'Unknown',
      checked_out_at: getWIBNow()
    };

    await reservation.save();

    const updated = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .populate('checked_out_by.employee_id', 'username');

    res.json({
      success: true,
      message: 'Reservation checked out successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error checking out reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking out reservation',
      error: error.message
    });
  }
};

// PUT /api/gro/reservations/:id/complete - Complete reservation
export const completeReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { closeOpenBill = false } = req.body;
    const userId = req.user?.id;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete cancelled reservation'
      });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Reservation already completed'
      });
    }

    // Auto check-out if not already done
    if (!reservation.check_out_time) {
      const employee = await User.findById(userId).select('username');
      reservation.check_out_time = getWIBNow();
      reservation.checked_out_by = {
        employee_id: userId,
        employee_name: employee?.username || 'Unknown',
        checked_out_at: getWIBNow()
      };
    }

    reservation.status = 'completed';
    await reservation.save();

    // Handle open bill closure
    if (closeOpenBill && reservation.order_id) {
      const order = await Order.findById(reservation.order_id);
      if (order && order.isOpenBill) {
        order.isOpenBill = false;
        await order.save();
      }
    }

    const updated = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .populate('order_id', 'order_id grandTotal status')
      .populate('checked_out_by.employee_id', 'username');

    res.json({
      success: true,
      message: 'Reservation completed successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error completing reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing reservation',
      error: error.message
    });
  }
};

// PUT /api/gro/reservations/:id/cancel - Cancel reservation
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed reservation'
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Reservation already cancelled'
      });
    }

    reservation.status = 'cancelled';
    if (reason) {
      reservation.notes = `Cancelled: ${reason}. ${reservation.notes}`;
    }
    await reservation.save();

    if (reservation.order_id) {
      await Order.findByIdAndUpdate(reservation.order_id, {
        status: 'Canceled'
      });
    }

    const updated = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats');

    res.json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling reservation',
      error: error.message
    });
  }
};

// PUT /api/gro/reservations/:id/close-open-bill - Close open bill status
export const closeOpenBill = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id).populate('order_id');
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (!reservation.order_id) {
      return res.status(400).json({
        success: false,
        message: 'No order associated with this reservation'
      });
    }

    const order = await Order.findById(reservation.order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      return res.status(400).json({
        success: false,
        message: 'Order is not an open bill'
      });
    }

    order.isOpenBill = false;
    await order.save();

    res.json({
      success: true,
      message: 'Open bill closed successfully',
      data: {
        reservation_id: reservation._id,
        order_id: order._id,
        order_code: order.order_id,
        isOpenBill: order.isOpenBill
      }
    });
  } catch (error) {
    console.error('Error closing open bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing open bill',
      error: error.message
    });
  }
};

// GET /api/gro/tables/availability - Get real-time table availability
export const getTableAvailability = async (req, res) => {
  try {
    const { date, time, area_id } = req.query;

    let targetDate;
    if (date) {
      targetDate = new Date(date);
    } else {
      targetDate = new Date();
    }

    const filter = {
      reservation_date: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ['confirmed', 'pending'] }
    };

    if (time) {
      filter.reservation_date = time;
    }

    if (area_id) {
      filter.area_id = area_id;
    }

    const reservations = await Reservation.find(filter).select('table_id');

    const occupiedTableIds = new Set();
    reservations.forEach(reservation => {
      reservation.table_id.forEach(tableId => {
        occupiedTableIds.add(tableId.toString());
      });
    });

    const tableFilter = area_id ? { area_id, is_active: true } : { is_active: true };
    const allTables = await Table.find(tableFilter)
      .populate('area_id', 'area_name area_code');

    const tablesWithStatus = allTables.map(table => ({
      _id: table._id,
      table_number: table.table_number,
      seats: table.seats,
      table_type: table.table_type,
      area: table.area_id,
      is_available: !occupiedTableIds.has(table._id.toString()),
      is_active: table.is_active
    }));

    res.json({
      success: true,
      data: {
        tables: tablesWithStatus,
        summary: {
          total: allTables.length,
          available: tablesWithStatus.filter(t => t.is_available).length,
          occupied: occupiedTableIds.size
        }
      }
    });
  } catch (error) {
    console.error('Error fetching table availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching table availability',
      error: error.message
    });
  }
};

// PUT /api/gro/reservations/:id/transfer-table - Transfer reservation to different table(s)
export const transferTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_table_ids, reason } = req.body;
    const userId = req.user?.id;

    // Validasi input
    if (!new_table_ids || !Array.isArray(new_table_ids) || new_table_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'New table IDs are required and must be an array'
      });
    }

    // Cari reservasi
    const reservation = await Reservation.findById(id)
      .populate('table_id', 'table_number')
      .populate('area_id', 'area_name');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Validasi status reservasi
    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer cancelled reservation'
      });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer completed reservation'
      });
    }

    // Validasi meja baru tersedia
    const newTables = await Table.find({
      _id: { $in: new_table_ids },
      is_active: true
    }).populate('area_id', 'area_name area_code');

    if (newTables.length !== new_table_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Some tables are not found or inactive'
      });
    }

    // Cek ketersediaan meja baru
    const conflictingReservations = await Reservation.find({
      _id: { $ne: id },
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      status: { $in: ['confirmed', 'pending'] },
      table_id: { $in: new_table_ids }
    });

    if (conflictingReservations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more new tables are already reserved for this time slot'
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    // Simpan riwayat meja lama
    const oldTableNumbers = reservation.table_id.map(t => t.table_number).join(', ');
    const newTableNumbers = newTables.map(t => t.table_number).join(', ');

    // Update reservasi
    reservation.table_id = new_table_ids;

    // Tambahkan catatan transfer
    const transferNote = `[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Pindah meja dari ${oldTableNumbers} ke ${newTableNumbers} oleh ${employee?.username || 'Unknown'}${reason ? ` - Alasan: ${reason}` : ''}`;

    reservation.notes = reservation.notes
      ? `${transferNote}\n${reservation.notes}`
      : transferNote;

    // Tambahkan history transfer (opsional, jika ada field history)
    if (!reservation.transfer_history) {
      reservation.transfer_history = [];
    }

    reservation.transfer_history.push({
      old_tables: reservation.table_id,
      new_tables: new_table_ids,
      transferred_by: {
        employee_id: userId,
        employee_name: employee?.username || 'Unknown'
      },
      transferred_at: getWIBNow(),
      reason: reason || 'No reason provided'
    });

    await reservation.save();

    // Ambil data lengkap setelah update
    const updated = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats table_type')
      .populate('order_id', 'order_id grandTotal status');

    res.json({
      success: true,
      message: 'Table transferred successfully',
      data: {
        reservation: updated,
        transfer_info: {
          old_tables: oldTableNumbers,
          new_tables: newTableNumbers,
          transferred_by: employee?.username || 'Unknown',
          transferred_at: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
          reason: reason || 'No reason provided'
        }
      }
    });
  } catch (error) {
    console.error('Error transferring table:', error);
    res.status(500).json({
      success: false,
      message: 'Error transferring table',
      error: error.message
    });
  }
};

// ! GRO Apps Controller end

/**
 * GRO Controller untuk management meja dan pesanan
 */

// ✅ GET ALL ACTIVE ORDERS WITH TABLE INFO (MAX 4 HOURS)
export const getActiveOrders = async (req, res) => {
  try {
    const { outletId } = req.params;

    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID diperlukan'
      });
    }

    const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const fourHoursAgo = new Date(nowWIB.getTime() - 4 * 60 * 60 * 1000);

    const activeOrders = await Order.find({
      outlet: outletId,
      status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
      orderType: 'Dine-In',
      tableNumber: { $exists: true, $ne: null },
      createdAtWIB: { $gte: fourHoursAgo }
    })
      .populate('user_id', 'name phone')
      .populate('cashierId', 'name')
      .populate({
        path: 'items.menuItem',
        select: 'name price mainCategory workstation'
      })
      .sort({ createdAt: -1 });

    // Ambil semua order_id untuk query pembayaran sekaligus (lebih efisien)
    const orderIds = activeOrders.map(order => order.order_id);
    const payments = await Payment.find({ order_id: { $in: orderIds } });

    // Group payments by order_id
    const paymentMap = {};
    payments.forEach(payment => {
      if (!paymentMap[payment.order_id]) {
        paymentMap[payment.order_id] = [];
      }
      paymentMap[payment.order_id].push(payment);
    });

    const formattedOrders = activeOrders.map(order => {
      const orderPayments = paymentMap[order.order_id] || [];
      // Hitung total yang sudah dibayar (status settlement/paid)
      const totalPaid = orderPayments
        .filter(p => p.status === 'settlement' || p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      // Tentukan payment status
      let paymentStatus = 'unpaid'; // default
      if (totalPaid >= order.grandTotal) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }

      return {
        id: order._id,
        order_id: order.order_id,
        customerName: order.user_id?.name || order.user,
        customerPhone: order.user_id?.phone,
        tableNumber: order.tableNumber,
        status: paymentStatus, // ✅ 'unpaid' | 'partial' | 'paid'
        orderType: order.orderType,
        items: order.items.map(item => ({
          name: item.menuItem?.name,
          quantity: item.quantity,
          mainCategory: item.menuItem?.mainCategory,
          workstation: item.menuItem?.workstation
        })),
        totalPrice: order.grandTotal,
        totalPaid, // opsional: tampilkan jumlah sudah dibayar
        createdAt: order.createdAtWIB,
        isOpenBill: order.isOpenBill
      };
    });

    res.json({
      success: true,
      data: formattedOrders,
      total: formattedOrders.length
    });

  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pesanan aktif',
      error: error.message
    });
  }
};

// ✅ GET TABLE OCCUPANCY STATUS — DENGAN AUTO-UPDATE STATUS MEJA
export const getTableOccupancyStatus = async (req, res) => {
  try {
    const { outletId } = req.params;

    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID diperlukan'
      });
    }

    // 🔥 LANGSUNG UPDATE STATUS MEJA BERDASARKAN PESANAN AKTIF (<4 JAM)
    await Table.syncTableStatusWithActiveOrders(outletId);

    // Sekarang ambil data terbaru
    const tables = await Table.find({ is_active: true })
      .populate('area_id', 'area_code area_name')
      .sort({ area_id: 1, table_number: 1 });

    // Ambil pesanan aktif (untuk tampilan occupancy detail)
    const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const fourHoursAgo = new Date(nowWIB.getTime() - 4 * 60 * 60 * 1000);

    const activeOrders = await Order.find({
      outlet: outletId,
      status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
      orderType: 'Dine-In',
      tableNumber: { $exists: true, $ne: null },
      createdAtWIB: { $gte: fourHoursAgo }
    }).select('order_id tableNumber user status createdAtWIB');

    const activeOrderMap = {};
    activeOrders.forEach(order => {
      activeOrderMap[order.tableNumber] = {
        orderId: order._id,
        order_id: order.order_id,
        customerName: order.user,
        status: order.status,
        occupiedSince: order.createdAtWIB
      };
    });

    const tableStatus = tables.map(table => {
      const occupancy = activeOrderMap[table.table_number];
      return {
        id: table._id,
        table_number: table.table_number,
        area: {
          code: table.area_id?.area_code || 'N/A',
          name: table.area_id?.area_name || 'Unknown Area'
        },
        seats: table.seats,
        table_type: table.table_type,
        currentStatus: table.status, // sekarang sudah akurat!
        displayStatus: table.status,  // tidak perlu override lagi
        isOccupied: !!occupancy,
        occupancy: occupancy || null
      };
    });

    // Group by area
    const tablesByArea = {};
    tableStatus.forEach(table => {
      const areaCode = table.area.code;
      if (!tablesByArea[areaCode]) {
        tablesByArea[areaCode] = [];
      }
      tablesByArea[areaCode].push(table);
    });

    const totalTables = tables.length;
    const occupiedTables = tableStatus.filter(t => t.isOccupied).length;
    const availableTables = totalTables - occupiedTables;

    res.json({
      success: true,
      data: {
        tablesByArea,
        statistics: {
          totalTables,
          occupiedTables,
          availableTables,
          occupancyRate: totalTables > 0 ? ((occupiedTables / totalTables) * 100).toFixed(1) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching table occupancy:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil status ocupansi meja',
      error: error.message
    });
  }
};

// ✅ PERBAIKAN: getAvailableTables — pastikan meja benar-benar available (tidak punya pesanan aktif)
export const getAvailableTables = async (req, res) => {
  try {
    const { outletId, areaCode } = req.query;

    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID diperlukan'
      });
    }

    // Ambil semua pesanan aktif untuk outlet ini
    const activeOrders = await Order.find({
      outlet: outletId,
      status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
      orderType: 'Dine-In',
      tableNumber: { $exists: true, $ne: null }
    }).select('tableNumber');

    const occupiedTableNumbers = new Set(
      activeOrders.map(order => order.tableNumber?.toUpperCase())
    );

    let filter = {
      is_active: true,
      // Jangan andalkan `status: 'available'` saja — cek juga tidak ada pesanan aktif
    };

    if (areaCode) {
      const area = await Area.findOne({
        area_code: areaCode.toUpperCase(),
        outlet_id: outletId,
        is_active: true
      });

      if (area) {
        filter.area_id = area._id;
      }
    }

    const allTables = await Table.find(filter)
      .populate('area_id', 'area_code area_name')
      .sort({ table_number: 1 });

    // Filter meja yang benar-benar available: status 'available' DAN tidak ada pesanan aktif
    const trulyAvailableTables = allTables.filter(table => {
      const tableNum = table.table_number.toUpperCase();
      return table.status === 'available' && !occupiedTableNumbers.has(tableNum);
    });

    const formattedTables = trulyAvailableTables.map(table => ({
      id: table._id,
      table_number: table.table_number,
      area: {
        code: table.area_id?.area_code || 'N/A',
        name: table.area_id?.area_name || 'Unknown'
      },
      seats: table.seats,
      table_type: table.table_type,
      status: table.status
    }));

    res.json({
      success: true,
      data: formattedTables,
      total: formattedTables.length
    });

  } catch (error) {
    console.error('Error fetching available tables:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data meja tersedia',
      error: error.message
    });
  }
};


// ✅ TRANSFER ORDER TO DIFFERENT TABLE
export const transferOrderTable = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { newTableNumber, reason, transferredBy } = req.body;

    if (!newTableNumber || !transferredBy) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Nomor meja baru dan nama GRO yang mentransfer diperlukan'
      });
    }

    // Cari pesanan
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }

    // Validasi order type
    if (order.orderType !== 'Dine-In') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Hanya pesanan Dine-In yang bisa dipindahkan meja'
      });
    }

    const oldTableNumber = order.tableNumber;

    // Cek apakah meja baru tersedia
    const newTable = await Table.findOne({
      table_number: newTableNumber.toUpperCase(),
      is_active: true,
      status: 'available'
    }).populate('area_id').session(session);

    if (!newTable) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Meja ${newTableNumber} tidak tersedia atau tidak ditemukan`
      });
    }

    // Cek apakah meja baru sudah ada pesanan aktif
    const existingOrderOnNewTable = await Order.findOne({
      tableNumber: newTableNumber,
      status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
      outlet: order.outlet
    }).session(session);

    if (existingOrderOnNewTable && existingOrderOnNewTable._id.toString() !== orderId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Meja ${newTableNumber} sudah memiliki pesanan aktif`
      });
    }

    // Update table status
    await Table.findByIdAndUpdate(
      newTable._id,
      { status: 'occupied' },
      { session }
    );

    // Jika meja lama ada, update statusnya menjadi available
    if (oldTableNumber) {
      const oldTable = await Table.findOne({
        table_number: oldTableNumber.toUpperCase()
      }).session(session);

      if (oldTable) {
        await Table.findByIdAndUpdate(
          oldTable._id,
          { status: 'available' },
          { session }
        );
      }
    }

    // Update order dengan table baru
    order.tableNumber = newTableNumber.toUpperCase();
    order.updatedAtWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));

    // Simpan history transfer
    if (!order.transferHistory) {
      order.transferHistory = [];
    }

    order.transferHistory.push({
      fromTable: oldTableNumber,
      toTable: newTableNumber,
      transferredBy: transferredBy,
      reason: reason || 'Table transfer by GRO',
      transferredAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
    });

    await order.save({ session });

    await session.commitTransaction();

    // ✅ EMIT SOCKET EVENT UNTUK REAL-TIME UPDATE
    const transferData = {
      orderId: order._id,
      order_id: order.order_id,
      oldTable: oldTableNumber,
      newTable: newTableNumber,
      customerName: order.user_id?.name || order.user,
      transferredBy: transferredBy,
      reason: reason,
      area: newTable.area_id.area_code,
      timestamp: new Date()
    };

    // Emit ke room order
    io.to(`order_${order.order_id}`).emit('table_transferred', transferData);

    // Emit ke cashier room
    io.to('cashier_room').emit('order_table_changed', transferData);

    // Emit ke area room
    io.to(`area_${newTable.area_id.area_code}`).emit('table_assignment_updated', {
      tableNumber: newTableNumber,
      orderId: order.order_id,
      status: 'occupied'
    });

    if (oldTableNumber) {
      const oldTable = await Table.findOne({ table_number: oldTableNumber });
      if (oldTable) {
        io.to(`area_${oldTable.area_id?.area_code}`).emit('table_assignment_updated', {
          tableNumber: oldTableNumber,
          status: 'available'
        });
      }
    }

    console.log(`✅ Table transferred: Order ${order.order_id} from ${oldTableNumber} to ${newTableNumber}`);

    res.json({
      success: true,
      message: `Pesanan berhasil dipindahkan dari meja ${oldTableNumber} ke meja ${newTableNumber}`,
      data: {
        order: {
          id: order._id,
          order_id: order.order_id,
          tableNumber: order.tableNumber,
          customerName: order.user_id?.name || order.user
        },
        transfer: {
          from: oldTableNumber,
          to: newTableNumber,
          transferredBy: transferredBy,
          reason: reason,
          timestamp: new Date()
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error transferring table:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memindahkan pesanan ke meja baru',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ✅ GET ORDER TABLE HISTORY
export const getOrderTableHistory = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .select('order_id tableNumber transferHistory user user_id');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }

    const history = order.transferHistory || [];

    res.json({
      success: true,
      data: {
        order: {
          id: order._id,
          order_id: order.order_id,
          currentTable: order.tableNumber,
          customerName: order.user_id?.name || order.user
        },
        transferHistory: history.map(transfer => ({
          fromTable: transfer.fromTable,
          toTable: transfer.toTable,
          transferredBy: transfer.transferredBy,
          reason: transfer.reason,
          transferredAt: transfer.transferredAt
        })).sort((a, b) => new Date(b.transferredAt) - new Date(a.transferredAt))
      }
    });

  } catch (error) {
    console.error('Error fetching table history:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil history perpindahan meja',
      error: error.message
    });
  }
};

// ✅ BULK TABLE STATUS UPDATE (Untuk GRO yang keliling)
export const bulkUpdateTableStatus = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { outletId, areaCode } = req.query;

    if (!outletId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Outlet ID diperlukan'
      });
    }

    // updates: array of { tableNumber, status, updatedBy, notes }
    const updates = Array.isArray(req.body) ? req.body : (req.body.updates || []);
    if (!Array.isArray(updates) || updates.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Payload harus berisi array updates'
      });
    }

    // Ambil semua pesanan aktif untuk outlet ini untuk pengecekan ketersediaan
    const activeOrders = await Order.find({
      outlet: outletId,
      status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
      orderType: 'Dine-In',
      tableNumber: { $exists: true, $ne: null }
    }).select('tableNumber');

    const occupiedTableNumbers = new Set(
      activeOrders.map(order => order.tableNumber?.toUpperCase())
    );

    const results = [];
    const errors = [];

    for (const update of updates) {
      const tableNumber = (update.tableNumber || '').toString().toUpperCase();
      const status = update.status;
      const updatedBy = update.updatedBy || 'GRO';
      const notes = update.notes || '';

      if (!tableNumber || !status) {
        errors.push({ tableNumber: update.tableNumber, message: 'tableNumber dan status wajib diisi' });
        continue;
      }

      try {
        // Cari meja (tambahkan outlet/area filter bila perlu)
        const table = await Table.findOne({
          table_number: tableNumber,
          is_active: true
        }).session(session);

        if (!table) {
          errors.push({ tableNumber, message: 'Meja tidak ditemukan' });
          continue;
        }

        // Jika ingin mengubah ke 'available' tetapi meja masih punya pesanan aktif -> tolak
        if (status === 'available' && table.status === 'occupied') {
          const activeOrder = await Order.findOne({
            tableNumber: table.table_number,
            status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
            outlet: outletId
          }).session(session);

          if (activeOrder) {
            errors.push({
              tableNumber,
              message: `Meja ${tableNumber} masih memiliki pesanan aktif (Order: ${activeOrder.order_id})`
            });
            continue;
          }
        }

        // Update table status dan history
        const oldStatus = table.status;
        table.status = status;
        table.updatedAt = new Date();

        if (!table.statusHistory) {
          table.statusHistory = [];
        }

        table.statusHistory.push({
          fromStatus: oldStatus,
          toStatus: status,
          updatedBy: updatedBy,
          notes: notes,
          updatedAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
        });

        await table.save({ session });

        results.push({
          tableNumber,
          fromStatus: oldStatus,
          toStatus: status,
          success: true
        });

        // Emit socket event ke area sesuai table.area_id (boleh undefined)
        io.to(`area_${table.area_id?.area_code}`).emit('table_status_updated', {
          tableId: table._id,
          tableNumber: table.table_number,
          areaId: table.area_id,
          oldStatus: oldStatus,
          newStatus: status,
          updatedBy: updatedBy,
          timestamp: new Date()
        });

      } catch (err) {
        errors.push({ tableNumber: update.tableNumber, message: err.message });
      }
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Bulk table status update selesai',
      results,
      errors
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error performing bulk table status update:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status meja secara massal',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

