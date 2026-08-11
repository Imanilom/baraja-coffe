import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';

// Get all orders (with optional filters)
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, limit, page, sort = '-createdAtWIB' } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const limitNum = parseInt(limit) || 50;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('user_id', 'username email')
      .populate('cashierId', 'username email')
      .populate('outlet', 'name')
      .populate('items.menuItem', 'name price category sku');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single order by ID
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user_id', 'username email')
      .populate('cashierId', 'username email')
      .populate('outlet', 'name')
      .populate('items.menuItem', 'name price category sku');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Create a new order with bypass logic (Admin override)
export const createOrder = async (req, res, next) => {
  try {
    const orderData = req.body;
    
    // Dewaadmin is allowed to set any field, including grandTotal and status directly
    if (!orderData.order_id) {
      orderData.order_id = `DEWA-${Date.now()}`;
    }

    const newOrder = new Order(orderData);
    await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully by dewaadmin',
      data: newOrder
    });
  } catch (error) {
    next(error);
  }
};

// Update order (Admin override - can change anything)
export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Append modification history for audit trail
    const modificationHistory = order.modificationHistory || [];
    modificationHistory.push({
      action: 'status_changed', // using status_changed as generic update action
      reason: 'Dewaadmin override update',
      cashierId: req.user?.id,
      timestamp: new Date(),
      details: updateData
    });

    updateData.modificationHistory = modificationHistory;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: false } // dewaadmin can bypass strict validators if needed
    );

    res.status(200).json({
      success: true,
      message: 'Order updated successfully by dewaadmin',
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// Hard Delete or Cancel Order
export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query; // If ?hardDelete=true, remove from DB entirely

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (hardDelete === 'true') {
      await Order.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: 'Order permanently deleted by dewaadmin'
      });
    } else {
      // Soft delete / cancel
      order.status = 'Canceled';
      order.cancellationReason = 'Canceled by Dewaadmin';
      
      order.modificationHistory.push({
        action: 'status_changed',
        reason: 'Order canceled by dewaadmin',
        cashierId: req.user?.id,
        timestamp: new Date()
      });

      await order.save();
      return res.status(200).json({
        success: true,
        message: 'Order canceled by dewaadmin',
        data: order
      });
    }
  } catch (error) {
    next(error);
  }
};
