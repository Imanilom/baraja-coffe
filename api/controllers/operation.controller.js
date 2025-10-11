import { Order } from '../models/order.model.js';
import { io } from '../index.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ! Start Kitchen sections
export const getKitchenOrder = async (req, res) => {
  try {
    // ✅ Ambil data order terbaru
    const orders = await Order.find({
      status: { $in: ['Waiting', 'Reserved', 'OnProcess', 'Completed', 'Cancelled'] },
    })
      .populate({
        path: 'items.menuItem',
        select: 'name workstation', // bisa pilih field yg diperlukan
      })
      .populate({
        path: 'reservation',
        populate: [
          { path: 'area_id', select: 'area_name' },
          { path: 'table_id', select: 'table_number' },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    // 🔥 Filter items & buang order yang tidak punya workstation kitchen
    const filteredOrders = orders
      .map((order) => ({
        ...order,
        items: order.items.filter(
          (item) => item.menuItem?.workstation === 'kitchen'
        ),
      }))
      .filter((order) => order.items.length > 0); // hanya order yang punya kitchen items

    res.status(200).json({
      success: true,
      data: filteredOrders, // sudah termasuk reservation populated
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
        select: 'name workstation category', // tambah category untuk filter minuman
      })
      .populate({
        path: 'reservation',
        populate: [
          { path: 'area_id', select: 'area_name' },
          { path: 'table_id', select: 'table_number' },
        ],
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
      }))
      .filter((order) => order.items.length > 0); // hanya order yang punya beverage items

    // 🔥 Filter berdasarkan area meja untuk bar depan/belakang
    const filteredOrders = beverageOrders.filter((order) => {
      if (!order.table_id && !order.reservation) return false;
      
      let tableNumber = '';
      
      // Ambil table number dari reservation atau langsung dari order
      if (order.reservation && order.reservation.table_id) {
        tableNumber = order.reservation.table_id.table_number;
      } else if (order.table_id) {
        tableNumber = order.table_id;
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

    console.log(`Bar ${barType} orders: ${filteredOrders.length} orders found`);

    res.status(200).json({
      success: true,
      data: filteredOrders,
      barType: barType,
      total: filteredOrders.length
    });
  } catch (error) {
    console.error(`Error fetching ${barType} bar orders:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${barType} bar orders`,
    });
  }
};

// ✅ Get all beverage orders (fallback)
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
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter hanya item beverage/bar
    const beverageOrders = orders
      .map((order) => ({
        ...order,
        items: order.items.filter(
          (item) => item.menuItem?.workstation === 'bar' || 
                    item.menuItem?.workstation === 'beverage' ||
                    (item.menuItem?.category && 
                     ['minuman', 'beverage', 'drink'].includes(item.menuItem.category.toLowerCase()))
        ),
      }))
      .filter((order) => order.items.length > 0);

    res.status(200).json({
      success: true,
      data: beverageOrders,
      total: beverageOrders.length
    });
  } catch (error) {
    console.error('Error fetching all beverage orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beverage orders',
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
      .populate('items.menuItem');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Update status order
    order.status = status;
    await order.save();

    // 🔥 EMIT SOCKET EVENTS
    const updateData = {
      order_id: orderId,
      orderStatus: status,
      bartender: { id: bartenderId, name: bartenderName },
      completedItems: completedItems || [],
      timestamp: new Date()
    };

    // Emit ke room customer
    io.to(`order_${orderId}`).emit('order_status_update', updateData);

    // Emit ke cashier
    io.to('cashier_room').emit('beverage_order_updated', updateData);

    // Emit ke bar room sesuai type
    const tableNumber = order.table_id?.toString() || 
                       order.reservation?.table_id?.table_number || '';
    const firstChar = tableNumber.charAt(0).toUpperCase();
    const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';
    
    io.to(barRoom).emit('beverage_order_updated', updateData);

    console.log(`Bar order ${orderId} updated to ${status} by ${bartenderName}`);

    res.status(200).json({ 
      success: true, 
      data: order,
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating bar order status:', error);
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
    const order = await Order.findOne({ order_id: orderId });

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
      bartenderName: bartenderName,
      message: 'Beverage order started preparation',
      timestamp: new Date()
    };

    // Emit ke customer
    io.to(`order_${orderId}`).emit('beverage_preparation_started', startData);

    // Emit ke cashier
    io.to('cashier_room').emit('beverage_preparation_started', startData);

    // Emit ke bar room
    const tableNumber = order.table_id?.toString() || 
                       order.reservation?.table_id?.table_number || '';
    const firstChar = tableNumber.charAt(0).toUpperCase();
    const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';
    
    io.to(barRoom).emit('beverage_preparation_started', startData);

    console.log(`Beverage order ${orderId} started preparation by ${bartenderName}`);

    res.status(200).json({ 
      success: true, 
      data: order,
      message: 'Beverage preparation started'
    });
  } catch (error) {
    console.error('Error starting beverage order:', error);
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
    const order = await Order.findOne({ order_id: orderId });

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
    const tableNumber = order.table_id?.toString() || 
                       order.reservation?.table_id?.table_number || '';
    const firstChar = tableNumber.charAt(0).toUpperCase();
    const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';
    
    io.to(barRoom).emit('beverage_ready', completeData);

    // Juga emit ke waitstaff/runner room
    io.to('waitstaff_room').emit('beverage_ready_for_serve', completeData);

    console.log(`Beverage order ${orderId} completed by ${bartenderName}`);

    res.status(200).json({ 
      success: true, 
      data: order,
      message: 'Beverage order marked as ready'
    });
  } catch (error) {
    console.error('Error completing beverage order:', error);
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
    const order = await Order.findOne({ order_id: orderId });

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
    item.status = status;
    await order.save();

    // 🔥 EMIT SOCKET EVENTS
    const itemUpdateData = {
      order_id: orderId,
      item_id: itemId,
      item_name: item.name,
      status: status,
      bartenderName: bartenderName,
      timestamp: new Date()
    };

    // Emit ke bar room untuk update real-time
    const tableNumber = order.table_id?.toString() || 
                       order.reservation?.table_id?.table_number || '';
    const firstChar = tableNumber.charAt(0).toUpperCase();
    const barRoom = (firstChar >= 'A' && firstChar <= 'I') ? 'bar_depan' : 'bar_belakang';
    
    io.to(barRoom).emit('beverage_item_status_updated', itemUpdateData);

    console.log(`Beverage item ${itemId} in order ${orderId} updated to ${status}`);

    res.status(200).json({ 
      success: true, 
      data: { order, updatedItem: item },
      message: `Item status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating beverage item status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update beverage item status' 
    });
  }
};