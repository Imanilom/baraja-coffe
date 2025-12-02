// operation.controller.js

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


// ============================================
// GET KITCHEN ORDERS (Optimized with lean + indexes)
// ============================================

export const getKitchenOrder = async (req, res) => {
  try {
    const startTime = Date.now();

    // Use lean() for 10x faster queries
    const orders = await Order.find({
      status: { $in: ['Waiting', 'Reserved', 'OnProcess', 'Completed', 'Cancelled'] },
    })
      .select('order_id customer_name status items createdAt updatedAt order_type reservation')
      .populate({
        path: 'items.menuItem',
        select: 'name workstation',
      })
      .populate({
        path: 'reservation',
        select: 'area_id table_id food_serving_option food_serving_time reservation_date reservation_time status',
        populate: [
          { path: 'area_id', select: 'area_name' },
          { path: 'table_id', select: 'table_number' },
        ],
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain objects (much faster)

    // Batch auto-confirm (non-blocking)
    const waitingOrderIds = orders
      .filter(order => order.status === 'Waiting')
      .map(order => order.order_id);

    if (waitingOrderIds.length > 0) {
      console.log(`🔥 [AUTO-CONFIRM] Found ${waitingOrderIds.length} Waiting orders`);

      // Fire and forget
      _batchConfirmWaitingOrders(waitingOrderIds).catch(err => {
        console.error('❌ Background auto-confirm failed:', err);
      });

      // Optimistic update
      orders.forEach(order => {
        if (order.status === 'Waiting') {
          order.status = 'OnProcess';
        }
      });
    }

    // Filter & map in single pass (more efficient)
    const filteredOrders = orders.reduce((acc, order) => {
      const kitchenItems = order.items.filter(
        (item) => item.menuItem?.workstation === 'kitchen'
      );

      if (kitchenItems.length === 0) return acc;

      // Calculate preparation timing
      let shouldStartPreparation = false;
      let timeUntilPreparation = null;

      if (order.reservation) {
        const reservation = order.reservation;
        const now = Date.now();

        if (reservation.food_serving_option === 'scheduled' && reservation.food_serving_time) {
          const servingTime = new Date(reservation.food_serving_time).getTime();
          const prepStartTime = servingTime - 30 * 60 * 1000;

          shouldStartPreparation = now >= prepStartTime;
          timeUntilPreparation = Math.ceil((prepStartTime - now) / 60000);
        } else {
          const reservationDate = new Date(reservation.reservation_date);
          const timeParts = (reservation.reservation_time || '00:00').split(':');
          const reservationDateTime = new Date(
            reservationDate.getFullYear(),
            reservationDate.getMonth(),
            reservationDate.getDate(),
            parseInt(timeParts[0]),
            parseInt(timeParts[1])
          ).getTime();

          const prepStartTime = reservationDateTime - 30 * 60 * 1000;

          shouldStartPreparation = now >= prepStartTime;
          timeUntilPreparation = Math.ceil((prepStartTime - now) / 60000);
        }
      }

      acc.push({
        ...order,
        items: kitchenItems,
        displayInfo: {
          orderType: order.order_type || 'dine-in',
          location: order.reservation
            ? `${order.reservation.area_id?.area_name || '-'} - Table ${order.reservation.table_id?.table_number || '-'}`
            : (order.order_type || 'TAKEAWAY').toUpperCase(),
          customerName: order.customer_name || order.customer?.name || 'Guest',
          servingOption: order.reservation?.food_serving_option || 'immediate',
          servingTime: order.reservation?.food_serving_time,
          shouldStartPreparation,
          timeUntilPreparation
        }
      });

      return acc;
    }, []);

    const queryTime = Date.now() - startTime;
    console.log(`⚡ Kitchen query completed in ${queryTime}ms`);

    res.status(200).json({
      success: true,
      data: filteredOrders,
      meta: {
        queryTime: `${queryTime}ms`,
        totalOrders: orders.length,
        filteredOrders: filteredOrders.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching kitchen orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch kitchen orders',
    });
  }
};

// ============================================
// BATCH AUTO-CONFIRM (Non-blocking)
// ============================================

async function _batchConfirmWaitingOrders(orderIds) {
  if (orderIds.length === 0) return;

  try {
    console.log(`🔄 [BATCH CONFIRM] Processing ${orderIds.length} orders...`);

    // Single bulk update
    const result = await Order.updateMany(
      {
        order_id: { $in: orderIds },
        status: 'Waiting'
      },
      {
        $set: { status: 'OnProcess' }
      }
    );

    console.log(`✅ [BATCH CONFIRM] Updated ${result.modifiedCount} orders`);

    // Emit socket events in parallel
    if (global.io) {
      const emitPromises = orderIds.map(orderId => {
        return global.io.to(`order_${orderId}`).emit('status_confirmed', {
          order_id: orderId,
          orderStatus: 'OnProcess',
          timestamp: new Date()
        });
      });

      await Promise.all(emitPromises);

      // Single emit to kitchen room
      global.io.to('kitchen_outlet-1').emit('order_status_updated', {
        orderIds,
        status: 'OnProcess',
        count: result.modifiedCount,
        timestamp: new Date()
      });
    }

  } catch (error) {
    console.error(`❌ [BATCH CONFIRM] Error:`, error);
  }
}

// ============================================
// UPDATE ORDER STATUS (Immediate response)
// ============================================

export const updateKitchenOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, kitchenId, kitchenName } = req.body;

  if (!orderId || !status) {
    return res.status(400).json({
      success: false,
      message: 'orderId and status are required'
    });
  }

  try {
    // Emit socket IMMEDIATELY
    const updateData = {
      order_id: orderId,
      orderStatus: status,
      orderType: 'dine-in',
      kitchen: { id: kitchenId, name: kitchenName },
      timestamp: new Date(),
    };

    if (global.io) {
      global.io.to(`order_${orderId}`).emit('order_status_update', updateData);
      global.io.to('cashier_room').emit('kitchen_order_updated', updateData);
      global.io.to('kitchen_room').emit('kitchen_order_updated', updateData);
    }

    // Response IMMEDIATE
    res.status(200).json({
      success: true,
      message: 'Status update broadcasted',
      data: { orderId, status }
    });

    // DB update in background
    setImmediate(async () => {
      try {
        const order = await Order.findOne({ order_id: orderId })
          .select('order_id status reservation')
          .populate('reservation', 'status')
          .lean();

        if (!order) {
          console.error(`Order ${orderId} not found`);
          return;
        }

        // Validation: active reservation
        if (status === 'Completed' && order.reservation) {
          const reservation = order.reservation;
          if (reservation.status &&
            ['confirmed', 'checked-in', 'in-progress'].includes(reservation.status)) {
            console.warn(`Order ${orderId} has active reservation`);

            if (global.io) {
              global.io.to(`order_${orderId}`).emit('status_update_corrected', {
                order_id: orderId,
                status: 'OnProcess',
                reason: 'Active reservation'
              });
            }
            return;
          }
        }

        // Update DB
        await Order.updateOne(
          { order_id: orderId },
          { $set: { status: status } }
        );

        console.log(`✅ Order ${orderId} status updated to ${status}`);

      } catch (error) {
        console.error(`❌ Background DB update failed for ${orderId}:`, error);
      }
    });

  } catch (error) {
    console.error('Error in updateKitchenOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// ============================================
// BATCH AUTO-CONFIRM ENDPOINT
// ============================================

export const batchAutoConfirmOrders = async (req, res) => {
  const { orderIds } = req.body;

  if (!orderIds || !Array.isArray(orderIds)) {
    return res.status(400).json({
      success: false,
      message: 'orderIds array required'
    });
  }

  try {
    // Response IMMEDIATELY
    res.status(200).json({
      success: true,
      message: `Confirming ${orderIds.length} orders`,
      orderIds: orderIds
    });

    // Background processing
    setImmediate(async () => {
      try {
        const result = await Order.updateMany(
          {
            order_id: { $in: orderIds },
            status: { $in: ['Waiting', 'Reserved'] }
          },
          {
            $set: { status: 'OnProcess' }
          }
        );

        console.log(`✅ Batch confirmed ${result.modifiedCount} orders`);

        if (global.io) {
          // Parallel socket emissions
          const emitPromises = orderIds.map(orderId =>
            global.io.to(`order_${orderId}`).emit('order_status_update', {
              order_id: orderId,
              orderStatus: 'OnProcess',
              timestamp: new Date()
            })
          );

          await Promise.all(emitPromises);

          global.io.to('kitchen_room').emit('batch_orders_confirmed', {
            orderIds,
            count: result.modifiedCount,
            timestamp: new Date()
          });
        }

      } catch (error) {
        console.error('Batch auto-confirm error:', error);
      }
    });

  } catch (error) {
    console.error('Error in batchAutoConfirmOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Batch confirm failed'
    });
  }
};

// ============================================
// UPDATE KITCHEN ITEM STATUS
// ============================================

export const updateKitchenItemStatus = async (req, res) => {
  const { orderId, itemId } = req.params;
  const { kitchenStatus, kitchenId, kitchenName } = req.body;

  console.log(`Updating item ${itemId} in order ${orderId} to ${kitchenStatus}`);

  if (!orderId || !itemId || !kitchenStatus) {
    return res.status(400).json({
      success: false,
      message: 'orderId, itemId, and kitchenStatus are required'
    });
  }

  const validStatuses = ['pending', 'printed', 'cooking', 'ready', 'served'];
  if (!validStatuses.includes(kitchenStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid kitchenStatus. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    const order = await Order.findOne({ order_id: orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const itemToUpdate = order.items.id(itemId);
    if (!itemToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found'
      });
    }

    const previousStatus = itemToUpdate.kitchenStatus;
    itemToUpdate.kitchenStatus = kitchenStatus;

    if (kitchenStatus === 'served') {
      itemToUpdate.isPrinted = true;
      itemToUpdate.printedAt = new Date();
    }

    await order.save();

    // Populate for response
    const updatedOrder = await Order.findOne({ order_id: orderId })
      .populate('items.menuItem')
      .populate('reservation');

    const updatedItem = updatedOrder.items.id(itemId);

    // Emit socket events
    const updateData = {
      order_id: orderId,
      item_id: itemId,
      kitchenStatus: kitchenStatus,
      previousStatus: previousStatus,
      orderType: updatedOrder.order_type || 'dine-in',
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

    if (global.io) {
      global.io.to(`order_${orderId}`).emit('kitchen_item_status_update', updateData);
      global.io.to('cashier_room').emit('kitchen_item_updated', updateData);
      global.io.to('kitchen_room').emit('kitchen_item_updated', updateData);
    }

    res.status(200).json({
      success: true,
      data: {
        order: updatedOrder,
        updatedItem: updatedItem
      },
      message: `Item status updated to ${kitchenStatus}`
    });

  } catch (error) {
    console.error('Error updating kitchen item status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update kitchen item status'
    });
  }
};

// ============================================
// BULK UPDATE KITCHEN ITEMS
// ============================================

export const bulkUpdateKitchenItems = async (req, res) => {
  const { orderId } = req.params;
  const { items, kitchenId, kitchenName } = req.body;

  if (!orderId || !items || !Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      message: 'orderId and items array are required'
    });
  }

  try {
    const order = await Order.findOne({ order_id: orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const updateResults = [];
    const validStatuses = ['pending', 'printed', 'cooking', 'ready', 'served'];

    for (const itemUpdate of items) {
      const { itemId, kitchenStatus } = itemUpdate;

      if (!itemId || !kitchenStatus) {
        updateResults.push({
          itemId,
          success: false,
          message: 'itemId and kitchenStatus required'
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

    const updatedOrder = await Order.findOne({ order_id: orderId })
      .populate('items.menuItem')
      .populate('reservation');

    // Emit socket events
    const bulkUpdateData = {
      order_id: orderId,
      updates: updateResults.filter(result => result.success),
      orderType: updatedOrder.order_type || 'dine-in',
      kitchen: { id: kitchenId, name: kitchenName },
      timestamp: new Date(),
      orderStatus: updatedOrder.status
    };

    if (global.io) {
      global.io.to(`order_${orderId}`).emit('kitchen_items_bulk_update', bulkUpdateData);
      global.io.to('kitchen_room').emit('kitchen_items_bulk_updated', bulkUpdateData);
      global.io.to('cashier_room').emit('kitchen_items_bulk_updated', bulkUpdateData);
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