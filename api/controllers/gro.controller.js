// controllers/groController.js
import { Order } from '../models/order.model.js';
import Table from '../models/Table.model.js';
import Area from '../models/Area.model.js';
import Payment from '../models/Payment.model.js';
import { broadcastNewOrder, io } from '../index.js';
import mongoose from "mongoose";
import Reservation from '../models/Reservation.model.js';
import User from '../models/user.model.js';
import moment from 'moment-timezone';
import Voucher from '../models/voucher.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import { db } from '../utils/mongo.js';
import { TaxAndService } from '../models/TaxAndService.model.js';
// ✅ PERFORMANCE: Redis cache for GRO optimization
import {
  getCache,
  setCache,
  invalidateGROCache,
  getReservationsCacheKey,
  getTableAvailabilityCacheKey
} from '../utils/redisCache.js';

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

// export async function generateOrderId(tableNumber) {
//   // Dapatkan tanggal sekarang
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = String(now.getMonth() + 1).padStart(2, '0');
//   const day = String(now.getDate()).padStart(2, '0');
//   const dateStr = `${year}${month}${day}`; // misal "20250605"

//   // Jika tidak ada tableNumber, gunakan hari dan tanggal
//   let tableOrDayCode = tableNumber;
//   if (!tableNumber) {
//     const days = ['MD', 'TU', 'WD', 'TH', 'FR', 'ST', 'SN'];
//     // getDay: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
//     const dayCode = days[now.getDay()];
//     tableOrDayCode = `${dayCode}${day}`;
//   }

//   // Kunci sequence unik per tableOrDayCode dan tanggal
//   const key = `order_seq_${tableOrDayCode}_${dateStr}`;

//   // Atomic increment dengan upsert dan reset setiap hari
//   const result = await db.collection('counters').findOneAndUpdate(
//     { _id: key },
//     { $inc: { seq: 1 } },
//     { upsert: true, returnDocument: 'after' }
//   );

//   const seq = result.value.seq;

//   // Format orderId
//   return `ORD-${day}${tableOrDayCode}-${String(seq).padStart(3, '0')}`;
// }

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

    const targetTableNumber = tableNumber.toUpperCase();

    // Build query untuk Dine-In
    const dineInQuery = {
      tableNumber: targetTableNumber,
      status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
      orderType: 'Dine-In'
    };

    // If date provided, filter by date
    if (date) {
      const targetDate = new Date(date);
      dineInQuery.createdAtWIB = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    }

    // Find Dine-In order
    let order = await Order.findOne(dineInQuery)
      .populate('user_id', 'name phone email')
      .populate({
        path: 'items.menuItem',
        select: 'name price imageURL category mainCategory'
      })
      .sort({ createdAtWIB: -1 });

    // Jika tidak ada Dine-In order, cari Reservation order
    if (!order) {
      // Cari table berdasarkan table_number
      const table = await mongoose.model('Table').findOne({
        table_number: targetTableNumber
      });

      if (table) {
        // Cari reservation yang sedang aktif untuk table ini
        const activeReservation = await Reservation.findOne({
          table_id: table._id,
          status: { $in: ['confirmed', 'pending'] },
          order_id: { $exists: true, $ne: null }
        });

        console.log('Active reservation for table', targetTableNumber, ':', activeReservation);

        if (activeReservation && activeReservation.order_id) {
          // Pertama cek order tersebut ada atau tidak tanpa filter status
          const checkOrder = await Order.findById(activeReservation.order_id);
          console.log('Order details:', checkOrder);

          // Cari order dari reservation dengan filter yang lebih longgar
          const reservationQuery = {
            _id: activeReservation.order_id,
            status: { $in: ['Pending', 'Waiting', 'OnProcess', 'Reserved'] } // Tambahkan 'Reserved'
          };

          if (date) {
            const targetDate = new Date(date);
            reservationQuery.createdAtWIB = {
              $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
              $lte: new Date(targetDate.setHours(23, 59, 59, 999))
            };
          }

          order = await Order.findOne(reservationQuery)
            .populate('user_id', 'name phone email')
            .populate({
              path: 'items.menuItem',
              select: 'name price imageURL category mainCategory'
            })
            .populate('reservation', 'reservation_code reservation_date reservation_time guest_count');

          console.log('Found reservation order for table', targetTableNumber, ':', order);
        }
      }
    }

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
      tableNumber: order.tableNumber || targetTableNumber,
      status: order.status,
      orderType: order.orderType,
      reservation: order.reservation ? {
        _id: order.reservation._id,
        reservation_code: order.reservation.reservation_code,
        reservation_date: order.reservation.reservation_date,
        reservation_time: order.reservation.reservation_time,
        guest_count: order.reservation.guest_count
      } : null,
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

// ✅ PUT /api/gro/tables/:tableNumber/force-reset - Force reset table status
export const forceResetTableStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tableNumber } = req.params;
    const { outletId } = req.body;

    if (!outletId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Outlet ID is required'
      });
    }

    console.log(`🔄 Force resetting table ${tableNumber} for outlet ${outletId}`);

    // ✅ 1. Cari dan batalkan order aktif yang terkait dengan meja ini
    const activeOrders = await Order.find({
      tableNumber: tableNumber.toUpperCase(),
      outlet: outletId,
      status: { $in: ['Pending', 'Waiting', 'OnProcess', 'Reserved'] }
    }).session(session);

    console.log(`📋 Found ${activeOrders.length} active orders for table ${tableNumber}`);

    // ✅ 2. Batalkan semua order aktif
    for (const order of activeOrders) {
      order.status = 'Canceled';
      order.updatedAtWIB = getWIBNow();

      const cancelNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Order dibatalkan secara paksa oleh sistem saat membebaskan meja`;
      order.notes = (order.notes || '') + cancelNote;

      await order.save({ session });
      console.log(`✅ Cancelled order: ${order.order_id}`);
    }

    // ✅ 3. Reset status meja
    const table = await Table.findOne({
      table_number: tableNumber.toUpperCase(),
      is_active: true
    }).session(session);

    if (!table) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: `Table ${tableNumber} not found`
      });
    }

    const oldStatus = table.status;
    table.status = 'available';
    table.updatedAt = new Date();

    // Add to status history
    if (!table.statusHistory) {
      table.statusHistory = [];
    }

    table.statusHistory.push({
      fromStatus: oldStatus,
      toStatus: 'available',
      updatedBy: 'System Force Reset',
      notes: `Table force reset - ${activeOrders.length} orders cancelled`,
      updatedAt: getWIBNow()
    });

    await table.save({ session });

    await session.commitTransaction();

    console.log(`✅ Table ${tableNumber} force reset completed. Status: ${oldStatus} → available`);

    res.json({
      success: true,
      message: `Table ${tableNumber} berhasil direset ke status available. ${activeOrders.length} orders dibatalkan.`,
      data: {
        table: {
          table_number: table.table_number,
          old_status: oldStatus,
          new_status: 'available'
        },
        cancelled_orders: activeOrders.length
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error force resetting table:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting table status',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// PUT /api/gro/orders/:orderId/complete - Complete order and free up table
// ✅ FIXED: Now emits socket events for real-time UI updates
export const completeTableOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    // Find the order
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate order can be completed
    if (order.status === 'Completed') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Order already completed'
      });
    }

    if (order.status === 'Canceled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot complete cancelled order'
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    // Update order status to Completed
    order.status = 'Completed';
    order.updatedAtWIB = getWIBNow();

    // Add completion note
    const completeNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Order selesai oleh: ${employee?.username || 'Unknown'}`;
    order.notes = (order.notes || '') + completeNote;

    await order.save({ session });

    console.log('✅ Order status updated to Completed:', order.order_id);

    // ✅ FREE UP TABLE
    let freedTable = null;
    if (order.tableNumber) {
      const table = await Table.findOne({
        table_number: order.tableNumber.toUpperCase()
      }).session(session);

      if (table && table.status === 'occupied') {
        table.status = 'available';
        table.is_available = true;
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
        freedTable = order.tableNumber;

        console.log('✅ Table freed on complete:', order.tableNumber);
      }
    }

    await session.commitTransaction();

    // ✅ EMIT SOCKET: Order status updated
    if (typeof io !== 'undefined' && io) {
      io.to('cashier_room').emit('order_status_updated', {
        orderId: order._id,
        order_id: order.order_id,
        status: 'Completed',
        updatedBy: employee?.username || 'GRO',
        timestamp: getWIBNow()
      });

      io.to('gro_room').emit('order_status_updated', {
        orderId: order._id,
        order_id: order.order_id,
        status: 'Completed',
        updatedBy: employee?.username || 'GRO',
        freedTable: freedTable,
        timestamp: getWIBNow()
      });

      // ✅ EMIT: Table status updated for real-time UI
      if (freedTable) {
        io.emit('table_status_updated', {
          tables: [freedTable],
          newStatus: 'available',
          reason: 'Order completed',
          updatedBy: employee?.username || 'GRO',
          timestamp: getWIBNow()
        });
      }
    }

    console.log('✅ Order completed successfully:', order.order_id, 'Table freed:', freedTable);

    res.json({
      success: true,
      message: 'Order completed successfully',
      data: {
        orderId: order._id,
        order_id: order.order_id,
        status: 'Completed',
        freedTable: freedTable
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error completing order:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const { date: dateParam } = req.query;
    const targetDate = dateParam
      ? new Date(dateParam)
      : moment.tz('Asia/Jakarta').startOf('day').toDate();

    const startOfDayWIB = moment.tz(targetDate, 'Asia/Jakarta').startOf('day').toDate();
    const endOfDayWIB = moment.tz(targetDate, 'Asia/Jakarta').endOf('day').toDate();

    // Konversi ke UTC untuk query MongoDB
    const startOfDayUTC = new Date(startOfDayWIB.getTime() - 7 * 60 * 60 * 1000);
    const endOfDayUTC = new Date(endOfDayWIB.getTime() - 7 * 60 * 60 * 1000);

    // === 1. Ambil SEMUA Order (Dine-In + Reservation) pada tanggal tersebut ===
    const allOrders = await Order.find({
      createdAt: { $gte: startOfDayUTC, $lte: endOfDayUTC },
      orderType: { $in: ['Dine-In', 'Reservation'] }
    }).lean();

    const allReservations = await Reservation.find({
      createdAtWIB: { $gte: startOfDayWIB, $lte: endOfDayWIB }
    }).lean();

    // === 2. Hitung total semua order (Riwayat Semua) ===
    const allReservationsCount = allOrders.length + allReservations.length;

    // === 3. Hitung berdasarkan status ===
    let pendingReservations = 0;
    let activeReservations = 0;
    let completedReservations = 0;
    let cancelledReservations = 0;

    // Proses Reservation
    for (const r of allReservations) {
      if (r.status === 'pending') pendingReservations++;
      else if (r.status === 'confirmed' && r.check_in_time && !r.check_out_time) activeReservations++;
      else if (r.status === 'completed') completedReservations++;
      else if (r.status === 'cancelled') cancelledReservations++;
    }

    // Proses Dine-In Orders
    for (const o of allOrders) {
      if (o.orderType === 'Dine-In') {
        if (['Pending', 'Waiting'].includes(o.status)) pendingReservations++;
        else if (o.status === 'OnProcess') activeReservations++;
        else if (o.status === 'Completed') completedReservations++;
        else if (o.status === 'Canceled') cancelledReservations++;
      } else if (o.orderType === 'Reservation') {
        // Ini seharusnya tidak terjadi karena Reservation disimpan di collection Reservation
        // Tapi jika ada, abaikan atau sesuaikan
      }
    }

    // === 4. Hitung Meja Terisi & Tersedia (opsional, sesuai kebutuhan UI) ===
    const allActiveTables = await Table.countDocuments({ is_active: true });

    // Ambil meja yang terisi dari:
    // - Reservation aktif (confirmed/pending, belum check-out)
    // - Dine-In aktif (status bukan Completed/Canceled)
    const occupiedTableIds = new Set();

    // Dari Reservation
    const activeReservationsToday = allReservations.filter(r =>
      ['confirmed', 'pending'].includes(r.status) && !r.check_out_time
    );
    for (const r of activeReservationsToday) {
      r.table_id.forEach(id => occupiedTableIds.add(id.toString()));
    }

    // Dari Dine-In
    const activeDineInOrders = allOrders.filter(o =>
      o.orderType === 'Dine-In' &&
      ['Pending', 'Waiting', 'OnProcess'].includes(o.status) &&
      o.tableNumber
    );
    const tableNumberToIdMap = new Map();
    const allTables = await Table.find({ is_active: true }).select('table_number');
    for (const t of allTables) {
      tableNumberToIdMap.set(t.table_number.toUpperCase(), t._id.toString());
    }
    for (const o of activeDineInOrders) {
      const id = tableNumberToIdMap.get(o.tableNumber.toUpperCase());
      if (id) occupiedTableIds.add(id);
    }

    const occupiedTablesCount = occupiedTableIds.size;
    const availableTables = Math.max(0, allActiveTables - occupiedTablesCount);

    // === 5. Return stats ===
    const stats = {
      allReservations: allReservationsCount,
      pendingReservations,
      activeReservations,
      completedReservations,
      cancelledReservations,
      availableTables,
      occupiedTables: occupiedTablesCount,
      totalTables: allActiveTables
    };

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

// controllers/groController.js - FIXED VERSION

// controllers/groController.js - FIXED VERSION

// ✅ GET /api/gro/reservations/:id - Get single reservation detail
export const getReservationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Fetching reservation detail for ID:', id);

    const reservation = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code capacity description')
      .populate('table_id', 'table_number seats table_type')
      .populate('created_by.employee_id', 'username email')
      .populate('checked_in_by.employee_id', 'username email')
      .populate('checked_out_by.employee_id', 'username email')
      .populate({
        path: 'order_id',
        select: '_id order_id items grandTotal totalBeforeDiscount totalAfterDiscount totalTax totalServiceFee status paymentMethod',
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

    // ✅ PERBAIKAN: Format order_id untuk konsistensi
    const formattedReservation = reservation.toObject();

    // Jika order_id adalah populated object, pastikan struktur konsisten
    if (formattedReservation.order_id && typeof formattedReservation.order_id === 'object') {
      // Sudah dalam format yang benar (populated)
      // Pastikan _id ada
      formattedReservation.order_id = {
        _id: formattedReservation.order_id._id,
        order_id: formattedReservation.order_id.order_id,
        items: formattedReservation.order_id.items || [],
        grandTotal: formattedReservation.order_id.grandTotal,
        totalBeforeDiscount: formattedReservation.order_id.totalBeforeDiscount,
        totalAfterDiscount: formattedReservation.order_id.totalAfterDiscount,
        totalTax: formattedReservation.order_id.totalTax,
        totalServiceFee: formattedReservation.order_id.totalServiceFee,
        status: formattedReservation.order_id.status,
        paymentMethod: formattedReservation.order_id.paymentMethod
      };
    }

    res.json({
      success: true,
      data: formattedReservation
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

    // ✅ PERFORMANCE: Check cache first (30s TTL)
    const cacheKey = getReservationsCacheKey({ date, status, area_id, search, page, limit });
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // ========== FILTER UNTUK RESERVATIONS ==========
    const reservationFilter = {};

    if (status) {
      if (status === 'active') {
        reservationFilter.status = 'confirmed';
        reservationFilter.check_in_time = { $ne: null };
        reservationFilter.check_out_time = null;
      } else {
        reservationFilter.status = status;
      }
    }

    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        reservationFilter.reservation_date = {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lt: new Date(targetDate.setHours(23, 59, 59, 999))
        };
      }
    } else {
      const { startOfDay, endOfDay } = getTodayWIBRange();
      reservationFilter.reservation_date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    if (area_id) {
      reservationFilter.area_id = area_id;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      reservationFilter.$or = [
        { reservation_code: searchRegex },
        { 'created_by.employee_name': searchRegex }
      ];
    }

    // Get reservations
    const total = await Reservation.countDocuments(reservationFilter);

    const reservations = await Reservation.find(reservationFilter)
      .populate('area_id', 'area_name area_code capacity')
      .populate('table_id', 'table_number seats')
      .populate({
        path: 'order_id',
        select: '_id order_id grandTotal status user items customAmountItems totalCustomAmount'
      })
      .populate('created_by.employee_id', 'username')
      .populate('checked_in_by.employee_id', 'username')
      .populate('checked_out_by.employee_id', 'username')
      .sort({ reservation_date: 1, reservation_time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // ✅ Format reservations dengan custom amount items
    const formattedReservations = reservations.map(reservation => {
      const resObj = reservation.toObject();

      let guestName = 'Tamu';
      if (resObj.order_id && typeof resObj.order_id === 'object') {
        guestName = resObj.order_id.user || 'Tamu';

        // ✅ Format order dengan custom amount items
        resObj.order_id = {
          _id: resObj.order_id._id,
          order_id: resObj.order_id.order_id,
          grandTotal: resObj.order_id.grandTotal,
          status: resObj.order_id.status,
          user: resObj.order_id.user,
          items: resObj.order_id.items || [],
          customAmountItems: resObj.order_id.customAmountItems || [],
          totalCustomAmount: resObj.order_id.totalCustomAmount || 0
        };
      }

      resObj.guest_name = guestName;

      return resObj;
    });

    // ========== FILTER UNTUK DINE-IN ORDERS ==========
    const orderFilter = {
      orderType: 'Dine-In'
    };

    if (status) {
      switch (status) {
        case 'pending':
          orderFilter.status = { $in: ['Pending', 'Waiting'] };
          break;
        case 'active':
          orderFilter.status = 'OnProcess';
          break;
        case 'completed':
          orderFilter.status = 'Completed';
          break;
        case 'cancelled':
          orderFilter.status = 'Canceled';
          break;
        default:
          break;
      }
    } else {
      orderFilter.status = { $nin: ['Canceled', 'Completed'] };
    }

    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        orderFilter.createdAt = {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lt: new Date(targetDate.setHours(23, 59, 59, 999))
        };
      }
    } else {
      const { startOfDay, endOfDay } = getTodayWIBRange();
      orderFilter.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      orderFilter.$or = [
        { order_id: searchRegex },
        { user: searchRegex }
      ];
    }

    // Get order IDs that already have reservations
    const reservedOrderIds = await Reservation.distinct('order_id', {
      order_id: { $ne: null }
    });

    orderFilter._id = { $nin: reservedOrderIds };

    // ✅ Query orders dengan custom amount items
    let dineInOrdersQuery = Order.find(orderFilter)
      .populate('cashierId', 'username')
      .populate('groId', 'username')
      .sort({ createdAt: -1 })
      .select('_id order_id orderType grandTotal status tableNumber type createdAt cashierId groId user items customAmountItems totalCustomAmount');

    const dineInOrders = await dineInOrdersQuery.lean();

    // Get table info manually if tableNumber exists
    const ordersWithTableInfo = await Promise.all(dineInOrders.map(async (order) => {
      let tableInfo = null;
      let areaInfo = null;

      if (order.tableNumber) {
        // ✅ FIX: Convert to uppercase to match Table model storage
        const tableNumberUpper = order.tableNumber.toUpperCase();

        const table = await Table.findOne({ table_number: tableNumberUpper })
          .populate('area_id', 'area_name area_code capacity')
          .lean();

        if (table) {
          tableInfo = {
            _id: table._id,
            table_number: table.table_number,
            seats: table.seats
          };
          areaInfo = table.area_id;

          console.log(`✅ Table found for order ${order.order_id}: ${table.table_number}, Area: ${areaInfo?.area_name}`);
        } else {
          console.log(`⚠️ Table NOT found for tableNumber: ${tableNumberUpper} (original: ${order.tableNumber})`);
        }
      } else {
        console.log(`⚠️ Order ${order.order_id} has no tableNumber`);
      }

      return {
        ...order,
        tableInfo,
        areaInfo
      };
    }));

    // Apply area filter to orders
    let filteredOrders = ordersWithTableInfo;
    if (area_id) {
      filteredOrders = ordersWithTableInfo.filter(order =>
        order.areaInfo && order.areaInfo._id.toString() === area_id
      );
    }

    // ✅ Transform dine-in orders dengan custom amount items
    const transformedOrders = filteredOrders.map(order => ({
      _id: order._id,
      type: 'dine-in-order',
      reservation_code: order.order_id,
      status: order.status,
      guest_name: order.user || 'Customer',
      guest_count: 1,
      reservation_date: order.createdAt,
      reservation_time: new Date(order.createdAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }),
      area_id: order.areaInfo,
      table_id: order.tableInfo ? [order.tableInfo] : [],
      order_id: {
        _id: order._id,
        order_id: order.order_id,
        grandTotal: order.grandTotal,
        status: order.status,
        user: order.user,
        items: order.items || [],
        customAmountItems: order.customAmountItems || [],
        totalCustomAmount: order.totalCustomAmount || 0
      },
      created_by: {
        employee_id: order.cashierId || order.groId,
        employee_name: (order.cashierId?.username || order.groId?.username || 'System'),
        timestamp: order.createdAt
      },
      notes: `Dine-In customer - ${order.user || 'Guest'}`,
      createdAt: order.createdAt
    }));

    // Filter manual berdasarkan search untuk dine-in orders
    let finalTransformedOrders = transformedOrders;
    if (search) {
      finalTransformedOrders = transformedOrders.filter(order =>
        order.guest_name.toLowerCase().includes(search.toLowerCase()) ||
        order.reservation_code.toLowerCase().includes(search.toLowerCase()) ||
        order.created_by.employee_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Combine and sort both datasets
    const combinedData = [...formattedReservations, ...finalTransformedOrders]
      .sort((a, b) => {
        const dateA = new Date(a.reservation_date || a.createdAt);
        const dateB = new Date(b.reservation_date || b.createdAt);
        return dateB - dateA;
      });

    // Apply pagination to combined data
    const paginatedData = combinedData.slice(skip, skip + parseInt(limit));
    const totalCombined = total + finalTransformedOrders.length;

    const responseData = {
      success: true,
      data: paginatedData,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalCombined / parseInt(limit)),
        total_records: totalCombined,
        reservations_count: reservations.length,
        dine_in_orders_count: finalTransformedOrders.length,
        limit: parseInt(limit)
      }
    };

    // ✅ PERFORMANCE: Cache the result (30s TTL)
    await setCache(cacheKey, responseData, 30);

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservations',
      error: error.message
    });
  }
};

// export const getOrderDetailById = async (req, res) => {
//   try {
//     const orderId = req.params.orderId;
//     if (!orderId) {
//       return res.status(400).json({ message: 'Order ID is required.' });
//     }
//     console.log('Fetching order with ID:', orderId);

//     // Cari pesanan dengan populate voucher dan tax details
//     const order = await Order.findById(orderId)
//       .populate('items.menuItem')
//       .populate('appliedVoucher')
//       .populate('taxAndServiceDetails');

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found.' });
//     }

//     // Cari pembayaran
//     const payment = await Payment.findOne({ order_id: order.order_id });

//     // Cari reservasi
//     const reservation = await Reservation.findOne({ order_id: orderId })
//       .populate('area_id')
//       .populate('table_id');

//     console.log('Payment:', payment);
//     console.log('Order:', orderId);
//     console.log('Reservation:', reservation);

//     // Format tanggal
//     const formatDate = (date) => {
//       const options = {
//         day: 'numeric',
//         month: 'long',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         timeZone: 'Asia/Jakarta'
//       };
//       return new Intl.DateTimeFormat('id-ID', options).format(new Date(date));
//     };

//     const formatReservationDate = (dateString) => {
//       const options = {
//         day: 'numeric',
//         month: 'long',
//         year: 'numeric',
//         timeZone: 'Asia/Jakarta'
//       };
//       return new Intl.DateTimeFormat('id-ID', options).format(new Date(dateString));
//     };

//     // ✅ Format items (menu items)
//     const formattedItems = order.items.map(item => {
//       const basePrice = item.price || item.menuItem?.price || 0;
//       const quantity = item.quantity || 1;

//       return {
//         menuItemId: item.menuItem?._id || item.menuItem || item._id,
//         name: item.menuItem?.name || item.name || 'Unknown Item',
//         price: basePrice,
//         quantity,
//         addons: item.addons || [],
//         toppings: item.toppings || [],
//         notes: item.notes,
//         outletId: item.outletId || null,
//         outletName: item.outletName || null,
//       };
//     });

//     // ✅ Format custom amount items
//     const formattedCustomAmountItems = (order.customAmountItems || []).map(item => ({
//       amount: item.amount || 0,
//       name: item.name || 'Penyesuaian Pembayaran',
//       description: item.description || '',
//       dineType: item.dineType || 'Dine-In',
//       appliedAt: item.appliedAt,
//       originalAmount: item.originalAmount || null,
//       discountApplied: item.discountApplied || 0
//     }));

//     // Generate order number
//     const generateOrderNumber = (orderId) => {
//       if (typeof orderId === 'string' && orderId.includes('ORD-')) {
//         const parts = orderId.split('-');
//         return parts.length > 2 ? `#${parts[parts.length - 1]}` : `#${orderId.slice(-4)}`;
//       }
//       return `#${orderId.toString().slice(-4)}`;
//     };

//     // Reservation data
//     let reservationData = null;
//     if (reservation) {
//       reservationData = {
//         _id: reservation._id.toString(),
//         reservationCode: reservation.reservation_code,
//         reservationDate: formatReservationDate(reservation.reservation_date),
//         reservationTime: reservation.reservation_time,
//         guestCount: reservation.guest_count,
//         status: reservation.status,
//         reservationType: reservation.reservation_type,
//         notes: reservation.notes,
//         area: {
//           _id: reservation.area_id?._id,
//           name: reservation.area_id?.area_name || 'Unknown Area'
//         },
//         tables: Array.isArray(reservation.table_id) ? reservation.table_id.map(table => ({
//           _id: table._id.toString(),
//           tableNumber: table.table_number || 'Unknown Table',
//           seats: table.seats,
//           tableType: table.table_type,
//           isAvailable: table.is_available,
//           isActive: table.is_active
//         })) : []
//       };
//     }

//     // Payment status logic
//     const paymentStatus = (() => {
//       if (
//         payment?.status === 'settlement' &&
//         payment?.paymentType === 'Down Payment' &&
//         payment?.remainingAmount !== 0
//       ) {
//         return 'partial';
//       } else if (
//         payment?.status === 'settlement' &&
//         payment?.paymentType === 'Down Payment' &&
//         payment?.remainingAmount == 0
//       ) {
//         return 'settlement';
//       }
//       return payment?.status || 'Unpaid';
//     })();

//     const totalAmountRemaining = await Payment.findOne({
//       order_id: order.order_id,
//       relatedPaymentId: { $ne: null },
//       status: { $in: ['pending', 'expire'] }
//     }).sort({ createdAt: -1 });

//     // Payment details
//     const paymentDetails = {
//       totalAmount: totalAmountRemaining?.amount || payment?.totalAmount || order.grandTotal || 0,
//       paidAmount: payment?.amount || 0,
//       remainingAmount: totalAmountRemaining?.totalAmount || payment?.remainingAmount || 0,
//       paymentType: payment?.paymentType || 'Full',
//       isDownPayment: payment?.paymentType === 'Down Payment',
//       downPaymentPaid: payment?.paymentType === 'Down Payment' && payment?.status === 'settlement',
//       method: payment
//         ? (payment?.permata_va_number || payment?.va_numbers?.[0]?.bank || payment?.method || 'Unknown').toUpperCase()
//         : 'Unknown',
//       status: paymentStatus,
//     };

//     // Format voucher data
//     let voucherData = null;
//     if (order.appliedVoucher && typeof order.appliedVoucher === 'object') {
//       if (order.appliedVoucher.code) {
//         voucherData = {
//           _id: order.appliedVoucher._id,
//           code: order.appliedVoucher.code,
//           name: order.appliedVoucher.name,
//           description: order.appliedVoucher.description,
//           discountAmount: order.appliedVoucher.discountAmount,
//           discountType: order.appliedVoucher.discountType,
//           validFrom: order.appliedVoucher.validFrom,
//           validTo: order.appliedVoucher.validTo,
//           quota: order.appliedVoucher.quota,
//           applicableOutlets: order.appliedVoucher.applicableOutlets || [],
//           customerType: order.appliedVoucher.customerType,
//           printOnReceipt: order.appliedVoucher.printOnReceipt || false,
//           isActive: order.appliedVoucher.isActive || true
//         };
//       }
//     }

//     // Format tax and service details
//     let taxAndServiceDetails = [];
//     if (order.taxAndServiceDetails && Array.isArray(order.taxAndServiceDetails)) {
//       taxAndServiceDetails = order.taxAndServiceDetails.map(tax => {
//         if (tax.type && tax.name) {
//           return {
//             _id: tax._id,
//             type: tax.type,
//             name: tax.name,
//             percentage: tax.percentage,
//             amount: tax.amount
//           };
//         }
//         return {
//           _id: tax._id || tax,
//           type: 'unknown',
//           name: 'Tax/Service',
//           percentage: 0,
//           amount: 0
//         };
//       });
//     }

//     const totalTax = order.totalTax || 0;

//     // ✅ Build orderData dengan custom amount items
//     const orderData = {
//       _id: order._id.toString(),
//       orderId: order.order_id || order._id.toString(),
//       orderNumber: generateOrderNumber(order.order_id || order._id),
//       orderDate: formatDate(order.createdAt),
//       items: formattedItems,
//       customAmountItems: formattedCustomAmountItems,
//       totalCustomAmount: order.totalCustomAmount || 0,
//       orderStatus: order.status,
//       paymentMethod: paymentDetails.method,
//       paymentStatus,
//       totalBeforeDiscount: order.totalBeforeDiscount || 0,
//       totalAfterDiscount: order.totalAfterDiscount || 0,
//       grandTotal: order.grandTotal || 0,
//       paymentDetails: paymentDetails,
//       voucher: voucherData,
//       taxAndServiceDetails: taxAndServiceDetails,
//       totalTax: totalTax,
//       reservation: reservationData,
//       dineInData: order.orderType === 'Dine-In' ? {
//         tableNumber: order.tableNumber,
//       } : null,
//       pickupData: order.orderType === 'Pickup' ? {
//         pickupTime: order.pickupTime,
//       } : null,
//       takeAwayData: order.orderType === 'Take Away' ? {
//         note: "Take Away order",
//       } : null,
//       deliveryData: order.orderType === 'Delivery' ? {
//         deliveryAddress: order.deliveryAddress,
//       } : null,
//     };

//     console.log('Order Data:', JSON.stringify(orderData, null, 2));
//     res.status(200).json({ orderData });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };

export const getOrderDetailById = async (req, res) => {
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

    // ✅ Format items (menu items)
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

    // ✅ Format custom amount items
    const formattedCustomAmountItems = (order.customAmountItems || []).map(item => ({
      amount: item.amount || 0,
      name: item.name || 'Penyesuaian Pembayaran',
      description: item.description || '',
      dineType: item.dineType || 'Dine-In',
      appliedAt: item.appliedAt,
      originalAmount: item.originalAmount || null,
      discountApplied: item.discountApplied || 0
    }));

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
      status: { $in: ['pending', 'expire'] }
    }).sort({ createdAt: -1 });

    // ✅ TAMBAHAN: Cek Final Payment (pending ATAU settlement)
    const finalPayment = await Payment.findOne({
      order_id: order.order_id,
      paymentType: 'Final Payment',
      status: { $in: ['pending', 'settlement', 'capture'] }
    }).sort({ updatedAt: -1 });  // Ambil yang terbaru

    const hasPendingFinalPayment = finalPayment?.status === 'pending';
    const isFinalPaymentSettled = ['settlement', 'capture'].includes(finalPayment?.status);

    console.log('Final Payment:', finalPayment ? `Found (${finalPayment.status})` : 'Not Found');

    // Payment details - ✅ DITAMBAHKAN finalPaymentDetails (supports both pending & settled)
    const paymentDetails = {
      totalAmount: totalAmountRemaining?.amount || payment?.totalAmount || order.grandTotal || 0,
      paidAmount: payment?.amount || 0,
      // ✅ FIX: remainingAmount = 0 jika Final Payment sudah settlement
      remainingAmount: isFinalPaymentSettled ? 0 : (totalAmountRemaining?.totalAmount || payment?.remainingAmount || 0),
      paymentType: payment?.paymentType || 'Full',
      isDownPayment: payment?.paymentType === 'Down Payment',
      downPaymentPaid: payment?.paymentType === 'Down Payment' && payment?.status === 'settlement',
      method: payment
        ? (payment?.permata_va_number || payment?.va_numbers?.[0]?.bank || payment?.method || 'Unknown').toUpperCase()
        : 'Unknown',
      // ✅ FIX: Status = settlement jika Final Payment sudah dibayar
      status: isFinalPaymentSettled ? 'settlement' : paymentStatus,
      hasPendingFinalPayment: hasPendingFinalPayment,  // true only if pending
      isFinalPaymentSettled: isFinalPaymentSettled,    // ✅ new flag
      // ✅ TAMBAHAN: Detail final payment (pending atau settlement)
      pendingFinalPaymentDetails: finalPayment ? {
        _id: finalPayment._id,
        amount: finalPayment.amount,
        method: finalPayment.method,
        status: finalPayment.status,
        actions: finalPayment.actions || [],  // QR CODE
        transaction_time: finalPayment.transaction_time,
        expiry_time: finalPayment.expiry_time,
      } : null,
    };

    // Format voucher data
    let voucherData = null;
    if (order.appliedVoucher && typeof order.appliedVoucher === 'object') {
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
      }
    }

    // Format tax and service details
    let taxAndServiceDetails = [];
    if (order.taxAndServiceDetails && Array.isArray(order.taxAndServiceDetails)) {
      taxAndServiceDetails = order.taxAndServiceDetails.map(tax => {
        if (tax.type && tax.name) {
          return {
            _id: tax._id,
            type: tax.type,
            name: tax.name,
            percentage: tax.percentage,
            amount: tax.amount
          };
        }
        return {
          _id: tax._id || tax,
          type: 'unknown',
          name: 'Tax/Service',
          percentage: 0,
          amount: 0
        };
      });
    }

    const totalTax = order.totalTax || 0;

    // ✅ Build orderData dengan custom amount items
    const orderData = {
      _id: order._id.toString(),
      orderId: order.order_id || order._id.toString(),
      orderNumber: generateOrderNumber(order.order_id || order._id),
      orderDate: formatDate(order.createdAt),
      items: formattedItems,
      customAmountItems: formattedCustomAmountItems,
      totalCustomAmount: order.totalCustomAmount || 0,
      orderStatus: order.status,
      paymentMethod: paymentDetails.method,
      paymentStatus,
      totalBeforeDiscount: order.totalBeforeDiscount || 0,
      totalAfterDiscount: order.totalAfterDiscount || 0,
      grandTotal: order.grandTotal || 0,
      paymentDetails: paymentDetails,
      voucher: voucherData,
      taxAndServiceDetails: taxAndServiceDetails,
      totalTax: totalTax,
      reservation: reservationData,
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

// ✅ PUT /api/gro/reservations/:id/edit - Edit reservation details and menu
export const editReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const {
      guest_name,
      guest_phone,
      guest_count,
      reservation_date,
      reservation_time,
      table_ids,
      area_id,
      notes,
      items = [], // Updated menu items
      customAmountItems = [], // Custom amount items
      voucherCode,
      serving_type,
      equipment = [],
      agenda,
      food_serving_option,
      food_serving_time,
      reservation_type
    } = req.body;

    const userId = req.user?.id;

    console.log('🔄 Editing reservation:', id);

    // Cari reservasi
    const reservation = await Reservation.findById(id)
      .populate('order_id')
      .session(session);

    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Reservasi tidak ditemukan'
      });
    }

    // ✅ VALIDASI: Hanya bisa edit jika belum dimulai (belum check-in)
    if (reservation.check_in_time) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat mengedit reservasi yang sudah dimulai (sudah check-in)'
      });
    }

    // ✅ VALIDASI: Hanya bisa edit jika status pending atau confirmed
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Tidak dapat mengedit reservasi dengan status ${reservation.status}`
      });
    }

    const employee = await User.findById(userId).select('username email');

    // ✅ UPDATE RESERVATION DATA
    if (guest_count !== undefined) reservation.guest_count = guest_count;
    if (reservation_date) reservation.reservation_date = new Date(reservation_date);
    if (reservation_time) reservation.reservation_time = reservation_time;
    if (area_id) reservation.area_id = area_id;
    if (table_ids && Array.isArray(table_ids)) reservation.table_id = table_ids;
    if (notes !== undefined) reservation.notes = notes;
    if (reservation_type) reservation.reservation_type = reservation_type;
    if (serving_type !== undefined) reservation.serving_food = serving_type === 'buffet' || serving_type === 'ala carte';
    if (equipment) reservation.equipment = equipment;
    if (agenda) reservation.agenda = agenda;
    if (food_serving_option) reservation.food_serving_option = food_serving_option;
    if (food_serving_time) reservation.food_serving_time = new Date(food_serving_time);

    // Tambahkan log edit
    const editNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Reservasi diedit oleh GRO: ${employee?.username || 'Unknown'}`;
    reservation.notes = (reservation.notes || '') + editNote;
    reservation.updatedAtWIB = getWIBNow();

    await reservation.save({ session });

    // ✅ UPDATE ORDER (Menu Items & Custom Amounts)
    if (reservation.order_id) {
      const order = await Order.findById(reservation.order_id).session(session);

      if (order) {
        // Process menu items
        const orderItems = [];
        if (items && items.length > 0) {
          for (const item of items) {
            const menuItem = await MenuItem.findById(item.productId);
            if (!menuItem) {
              await session.abortTransaction();
              return res.status(404).json({
                success: false,
                message: `Menu item tidak ditemukan: ${item.productId}`
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

        // ✅ Update order items
        order.items = orderItems;

        // ✅ Update custom amount items
        order.customAmountItems = customAmountItems.map(item => ({
          amount: item.amount || 0,
          name: item.name || 'Penyesuaian Pembayaran',
          description: item.description || '',
          dineType: item.dineType || 'Dine-In',
          appliedAt: getWIBNow(),
          originalAmount: item.originalAmount || null,
          discountApplied: item.discountApplied || 0
        }));

        // ✅ Recalculate totals
        let totalBeforeDiscount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

        // Add custom amounts to subtotal
        const totalCustomAmount = order.customAmountItems.reduce((sum, item) => sum + item.amount, 0);
        totalBeforeDiscount += totalCustomAmount;
        order.totalCustomAmount = totalCustomAmount;

        let totalAfterDiscount = totalBeforeDiscount;
        let voucherDiscount = 0;

        // Apply voucher if provided
        if (voucherCode) {
          const voucher = await Voucher.findOne({ code: voucherCode, isActive: true });
          if (voucher) {
            order.appliedVoucher = voucher._id;
            if (voucher.discountType === 'percentage') {
              voucherDiscount = totalBeforeDiscount * (voucher.discountAmount / 100);
            } else {
              voucherDiscount = voucher.discountAmount;
            }
            totalAfterDiscount = Math.max(0, totalBeforeDiscount - voucherDiscount);
          }
        }

        order.discounts = {
          autoPromoDiscount: 0,
          manualDiscount: 0,
          voucherDiscount: voucherDiscount
        };

        // Recalculate tax and service
        const taxServiceCalculation = await calculateTaxAndService(
          totalAfterDiscount,
          order.outlet,
          true,
          false
        );

        order.taxAndServiceDetails = taxServiceCalculation.taxAndServiceDetails;
        order.totalTax = taxServiceCalculation.totalTax;
        order.totalServiceFee = taxServiceCalculation.totalServiceFee;

        order.totalBeforeDiscount = totalBeforeDiscount;
        order.totalAfterDiscount = totalAfterDiscount;
        order.grandTotal = totalAfterDiscount + taxServiceCalculation.totalTax + taxServiceCalculation.totalServiceFee;

        // Update guest info if changed
        if (guest_name) order.user = guest_name;

        // Add edit note
        const orderEditNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Menu diedit oleh GRO: ${employee?.username || 'Unknown'}`;
        order.notes = (order.notes || '') + orderEditNote;
        order.updatedAtWIB = getWIBNow();

        await order.save({ session });

        // ✅ FIX: Update related Payment records when order totals change
        const existingPayments = await Payment.find({
          order_id: order.order_id
        }).session(session);

        if (existingPayments.length > 0) {
          for (const payment of existingPayments) {
            // Update totalAmount to reflect new grandTotal
            payment.totalAmount = order.grandTotal;

            // Recalculate remainingAmount based on payment type
            if (payment.paymentType === 'Down Payment') {
              // For DP, remaining = grandTotal - paid amount
              payment.remainingAmount = Math.max(0, order.grandTotal - payment.amount);
            } else if (payment.paymentType === 'Full') {
              // Full payment should match grandTotal
              payment.amount = order.grandTotal;
              payment.remainingAmount = 0;
            }
            // For Final Payment, don't modify - it's a separate payment for remaining balance

            await payment.save({ session });
          }

          console.log(`✅ Updated ${existingPayments.length} payment record(s) with new totals`);
        }

        console.log('✅ Order updated:', {
          orderId: order.order_id,
          items: orderItems.length,
          customAmounts: order.customAmountItems.length,
          totalBeforeDiscount,
          totalAfterDiscount,
          grandTotal: order.grandTotal
        });
      }
    }

    await session.commitTransaction();

    // Get updated data
    const updatedReservation = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code capacity')
      .populate('table_id', 'table_number seats table_type')
      .populate({
        path: 'order_id',
        populate: {
          path: 'items.menuItem',
          select: 'name price imageURL category'
        }
      });

    // Emit socket event
    if (typeof io !== 'undefined' && io) {
      io.to('gro_room').emit('reservation_updated', {
        reservation: updatedReservation,
        updatedBy: employee?.username || 'Unknown',
        timestamp: getWIBNow()
      });
    }

    console.log('✅ Reservation edited successfully:', id);

    res.json({
      success: true,
      message: 'Reservasi berhasil diperbarui',
      data: updatedReservation
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error editing reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengedit reservasi',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// export const getReservations = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       status,
//       date,
//       area_id,
//       search
//     } = req.query;

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // ========== FILTER UNTUK RESERVATIONS ==========
//     const reservationFilter = {};

//     if (status) {
//       if (status === 'active') {
//         reservationFilter.status = 'confirmed';
//         reservationFilter.check_in_time = { $ne: null };
//         reservationFilter.check_out_time = null;
//       } else {
//         reservationFilter.status = status;
//       }
//     }

//     if (date) {
//       const targetDate = new Date(date);
//       if (!isNaN(targetDate.getTime())) {
//         reservationFilter.reservation_date = {
//           $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
//           $lt: new Date(targetDate.setHours(23, 59, 59, 999))
//         };
//       }
//     } else {
//       const { startOfDay, endOfDay } = getTodayWIBRange();
//       reservationFilter.reservation_date = {
//         $gte: startOfDay,
//         $lte: endOfDay
//       };
//     }

//     if (area_id) {
//       reservationFilter.area_id = area_id;
//     }

//     // ✅ PERBAIKAN: Search untuk reservations - hanya field string
//     if (search) {
//       const searchRegex = { $regex: search, $options: 'i' };
//       reservationFilter.$or = [
//         { reservation_code: searchRegex },
//         { 'created_by.employee_name': searchRegex }
//         // Hapus pencarian di field object/array yang bukan string
//       ];
//     }

//     // Get reservations
//     const total = await Reservation.countDocuments(reservationFilter);

//     const reservations = await Reservation.find(reservationFilter)
//       .populate('area_id', 'area_name area_code capacity')
//       .populate('table_id', 'table_number seats')
//       .populate({
//         path: 'order_id',
//         select: '_id order_id grandTotal status user'
//       })
//       .populate('created_by.employee_id', 'username')
//       .populate('checked_in_by.employee_id', 'username')
//       .populate('checked_out_by.employee_id', 'username')
//       .sort({ reservation_date: 1, reservation_time: 1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     // ✅ Format reservations untuk konsistensi
//     const formattedReservations = reservations.map(reservation => {
//       const resObj = reservation.toObject();

//       // Jika order_id populated, ambil user dari order
//       let guestName = 'Tamu';
//       if (resObj.order_id && typeof resObj.order_id === 'object') {
//         guestName = resObj.order_id.user || 'Tamu';

//         resObj.order_id = {
//           _id: resObj.order_id._id,
//           order_id: resObj.order_id.order_id,
//           grandTotal: resObj.order_id.grandTotal,
//           status: resObj.order_id.status,
//           user: resObj.order_id.user
//         };
//       }

//       // ✅ Tambahkan guest_name dari order.user
//       resObj.guest_name = guestName;

//       return resObj;
//     });

//     // ========== FILTER UNTUK DINE-IN ORDERS ==========
//     const orderFilter = {
//       orderType: 'Dine-In'
//     };

//     if (status) {
//       switch (status) {
//         case 'pending':
//           orderFilter.status = { $in: ['Pending', 'Waiting'] };
//           break;
//         case 'active':
//           orderFilter.status = 'OnProcess';
//           break;
//         case 'completed':
//           orderFilter.status = 'Completed';
//           break;
//         case 'cancelled':
//           orderFilter.status = 'Canceled';
//           break;
//         default:
//           break;
//       }
//     } else {
//       orderFilter.status = { $nin: ['Canceled', 'Completed'] };
//     }

//     // Apply date filter to orders
//     if (date) {
//       const targetDate = new Date(date);
//       if (!isNaN(targetDate.getTime())) {
//         orderFilter.createdAt = {
//           $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
//           $lt: new Date(targetDate.setHours(23, 59, 59, 999))
//         };
//       }
//     } else {
//       const { startOfDay, endOfDay } = getTodayWIBRange();
//       orderFilter.createdAt = {
//         $gte: startOfDay,
//         $lte: endOfDay
//       };
//     }

//     // ✅ PERBAIKAN: Search untuk dine-in orders - hanya field string
//     if (search) {
//       const searchRegex = { $regex: search, $options: 'i' };
//       orderFilter.$or = [
//         { order_id: searchRegex },
//         { user: searchRegex }
//         // Hapus groId dari search karena itu ObjectId, bukan string
//       ];
//     }

//     // Get order IDs that already have reservations
//     const reservedOrderIds = await Reservation.distinct('order_id', {
//       order_id: { $ne: null }
//     });

//     // Exclude orders that already have reservations
//     orderFilter._id = { $nin: reservedOrderIds };

//     // Query orders
//     let dineInOrdersQuery = Order.find(orderFilter)
//       .populate('cashierId', 'username')
//       .populate('groId', 'username')
//       .sort({ createdAt: -1 })
//       .select('_id order_id orderType grandTotal status tableNumber type createdAt cashierId groId user');

//     const dineInOrders = await dineInOrdersQuery.lean();

//     // Get table info manually if tableNumber exists
//     const ordersWithTableInfo = await Promise.all(dineInOrders.map(async (order) => {
//       let tableInfo = null;
//       let areaInfo = null;

//       if (order.tableNumber) {
//         const table = await Table.findOne({ table_number: order.tableNumber })
//           .populate('area_id', 'area_name area_code capacity')
//           .lean();

//         if (table) {
//           tableInfo = {
//             _id: table._id,
//             table_number: table.table_number,
//             seats: table.seats
//           };
//           areaInfo = table.area_id;
//         }
//       }

//       return {
//         ...order,
//         tableInfo,
//         areaInfo
//       };
//     }));

//     // Apply area filter to orders (after getting area info)
//     let filteredOrders = ordersWithTableInfo;
//     if (area_id) {
//       filteredOrders = ordersWithTableInfo.filter(order =>
//         order.areaInfo && order.areaInfo._id.toString() === area_id
//       );
//     }

//     // Transform dine-in orders to match reservation structure
//     const transformedOrders = filteredOrders.map(order => ({
//       _id: order._id,
//       type: 'dine-in-order',
//       reservation_code: order.order_id,
//       status: order.status,
//       guest_name: order.user || 'Customer',
//       guest_count: 1,
//       reservation_date: order.createdAt,
//       reservation_time: new Date(order.createdAt).toLocaleTimeString('id-ID', {
//         hour: '2-digit',
//         minute: '2-digit',
//         timeZone: 'Asia/Jakarta'
//       }),
//       area_id: order.areaInfo,
//       table_id: order.tableInfo ? [order.tableInfo] : [],
//       order_id: {
//         _id: order._id,
//         order_id: order.order_id,
//         grandTotal: order.grandTotal,
//         status: order.status,
//         user: order.user
//       },
//       created_by: {
//         employee_id: order.cashierId || order.groId,
//         employee_name: (order.cashierId?.username || order.groId?.username || 'System'),
//         timestamp: order.createdAt
//       },
//       notes: `Dine-In customer - ${order.user || 'Guest'}`,
//       createdAt: order.createdAt
//     }));

//     // ✅ PERBAIKAN: Filter manual berdasarkan search untuk dine-in orders
//     let finalTransformedOrders = transformedOrders;
//     if (search) {
//       finalTransformedOrders = transformedOrders.filter(order =>
//         order.guest_name.toLowerCase().includes(search.toLowerCase()) ||
//         order.reservation_code.toLowerCase().includes(search.toLowerCase()) ||
//         order.created_by.employee_name.toLowerCase().includes(search.toLowerCase())
//       );
//     }

//     // Combine and sort both datasets
//     const combinedData = [...formattedReservations, ...finalTransformedOrders]
//       .sort((a, b) => {
//         const dateA = new Date(a.reservation_date || a.createdAt);
//         const dateB = new Date(b.reservation_date || b.createdAt);
//         return dateB - dateA;
//       });

//     // Apply pagination to combined data
//     const paginatedData = combinedData.slice(skip, skip + parseInt(limit));
//     const totalCombined = total + finalTransformedOrders.length;

//     res.json({
//       success: true,
//       data: paginatedData,
//       pagination: {
//         current_page: parseInt(page),
//         total_pages: Math.ceil(totalCombined / parseInt(limit)),
//         total_records: totalCombined,
//         reservations_count: reservations.length,
//         dine_in_orders_count: finalTransformedOrders.length,
//         limit: parseInt(limit)
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching reservations:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching reservations',
//       error: error.message
//     });
//   }
// };

// export const getOrderDetailById = async (req, res) => {
//   try {
//     const orderId = req.params.orderId;
//     if (!orderId) {
//       return res.status(400).json({ message: 'Order ID is required.' });
//     }
//     console.log('Fetching order with ID:', orderId);

//     // Cari pesanan dengan populate voucher dan tax details
//     const order = await Order.findById(orderId)
//       .populate('items.menuItem')
//       .populate('appliedVoucher')
//       .populate('taxAndServiceDetails');
//     if (!order) {
//       return res.status(404).json({ message: 'Order not found.' });
//     }

//     // Cari pembayaran
//     const payment = await Payment.findOne({ order_id: order.order_id });


//     // Cari reservasi
//     const reservation = await Reservation.findOne({ order_id: orderId })
//       .populate('area_id')
//       .populate('table_id');

//     console.log('Payment:', payment);
//     console.log('Order:', orderId);
//     console.log('Reservation:', reservation);
//     console.log('controller yang digunakan masih dari groController');

//     // Format tanggal
//     const formatDate = (date) => {
//       const options = {
//         day: 'numeric',
//         month: 'long',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         timeZone: 'Asia/Jakarta'
//       };
//       return new Intl.DateTimeFormat('id-ID', options).format(new Date(date));
//     };

//     const formatReservationDate = (dateString) => {
//       const options = {
//         day: 'numeric',
//         month: 'long',
//         year: 'numeric',
//         timeZone: 'Asia/Jakarta'
//       };
//       return new Intl.DateTimeFormat('id-ID', options).format(new Date(dateString));
//     };

//     // Format items
//     const formattedItems = order.items.map(item => {
//       const basePrice = item.price || item.menuItem?.price || 0;
//       const quantity = item.quantity || 1;

//       return {
//         menuItemId: item.menuItem?._id || item.menuItem || item._id,
//         name: item.menuItem?.name || item.name || 'Unknown Item',
//         price: basePrice,
//         quantity,
//         addons: item.addons || [],
//         toppings: item.toppings || [],
//         notes: item.notes,
//         outletId: item.outletId || null,
//         outletName: item.outletName || null,
//       };
//     });

//     // Generate order number
//     const generateOrderNumber = (orderId) => {
//       if (typeof orderId === 'string' && orderId.includes('ORD-')) {
//         const parts = orderId.split('-');
//         return parts.length > 2 ? `#${parts[parts.length - 1]}` : `#${orderId.slice(-4)}`;
//       }
//       return `#${orderId.toString().slice(-4)}`;
//     };

//     // Reservation data
//     let reservationData = null;
//     if (reservation) {
//       reservationData = {
//         _id: reservation._id.toString(),
//         reservationCode: reservation.reservation_code,
//         reservationDate: formatReservationDate(reservation.reservation_date),
//         reservationTime: reservation.reservation_time,
//         guestCount: reservation.guest_count,
//         status: reservation.status,
//         reservationType: reservation.reservation_type,
//         notes: reservation.notes,
//         area: {
//           _id: reservation.area_id?._id,
//           name: reservation.area_id?.area_name || 'Unknown Area'
//         },
//         tables: Array.isArray(reservation.table_id) ? reservation.table_id.map(table => ({
//           _id: table._id.toString(),
//           tableNumber: table.table_number || 'Unknown Table',
//           seats: table.seats,
//           tableType: table.table_type,
//           isAvailable: table.is_available,
//           isActive: table.is_active
//         })) : []
//       };
//     }

//     console.log("orderType:", order.orderType);
//     console.log('Tables detail:', JSON.stringify(reservationData?.tables || [], null, 2));
//     console.log("Dine In Data:", order.orderType === 'Dine-In' ? { tableNumber: order.tableNumber } : 'N/A');
//     console.log("Pickup Data:", order.orderType === 'Pickup' ? { pickupTime: order.pickupTime } : 'N/A');
//     console.log("Delivery Data:", order.orderType === 'Delivery' ? { deliveryAddress: order.deliveryAddress } : 'N/A');
//     console.log("Take Away Data:", order.orderType === 'Take Away' ? { note: "Take Away order" } : 'N/A');
//     console.log("Ini adalah data order di getORderById:", order)

//     // Payment status logic
//     const paymentStatus = (() => {
//       if (
//         payment?.status === 'settlement' &&
//         payment?.paymentType === 'Down Payment' &&
//         payment?.remainingAmount !== 0
//       ) {
//         return 'partial';
//       } else if (
//         payment?.status === 'settlement' &&
//         payment?.paymentType === 'Down Payment' &&
//         payment?.remainingAmount == 0
//       ) {
//         return 'settlement';
//       }
//       return payment?.status || 'Unpaid';
//     })();

//     const totalAmountRemaining = await Payment.findOne({
//       order_id: order.order_id,
//       relatedPaymentId: { $ne: null },
//       status: { $in: ['pending', 'expire'] } // hanya update yang belum settlement
//     }).sort({ createdAt: -1 });

//     console.log('Total Amount Remaining:', totalAmountRemaining);
//     console.log('Total Amount Remaining (amount):', totalAmountRemaining?.amount || 'N/A');

//     //  TAMBAHAN: Payment details untuk down payment
//     const paymentDetails = {
//       totalAmount: totalAmountRemaining?.amount || payment?.totalAmount || order.grandTotal || 0,
//       paidAmount: payment?.amount || 0,
//       remainingAmount: totalAmountRemaining?.totalAmount || payment?.remainingAmount || 0,
//       paymentType: payment?.paymentType || 'Full',
//       isDownPayment: payment?.paymentType === 'Down Payment',
//       downPaymentPaid: payment?.paymentType === 'Down Payment' && payment?.status === 'settlement',
//       method: payment
//         ? (payment?.permata_va_number || payment?.va_numbers?.[0]?.bank || payment?.method || 'Unknown').toUpperCase()
//         : 'Unknown',
//       status: paymentStatus,
//     };

//     //  DEBUG: Log semua data order untuk melihat struktur sebenarnya
//     console.log('=== DEBUGGING ORDER DATA ===');
//     console.log('Order keys:', Object.keys(order.toObject()));
//     console.log('Applied Voucher:', JSON.stringify(order.appliedVoucher, null, 2));
//     console.log('Tax And Service Details:', JSON.stringify(order.taxAndServiceDetails, null, 2));
//     console.log('Discounts:', JSON.stringify(order.discounts, null, 2));
//     console.log('Applied Promos:', order.appliedPromos);
//     console.log('Applied Manual Promo:', order.appliedManualPromo);
//     console.log('Total Tax:', order.totalTax);
//     console.log('============================');

//     //  TAMBAHAN: Format voucher data - sekarang sudah ter-populate
//     let voucherData = null;

//     if (order.appliedVoucher && typeof order.appliedVoucher === 'object') {
//       // Jika sudah ter-populate, ambil data langsung
//       if (order.appliedVoucher.code) {
//         voucherData = {
//           _id: order.appliedVoucher._id,
//           code: order.appliedVoucher.code,
//           name: order.appliedVoucher.name,
//           description: order.appliedVoucher.description,
//           discountAmount: order.appliedVoucher.discountAmount,
//           discountType: order.appliedVoucher.discountType,
//           validFrom: order.appliedVoucher.validFrom,
//           validTo: order.appliedVoucher.validTo,
//           quota: order.appliedVoucher.quota,
//           applicableOutlets: order.appliedVoucher.applicableOutlets || [],
//           customerType: order.appliedVoucher.customerType,
//           printOnReceipt: order.appliedVoucher.printOnReceipt || false,
//           isActive: order.appliedVoucher.isActive || true
//         };
//       } else {
//         // Jika hanya ObjectId, coba manual query
//         console.log('Voucher not populated, trying manual query for ID:', order.appliedVoucher._id);
//         try {
//           // Assumsi Anda punya model Voucher
//           const Voucher = require('../models/Voucher'); // sesuaikan path model
//           const voucherDetails = await Voucher.findById(order.appliedVoucher._id || order.appliedVoucher);
//           if (voucherDetails) {
//             voucherData = {
//               _id: voucherDetails._id,
//               code: voucherDetails.code,
//               name: voucherDetails.name,
//               description: voucherDetails.description,
//               discountAmount: voucherDetails.discountAmount,
//               discountType: voucherDetails.discountType,
//               validFrom: voucherDetails.validFrom,
//               validTo: voucherDetails.validTo,
//               quota: voucherDetails.quota,
//               applicableOutlets: voucherDetails.applicableOutlets || [],
//               customerType: voucherDetails.customerType,
//               printOnReceipt: voucherDetails.printOnReceipt || false,
//               isActive: voucherDetails.isActive || true
//             };
//           }
//         } catch (voucherError) {
//           console.log('Error fetching voucher details:', voucherError.message);
//         }
//       }
//     }

//     //  TAMBAHAN: Format tax and service details - sekarang sudah ter-populate  
//     let taxAndServiceDetails = [];

//     if (order.taxAndServiceDetails && Array.isArray(order.taxAndServiceDetails)) {
//       taxAndServiceDetails = order.taxAndServiceDetails.map(tax => {
//         // Jika tax adalah object dengan data lengkap
//         if (tax.type && tax.name) {
//           return {
//             _id: tax._id,
//             type: tax.type,
//             name: tax.name,
//             percentage: tax.percentage,
//             amount: tax.amount
//           };
//         }
//         // Jika tax hanya ObjectId, return minimal data
//         return {
//           _id: tax._id || tax,
//           type: 'unknown',
//           name: 'Tax/Service',
//           percentage: 0,
//           amount: 0
//         };
//       });
//     }

//     console.log('Formatted Voucher Data:', JSON.stringify(voucherData, null, 2));
//     console.log('Formatted Tax Data:', JSON.stringify(taxAndServiceDetails, null, 2));

//     // Calculate total tax amount
//     const totalTax = order.totalTax || 0;

//     // Build orderData
//     const orderData = {
//       _id: order._id.toString(),
//       orderId: order.order_id || order._id.toString(),
//       orderNumber: generateOrderNumber(order.order_id || order._id),
//       orderDate: formatDate(order.createdAt),
//       items: formattedItems,
//       orderStatus: order.status,
//       paymentMethod: paymentDetails.method,
//       paymentStatus,
//       totalBeforeDiscount: order.totalBeforeDiscount || 0,
//       totalAfterDiscount: order.totalAfterDiscount || 0,
//       grandTotal: order.grandTotal || 0,

//       //  TAMBAHAN: Detail pembayaran yang lebih lengkap
//       paymentDetails: paymentDetails,

//       //  TAMBAHAN: Data voucher
//       voucher: voucherData,

//       //  TAMBAHAN: Data tax dan service details
//       taxAndServiceDetails: taxAndServiceDetails,
//       totalTax: totalTax,

//       reservation: reservationData,

//       // Data untuk frontend
//       dineInData: order.orderType === 'Dine-In' ? {
//         tableNumber: order.tableNumber,
//       } : null,

//       pickupData: order.orderType === 'Pickup' ? {
//         pickupTime: order.pickupTime,
//       } : null,

//       takeAwayData: order.orderType === 'Take Away' ? {
//         note: "Take Away order",
//       } : null,

//       deliveryData: order.orderType === 'Delivery' ? {
//         deliveryAddress: order.deliveryAddress,
//       } : null,
//     };

//     console.log('Order Data:', JSON.stringify(orderData, null, 2));
//     res.status(200).json({ orderData });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };

// GET /api/orders/:orderId - Get order detail (FIXED - Proper 404 handling)
// export const getOrderDetail = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     console.log('Fetching order with ID:', orderId);

//     // Validate ObjectId format
//     if (!mongoose.Types.ObjectId.isValid(orderId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid order ID format'
//       });
//     }

//     const order = await Order.findById(orderId)
//       .populate('user_id', 'name phone email')
//       .populate({
//         path: 'items.menuItem',
//         select: 'name price imageURL category mainCategory'
//       })
//       .populate('reservation', 'reservation_code reservation_date reservation_time guest_count');

//     console.log('Order found:', order ? 'Yes' : 'No');

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // Format response dengan struktur yang konsisten
//     const formattedResponse = {
//       success: true,
//       data: {
//         _id: order._id,
//         order_id: order.order_id,
//         customerName: order.user_id?.name || order.user || 'Guest',
//         customerPhone: order.user_id?.phone || '',
//         customerEmail: order.user_id?.email || '',
//         tableNumber: order.tableNumber || 'N/A',
//         status: order.status,
//         orderType: order.orderType,
//         items: order.items.map(item => ({
//           _id: item._id,
//           menuItem: item.menuItem ? {
//             _id: item.menuItem._id,
//             name: item.menuItem.name,
//             price: item.menuItem.price,
//             imageURL: item.menuItem.imageURL,
//             category: item.menuItem.category,
//             mainCategory: item.menuItem.mainCategory
//           } : null,
//           quantity: item.quantity,
//           subtotal: item.subtotal,
//           addons: Array.isArray(item.addons) ? item.addons : [],
//           toppings: Array.isArray(item.toppings) ? item.toppings : [],
//           notes: item.notes || '',
//           kitchenStatus: item.kitchenStatus,
//           batchNumber: item.batchNumber
//         })),
//         customAmountItems: Array.isArray(order.customAmountItems)
//           ? order.customAmountItems.map(item => ({
//             _id: item._id,
//             amount: item.amount || 0,
//             name: item.name || 'Penyesuaian Pembayaran',
//             description: item.description || '',
//             dineType: item.dineType || 'Dine-In',
//             appliedAt: item.appliedAt,
//             originalAmount: item.originalAmount,
//             discountApplied: item.discountApplied || 0
//           }))
//           : [],
//         totalCustomAmount: order.totalCustomAmount || 0,
//         totalBeforeDiscount: order.totalBeforeDiscount || 0,
//         totalAfterDiscount: order.totalAfterDiscount || 0,
//         totalTax: order.totalTax || 0,
//         totalServiceFee: order.totalServiceFee || 0,
//         grandTotal: order.grandTotal || 0,
//         discounts: order.discounts || {},
//         appliedVoucher: order.appliedVoucher,
//         paymentMethod: order.paymentMethod,
//         isOpenBill: order.isOpenBill || false,
//         createdAt: order.createdAt,
//         createdAtWIB: order.createdAtWIB,
//         updatedAt: order.updatedAt,
//         updatedAtWIB: order.updatedAtWIB
//       }
//     };

//     console.log('Returning formatted response');
//     res.json(formattedResponse);

//   } catch (error) {
//     console.error('Error fetching order detail:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching order detail',
//       error: error.message
//     });
//   }
// };

// ✅ FIXED: Update order status ke Reserved saat konfirmasi
export const confirmReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user?.id; // Dari auth middleware

    console.log('Confirming reservation ID:', id, 'by user ID:', userId);

    const reservation = await Reservation.findById(id).session(session);
    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot confirm cancelled reservation'
      });
    }

    if (reservation.status === 'completed') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Reservation already completed'
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    // Update reservation status
    reservation.status = 'confirmed';
    reservation.confirm_by = {
      employee_id: userId,
      employee_name: employee?.username || 'Unknown',
      confirmed_at: getWIBNow()
    };

    await reservation.save({ session });

    // ✅ PERBAIKAN: Update order status ke Reserved jika ada order terkait
    if (reservation.order_id) {
      const order = await Order.findById(reservation.order_id).session(session);

      if (order) {
        // Update status order menjadi Reserved
        order.status = 'Reserved';
        order.updatedAtWIB = getWIBNow();

        // Tambahkan log ke notes
        const confirmNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Reservasi dikonfirmasi oleh GRO: ${employee?.username || 'Unknown'}`;
        order.notes = (order.notes || '') + confirmNote;

        await order.save({ session });

        console.log('✅ Order status updated to Reserved:', order.order_id);

        // Emit socket event untuk order status update
        if (typeof io !== 'undefined' && io) {
          io.to('cashier_room').emit('order_status_updated', {
            orderId: order._id,
            order_id: order.order_id,
            status: 'Reserved',
            updatedBy: employee?.username || 'GRO',
            timestamp: getWIBNow()
          });

          io.to('gro_room').emit('order_status_updated', {
            orderId: order._id,
            order_id: order.order_id,
            status: 'Reserved',
            updatedBy: employee?.username || 'GRO',
            timestamp: getWIBNow()
          });
        }
      }
    }

    await session.commitTransaction();

    // Ambil data lengkap untuk response
    const updated = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .populate('confirm_by.employee_id', 'username')
      .populate({
        path: 'order_id',
        select: 'order_id status grandTotal'
      });

    // Emit socket event untuk reservation update
    if (typeof io !== 'undefined' && io) {
      io.to('gro_room').emit('reservation_confirmed', {
        reservation: updated,
        confirmedBy: employee?.username || 'Unknown',
        timestamp: getWIBNow()
      });
    }

    console.log('✅ Reservation confirmed successfully:', id);

    res.json({
      success: true,
      message: 'Reservation confirmed successfully',
      data: updated
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error confirming reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming reservation',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};
// PUT /api/gro/reservations/:id/check-in - Check-in reservation
// ✅ FIXED: PUT /api/gro/reservations/:id/check-in
// Update order status ke OnProcess saat check-in
export const checkInReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log('Checking in reservation ID:', id, 'by user ID:', userId);

    const reservation = await Reservation.findById(id).session(session);
    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot check-in cancelled reservation'
      });
    }

    if (reservation.check_in_time) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Reservation already checked in'
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    // Update reservation
    reservation.check_in_time = getWIBNow();
    reservation.checked_in_by = {
      employee_id: userId,
      employee_name: employee?.username || 'Unknown',
      checked_in_at: getWIBNow()
    };
    reservation.status = 'confirmed';

    await reservation.save({ session });

    // ✅ PERBAIKAN: Update order status ke OnProcess jika ada order terkait
    if (reservation.order_id) {
      const order = await Order.findById(reservation.order_id).session(session);

      if (order) {
        // Update status order menjadi OnProcess (sedang berlangsung)
        order.status = 'OnProcess';
        order.updatedAtWIB = getWIBNow();

        // Tambahkan log ke notes
        const checkInNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Customer check-in oleh GRO: ${employee?.username || 'Unknown'}`;
        order.notes = (order.notes || '') + checkInNote;

        await order.save({ session });

        console.log('✅ Order status updated to OnProcess:', order.order_id);

        // Emit socket event untuk order status update
        if (typeof io !== 'undefined' && io) {
          io.to('cashier_room').emit('order_status_updated', {
            orderId: order._id,
            order_id: order.order_id,
            status: 'OnProcess',
            updatedBy: employee?.username || 'GRO',
            timestamp: getWIBNow()
          });

          io.to('gro_room').emit('order_status_updated', {
            orderId: order._id,
            order_id: order.order_id,
            status: 'OnProcess',
            updatedBy: employee?.username || 'GRO',
            timestamp: getWIBNow()
          });
        }
      }
    }

    await session.commitTransaction();

    // Ambil data lengkap untuk response
    const updated = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .populate('checked_in_by.employee_id', 'username')
      .populate({
        path: 'order_id',
        select: 'order_id status grandTotal'
      });

    // Emit socket event untuk reservation update
    if (typeof io !== 'undefined' && io) {
      io.to('gro_room').emit('reservation_checked_in', {
        reservation: updated,
        checkedInBy: employee?.username || 'Unknown',
        timestamp: getWIBNow()
      });
    }

    console.log('✅ Reservation checked in successfully:', id);

    res.json({
      success: true,
      message: 'Reservation checked in successfully',
      data: updated
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error checking in reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking in reservation',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ✅ FIXED: PUT /api/gro/reservations/:id/check-out
// Update order status ke Completed saat check-out
export const checkOutReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log('Checking out reservation ID:', id, 'by user ID:', userId);

    const reservation = await Reservation.findById(id).session(session);
    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (!reservation.check_in_time) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot check-out before check-in'
      });
    }

    if (reservation.check_out_time) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Reservation already checked out'
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    // Update reservation
    reservation.check_out_time = getWIBNow();
    reservation.checked_out_by = {
      employee_id: userId,
      employee_name: employee?.username || 'Unknown',
      checked_out_at: getWIBNow()
    };

    await reservation.save({ session });

    // ✅ PERBAIKAN: Update order status ke Completed jika ada order terkait
    if (reservation.order_id) {
      const order = await Order.findById(reservation.order_id).session(session);

      if (order) {
        // Update status order menjadi Completed
        order.status = 'Completed';
        order.updatedAtWIB = getWIBNow();

        // Tambahkan log ke notes
        const checkOutNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Customer check-out oleh GRO: ${employee?.username || 'Unknown'}`;
        order.notes = (order.notes || '') + checkOutNote;

        await order.save({ session });

        console.log('✅ Order status updated to Completed:', order.order_id);

        // ✅ Free up table (set table status to available)
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
              notes: `Reservation ${reservation.reservation_code} checked out`,
              updatedAt: getWIBNow()
            });

            await table.save({ session });

            console.log('✅ Table freed:', order.tableNumber);

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

        // Emit socket event untuk order status update
        if (typeof io !== 'undefined' && io) {
          io.to('cashier_room').emit('order_status_updated', {
            orderId: order._id,
            order_id: order.order_id,
            status: 'Completed',
            updatedBy: employee?.username || 'GRO',
            timestamp: getWIBNow()
          });

          io.to('gro_room').emit('order_status_updated', {
            orderId: order._id,
            order_id: order.order_id,
            status: 'Completed',
            updatedBy: employee?.username || 'GRO',
            timestamp: getWIBNow()
          });
        }
      }
    }

    await session.commitTransaction();

    // Ambil data lengkap untuk response
    const updated = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .populate('checked_out_by.employee_id', 'username')
      .populate({
        path: 'order_id',
        select: 'order_id status grandTotal'
      });

    // Emit socket event untuk reservation update
    if (typeof io !== 'undefined' && io) {
      io.to('gro_room').emit('reservation_checked_out', {
        reservation: updated,
        checkedOutBy: employee?.username || 'Unknown',
        timestamp: getWIBNow()
      });
    }

    console.log('✅ Reservation checked out successfully:', id);

    res.json({
      success: true,
      message: 'Reservation checked out successfully',
      data: updated
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error checking out reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking out reservation',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};


// PUT /api/gro/reservations/:id/cancel - Cancel reservation
// ✅ FIXED: Now frees tables and emits socket for real-time updates
export const cancelReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    const reservation = await Reservation.findById(id).session(session);
    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'completed') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed reservation'
      });
    }

    if (reservation.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Reservation already cancelled'
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    // Update reservation status
    reservation.status = 'cancelled';
    if (reason) {
      reservation.notes = `Cancelled: ${reason}. ${reservation.notes || ''}`;
    }
    reservation.cancelled_by = {
      employee_id: userId,
      employee_name: employee?.username || 'Unknown',
      cancelled_at: getWIBNow()
    };
    await reservation.save({ session });

    // ✅ PERBAIKAN: Update order AND free tables
    let freedTables = [];
    if (reservation.order_id) {
      const order = await Order.findById(reservation.order_id).session(session);

      if (order) {
        // Update order status
        order.status = 'Canceled';
        order.updatedAtWIB = getWIBNow();

        // Add cancellation note
        const cancelNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Order dibatalkan: ${reason || 'No reason provided'}. By: ${employee?.username || 'Unknown'}`;
        order.notes = (order.notes || '') + cancelNote;

        await order.save({ session });

        // ✅ FREE UP TABLES
        if (order.tableNumber) {
          const table = await Table.findOne({
            table_number: order.tableNumber.toUpperCase()
          }).session(session);

          if (table && table.status === 'occupied') {
            table.status = 'available';
            table.is_available = true;
            table.updatedAt = new Date();

            if (!table.statusHistory) {
              table.statusHistory = [];
            }

            table.statusHistory.push({
              fromStatus: 'occupied',
              toStatus: 'available',
              updatedBy: employee?.username || 'GRO System',
              notes: `Order ${order.order_id} cancelled - table freed`,
              updatedAt: getWIBNow()
            });

            await table.save({ session });
            freedTables.push(order.tableNumber);

            console.log('✅ Table freed on cancel:', order.tableNumber);
          }
        }

        // ✅ EMIT SOCKET: Order status updated
        if (typeof io !== 'undefined' && io) {
          io.to('cashier_room').emit('order_status_updated', {
            orderId: order._id,
            order_id: order.order_id,
            status: 'Canceled',
            updatedBy: employee?.username || 'GRO',
            reason: reason || 'Reservation cancelled',
            timestamp: getWIBNow()
          });

          io.to('gro_room').emit('order_status_updated', {
            orderId: order._id,
            order_id: order.order_id,
            status: 'Canceled',
            updatedBy: employee?.username || 'GRO',
            reason: reason || 'Reservation cancelled',
            freedTables: freedTables,
            timestamp: getWIBNow()
          });

          // ✅ EMIT: Table status updated for real-time UI
          if (freedTables.length > 0) {
            io.emit('table_status_updated', {
              tables: freedTables,
              newStatus: 'available',
              reason: 'Order cancelled',
              updatedBy: employee?.username || 'GRO',
              timestamp: getWIBNow()
            });
          }
        }
      }
    }

    await session.commitTransaction();

    const updated = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats');

    // ✅ EMIT: Reservation cancelled
    if (typeof io !== 'undefined' && io) {
      io.to('gro_room').emit('reservation_cancelled', {
        reservation: updated,
        cancelledBy: employee?.username || 'Unknown',
        reason: reason,
        freedTables: freedTables,
        timestamp: getWIBNow()
      });
    }

    console.log('✅ Reservation cancelled successfully:', id, 'Tables freed:', freedTables);

    res.json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: updated,
      freedTables: freedTables
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error cancelling reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling reservation',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};



export const checkInDineInOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();


  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validasi order type
    if (order.orderType !== 'Dine-In' && order.orderType !== 'Reservation') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Only Dine-In or Reservation orders can be checked in'
      });
    }

    // Validasi status
    if (order.status !== 'Reserved') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot check-in order with status ${order.status}. Order must be Reserved.`
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    // Update order status ke OnProcess
    order.status = 'OnProcess';
    order.updatedAtWIB = getWIBNow();

    // Tambahkan log check-in
    const checkInNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Customer check-in oleh GRO: ${employee?.username || 'Unknown'}`;
    order.notes = (order.notes || '') + checkInNote;

    await order.save({ session });

    // Jika ada reservation terkait, update juga
    if (order.reservation) {
      const reservation = await Reservation.findById(order.reservation).session(session);
      if (reservation && !reservation.check_in_time) {
        reservation.check_in_time = getWIBNow();
        reservation.checked_in_by = {
          employee_id: userId,
          employee_name: employee?.username || 'Unknown',
          checked_in_at: getWIBNow()
        };
        await reservation.save({ session });
      }
    }

    await session.commitTransaction();

    // Emit socket events
    if (typeof io !== 'undefined' && io) {
      io.to('cashier_room').emit('order_status_updated', {
        orderId: order._id,
        order_id: order.order_id,
        status: 'OnProcess',
        updatedBy: employee?.username || 'GRO',
        timestamp: getWIBNow()
      });

      io.to('gro_room').emit('order_checked_in', {
        orderId: order._id,
        order_id: order.order_id,
        tableNumber: order.tableNumber,
        checkedInBy: employee?.username || 'GRO',
        timestamp: getWIBNow()
      });
    }

    console.log(`✅ Order ${order.order_id} checked in by GRO. Status: Reserved → OnProcess`);

    res.json({
      success: true,
      message: 'Customer berhasil check-in. Order sekarang sedang berlangsung.',
      data: {
        order: {
          id: order._id,
          order_id: order.order_id,
          status: order.status,
          tableNumber: order.tableNumber
        },
        checkedInBy: employee?.username || 'GRO',
        checkedInAt: getWIBNow()
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error checking in dine-in order:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking in dine-in order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ✅ PUT /api/gro/orders/:orderId/cancel
// Cancel dine-in order (Reserved → Canceled)
export const cancelDineInOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validasi order type
    if (order.orderType !== 'Dine-In' && order.orderType !== 'Reservation') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Only Dine-In or Reservation orders can be cancelled'
      });
    }

    // Cek jika order sudah completed
    if (order.status === 'Completed') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed order'
      });
    }

    // Cek jika order sudah canceled
    if (order.status === 'Canceled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username');

    // Update order status ke Canceled
    order.status = 'Canceled';
    order.updatedAtWIB = getWIBNow();

    // Tambahkan log pembatalan
    const cancelNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Order dibatalkan oleh GRO: ${employee?.username || 'Unknown'}${reason ? `\nAlasan: ${reason}` : ''}`;
    order.notes = (order.notes || '') + cancelNote;

    await order.save({ session });

    // Update table status ke available jika ada
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
          notes: `Order ${order.order_id} cancelled`,
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

    // Jika ada reservation terkait, update juga
    if (order.reservation) {
      const reservation = await Reservation.findById(order.reservation).session(session);
      if (reservation && reservation.status !== 'cancelled') {
        reservation.status = 'cancelled';
        if (reason) {
          reservation.notes = `Cancelled: ${reason}. ${reservation.notes || ''}`;
        }
        await reservation.save({ session });
      }
    }

    await session.commitTransaction();

    // Emit socket events
    if (typeof io !== 'undefined' && io) {
      io.to('cashier_room').emit('order_status_updated', {
        orderId: order._id,
        order_id: order.order_id,
        status: 'Canceled',
        updatedBy: employee?.username || 'GRO',
        timestamp: getWIBNow()
      });

      io.to('gro_room').emit('order_cancelled', {
        orderId: order._id,
        order_id: order.order_id,
        tableNumber: order.tableNumber,
        cancelledBy: employee?.username || 'GRO',
        reason: reason,
        timestamp: getWIBNow()
      });
    }

    console.log(`✅ Order ${order.order_id} cancelled by GRO. Table ${order.tableNumber} is now available.`);

    res.json({
      success: true,
      message: `Order berhasil dibatalkan.${order.tableNumber ? ` Meja ${order.tableNumber} sekarang tersedia.` : ''}`,
      data: {
        order: {
          id: order._id,
          order_id: order.order_id,
          status: order.status,
          tableNumber: order.tableNumber
        },
        cancelledBy: employee?.username || 'GRO',
        cancelledAt: getWIBNow(),
        reason: reason || 'No reason provided'
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error canceling dine-in order:', error);
    res.status(500).json({
      success: false,
      message: 'Error canceling dine-in order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// ✅ PUT /api/gro/orders/:orderId/dine-in/check-out
export const checkOutDineInOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    if (order.orderType !== 'Dine-In') {
      return res.status(400).json({
        success: false,
        message: 'Only Dine-In orders can be checked out'
      });
    }
    const employee = await User.findById(userId).select('username');
    const checkOutNote = `
[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Customer check-out oleh GRO: ${employee?.username || 'Unknown'}`;
    order.notes = (order.notes || '') + checkOutNote;
    await order.save();
    res.json({
      success: true,
      message: 'Customer berhasil check-out',
      data: order
    });
  } catch (error) {
    console.error('Error checking out dine-in order:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking out dine-in order',
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

export const getAllAvailableTables = async (req, res) => {
  try {
    const { outletId } = req.query;

    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID is required'
      });
    }

    // ✅ HAPUS FILTER WAKTU - Ambil semua order aktif
    const activeOrders = await Order.find({
      outlet: outletId,
      status: { $in: ['Pending', 'Waiting', 'OnProcess', 'Reserved'] },
      orderType: { $in: ['Dine-In', 'Reservation'] },
      tableNumber: { $exists: true, $ne: null, $ne: '' }
    }).select('tableNumber status orderType order_id user');

    const occupiedTableNumbers = new Set(
      activeOrders.map(order => order.tableNumber?.toUpperCase()).filter(Boolean)
    );

    // Ambil semua meja aktif
    const areas = await Area.find({ outlet_id: outletId }).select('_id');
    const areaIds = areas.map(area => area._id);

    const allTables = await Table.find({
      area_id: { $in: areaIds },
      is_active: true
    })
      .populate('area_id', 'area_name area_code')
      .sort({ area_id: 1, table_number: 1 });

    // Filter meja yang benar-benar tersedia
    const availableTables = allTables.filter(table => {
      const tableNumberUpper = table.table_number.toUpperCase();
      const isOccupiedByOrder = occupiedTableNumbers.has(tableNumberUpper);
      const isAvailableInDB = table.status === 'available';

      return !isOccupiedByOrder && isAvailableInDB;
    });

    // Format response
    const formattedTables = availableTables.map(table => ({
      _id: table._id,
      table_number: table.table_number,
      seats: table.seats,
      table_type: table.table_type,
      area: {
        _id: table.area_id._id,
        area_name: table.area_id.area_name,
        area_code: table.area_id.area_code
      },
      status: table.status,
      is_available: true
    }));

    // Group by area untuk kemudahan frontend
    const tablesByArea = {};
    formattedTables.forEach(table => {
      const areaName = table.area.area_name;
      if (!tablesByArea[areaName]) {
        tablesByArea[areaName] = [];
      }
      tablesByArea[areaName].push(table);
    });

    res.json({
      success: true,
      data: {
        tables: formattedTables,
        tablesByArea: tablesByArea,
        summary: {
          total_available: formattedTables.length,
          total_tables: allTables.length,
          occupied_tables: allTables.length - formattedTables.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching available tables:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available tables',
      error: error.message
    });
  }
};

export const getTableAvailability = async (req, res) => {
  try {
    const { date, time, area_id, outletId } = req.query;

    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID is required for table availability'
      });
    }

    const startTime = Date.now(); // ✅ PERFORMANCE: Track response time

    // ✅ PERFORMANCE: Check cache first (30s TTL - increased from 20s)
    const cacheKey = getTableAvailabilityCacheKey({ outletId, date, time, area_id });
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Tentukan tanggal target
    let targetDate;
    if (date) {
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
    } else {
      targetDate = new Date();
    }

    // Set range untuk hari yang dipilih (WIB timezone)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build reservation filter
    const reservationFilter = {
      reservation_date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['confirmed', 'pending'] }
    };

    if (time) {
      reservationFilter.reservation_time = time;
    }

    if (area_id) {
      reservationFilter.area_id = area_id;
    }

    // ✅ PERFORMANCE V2: Get areas first (fast query), then run ALL other queries in parallel
    // This allows Table query to be included in Promise.all
    const areasQuery = await Area.find({ outlet_id: outletId }).select('_id').lean();

    if (areasQuery.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No areas found for this outlet'
      });
    }

    // Build table filter BEFORE parallel queries
    const tableFilter = { is_active: true };
    if (area_id) {
      tableFilter.area_id = area_id;
    } else {
      tableFilter.area_id = { $in: areasQuery.map(area => area._id) };
    }

    // ✅ PERFORMANCE V2: ALL 4 queries now run in parallel (was 3+1 sequential)
    // Expected improvement: 30-50% faster response time
    const [reservations, activeOrders, allTables] = await Promise.all([
      // Query 1: Reservations
      Reservation.find(reservationFilter)
        .populate('table_id', 'table_number')
        .select('table_id reservation_date reservation_time status')
        .lean(),

      // Query 2: Active Orders
      Order.find({
        outlet: outletId,
        status: { $in: ['Pending', 'Waiting', 'OnProcess', 'Reserved'] },
        orderType: { $in: ['Dine-In', 'Reservation'] },
        tableNumber: { $exists: true, $ne: null, $ne: '' }
      }).select('tableNumber status orderType order_id user createdAtWIB updatedAtWIB').lean(),

      // Query 3: Tables (NOW IN PARALLEL - was sequential before!)
      Table.find(tableFilter)
        .populate('area_id', 'area_name area_code')
        .sort({ area_id: 1, table_number: 1 })
        .lean()
    ]);

    // ✅ PERBAIKAN: Gabungkan data occupancy dengan logic yang lebih baik
    const occupiedTableNumbers = new Set();
    const tableOccupancyInfo = {};

    // 1. Process reservations first
    reservations.forEach(reservation => {
      if (reservation.table_id && Array.isArray(reservation.table_id)) {
        reservation.table_id.forEach(table => {
          if (table && table.table_number) {
            const tableNum = table.table_number.toUpperCase();
            occupiedTableNumbers.add(tableNum);

            if (!tableOccupancyInfo[tableNum]) {
              tableOccupancyInfo[tableNum] = {
                by: 'reservation',
                reservation_id: reservation._id,
                status: reservation.status,
                type: 'reservation',
                time: reservation.reservation_time
              };
            }
          }
        });
      }
    });

    // 2. Process active orders (override reservations if conflict)
    activeOrders.forEach(order => {
      if (order.tableNumber) {
        const tableNum = order.tableNumber.toUpperCase();
        occupiedTableNumbers.add(tableNum);

        // Order takes precedence over reservation
        tableOccupancyInfo[tableNum] = {
          by: 'order',
          order_id: order.order_id,
          status: order.status,
          customer: order.user || 'Guest',
          since: order.createdAtWIB,
          type: order.orderType,
          lastUpdated: order.updatedAtWIB
        };
      }
    });

    // ✅ Tables already fetched in parallel query above (allTables variable)

    // ✅ PERBAIKAN: Deteksi inconsistencies dan format response
    const tablesWithStatus = [];
    const inconsistencies = [];
    const consistentTables = [];

    allTables.forEach(table => {
      const tableNumberUpper = table.table_number.toUpperCase();
      const isOccupiedInSystem = table.status === 'occupied';
      const hasActiveOrder = occupiedTableNumbers.has(tableNumberUpper);

      const occupancyInfo = tableOccupancyInfo[tableNumberUpper] || null;

      // Check consistency between table status and actual orders
      const statusConsistent = isOccupiedInSystem === hasActiveOrder;

      // Determine final availability status
      const finalIsAvailable = table.status === 'available' && !hasActiveOrder;

      // Deteksi inconsistencies untuk auto-repair
      if (!statusConsistent) {
        inconsistencies.push({
          table_number: table.table_number,
          area: table.area_id?.area_name,
          current_status: table.status,
          expected_status: hasActiveOrder ? 'occupied' : 'available',
          active_orders: activeOrders.filter(order =>
            order.tableNumber?.toUpperCase() === tableNumberUpper
          ).map(order => ({
            order_id: order.order_id,
            status: order.status,
            customer: order.user
          }))
        });
      } else {
        consistentTables.push({
          table_number: table.table_number,
          area: table.area_id?.area_name,
          status: table.status,
          consistent: true
        });
      }

      tablesWithStatus.push({
        _id: table._id,
        table_number: table.table_number,
        seats: table.seats,
        table_type: table.table_type,
        area: table.area_id,
        is_available: finalIsAvailable,
        is_active: table.is_active,
        status: table.status,
        occupancy_info: occupancyInfo,
        debug: {
          table_status: table.status,
          has_active_order: hasActiveOrder,
          status_consistent: statusConsistent,
          occupied_by: occupancyInfo?.by || 'none',
          final_calculation: `table:${table.status} + order:${hasActiveOrder} = available:${finalIsAvailable}`
        }
      });
    });

    // ✅ PERFORMANCE FIX: REMOVED blocking auto-repair from GET
    // Auto-repair sekarang TIDAK dijalankan di GET request untuk performa
    // Repair akan dijalankan via cron job terpisah (setiap 1-5 menit)
    // GET sekarang hanya READ-ONLY - tidak ada write operations

    // Log inconsistencies untuk monitoring (tanpa blocking repair)
    if (inconsistencies.length > 0) {
      console.log(`⚠️ Found ${inconsistencies.length} inconsistent tables (repair via cron job):`);
      inconsistencies.forEach(inc => {
        console.log(`   - ${inc.table_number}: ${inc.current_status} → should be ${inc.expected_status}`);
      });
    }

    // ✅ Hitung summary berdasarkan status final
    const availableTables = tablesWithStatus.filter(t => t.is_available);
    const occupiedTables = tablesWithStatus.filter(t => !t.is_available);

    const availableCount = availableTables.length;
    const occupiedCount = occupiedTables.length;

    // ✅ Hitung consistency metrics
    const consistentTablesCount = tablesWithStatus.filter(t => t.debug.status_consistent).length;
    const inconsistentTablesCount = tablesWithStatus.length - consistentTablesCount;

    const response = {
      success: true,
      data: {
        tables: tablesWithStatus,
        summary: {
          total: allTables.length,
          available: availableCount,
          occupied: occupiedCount,
          available_percentage: allTables.length > 0 ? ((availableCount / allTables.length) * 100).toFixed(1) : 0
        },
        consistency: {
          consistent_tables: consistentTablesCount,
          inconsistent_tables: inconsistentTablesCount,
          consistency_rate: allTables.length > 0 ? ((consistentTablesCount / allTables.length) * 100).toFixed(1) : 0
          // Note: Auto-repair removed for performance - runs via cron job instead
        },
        filters: {
          date: date || 'today',
          time: time || 'all',
          area_id: area_id || 'all',
          outletId: outletId
        },
        metadata: {
          total_reservations: reservations.length,
          total_active_orders: activeOrders.length,
          occupied_tables_count: occupiedTableNumbers.size,
          response_time_ms: Date.now() - startTime, // ✅ PERFORMANCE: Track response time
          date_range: {
            start: startOfDay,
            end: endOfDay
          }
        }
      }
    };

    console.log(`✅ Table availability fetched in ${Date.now() - startTime}ms`);
    console.log(`📊 Summary: ${availableCount} available, ${occupiedCount} occupied`);

    // ✅ PERFORMANCE: Cache the result (30s TTL - increased for faster response)
    await setCache(cacheKey, response, 30);

    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching table availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching table availability',
      error: error.message,
      debug: {
        outletId: req.query.outletId,
        timestamp: new Date().toISOString(),
        query: req.query
      }
    });
  }
};

// ✅ PUT /api/gro/orders/:orderId/transfer-table - Transfer order to different table
export const transferOrderToTable = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { newTableNumber, reason, transferredBy } = req.body;
    const userId = req.user?.id;

    console.log('🔄 Transferring order to new table:', {
      orderId,
      newTableNumber,
      reason,
      transferredBy,
      userId
    });

    // Validasi input
    if (!newTableNumber || !transferredBy) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Nomor meja baru dan nama GRO yang mentransfer diperlukan'
      });
    }

    // Cari pesanan
    const order = await Order.findById(orderId)
      .populate('user_id', 'name phone')
      .session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }

    // Validasi order type
    if (order.orderType !== 'Dine-In' && order.orderType !== 'Reservation') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Hanya pesanan Dine-In atau Reservation yang bisa dipindahkan meja'
      });
    }

    // Validasi status order
    if (!['Pending', 'Waiting', 'OnProcess', 'Reserved'].includes(order.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Tidak dapat memindahkan order dengan status ${order.status}. Order harus dalam status aktif.`
      });
    }

    const oldTableNumber = order.tableNumber;
    const outletId = order.outlet;

    console.log('📋 Order details:', {
      orderId: order.order_id,
      currentTable: oldTableNumber,
      outletId: outletId,
      status: order.status
    });

    // Cek apakah meja baru tersedia
    const newTable = await Table.findOne({
      table_number: newTableNumber.toUpperCase(),
      is_active: true
    }).populate('area_id').session(session);

    if (!newTable) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Meja ${newTableNumber} tidak ditemukan atau tidak aktif`
      });
    }

    // Cek status meja baru
    if (newTable.status !== 'available') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Meja ${newTableNumber} sedang tidak tersedia (status: ${newTable.status})`
      });
    }

    // Cek apakah meja baru sudah ada pesanan aktif
    const existingOrderOnNewTable = await Order.findOne({
      tableNumber: newTableNumber.toUpperCase(),
      status: { $in: ['Pending', 'Waiting', 'OnProcess', 'Reserved'] },
      outlet: outletId,
      _id: { $ne: orderId } // Exclude current order
    }).session(session);

    if (existingOrderOnNewTable) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Meja ${newTableNumber} sudah memiliki pesanan aktif (Order: ${existingOrderOnNewTable.order_id})`
      });
    }

    // Get employee info
    const employee = await User.findById(userId).select('username').session(session);

    // ✅ UPDATE 1: Update status meja baru menjadi occupied
    newTable.status = 'occupied';
    newTable.updatedAt = new Date();

    // Tambahkan history untuk meja baru
    if (!newTable.statusHistory) {
      newTable.statusHistory = [];
    }

    newTable.statusHistory.push({
      fromStatus: 'available',
      toStatus: 'occupied',
      updatedBy: transferredBy,
      notes: `Order ${order.order_id} dipindahkan dari meja ${oldTableNumber}`,
      updatedAt: getWIBNow()
    });

    await newTable.save({ session });

    console.log('✅ New table status updated to occupied:', newTableNumber);

    // ✅ UPDATE 2: Jika meja lama ada, update statusnya menjadi available
    if (oldTableNumber && oldTableNumber !== newTableNumber) {
      const oldTable = await Table.findOne({
        table_number: oldTableNumber.toUpperCase()
      }).session(session);

      if (oldTable) {
        oldTable.status = 'available';
        oldTable.updatedAt = new Date();

        // Tambahkan history untuk meja lama
        if (!oldTable.statusHistory) {
          oldTable.statusHistory = [];
        }

        oldTable.statusHistory.push({
          fromStatus: 'occupied',
          toStatus: 'available',
          updatedBy: transferredBy,
          notes: `Order ${order.order_id} dipindahkan ke meja ${newTableNumber}`,
          updatedAt: getWIBNow()
        });

        await oldTable.save({ session });

        console.log('✅ Old table status updated to available:', oldTableNumber);
      }
    }

    // ✅ UPDATE 3: Update order dengan table baru
    order.tableNumber = newTableNumber.toUpperCase();
    order.updatedAtWIB = getWIBNow();

    // Tambahkan catatan transfer
    const transferNote = `\n[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Dipindahkan dari meja ${oldTableNumber} ke meja ${newTableNumber} oleh ${transferredBy}${reason ? ` - Alasan: ${reason}` : ''}`;
    order.notes = (order.notes || '') + transferNote;

    // Simpan history transfer
    if (!order.transferHistory) {
      order.transferHistory = [];
    }

    order.transferHistory.push({
      fromTable: oldTableNumber,
      toTable: newTableNumber,
      transferredBy: transferredBy,
      reason: reason || 'Table transfer by GRO',
      transferredAt: getWIBNow()
    });

    await order.save({ session });

    // ✅ UPDATE 4: Jika ini adalah reservation, update juga table_id di reservation
    if (order.reservation) {
      const reservation = await Reservation.findById(order.reservation).session(session);
      if (reservation) {
        // Cari table berdasarkan table_number baru
        const newTableForReservation = await Table.findOne({
          table_number: newTableNumber.toUpperCase()
        }).session(session);

        if (newTableForReservation) {
          // Update table_id di reservation (replace dengan table baru)
          reservation.table_id = [newTableForReservation._id];

          // Tambahkan catatan
          const reservationTransferNote = `[${getWIBNow().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Meja dipindahkan dari ${oldTableNumber} ke ${newTableNumber} oleh ${transferredBy}`;
          reservation.notes = reservation.notes
            ? `${reservationTransferNote}\n${reservation.notes}`
            : reservationTransferNote;

          await reservation.save({ session });
          console.log('✅ Reservation table updated:', order.reservation);
        }
      }
    }

    await session.commitTransaction();

    console.log(`✅ Table transfer completed: Order ${order.order_id} from ${oldTableNumber} to ${newTableNumber}`);

    // ✅ EMIT SOCKET EVENTS UNTUK REAL-TIME UPDATE
    const transferData = {
      orderId: order._id,
      order_id: order.order_id,
      oldTable: oldTableNumber,
      newTable: newTableNumber,
      customerName: order.user_id?.name || order.user,
      customerPhone: order.user_id?.phone,
      transferredBy: transferredBy,
      reason: reason,
      area: newTable.area_id?.area_code,
      timestamp: new Date()
    };

    // Emit ke berbagai room untuk real-time update
    if (typeof io !== 'undefined' && io) {
      // Emit ke room order
      io.to(`order_${order.order_id}`).emit('table_transferred', transferData);

      // Emit ke cashier room
      io.to('cashier_room').emit('order_table_changed', transferData);

      // Emit ke GRO room
      io.to('gro_room').emit('order_table_changed', transferData);

      // Emit table status update untuk area baru
      io.to(`area_${newTable.area_id?.area_code}`).emit('table_status_updated', {
        tableId: newTable._id,
        tableNumber: newTable.table_number,
        oldStatus: 'available',
        newStatus: 'occupied',
        updatedBy: transferredBy,
        timestamp: new Date(),
        orderId: order.order_id
      });

      // Emit table status update untuk area lama (jika ada)
      if (oldTableNumber && oldTableNumber !== newTableNumber) {
        const oldTable = await Table.findOne({ table_number: oldTableNumber });
        if (oldTable && oldTable.area_id) {
          io.to(`area_${oldTable.area_id?.area_code}`).emit('table_status_updated', {
            tableId: oldTable._id,
            tableNumber: oldTable.table_number,
            oldStatus: 'occupied',
            newStatus: 'available',
            updatedBy: transferredBy,
            timestamp: new Date()
          });
        }
      }
    }

    // Response sukses
    res.json({
      success: true,
      message: `Pesanan berhasil dipindahkan dari meja ${oldTableNumber} ke meja ${newTableNumber}`,
      data: {
        order: {
          id: order._id,
          order_id: order.order_id,
          tableNumber: order.tableNumber,
          customerName: order.user_id?.name || order.user,
          status: order.status
        },
        transfer: {
          from: oldTableNumber,
          to: newTableNumber,
          transferredBy: transferredBy,
          reason: reason || 'No reason provided',
          timestamp: getWIBNow()
        },
        tables: {
          oldTable: oldTableNumber ? {
            number: oldTableNumber,
            newStatus: 'available'
          } : null,
          newTable: {
            number: newTableNumber,
            area: newTable.area_id?.area_name,
            newStatus: 'occupied'
          }
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error transferring order table:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memindahkan pesanan ke meja baru',
      error: error.message,
      debug: {
        orderId: req.params.orderId,
        newTableNumber: req.body.newTableNumber,
        timestamp: new Date().toISOString()
      }
    });
  } finally {
    session.endSession();
  }
};

// POST /api/gro/tables/debug-status - Debug table status inconsistencies
export const debugTableStatus = async (req, res) => {
  try {
    const { outletId } = req.body;

    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID is required'
      });
    }

    // Ambil semua data untuk analisis
    const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const fourHoursAgo = new Date(nowWIB.getTime() - 4 * 60 * 60 * 1000);

    // 1. Ambil semua meja
    const areas = await Area.find({ outlet_id: outletId }).select('_id');
    const areaIds = areas.map(area => area._id);
    const allTables = await Table.find({
      area_id: { $in: areaIds },
      is_active: true
    }).populate('area_id', 'area_name area_code');

    // 2. Ambil semua order aktif
    const activeOrders = await Order.find({
      outlet: outletId,
      status: { $in: ['Pending', 'Waiting', 'OnProcess', 'Reserved'] },
      orderType: { $in: ['Dine-In', 'Reservation'] },
      tableNumber: { $exists: true, $ne: null },
      $or: [
        { createdAtWIB: { $gte: fourHoursAgo } },
        { updatedAtWIB: { $gte: fourHoursAgo } }
      ]
    }).select('tableNumber status orderType order_id user');

    // 3. Analisis inconsistencies
    const occupiedTableNumbers = new Set(
      activeOrders.map(order => order.tableNumber?.toUpperCase()).filter(Boolean)
    );

    const inconsistencies = [];
    const consistentTables = [];

    allTables.forEach(table => {
      const tableNumberUpper = table.table_number.toUpperCase();
      const shouldBeOccupied = occupiedTableNumbers.has(tableNumberUpper);
      const isOccupiedInDB = table.status === 'occupied';

      const isConsistent = shouldBeOccupied === isOccupiedInDB;

      if (!isConsistent) {
        inconsistencies.push({
          table_number: table.table_number,
          area: table.area_id?.area_name,
          current_status: table.status,
          expected_status: shouldBeOccupied ? 'occupied' : 'available',
          active_orders: activeOrders.filter(order =>
            order.tableNumber?.toUpperCase() === tableNumberUpper
          ).map(order => ({
            order_id: order.order_id,
            status: order.status,
            customer: order.user
          }))
        });
      } else {
        consistentTables.push({
          table_number: table.table_number,
          area: table.area_id?.area_name,
          status: table.status,
          consistent: true
        });
      }
    });

    // 4. Auto-repair inconsistencies
    if (inconsistencies.length > 0) {
      console.log(`🛠️ Auto-repairing ${inconsistencies.length} inconsistent tables`);

      const repairPromises = inconsistencies.map(async (inc) => {
        const table = await Table.findOne({
          table_number: inc.table_number,
          area_id: { $in: areaIds }
        });

        if (table) {
          const oldStatus = table.status;
          table.status = inc.expected_status;
          table.is_available = inc.expected_status === 'available';
          table.updatedAt = new Date();

          if (!table.statusHistory) table.statusHistory = [];
          table.statusHistory.push({
            fromStatus: oldStatus,
            toStatus: inc.expected_status,
            updatedBy: 'System Debug Repair',
            notes: `Auto-repair: ${inc.active_orders.length} active orders found`,
            updatedAt: nowWIB
          });

          await table.save();
          return { table_number: inc.table_number, repaired: true };
        }
        return { table_number: inc.table_number, repaired: false };
      });

      await Promise.all(repairPromises);
    }

    res.json({
      success: true,
      data: {
        total_tables: allTables.length,
        active_orders: activeOrders.length,
        inconsistencies_count: inconsistencies.length,
        consistent_tables_count: consistentTables.length,
        inconsistencies: inconsistencies,
        consistent_tables: consistentTables.slice(0, 10), // Batasi output
        repair_performed: inconsistencies.length > 0,
        timestamp: nowWIB
      }
    });

  } catch (error) {
    console.error('Error debugging table status:', error);
    res.status(500).json({
      success: false,
      message: 'Error debugging table status',
      error: error.message
    });
  }
};

// POST /api/gro/tables/sync-status - Manual sync table status
export const syncTableStatus = async (req, res) => {
  try {
    const { outletId } = req.body;

    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID is required'
      });
    }

    await Table.syncTableStatusWithActiveOrders(outletId);

    res.json({
      success: true,
      message: 'Table status synchronized successfully',
      data: {
        outletId,
        timestamp: getWIBNow()
      }
    });
  } catch (error) {
    console.error('Error syncing table status:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing table status',
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
  session.startTransaction();

  try {
    const { updates, updatedBy } = req.body;

    if (!Array.isArray(updates) || updates.length === 0 || !updatedBy) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Data updates dan nama GRO diperlukan'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { tableNumber, status, notes } = update;

        // Find table
        const table = await Table.findOne({
          table_number: tableNumber.toUpperCase(),
          is_active: true
        }).session(session);

        if (!table) {
          errors.push({ tableNumber, message: 'Meja tidak ditemukan' });
          continue;
        }

        // Check if table has active order when changing to available
        if (status === 'available' && table.status === 'occupied') {
          const activeOrder = await Order.findOne({
            tableNumber: tableNumber,
            status: { $in: ['Pending', 'Waiting', 'OnProcess'] }
          }).session(session);

          if (activeOrder) {
            errors.push({
              tableNumber,
              message: `Meja ${tableNumber} masih memiliki pesanan aktif (Order: ${activeOrder.order_id})`
            });
            continue;
          }
        }

        // Update table status
        const oldStatus = table.status;
        table.status = status;
        table.updatedAt = new Date();

        // Add status history
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

        // Emit socket event
        io.to(`area_${table.area_id?.area_code}`).emit('table_status_updated', {
          tableId: table._id,
          tableNumber: table.table_number,
          areaId: table.area_id,
          oldStatus: oldStatus,
          newStatus: status,
          updatedBy: updatedBy,
          timestamp: new Date()
        });

      } catch (error) {
        errors.push({ tableNumber: update.tableNumber, message: error.message });
      }
    }

    await session.commitTransaction();

    res.json({
      success: errors.length === 0,
      message: `${results.length} meja berhasil diupdate, ${errors.length} gagal`,
      updated: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error bulk updating tables:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal update status meja',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};