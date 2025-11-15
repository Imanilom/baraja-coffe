import { Order } from '../models/order.model.js';
import { io } from '../index.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PrintLogger } from '../services/print-logger.service.js';
dotenv.config();


// Tambahkan function print tracking di operation controller
export const trackPrintAttempt = async (orderId, workstation, printerConfig) => {
  try {
    // Untuk sekarang, kita log order secara keseluruhan dulu
    // Bisa dikembangkan untuk log per item jika diperlukan
    const logId = await PrintLogger.logPrintAttempt(
      orderId,
      null, // itemId - bisa diisi jika perlu tracking per item
      workstation,
      printerConfig
    );

    return logId;
  } catch (error) {
    console.error('Error in trackPrintAttempt:', error);
    return null;
  }
};

export const trackPrintSuccess = async (logId, duration) => {
  await PrintLogger.logPrintSuccess(logId, duration);
};

export const trackPrintFailure = async (logId, reason, details = '') => {
  await PrintLogger.logPrintFailure(logId, reason, details);
};

// di operation.controller.js
export const logProblematicItem = async (req, res) => {
  try {
    const { order_id, item, workstation, issues, details, stock_info } = req.body;

    if (!order_id || !item || !issues) {
      return res.status(400).json({
        success: false,
        message: 'order_id, item, and issues are required'
      });
    }

    const logId = await PrintLogger.logProblematicItem(
      order_id,
      item,
      workstation,
      issues,
      details,
      stock_info
    );

    res.status(200).json({
      success: true,
      data: {
        log_id: logId
      }
    });
  } catch (error) {
    console.error('Error logging problematic item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log problematic item'
    });
  }
};

// Enhanced logPrintAttempt endpoint
// Di operation.controller.js - perbaiki endpoint logPrintAttempt
export const logPrintAttempt = async (req, res) => {
  try {
    const {
      order_id,
      item,
      workstation,
      printer_config,
      stock_info
    } = req.body;

    if (!order_id || !item || !workstation) {
      return res.status(400).json({
        success: false,
        message: 'order_id, item, and workstation are required'
      });
    }

    // Enhanced logging dengan problematic details
    const logId = await PrintLogger.logPrintAttempt(
      order_id,
      item,
      workstation,
      printer_config,
      stock_info
    );

    res.status(200).json({
      success: true,
      data: {
        log_id: logId,
        logged_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error logging print attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log print attempt'
    });
  }
};

// New endpoint untuk problematic reports
export const getProblematicPrintReport = async (req, res) => {
  try {
    const { hours = 24, workstation } = req.query;

    const problematicReport = await PrintLogger.getProblematicItemsReport(parseInt(hours));
    const technicalReport = await PrintLogger.getTechnicalIssuesReport(parseInt(hours));

    // Filter by workstation jika provided
    let filteredProblematic = problematicReport;
    let filteredTechnical = technicalReport;

    if (workstation) {
      filteredProblematic = problematicReport.filter(item =>
        item.workstation === workstation
      );
      filteredTechnical = technicalReport.filter(item =>
        item.workstation === workstation
      );
    }

    res.status(200).json({
      success: true,
      data: {
        problematic_items: filteredProblematic,
        technical_issues: filteredTechnical,
        summary: {
          total_problematic: filteredProblematic.reduce((sum, item) => sum + item.count, 0),
          total_technical: filteredTechnical.reduce((sum, item) => sum + item.count, 0),
          time_range: `${hours} hours`,
          workstation: workstation || 'all'
        }
      }
    });
  } catch (error) {
    console.error('Error getting problematic print report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get problematic print report'
    });
  }
};
// Endpoint untuk log print success
export const logPrintSuccess = async (req, res) => {
  try {
    const { log_id, duration } = req.body;

    if (!log_id) {
      return res.status(400).json({
        success: false,
        message: 'log_id is required'
      });
    }

    await trackPrintSuccess(log_id, duration);

    res.status(200).json({
      success: true,
      message: 'Print success logged'
    });
  } catch (error) {
    console.error('Error logging print success:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log print success'
    });
  }
};

// di operation.controller.js
export const logSkippedItem = async (req, res) => {
  try {
    const { order_id, item, workstation, reason, details } = req.body;

    if (!order_id || !item || !reason) {
      return res.status(400).json({
        success: false,
        message: 'order_id, item, and reason are required'
      });
    }

    await PrintLogger.logSkippedItem(order_id, item, workstation, reason, details);

    res.status(200).json({
      success: true,
      message: 'Skipped item logged'
    });
  } catch (error) {
    console.error('Error logging skipped item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log skipped item'
    });
  }
};

// Endpoint untuk log print failure
export const logPrintFailure = async (req, res) => {
  try {
    const { log_id, reason, details } = req.body;

    if (!log_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'log_id and reason are required'
      });
    }

    await trackPrintFailure(log_id, reason, details);

    res.status(200).json({
      success: true,
      message: 'Print failure logged'
    });
  } catch (error) {
    console.error('Error logging print failure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log print failure'
    });
  }
};

// Tambahkan endpoint untuk print monitoring
export const getPrintStats = async (req, res) => {
  try {
    const { hours = 24 } = req.query;

    const stats = await PrintLogger.getPrintSummary(parseInt(hours));
    const failures = await PrintLogger.getRecentFailures(6, 10);

    res.status(200).json({
      success: true,
      data: {
        statistics: stats,
        recent_failures: failures
      }
    });
  } catch (error) {
    console.error('Error getting print stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get print statistics'
    });
  }
};

export const getOrderPrintHistory = async (req, res) => {
  try {
    const { orderId } = req.params;

    const printHistory = await PrintLog.find({ order_id: orderId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        order_id: orderId,
        print_history: printHistory
      }
    });
  } catch (error) {
    console.error('Error getting order print history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get print history'
    });
  }
};

// ! Start Kitchen sections

export const getKitchenOrder = async (req, res) => {
  try {
    // ✅ Ambil data order terbaru
    const orders = await Order.find({
      status: { $in: ['Waiting', 'Reserved', 'OnProcess', 'Completed', 'Cancelled'] },

    })
      .populate({
        path: 'items.menuItem',
        select: 'name workstation',
      })
      .populate({
        path: 'reservation',
        populate: [
          { path: 'area_id', select: 'area_name' },
          { path: 'table_id', select: 'table_number' },
        ],
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .lean();

    // 🔥 Filter items & buang order yang tidak punya workstation kitchen
    const filteredOrders = orders
      .map((order) => {
        const kitchenItems = order.items.filter(
          (item) => item.menuItem?.workstation === 'kitchen'
        );

        if (kitchenItems.length === 0) return null;

        // 🎯 Calculate preparation time based on food_serving_option
        let shouldStartPreparation = false;
        let timeUntilPreparation = null;

        if (order.reservation) {
          const reservation = order.reservation;
          const now = new Date();

          if (reservation.food_serving_option === 'scheduled' && reservation.food_serving_time) {
            // ✅ SCHEDULED: Patokan dari food_serving_time - 30 menit
            const servingTime = new Date(reservation.food_serving_time);
            const prepStartTime = new Date(servingTime.getTime() - 30 * 60 * 1000); // 30 menit sebelum serving

            shouldStartPreparation = now >= prepStartTime;
            timeUntilPreparation = prepStartTime - now;

            console.log(`📅 [SCHEDULED] Order ${order.order_id}:`);
            console.log(`   Food Serving Time: ${servingTime.toISOString()}`);
            console.log(`   Prep Start Time: ${prepStartTime.toISOString()}`);
            console.log(`   Should Start: ${shouldStartPreparation}`);
          } else {
            // ✅ IMMEDIATE: Patokan dari reservation_time - 30 menit
            const reservationDate = new Date(reservation.reservation_date);
            const timeParts = (reservation.reservation_time || '00:00').split(':');
            const reservationDateTime = new Date(
              reservationDate.getFullYear(),
              reservationDate.getMonth(),
              reservationDate.getDate(),
              parseInt(timeParts[0]),
              parseInt(timeParts[1])
            );

            const prepStartTime = new Date(reservationDateTime.getTime() - 30 * 60 * 1000);

            shouldStartPreparation = now >= prepStartTime;
            timeUntilPreparation = prepStartTime - now;

            console.log(`⚡ [IMMEDIATE] Order ${order.order_id}:`);
            console.log(`   Reservation Time: ${reservationDateTime.toISOString()}`);
            console.log(`   Prep Start Time: ${prepStartTime.toISOString()}`);
            console.log(`   Should Start: ${shouldStartPreparation}`);
          }
        }

        return {
          ...order,
          items: kitchenItems,
          displayInfo: {
            orderType: order.order_type || 'dine-in',
            location: order.reservation
              ? `${order.reservation.area_id?.area_name || '-'} - Table ${order.reservation.table_id?.table_number || '-'}`
              : (order.order_type || 'TAKEAWAY').toUpperCase(),
            customerName: order.customer_name || order.customer?.name || 'Guest',
            // 🎯 Tambahan info untuk reservasi
            servingOption: order.reservation?.food_serving_option || 'immediate',
            servingTime: order.reservation?.food_serving_time,
            shouldStartPreparation,
            timeUntilPreparation: timeUntilPreparation ? Math.ceil(timeUntilPreparation / 60000) : null // dalam menit
          }
        };
      })
      .filter(order => order !== null);

    res.status(200).json({
      success: true,
      data: filteredOrders,
    });
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch kitchen orders',
    });
  }
};

export const updateKitchenOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, kitchenId, kitchenName } = req.body;

  console.log('Updating kitchen order status for orderId:', orderId, 'to status:', status);
  if (!orderId || !status) {
    return res.status(400).json({ success: false, message: 'orderId and status are required' });
  }

  try {
    // 🔍 Cek order dan reservasi terkait
    const order = await Order.findOne({ order_id: orderId })
      .populate('reservation')
      .populate('items.menuItem');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 🚫 CEK: Jika status ingin diubah ke Completed dan ada reservasi aktif
    // ⚠️ Hanya cek jika order punya reservation (dine-in)
    if (status === 'Completed' && order.reservation) {
      const reservation = order.reservation;

      // Cek apakah reservasi masih aktif (belum selesai)
      if (reservation.status && ['confirmed', 'checked-in', 'in-progress'].includes(reservation.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot complete order with active reservation. Reservation might have OTS or additional orders.'
        });
      }

      // Atau cek berdasarkan waktu reservasi
      const now = new Date();
      const reservationEnd = new Date(reservation.reservation_end || reservation.end_time);
      if (reservationEnd > now) {
        return res.status(400).json({
          success: false,
          message: 'Cannot complete order while reservation is still active. Customer might add more orders.'
        });
      }
    }

    // ✅ Update status order
    const updatedOrder = await Order.findOneAndUpdate(
      { order_id: orderId },
      { $set: { status: status } },
      { new: true }
    ).populate('items.menuItem');

    // 🔥 EMIT SOCKET EVENTS
    const updateData = {
      order_id: orderId,
      orderStatus: status,
      orderType: order.order_type || 'dine-in', // 🎯 Tambahkan order type
      kitchen: { id: kitchenId, name: kitchenName },
      timestamp: new Date(),
      hasActiveReservation: !!order.reservation
    };

    // Emit ke room customer agar tahu progres order
    io.to(`order_${orderId}`).emit('order_status_update', updateData);

    // Emit ke cashier agar kasir tahu kitchen update status
    io.to('cashier_room').emit('kitchen_order_updated', updateData);

    // Emit ke kitchen room juga kalau perlu broadcast antar kitchen
    io.to('kitchen_room').emit('kitchen_order_updated', updateData);

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: status === 'Completed' && order.reservation
        ? 'Order completed but reservation is still active'
        : 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating kitchen order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update kitchen order status' });
  }
};

export const updateKitchenItemStatus = async (req, res) => {
  const { orderId, itemId } = req.params;
  const { kitchenStatus, kitchenId, kitchenName } = req.body;

  console.log('Updating kitchen item status for orderId:', orderId, 'itemId:', itemId, 'to status:', kitchenStatus);

  if (!orderId || !itemId || !kitchenStatus) {
    return res.status(400).json({
      success: false,
      message: 'orderId, itemId, and kitchenStatus are required'
    });
  }

  // Validasi kitchenStatus
  const validStatuses = ['pending', 'printed', 'cooking', 'ready', 'served'];
  if (!validStatuses.includes(kitchenStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid kitchenStatus. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    // 🔍 Cek order dan item
    const order = await Order.findOne({ order_id: orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Cari item yang akan diupdate
    const itemToUpdate = order.items.id(itemId);
    if (!itemToUpdate) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    // Simpan status sebelumnya untuk tracking
    const previousStatus = itemToUpdate.kitchenStatus;

    // ✅ Update kitchenStatus item
    itemToUpdate.kitchenStatus = kitchenStatus;

    // Jika status diubah menjadi 'served', set isPrinted menjadi true
    if (kitchenStatus === 'served') {
      itemToUpdate.isPrinted = true;
      itemToUpdate.printedAt = new Date();
    }

    // Simpan perubahan
    await order.save();

    // 🔍 Populate ulang untuk mendapatkan data yang lengkap
    const updatedOrder = await Order.findOne({ order_id: orderId })
      .populate('items.menuItem')
      .populate('reservation');

    // Dapatkan item yang sudah diupdate
    const updatedItem = updatedOrder.items.id(itemId);

    // 🔥 EMIT SOCKET EVENTS
    const updateData = {
      order_id: orderId,
      item_id: itemId,
      kitchenStatus: kitchenStatus,
      previousStatus: previousStatus,
      orderType: updatedOrder.order_type || 'dine-in', // 🎯 Tambahkan order type
      kitchen: { id: kitchenId, name: kitchenName },
      timestamp: new Date(),
      itemDetails: {
        menuItem: updatedItem.menuItem,
        quantity: updatedItem.quantity,
        notes: updatedItem.notes,
        batchNumber: updatedItem.batchNumber
      },
      orderStatus: updatedOrder.status,
      hasActiveReservation: !!updatedOrder.reservation
    };

    // Emit ke room customer
    io.to(`order_${orderId}`).emit('kitchen_item_status_update', updateData);

    // Emit ke cashier room
    io.to('cashier_room').emit('kitchen_item_updated', updateData);

    // Emit ke kitchen room untuk update real-time
    io.to('kitchen_room').emit('kitchen_item_updated', updateData);

    res.status(200).json({
      success: true,
      data: {
        order: updatedOrder,
        updatedItem: updatedItem
      },
      message: `Item status updated to ${kitchenStatus} successfully`
    });

  } catch (error) {
    console.error('Error updating kitchen item status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update kitchen item status'
    });
  }
};

export const bulkUpdateKitchenItems = async (req, res) => {
  const { orderId } = req.params;
  const { items, kitchenId, kitchenName } = req.body;

  console.log('Bulk updating kitchen items for orderId:', orderId, 'items:', items);

  if (!orderId || !items || !Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      message: 'orderId and items array are required'
    });
  }

  try {
    const order = await Order.findOne({ order_id: orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updateResults = [];
    const validStatuses = ['pending', 'printed', 'cooking', 'ready', 'served'];

    // Update setiap item
    for (const itemUpdate of items) {
      const { itemId, kitchenStatus } = itemUpdate;

      if (!itemId || !kitchenStatus) {
        updateResults.push({
          itemId,
          success: false,
          message: 'itemId and kitchenStatus are required for each item'
        });
        continue;
      }

      if (!validStatuses.includes(kitchenStatus)) {
        updateResults.push({
          itemId,
          success: false,
          message: `Invalid kitchenStatus: ${kitchenStatus}`
        });
        continue;
      }

      const itemToUpdate = order.items.id(itemId);
      if (!itemToUpdate) {
        updateResults.push({
          itemId,
          success: false,
          message: 'Order item not found'
        });
        continue;
      }

      const previousStatus = itemToUpdate.kitchenStatus;
      itemToUpdate.kitchenStatus = kitchenStatus;

      if (kitchenStatus === 'served') {
        itemToUpdate.isPrinted = true;
        itemToUpdate.printedAt = new Date();
      }

      updateResults.push({
        itemId,
        success: true,
        previousStatus,
        newStatus: kitchenStatus
      });
    }

    await order.save();

    // Populate ulang untuk mendapatkan data lengkap
    const updatedOrder = await Order.findOne({ order_id: orderId })
      .populate('items.menuItem')
      .populate('reservation');

    // 🔥 EMIT SOCKET EVENTS untuk bulk update
    const bulkUpdateData = {
      order_id: orderId,
      updates: updateResults.filter(result => result.success),
      orderType: updatedOrder.order_type || 'dine-in', // 🎯 Tambahkan order type
      kitchen: { id: kitchenId, name: kitchenName },
      timestamp: new Date(),
      orderStatus: updatedOrder.status
    };

    io.to(`order_${orderId}`).emit('kitchen_items_bulk_update', bulkUpdateData);
    io.to('kitchen_room').emit('kitchen_items_bulk_updated', bulkUpdateData);
    io.to('cashier_room').emit('kitchen_items_bulk_updated', bulkUpdateData);

    // Cek jika ada items yang ready/served untuk notifikasi waiter
    const servedItems = updateResults.filter(result =>
      result.success && ['ready', 'served'].includes(result.newStatus)
    );

    if (servedItems.length > 0) {
      io.to('waiter_room').emit('items_ready_for_serving', {
        ...bulkUpdateData,
        servedItems: servedItems
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order: updatedOrder,
        updateResults: updateResults
      },
      message: `Bulk update completed for ${updateResults.filter(r => r.success).length} items`
    });

  } catch (error) {
    console.error('Error in bulk updating kitchen items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update kitchen items'
    });
  }
};

// ! End Kitchen sections

// ! Start Bar sections

export const getBarOrder = async (req, res) => {
  try {
    const { barType } = req.params; // 'depan' atau 'belakang'

    if (!barType || !['depan', 'belakang'].includes(barType)) {
      return res.status(400).json({
        success: false,
        message: 'Bar type harus "depan" atau "belakang"'
      });
    }

    // ✅ Ambil data order terbaru
    const orders = await Order.find({
      status: { $in: ['Waiting', 'Reserved', 'OnProcess', 'Completed', 'Ready', 'Cancelled'] },
    })
      .populate({
        path: 'items.menuItem',
        select: 'name workstation category',
      })
      .populate({
        path: 'reservation',
        populate: [
          { path: 'area_id', select: 'area_name' },
          { path: 'table_id', select: 'table_number' },
        ],
        // 🔥 TAMBAHKAN INI - Skip populate jika reservation null
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .lean();

    // 🔥 Filter: hanya ambil item dengan workstation bar/beverage
    const beverageOrders = orders
      .map((order) => ({
        ...order,
        items: order.items.filter(
          (item) => item.menuItem?.workstation === 'bar' ||
            item.menuItem?.workstation === 'beverage' ||
            (item.menuItem?.category &&
              ['minuman', 'beverage', 'drink'].includes(item.menuItem.category.toLowerCase()))
        ),
        // 🎯 Tambahan: Info untuk display di bar
        displayInfo: {
          orderType: order.orderType || order.order_type || 'dine-in',
          location: order.reservation
            ? `${order.reservation.area_id?.area_name || '-'} - Table ${order.reservation.table_id?.table_number || '-'}`
            : (order.orderType || 'TAKEAWAY').toUpperCase(),
          customerName: order.customer_name || order.user || 'Guest'
        }
      }))
      .filter((order) => order.items.length > 0); // hanya order yang punya beverage items

    // 🔥 Filter berdasarkan area meja untuk bar depan/belakang
    const filteredOrders = beverageOrders.filter((order) => {
      // 🎯 HANDLE TAKEAWAY/PICKUP/DELIVERY - tampilkan di semua bar
      const orderType = (order.orderType || order.order_type || '').toLowerCase();
      if (['takeaway', 'pickup', 'delivery', 'take away'].includes(orderType)) {
        console.log(`📦 ${orderType.toUpperCase()} order ${order.order_id} - showing in all bars`);
        return true; // Tampilkan di semua bar
      }

      // 🎯 HANDLE DINE-IN & RESERVATION - filter berdasarkan table
      if (!order.tableNumber && !order.reservation) {
        console.log(`⚠️ Order ${order.order_id} has no table info - skipping`);
        return false;
      }

      let tableNumber = '';

      // Ambil table number dari reservation atau langsung dari order
      if (order.reservation && order.reservation.table_id) {
        const tableData = order.reservation.table_id;
        tableNumber = tableData.table_number || tableData;
      } else if (order.tableNumber) {
        tableNumber = order.tableNumber;
      } else {
        return false;
      }

      // Convert ke string dan ambil karakter pertama
      const tableStr = tableNumber.toString().toUpperCase();
      const firstChar = tableStr.charAt(0);

      if (barType === 'depan') {
        // Bar depan: meja A-I
        return firstChar >= 'A' && firstChar <= 'I';
      } else if (barType === 'belakang') {
        // Bar belakang: meja J-Z
        return firstChar >= 'J' && firstChar <= 'Z';
      }

      return false;
    });

    console.log(`✅ Bar ${barType} orders: ${filteredOrders.length} orders found`);

    res.status(200).json({
      success: true,
      data: filteredOrders,
      barType: barType,
      total: filteredOrders.length
    });
  } catch (error) {
    console.error(`❌ Error fetching ${barType} bar orders:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${barType} bar orders`,
    });
  }
};

export const getAllBeverageOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['Waiting', 'Reserved', 'OnProcess', 'Completed', 'Ready', 'Cancelled'] },
    })
      .populate({
        path: 'items.menuItem',
        select: 'name workstation category',
      })
      .populate({
        path: 'reservation',
        populate: [
          { path: 'area_id', select: 'area_name' },
          { path: 'table_id', select: 'table_number' },
        ],
        // 🔥 TAMBAHKAN INI - Skip populate jika reservation null
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter hanya item beverage/bar - VERSI AMAN
    const beverageOrders = orders
      .map((order) => ({
        ...order,
        items: order.items.filter((item) => {
          const menuItem = item.menuItem;

          // Skip jika menuItem null/undefined
          if (!menuItem) return false;

          // Cek workstation
          if (menuItem.workstation === 'bar' || menuItem.workstation === 'beverage') {
            return true;
          }

          // Cek category dengan safe check
          if (menuItem.category) {
            const categoryStr = String(menuItem.category).toLowerCase();
            return ['minuman', 'beverage', 'drink'].includes(categoryStr);
          }

          return false;
        }),
        // 🎯 Tambahan: Info untuk display
        displayInfo: {
          orderType: order.orderType || order.order_type || 'dine-in',
          location: order.reservation
            ? `${order.reservation.area_id?.area_name || '-'} - Table ${order.reservation.table_id?.table_number || '-'}`
            : (order.orderType || 'TAKEAWAY').toUpperCase(),
          customerName: order.customer_name || order.user || 'Guest'
        }
      }))
      .filter((order) => order.items.length > 0);

    console.log(`✅ All beverage orders: ${beverageOrders.length} orders found`);

    res.status(200).json({
      success: true,
      data: beverageOrders,
      total: beverageOrders.length
    });

  } catch (error) {
    console.error('❌ Error fetching beverage orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beverage orders',
      error: error.message
    });
  }
};

// ✅ Update bar order status
export const updateBarOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, bartenderId, bartenderName, completedItems } = req.body;

  console.log('Updating bar order status for orderId:', orderId, 'to status:', status);

  if (!orderId || !status) {
    return res.status(400).json({
      success: false,
      message: 'orderId and status are required'
    });
  }

  try {
    const order = await Order.findOne({ order_id: orderId })
      .populate('items.menuItem')
      .populate('reservation');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 🚫 CEK: Jika status ingin diubah ke Completed dan ada reservasi aktif
    // ⚠️ Hanya cek jika order punya reservation (dine-in)
    if (status === 'Completed' && order.reservation) {
      const reservation = order.reservation;

      // Cek apakah reservasi masih aktif
      if (reservation.status && ['confirmed', 'checked-in', 'in-progress'].includes(reservation.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot complete order with active reservation. Reservation might have additional orders.'
        });
      }

      // Atau cek berdasarkan waktu reservasi
      const now = new Date();
      const reservationEnd = new Date(reservation.reservation_end || reservation.end_time);
      if (reservationEnd > now) {
        return res.status(400).json({
          success: false,
          message: 'Cannot complete order while reservation is still active.'
        });
      }
    }

    // Update status order
    order.status = status;
    await order.save();

    // 🔥 EMIT SOCKET EVENTS
    const updateData = {
      order_id: orderId,
      orderStatus: status,
      orderType: order.orderType || order.order_type || 'dine-in', // 🎯 Tambahkan order type
      bartender: { id: bartenderId, name: bartenderName },
      completedItems: completedItems || [],
      hasActiveReservation: !!order.reservation,
      timestamp: new Date()
    };

    // Emit ke room customer
    io.to(`order_${orderId}`).emit('order_status_update', updateData);

    // Emit ke cashier
    io.to('cashier_room').emit('beverage_order_updated', updateData);

    // Emit ke bar room sesuai type
    const tableNumber = order.tableNumber?.toString() ||
      order.reservation?.table_id?.table_number || '';

    if (tableNumber) {
      const firstChar = tableNumber.charAt(0).toUpperCase();
      const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';
      io.to(barRoom).emit('beverage_order_updated', updateData);
    } else {
      // Jika tidak ada table number (takeaway/pickup/delivery), emit ke semua bar
      io.to('bar_depan').emit('beverage_order_updated', updateData);
      io.to('bar_belakang').emit('beverage_order_updated', updateData);
    }

    console.log(`✅ Bar order ${orderId} updated to ${status} by ${bartenderName}`);

    res.status(200).json({
      success: true,
      data: order,
      message: status === 'Completed' && order.reservation
        ? 'Order completed but reservation is still active'
        : `Order status updated to ${status}`
    });
  } catch (error) {
    console.error('❌ Error updating bar order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bar order status'
    });
  }
};

// ✅ Start preparing beverage order
export const startBeverageOrder = async (req, res) => {
  const { orderId } = req.params;
  const { bartenderName } = req.body;

  console.log('Starting beverage preparation for orderId:', orderId, 'by:', bartenderName);

  if (!orderId || !bartenderName) {
    return res.status(400).json({
      success: false,
      message: 'orderId and bartenderName are required'
    });
  }

  try {
    const order = await Order.findOne({ order_id: orderId })
      .populate('reservation');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update status ke OnProcess
    order.status = 'OnProcess';
    await order.save();

    // 🔥 EMIT SOCKET EVENTS
    const startData = {
      order_id: orderId,
      orderStatus: 'OnProcess',
      orderType: order.orderType || order.order_type || 'dine-in', // 🎯 Tambahkan order type
      bartenderName: bartenderName,
      message: 'Beverage order started preparation',
      timestamp: new Date()
    };

    // Emit ke customer
    io.to(`order_${orderId}`).emit('beverage_preparation_started', startData);

    // Emit ke cashier
    io.to('cashier_room').emit('beverage_preparation_started', startData);

    // Emit ke bar room
    const tableNumber = order.tableNumber?.toString() ||
      order.reservation?.table_id?.table_number || '';

    if (tableNumber) {
      const firstChar = tableNumber.charAt(0).toUpperCase();
      const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';
      io.to(barRoom).emit('beverage_preparation_started', startData);
    } else {
      // Emit ke semua bar untuk non-table orders
      io.to('bar_depan').emit('beverage_preparation_started', startData);
      io.to('bar_belakang').emit('beverage_preparation_started', startData);
    }

    console.log(`✅ Beverage order ${orderId} started preparation by ${bartenderName}`);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Beverage preparation started'
    });
  } catch (error) {
    console.error('❌ Error starting beverage order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start beverage order'
    });
  }
};

// ✅ Complete beverage order (mark as ready)
export const completeBeverageOrder = async (req, res) => {
  const { orderId } = req.params;
  const { bartenderName, completedItems } = req.body;

  console.log('Completing beverage order for orderId:', orderId, 'by:', bartenderName);

  if (!orderId || !bartenderName) {
    return res.status(400).json({
      success: false,
      message: 'orderId and bartenderName are required'
    });
  }

  try {
    const order = await Order.findOne({ order_id: orderId })
      .populate('reservation');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update status ke Ready
    order.status = 'Ready';
    await order.save();

    // 🔥 EMIT SOCKET EVENTS
    const completeData = {
      order_id: orderId,
      orderStatus: 'Ready',
      orderType: order.orderType || order.order_type || 'dine-in', // 🎯 Tambahkan order type
      bartenderName: bartenderName,
      completedItems: completedItems || [],
      message: 'Beverage order is ready to serve',
      timestamp: new Date()
    };

    // Emit ke customer
    io.to(`order_${orderId}`).emit('beverage_ready', completeData);

    // Emit ke cashier
    io.to('cashier_room').emit('beverage_ready', completeData);

    // Emit ke bar room
    const tableNumber = order.tableNumber?.toString() ||
      order.reservation?.table_id?.table_number || '';

    if (tableNumber) {
      const firstChar = tableNumber.charAt(0).toUpperCase();
      const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';
      io.to(barRoom).emit('beverage_ready', completeData);
    } else {
      // Emit ke semua bar untuk non-table orders
      io.to('bar_depan').emit('beverage_ready', completeData);
      io.to('bar_belakang').emit('beverage_ready', completeData);
    }

    // Juga emit ke waitstaff/runner room
    io.to('waitstaff_room').emit('beverage_ready_for_serve', completeData);

    console.log(`✅ Beverage order ${orderId} completed by ${bartenderName}`);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Beverage order marked as ready'
    });
  } catch (error) {
    console.error('❌ Error completing beverage order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete beverage order'
    });
  }
};

// ✅ Update individual beverage item status
export const updateBeverageItemStatus = async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status, bartenderName } = req.body;

  console.log('Updating beverage item status for orderId:', orderId, 'itemId:', itemId, 'to:', status);

  if (!orderId || !itemId || !status) {
    return res.status(400).json({
      success: false,
      message: 'orderId, itemId and status are required'
    });
  }

  try {
    const order = await Order.findOne({ order_id: orderId })
      .populate('items.menuItem')
      .populate('reservation');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Find and update the specific item
    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in order'
      });
    }

    // Update item status
    item.kitchenStatus = status; // Gunakan kitchenStatus sesuai schema
    if (status === 'served') {
      item.isPrinted = true;
      item.printedAt = new Date();
    }
    await order.save();

    // 🔥 EMIT SOCKET EVENTS
    const itemUpdateData = {
      order_id: orderId,
      item_id: itemId,
      item_name: item.menuItem?.name || item.name,
      status: status,
      orderType: order.orderType || order.order_type || 'dine-in', // 🎯 Tambahkan order type
      bartenderName: bartenderName,
      timestamp: new Date()
    };

    // Emit ke bar room untuk update real-time
    const tableNumber = order.tableNumber?.toString() ||
      order.reservation?.table_id?.table_number || '';

    if (tableNumber) {
      const firstChar = tableNumber.charAt(0).toUpperCase();
      const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';
      io.to(barRoom).emit('beverage_item_status_updated', itemUpdateData);
    } else {
      // Emit ke semua bar untuk non-table orders
      io.to('bar_depan').emit('beverage_item_status_updated', itemUpdateData);
      io.to('bar_belakang').emit('beverage_item_status_updated', itemUpdateData);
    }

    console.log(`✅ Beverage item ${itemId} in order ${orderId} updated to ${status}`);

    res.status(200).json({
      success: true,
      data: { order, updatedItem: item },
      message: `Item status updated to ${status}`
    });
  } catch (error) {
    console.error('❌ Error updating beverage item status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update beverage item status'
    });
  }
};

// ! End Bar sections

// ! Start Old Kitchen sections
// export const getKitchenOrder = async (req, res) => {
//   try {
//     // ✅ Ambil data order terbaru
//     const orders = await Order.find({
//       status: { $in: ['Waiting', 'Reserved', 'OnProcess', 'Completed', 'Cancelled'] },
//     })
//       .populate({
//         path: 'items.menuItem',
//         select: 'name workstation', // bisa pilih field yg diperlukan
//       })
//       .populate({
//         path: 'reservation',
//         populate: [
//           { path: 'area_id', select: 'area_name' },
//           { path: 'table_id', select: 'table_number' },
//         ],
//       })
//       .sort({ createdAt: -1 })
//       .lean();

//     // 🔥 Filter items & buang order yang tidak punya workstation kitchen
//     const filteredOrders = orders
//       .map((order) => ({
//         ...order,
//         items: order.items.filter(
//           (item) => item.menuItem?.workstation === 'kitchen'
//         ),
//       }))
//       .filter((order) => order.items.length > 0); // hanya order yang punya kitchen items

//     res.status(200).json({
//       success: true,
//       data: filteredOrders, // sudah termasuk reservation populated
//     });
//   } catch (error) {
//     console.error('Error fetching kitchen orders:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch kitchen orders',
//     });
//   }
// };

// export const updateKitchenOrderStatus = async (req, res) => {
//   const { orderId } = req.params;
//   const { status, kitchenId, kitchenName } = req.body;

//   console.log('Updating kitchen order status for orderId:', orderId, 'to status:', status);
//   if (!orderId || !status) {
//     return res.status(400).json({ success: false, message: 'orderId and status are required' });
//   }

//   try {
//     // 🔍 Cek order dan reservasi terkait
//     const order = await Order.findOne({ order_id: orderId })
//       .populate('reservation')
//       .populate('items.menuItem');

//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     // 🚫 CEK: Jika status ingin diubah ke Completed dan ada reservasi aktif
//     if (status === 'Completed' && order.reservation) {
//       // Cek apakah reservasi masih aktif (belum selesai)
//       const reservation = order.reservation;

//       // Asumsi: reservasi memiliki field status yang menandakan aktif/tidak
//       // Sesuaikan dengan struktur data reservasi Anda
//       if (reservation.status && ['confirmed', 'checked-in', 'in-progress'].includes(reservation.status)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Cannot complete order with active reservation. Reservation might have OTS or additional orders.'
//         });
//       }

//       // Atau cek berdasarkan waktu reservasi
//       const now = new Date();
//       const reservationEnd = new Date(reservation.reservation_end || reservation.end_time);
//       if (reservationEnd > now) {
//         return res.status(400).json({
//           success: false,
//           message: 'Cannot complete order while reservation is still active. Customer might add more orders.'
//         });
//       }
//     }

//     // ✅ Update status order
//     const updatedOrder = await Order.findOneAndUpdate(
//       { order_id: orderId },
//       { $set: { status: status } },
//       { new: true }
//     ).populate('items.menuItem');

//     // 🔥 EMIT SOCKET EVENTS
//     const updateData = {
//       order_id: orderId,
//       orderStatus: status,
//       kitchen: { id: kitchenId, name: kitchenName },
//       timestamp: new Date(),
//       hasActiveReservation: !!order.reservation // tambahkan info reservasi
//     };

//     // Emit ke room customer agar tahu progres order
//     io.to(`order_${orderId}`).emit('order_status_update', updateData);

//     // Emit ke cashier agar kasir tahu kitchen update status
//     io.to('cashier_room').emit('kitchen_order_updated', updateData);

//     // Emit ke kitchen room juga kalau perlu broadcast antar kitchen
//     io.to('kitchen_room').emit('kitchen_order_updated', updateData);

//     res.status(200).json({
//       success: true,
//       data: updatedOrder,
//       message: status === 'Completed' && order.reservation
//         ? 'Order completed but reservation is still active'
//         : 'Order status updated successfully'
//     });
//   } catch (error) {
//     console.error('Error updating kitchen order status:', error);
//     res.status(500).json({ success: false, message: 'Failed to update kitchen order status' });
//   }
// };

// export const updateKitchenItemStatus = async (req, res) => {
//   const { orderId, itemId } = req.params;
//   const { kitchenStatus, kitchenId, kitchenName } = req.body;

//   console.log('Updating kitchen item status for orderId:', orderId, 'itemId:', itemId, 'to status:', kitchenStatus);

//   if (!orderId || !itemId || !kitchenStatus) {
//     return res.status(400).json({
//       success: false,
//       message: 'orderId, itemId, and kitchenStatus are required'
//     });
//   }

//   // Validasi kitchenStatus
//   const validStatuses = ['pending', 'printed', 'cooking', 'ready', 'served'];
//   if (!validStatuses.includes(kitchenStatus)) {
//     return res.status(400).json({
//       success: false,
//       message: `Invalid kitchenStatus. Must be one of: ${validStatuses.join(', ')}`
//     });
//   }

//   try {
//     // 🔍 Cek order dan item
//     const order = await Order.findOne({ order_id: orderId });

//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     // Cari item yang akan diupdate
//     const itemToUpdate = order.items.id(itemId);
//     if (!itemToUpdate) {
//       return res.status(404).json({ success: false, message: 'Order item not found' });
//     }

//     // Simpan status sebelumnya untuk tracking
//     const previousStatus = itemToUpdate.kitchenStatus;

//     // ✅ Update kitchenStatus item
//     itemToUpdate.kitchenStatus = kitchenStatus;

//     // Jika status diubah menjadi 'served', set isPrinted menjadi true
//     if (kitchenStatus === 'served') {
//       itemToUpdate.isPrinted = true;
//       itemToUpdate.printedAt = new Date();
//     }

//     // Simpan perubahan
//     await order.save();

//     // 🔍 Populate ulang untuk mendapatkan data yang lengkap
//     const updatedOrder = await Order.findOne({ order_id: orderId })
//       .populate('items.menuItem')
//       .populate('reservation');

//     // Dapatkan item yang sudah diupdate
//     const updatedItem = updatedOrder.items.id(itemId);

//     // 🔥 EMIT SOCKET EVENTS
//     const updateData = {
//       order_id: orderId,
//       item_id: itemId,
//       kitchenStatus: kitchenStatus,
//       previousStatus: previousStatus,
//       kitchen: { id: kitchenId, name: kitchenName },
//       timestamp: new Date(),
//       itemDetails: {
//         menuItem: updatedItem.menuItem,
//         quantity: updatedItem.quantity,
//         notes: updatedItem.notes,
//         batchNumber: updatedItem.batchNumber
//       },
//       orderStatus: updatedOrder.status, // Status order keseluruhan
//       hasActiveReservation: !!updatedOrder.reservation
//     };

//     // Emit ke room customer
//     io.to(`order_${orderId}`).emit('kitchen_item_status_update', updateData);

//     // Emit ke cashier room
//     io.to('cashier_room').emit('kitchen_item_updated', updateData);

//     // Emit ke kitchen room untuk update real-time
//     io.to('kitchen_room').emit('kitchen_item_updated', updateData);

//     // Emit khusus untuk waiter jika item sudah ready/served
//     // if (['ready', 'served'].includes(kitchenStatus)) {
//     //   io.to('waiter_room').emit('item_ready_for_serving', updateData);
//     // }

//     res.status(200).json({
//       success: true,
//       data: {
//         order: updatedOrder,
//         updatedItem: updatedItem
//       },
//       message: `Item status updated to ${kitchenStatus} successfully`
//     });

//   } catch (error) {
//     console.error('Error updating kitchen item status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update kitchen item status'
//     });
//   }
// };

// export const bulkUpdateKitchenItems = async (req, res) => {
//   const { orderId } = req.params;
//   const { items, kitchenId, kitchenName } = req.body;

//   console.log('Bulk updating kitchen items for orderId:', orderId, 'items:', items);

//   if (!orderId || !items || !Array.isArray(items)) {
//     return res.status(400).json({
//       success: false,
//       message: 'orderId and items array are required'
//     });
//   }

//   try {
//     const order = await Order.findOne({ order_id: orderId });

//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     const updateResults = [];
//     const validStatuses = ['pending', 'printed', 'cooking', 'ready', 'served'];

//     // Update setiap item
//     for (const itemUpdate of items) {
//       const { itemId, kitchenStatus } = itemUpdate;

//       if (!itemId || !kitchenStatus) {
//         updateResults.push({
//           itemId,
//           success: false,
//           message: 'itemId and kitchenStatus are required for each item'
//         });
//         continue;
//       }

//       if (!validStatuses.includes(kitchenStatus)) {
//         updateResults.push({
//           itemId,
//           success: false,
//           message: `Invalid kitchenStatus: ${kitchenStatus}`
//         });
//         continue;
//       }

//       const itemToUpdate = order.items.id(itemId);
//       if (!itemToUpdate) {
//         updateResults.push({
//           itemId,
//           success: false,
//           message: 'Order item not found'
//         });
//         continue;
//       }

//       const previousStatus = itemToUpdate.kitchenStatus;
//       itemToUpdate.kitchenStatus = kitchenStatus;

//       if (kitchenStatus === 'served') {
//         itemToUpdate.isPrinted = true;
//         itemToUpdate.printedAt = new Date();
//       }

//       updateResults.push({
//         itemId,
//         success: true,
//         previousStatus,
//         newStatus: kitchenStatus
//       });
//     }

//     await order.save();

//     // Populate ulang untuk mendapatkan data lengkap
//     const updatedOrder = await Order.findOne({ order_id: orderId })
//       .populate('items.menuItem')
//       .populate('reservation');

//     // 🔥 EMIT SOCKET EVENTS untuk bulk update
//     const bulkUpdateData = {
//       order_id: orderId,
//       updates: updateResults.filter(result => result.success),
//       kitchen: { id: kitchenId, name: kitchenName },
//       timestamp: new Date(),
//       orderStatus: updatedOrder.status
//     };

//     io.to(`order_${orderId}`).emit('kitchen_items_bulk_update', bulkUpdateData);
//     io.to('kitchen_room').emit('kitchen_items_bulk_updated', bulkUpdateData);
//     io.to('cashier_room').emit('kitchen_items_bulk_updated', bulkUpdateData);

//     // Cek jika ada items yang ready/served untuk notifikasi waiter
//     const servedItems = updateResults.filter(result =>
//       result.success && ['ready', 'served'].includes(result.newStatus)
//     );

//     if (servedItems.length > 0) {
//       io.to('waiter_room').emit('items_ready_for_serving', {
//         ...bulkUpdateData,
//         servedItems: servedItems
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         order: updatedOrder,
//         updateResults: updateResults
//       },
//       message: `Bulk update completed for ${updateResults.filter(r => r.success).length} items`
//     });

//   } catch (error) {
//     console.error('Error in bulk updating kitchen items:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to bulk update kitchen items'
//     });
//   }
// };
// ! End Old Kitchen sections
// ! Start Old Bar sections
// export const getBarOrder = async (req, res) => {
//   try {
//     const { barType } = req.params; // 'depan' atau 'belakang'

//     if (!barType || !['depan', 'belakang'].includes(barType)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Bar type harus "depan" atau "belakang"'
//       });
//     }

//     // ✅ Ambil data order terbaru
//     const orders = await Order.find({
//       status: { $in: ['Waiting', 'Reserved', 'OnProcess', 'Completed', 'Ready', 'Cancelled'] },
//     })
//       .populate({
//         path: 'items.menuItem',
//         select: 'name workstation category', // tambah category untuk filter minuman
//       })
//       .populate({
//         path: 'reservation',
//         populate: [
//           { path: 'area_id', select: 'area_name' },
//           { path: 'table_id', select: 'table_number' },
//         ],
//       })
//       .sort({ createdAt: -1 })
//       .lean();

//     // 🔥 Filter: hanya ambil item dengan workstation bar/beverage
//     const beverageOrders = orders
//       .map((order) => ({
//         ...order,
//         items: order.items.filter(
//           (item) => item.menuItem?.workstation === 'bar' ||
//             item.menuItem?.workstation === 'beverage' ||
//             (item.menuItem?.category &&
//               ['minuman', 'beverage', 'drink'].includes(item.menuItem.category.toLowerCase()))
//         ),
//       }))
//       .filter((order) => order.items.length > 0); // hanya order yang punya beverage items

//     // 🔥 Filter berdasarkan area meja untuk bar depan/belakang
//     const filteredOrders = beverageOrders.filter((order) => {
//       if (!order.table_id && !order.reservation) return false;

//       let tableNumber = '';

//       // Ambil table number dari reservation atau langsung dari order
//       if (order.reservation && order.reservation.table_id) {
//         tableNumber = order.reservation.table_id.table_number;
//       } else if (order.table_id) {
//         tableNumber = order.table_id;
//       } else {
//         return false;
//       }

//       // Convert ke string dan ambil karakter pertama
//       const tableStr = tableNumber.toString().toUpperCase();
//       const firstChar = tableStr.charAt(0);

//       if (barType === 'depan') {
//         // Bar depan: meja A-I
//         return firstChar >= 'A' && firstChar <= 'I';
//       } else if (barType === 'belakang') {
//         // Bar belakang: meja J-Z
//         return firstChar >= 'J' && firstChar <= 'Z';
//       }

//       return false;
//     });

//     console.log(`Bar ${barType} orders: ${filteredOrders.length} orders found`);

//     res.status(200).json({
//       success: true,
//       data: filteredOrders,
//       barType: barType,
//       total: filteredOrders.length
//     });
//   } catch (error) {
//     console.error(`Error fetching ${barType} bar orders:`, error);
//     res.status(500).json({
//       success: false,
//       message: `Failed to fetch ${barType} bar orders`,
//     });
//   }
// };

// export const getAllBeverageOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({
//       status: { $in: ['Waiting', 'Reserved', 'OnProcess', 'Completed', 'Ready', 'Cancelled'] },
//     })
//       .populate({
//         path: 'items.menuItem',
//         select: 'name workstation category',
//       })
//       .populate({
//         path: 'reservation',
//         populate: [
//           { path: 'area_id', select: 'area_name' },
//           { path: 'table_id', select: 'table_number' },
//         ],
//       })
//       .sort({ createdAt: -1 })
//       .lean();

//     // Filter hanya item beverage/bar - VERSI AMAN
//     const beverageOrders = orders
//       .map((order) => ({
//         ...order,
//         items: order.items.filter((item) => {
//           const menuItem = item.menuItem;

//           // Skip jika menuItem null/undefined
//           if (!menuItem) return false;

//           // Cek workstation
//           if (menuItem.workstation === 'bar' || menuItem.workstation === 'beverage') {
//             return true;
//           }

//           // Cek category dengan safe check
//           if (menuItem.category) {
//             const categoryStr = String(menuItem.category).toLowerCase();
//             return ['minuman', 'beverage', 'drink'].includes(categoryStr);
//           }

//           return false;
//         }),
//       }))
//       .filter((order) => order.items.length > 0);

//     res.status(200).json({
//       success: true,
//       data: beverageOrders,
//       total: beverageOrders.length
//     });

//   } catch (error) {
//     console.error('❌ Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch beverage orders',
//       error: error.message
//     });
//   }
// };

// // ✅ Update bar order status
// export const updateBarOrderStatus = async (req, res) => {
//   const { orderId } = req.params;
//   const { status, bartenderId, bartenderName, completedItems } = req.body;

//   console.log('Updating bar order status for orderId:', orderId, 'to status:', status);

//   if (!orderId || !status) {
//     return res.status(400).json({
//       success: false,
//       message: 'orderId and status are required'
//     });
//   }

//   try {
//     const order = await Order.findOne({ order_id: orderId })
//       .populate('items.menuItem');

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // Update status order
//     order.status = status;
//     await order.save();

//     // 🔥 EMIT SOCKET EVENTS
//     const updateData = {
//       order_id: orderId,
//       orderStatus: status,
//       bartender: { id: bartenderId, name: bartenderName },
//       completedItems: completedItems || [],
//       timestamp: new Date()
//     };

//     // Emit ke room customer
//     io.to(`order_${orderId}`).emit('order_status_update', updateData);

//     // Emit ke cashier
//     io.to('cashier_room').emit('beverage_order_updated', updateData);

//     // Emit ke bar room sesuai type
//     const tableNumber = order.table_id?.toString() ||
//       order.reservation?.table_id?.table_number || '';
//     const firstChar = tableNumber.charAt(0).toUpperCase();
//     const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';

//     io.to(barRoom).emit('beverage_order_updated', updateData);

//     console.log(`Bar order ${orderId} updated to ${status} by ${bartenderName}`);

//     res.status(200).json({
//       success: true,
//       data: order,
//       message: `Order status updated to ${status}`
//     });
//   } catch (error) {
//     console.error('Error updating bar order status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update bar order status'
//     });
//   }
// };

// // ✅ Start preparing beverage order
// export const startBeverageOrder = async (req, res) => {
//   const { orderId } = req.params;
//   const { bartenderName } = req.body;

//   console.log('Starting beverage preparation for orderId:', orderId, 'by:', bartenderName);

//   if (!orderId || !bartenderName) {
//     return res.status(400).json({
//       success: false,
//       message: 'orderId and bartenderName are required'
//     });
//   }

//   try {
//     const order = await Order.findOne({ order_id: orderId });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // Update status ke OnProcess
//     order.status = 'OnProcess';
//     await order.save();

//     // 🔥 EMIT SOCKET EVENTS
//     const startData = {
//       order_id: orderId,
//       orderStatus: 'OnProcess',
//       bartenderName: bartenderName,
//       message: 'Beverage order started preparation',
//       timestamp: new Date()
//     };

//     // Emit ke customer
//     io.to(`order_${orderId}`).emit('beverage_preparation_started', startData);

//     // Emit ke cashier
//     io.to('cashier_room').emit('beverage_preparation_started', startData);

//     // Emit ke bar room
//     const tableNumber = order.table_id?.toString() ||
//       order.reservation?.table_id?.table_number || '';
//     const firstChar = tableNumber.charAt(0).toUpperCase();
//     const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';

//     io.to(barRoom).emit('beverage_preparation_started', startData);

//     console.log(`Beverage order ${orderId} started preparation by ${bartenderName}`);

//     res.status(200).json({
//       success: true,
//       data: order,
//       message: 'Beverage preparation started'
//     });
//   } catch (error) {
//     console.error('Error starting beverage order:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to start beverage order'
//     });
//   }
// };

// // ✅ Complete beverage order (mark as ready)
// export const completeBeverageOrder = async (req, res) => {
//   const { orderId } = req.params;
//   const { bartenderName, completedItems } = req.body;

//   console.log('Completing beverage order for orderId:', orderId, 'by:', bartenderName);

//   if (!orderId || !bartenderName) {
//     return res.status(400).json({
//       success: false,
//       message: 'orderId and bartenderName are required'
//     });
//   }

//   try {
//     const order = await Order.findOne({ order_id: orderId });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // Update status ke Ready
//     order.status = 'Ready';
//     await order.save();

//     // 🔥 EMIT SOCKET EVENTS
//     const completeData = {
//       order_id: orderId,
//       orderStatus: 'Ready',
//       bartenderName: bartenderName,
//       completedItems: completedItems || [],
//       message: 'Beverage order is ready to serve',
//       timestamp: new Date()
//     };

//     // Emit ke customer
//     io.to(`order_${orderId}`).emit('beverage_ready', completeData);

//     // Emit ke cashier
//     io.to('cashier_room').emit('beverage_ready', completeData);

//     // Emit ke bar room
//     const tableNumber = order.table_id?.toString() ||
//       order.reservation?.table_id?.table_number || '';
//     const firstChar = tableNumber.charAt(0).toUpperCase();
//     const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';

//     io.to(barRoom).emit('beverage_ready', completeData);

//     // Juga emit ke waitstaff/runner room
//     io.to('waitstaff_room').emit('beverage_ready_for_serve', completeData);

//     console.log(`Beverage order ${orderId} completed by ${bartenderName}`);

//     res.status(200).json({
//       success: true,
//       data: order,
//       message: 'Beverage order marked as ready'
//     });
//   } catch (error) {
//     console.error('Error completing beverage order:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to complete beverage order'
//     });
//   }
// };

// // ✅ Update individual beverage item status
// export const updateBeverageItemStatus = async (req, res) => {
//   const { orderId, itemId } = req.params;
//   const { status, bartenderName } = req.body;

//   console.log('Updating beverage item status for orderId:', orderId, 'itemId:', itemId, 'to:', status);

//   if (!orderId || !itemId || !status) {
//     return res.status(400).json({
//       success: false,
//       message: 'orderId, itemId and status are required'
//     });
//   }

//   try {
//     const order = await Order.findOne({ order_id: orderId });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // Find and update the specific item
//     const item = order.items.id(itemId);
//     if (!item) {
//       return res.status(404).json({
//         success: false,
//         message: 'Item not found in order'
//       });
//     }

//     // Update item status
//     item.status = status;
//     await order.save();

//     // 🔥 EMIT SOCKET EVENTS
//     const itemUpdateData = {
//       order_id: orderId,
//       item_id: itemId,
//       item_name: item.name,
//       status: status,
//       bartenderName: bartenderName,
//       timestamp: new Date()
//     };

//     // Emit ke bar room untuk update real-time
//     const tableNumber = order.table_id?.toString() ||
//       order.reservation?.table_id?.table_number || '';
//     const firstChar = tableNumber.charAt(0).toUpperCase();
//     const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';

//     io.to(barRoom).emit('beverage_item_status_updated', itemUpdateData);

//     console.log(`Beverage item ${itemId} in order ${orderId} updated to ${status}`);

//     res.status(200).json({
//       success: true,
//       data: { order, updatedItem: item },
//       message: `Item status updated to ${status}`
//     });
//   } catch (error) {
//     console.error('Error updating beverage item status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update beverage item status'
//     });
//   }
// };


// ! End Bar sections