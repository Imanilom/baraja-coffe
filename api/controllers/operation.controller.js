// operation.controller.js - COMPLETE VERSION FOR DEVICE-BASED SCALING

import { Order } from '../models/order.model.js';
import { io } from '../index.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PrintLogger } from '../services/print-logger.service.js';
dotenv.config();

// ============================================
// PRINT TRACKING FUNCTIONS
// ============================================

export const trackPrintAttempt = async (orderId, workstation, printerConfig) => {
  try {
    const logId = await PrintLogger.logPrintAttempt(
      orderId,
      null,
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
      data: { log_id: logId }
    });
  } catch (error) {
    console.error('Error logging problematic item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log problematic item'
    });
  }
};

export const logPrintAttempt = async (req, res) => {
  try {
    const { order_id, item, workstation, printer_config, stock_info } = req.body;

    if (!order_id || !item || !workstation) {
      return res.status(400).json({
        success: false,
        message: 'order_id, item, and workstation are required'
      });
    }

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

export const getProblematicPrintReport = async (req, res) => {
  try {
    const { hours = 24, workstation } = req.query;

    const problematicReport = await PrintLogger.getProblematicItemsReport(parseInt(hours));
    const technicalReport = await PrintLogger.getTechnicalIssuesReport(parseInt(hours));

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

// ============================================
// ✅ NEW: GET WORKSTATION ORDERS (UNIFIED)
// ============================================

export const getWorkstationOrders = async (req, res) => {
  try {
    const { workstationType } = req.params;
    const startTime = Date.now();

    if (!workstationType || !['kitchen', 'bar', 'general'].includes(workstationType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workstation type. Must be: kitchen, bar, or general'
      });
    }

    console.log(`📡 Fetching orders for workstation: ${workstationType}`);

    const orders = await Order.find({
      status: { $in: ['Waiting', 'Reserved', 'OnProcess', 'Completed', 'Ready', 'Cancelled'] },
    })
      .select('order_id customer_name status items createdAt updatedAt order_type reservation tableNumber')
      .populate({
        path: 'items.menuItem',
        select: 'name workstation category',
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
      .lean();

    // Batch auto-confirm waiting orders
    const waitingOrderIds = orders
      .filter(order => order.status === 'Waiting')
      .map(order => order.order_id);

    if (waitingOrderIds.length > 0) {
      console.log(`🔥 [AUTO-CONFIRM] Found ${waitingOrderIds.length} Waiting orders`);

      _batchConfirmWaitingOrders(waitingOrderIds).catch(err => {
        console.error('❌ Background auto-confirm failed:', err);
      });

      orders.forEach(order => {
        if (order.status === 'Waiting') {
          order.status = 'OnProcess';
        }
      });
    }

    // Filter items based on workstation type
    const filteredOrders = orders.reduce((acc, order) => {
      let relevantItems = [];

      if (workstationType === 'kitchen') {
        relevantItems = order.items.filter(
          item => item.menuItem?.workstation === 'kitchen'
        );
      } else if (workstationType === 'bar') {
        relevantItems = order.items.filter(item => {
          const menuItem = item.menuItem;
          if (!menuItem) return false;

          if (menuItem.workstation === 'bar' || menuItem.workstation === 'beverage') {
            return true;
          }

          if (menuItem.category) {
            const categoryStr = String(menuItem.category).toLowerCase();
            return ['minuman', 'beverage', 'drink'].includes(categoryStr);
          }

          return false;
        });
      } else if (workstationType === 'general') {
        relevantItems = order.items.filter(item => {
          const menuItem = item.menuItem;
          if (!menuItem) return false;

          const isKitchen = menuItem.workstation === 'kitchen';
          const isBar = menuItem.workstation === 'bar' || menuItem.workstation === 'beverage';

          return !isKitchen && !isBar;
        });
      }

      if (relevantItems.length === 0) return acc;

      // Calculate preparation timing for reservations
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

      // Determine location display
      let location = '';
      const orderType = (order.order_type || '').toLowerCase();

      if (['takeaway', 'pickup', 'delivery', 'take away'].includes(orderType)) {
        location = orderType.toUpperCase();
      } else if (order.reservation) {
        location = `${order.reservation.area_id?.area_name || '-'} - Table ${order.reservation.table_id?.table_number || '-'}`;
      } else if (order.tableNumber) {
        location = `Table ${order.tableNumber}`;
      } else {
        location = 'DINE-IN';
      }

      acc.push({
        ...order,
        items: relevantItems,
        displayInfo: {
          orderType: order.order_type || 'dine-in',
          location: location,
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
    console.log(`⚡ ${workstationType} query completed in ${queryTime}ms`);

    res.status(200).json({
      success: true,
      data: filteredOrders,
      meta: {
        workstationType,
        queryTime: `${queryTime}ms`,
        totalOrders: orders.length,
        filteredOrders: filteredOrders.length
      }
    });
  } catch (error) {
    console.error(`❌ Error fetching ${workstationType} orders:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${workstationType} orders`,
    });
  }
};

// ============================================
// ✅ DEPRECATED: Keep old endpoints for backward compatibility
// ============================================

export const getKitchenOrder = async (req, res) => {
  console.warn('⚠️ getKitchenOrder is deprecated. Use getWorkstationOrders instead.');
  req.params.workstationType = 'kitchen';
  return getWorkstationOrders(req, res);
};

export const getBarOrder = async (req, res) => {
  console.warn('⚠️ getBarOrder is deprecated. Use getWorkstationOrders instead.');
  req.params.workstationType = 'bar';
  return getWorkstationOrders(req, res);
};

export const getAllBeverageOrders = async (req, res) => {
  console.warn('⚠️ getAllBeverageOrders is deprecated. Use getWorkstationOrders instead.');
  req.params.workstationType = 'bar';
  return getWorkstationOrders(req, res);
};

// ============================================
// BATCH AUTO-CONFIRM
// ============================================

async function _batchConfirmWaitingOrders(orderIds) {
  if (orderIds.length === 0) return;

  try {
    console.log(`🔄 [BATCH CONFIRM] Processing ${orderIds.length} orders...`);

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

    if (global.io) {
      const emitPromises = orderIds.map(orderId => {
        return global.io.to(`order_${orderId}`).emit('status_confirmed', {
          order_id: orderId,
          orderStatus: 'OnProcess',
          timestamp: new Date()
        });
      });

      await Promise.all(emitPromises);

      global.io.emit('order_status_updated', {
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
// UPDATE ORDER STATUS
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

    res.status(200).json({
      success: true,
      message: 'Status update broadcasted',
      data: { orderId, status }
    });

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

export const batchAutoConfirmOrders = async (req, res) => {
  const { orderIds } = req.body;

  if (!orderIds || !Array.isArray(orderIds)) {
    return res.status(400).json({
      success: false,
      message: 'orderIds array required'
    });
  }

  try {
    res.status(200).json({
      success: true,
      message: `Confirming ${orderIds.length} orders`,
      orderIds: orderIds
    });

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
          const emitPromises = orderIds.map(orderId =>
            global.io.to(`order_${orderId}`).emit('order_status_update', {
              order_id: orderId,
              orderStatus: 'OnProcess',
              timestamp: new Date()
            })
          );

          await Promise.all(emitPromises);

          global.io.emit('batch_orders_confirmed', {
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
// UPDATE ITEM STATUS
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

    const updatedOrder = await Order.findOne({ order_id: orderId })
      .populate('items.menuItem')
      .populate('reservation');

    const updatedItem = updatedOrder.items.id(itemId);

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

// ============================================
// ✅ NEW: UPDATE WORKSTATION ORDER STATUS (UNIFIED)
// ============================================

export const updateWorkstationOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, workstationId, workstationName, workstationType } = req.body;

  if (!orderId || !status) {
    return res.status(400).json({
      success: false,
      message: 'orderId and status are required'
    });
  }

  try {
    const updateData = {
      order_id: orderId,
      orderStatus: status,
      workstation: {
        id: workstationId,
        name: workstationName,
        type: workstationType
      },
      timestamp: new Date(),
    };

    if (global.io) {
      global.io.to(`order_${orderId}`).emit('order_status_update', updateData);
      global.io.to('cashier_room').emit('workstation_order_updated', updateData);

      // Emit to specific workstation room
      if (workstationType) {
        global.io.to(`${workstationType}_room`).emit('workstation_order_updated', updateData);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Status update broadcasted',
      data: { orderId, status }
    });

    // Background DB update
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

        await Order.updateOne(
          { order_id: orderId },
          { $set: { status: status } }
        );

        console.log(`✅ Order ${orderId} status updated to ${status} for workstation ${workstationType}`);

      } catch (error) {
        console.error(`❌ Background DB update failed for ${orderId}:`,// operation.controller.js - PART 2 (continuation from Part 1)

          // ============================================
          // ✅ CONTINUATION: UPDATE WORKSTATION ORDER STATUS
          // ============================================

          error);
      }
    });

  } catch (error) {
    console.error('Error in updateWorkstationOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workstation order status'
    });
  }
};

// ============================================
// ✅ NEW: UPDATE WORKSTATION ITEM STATUS (UNIFIED)
// ============================================

export const updateWorkstationItemStatus = async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status, workstationId, workstationName, workstationType } = req.body;

  console.log(`Updating item ${itemId} in order ${orderId} to ${status} for workstation ${workstationType}`);

  if (!orderId || !itemId || !status) {
    return res.status(400).json({
      success: false,
      message: 'orderId, itemId, and status are required'
    });
  }

  const validStatuses = ['pending', 'printed', 'cooking', 'ready', 'served'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
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
    itemToUpdate.kitchenStatus = status;

    if (status === 'served') {
      itemToUpdate.isPrinted = true;
      itemToUpdate.printedAt = new Date();
    }

    await order.save();

    const updatedOrder = await Order.findOne({ order_id: orderId })
      .populate('items.menuItem')
      .populate('reservation');

    const updatedItem = updatedOrder.items.id(itemId);

    const updateData = {
      order_id: orderId,
      item_id: itemId,
      status: status,
      previousStatus: previousStatus,
      orderType: updatedOrder.order_type || 'dine-in',
      workstation: {
        id: workstationId,
        name: workstationName,
        type: workstationType
      },
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
      global.io.to(`order_${orderId}`).emit('workstation_item_status_update', updateData);
      global.io.to('cashier_room').emit('workstation_item_updated', updateData);

      // Emit to specific workstation room
      if (workstationType) {
        global.io.to(`${workstationType}_room`).emit('workstation_item_updated', updateData);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        order: updatedOrder,
        updatedItem: updatedItem
      },
      message: `Item status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating workstation item status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workstation item status'
    });
  }
};

// ============================================
// ✅ NEW: BULK UPDATE WORKSTATION ITEMS (UNIFIED)
// ============================================

export const bulkUpdateWorkstationItems = async (req, res) => {
  const { orderId } = req.params;
  const { items, workstationId, workstationName, workstationType } = req.body;

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
      const { itemId, status } = itemUpdate;

      if (!itemId || !status) {
        updateResults.push({
          itemId,
          success: false,
          message: 'itemId and status required'
        });
        continue;
      }

      if (!validStatuses.includes(status)) {
        updateResults.push({
          itemId,
          success: false,
          message: `Invalid status: ${status}`
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
      itemToUpdate.kitchenStatus = status;

      if (status === 'served') {
        itemToUpdate.isPrinted = true;
        itemToUpdate.printedAt = new Date();
      }

      updateResults.push({
        itemId,
        success: true,
        previousStatus,
        newStatus: status
      });
    }

    await order.save();

    const updatedOrder = await Order.findOne({ order_id: orderId })
      .populate('items.menuItem')
      .populate('reservation');

    const bulkUpdateData = {
      order_id: orderId,
      updates: updateResults.filter(result => result.success),
      orderType: updatedOrder.order_type || 'dine-in',
      workstation: {
        id: workstationId,
        name: workstationName,
        type: workstationType
      },
      timestamp: new Date(),
      orderStatus: updatedOrder.status
    };

    if (global.io) {
      global.io.to(`order_${orderId}`).emit('workstation_items_bulk_update', bulkUpdateData);

      // Emit to specific workstation room
      if (workstationType) {
        global.io.to(`${workstationType}_room`).emit('workstation_items_bulk_updated', bulkUpdateData);
      }

      global.io.to('cashier_room').emit('workstation_items_bulk_updated', bulkUpdateData);
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
    console.error('Error in bulk updating workstation items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update workstation items'
    });
  }
};