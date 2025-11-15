// controllers/openBill.controller.js
import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import Reservation from '../models/Reservation.model.js';
import Table from '../models/Table.model.js';
import Area from '../models/Area.model.js';
import Payment from '../models/Payment.model.js';
import Joi from 'joi';

// Helper untuk get WIB time sekarang
const getWIBNow = () => {
  const now = new Date();
  const wibOffset = 7 * 60 * 60 * 1000;
  return new Date(now.getTime() + wibOffset);
};

// Schema untuk menambah item ke order
const addOrderItemSchema = Joi.object({
  menuItem: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).max(100).required(),
  subtotal: Joi.number().min(0).required(), // Tambahkan subtotal
  notes: Joi.string().optional().allow(''),
  guestName: Joi.string().optional().allow('')
});

// Schema untuk close order
const closeOrderSchema = Joi.object({
  final_notes: Joi.string().optional().allow(''),
  payment_method: Joi.string().valid('Cash', 'E-Wallet', 'Bank Transfer', 'Credit Card', 'QRIS', 'Debit').required(),
  amount_paid: Joi.number().min(0).required(),
  change: Joi.number().min(0).optional().default(0)
});

// Get all open bills - FIXED VERSION
export const getOpenBills = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, table_number, area_id } = req.query;
    
    console.log('🔍 Fetching open bills with filters:', { 
      page, limit, status, table_number, area_id 
    });

    let query = { isOpenBill: true };
    
    // Filter by status jika ada
    if (status) {
      query.status = status;
    } else {
      // Default hanya tampilkan yang masih aktif
      query.status = { $in: ['Pending', 'Confirmed', 'In Progress', 'OnProcess', 'Waiting'] };
    }
    
    // Build aggregation pipeline untuk handling complex population
    let aggregationPipeline = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ];

    // Lookup reservation data
    aggregationPipeline.push({
      $lookup: {
        from: 'reservations',
        localField: 'reservation',
        foreignField: '_id',
        as: 'reservationData'
      }
    });

    // Lookup menu items untuk order items
    aggregationPipeline.push({
      $lookup: {
        from: 'menuitems',
        localField: 'items.menuItem',
        foreignField: '_id',
        as: 'menuItemsData'
      }
    });

    // Add fields untuk memudahkan frontend
    aggregationPipeline.push({
      $addFields: {
        reservation: { $arrayElemAt: ['$reservationData', 0] },
        populatedItems: {
          $map: {
            input: '$items',
            as: 'item',
            in: {
              $mergeObjects: [
                '$$item',
                {
                  menuItem: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$menuItemsData',
                          as: 'menuItem',
                          cond: { $eq: ['$$menuItem._id', '$$item.menuItem'] }
                        }
                      },
                      0
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    });

    // Filter tambahan berdasarkan table number jika ada
    if (table_number) {
      aggregationPipeline.unshift({
        $match: {
          ...query,
          tableNumber: { $regex: table_number, $options: 'i' }
        }
      });
    }

    // Filter berdasarkan area_id jika ada (lebih complex, perlu lookup reservation dulu)
    if (area_id) {
      // Untuk filter area, kita perlu proses dua tahap
      const orders = await Order.aggregate(aggregationPipeline);
      
      // Filter manual berdasarkan area_id
      const filteredOrders = [];
      for (let order of orders) {
        if (order.reservation) {
          const reservation = await Reservation.findById(order.reservation)
            .populate('table_id')
            .populate('area_id');
          
          if (reservation && reservation.area_id && 
              reservation.area_id._id.toString() === area_id) {
            order.reservation = reservation;
            filteredOrders.push(order);
          }
        } else {
          // Jika tidak ada reservation, skip atau include berdasarkan logic bisnis
          filteredOrders.push(order);
        }
      }

      const total = await Order.countDocuments(query);

      return res.json({
        success: true,
        data: filteredOrders,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    }

    // Eksekusi aggregation pipeline
    const orders = await Order.aggregate(aggregationPipeline);

    // Populate table and area information untuk orders dengan reservation
    for (let order of orders) {
      if (order.reservation) {
        const reservation = await Reservation.findById(order.reservation)
          .populate('table_id')
          .populate('area_id');
        order.reservation = reservation;
      }
    }

    const total = await Order.countDocuments(query);

    console.log(`✅ Found ${orders.length} open bills`);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('❌ Error getting open bills:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting open bills',
      error: error.message
    });
  }
};

// Get open bill by ID - FIXED VERSION
export const getOpenBillById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Fetching open bill detail for:', id);

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    // Populate table and area information jika ada reservation
    if (order.reservation) {
      const reservation = await Reservation.findById(order.reservation)
        .populate('table_id')
        .populate('area_id');
      order.reservation = reservation;
    }

    console.log(`✅ Open bill detail loaded: ${order.order_id}`);

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('❌ Error getting open bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting open bill',
      error: error.message
    });
  }
};

// Add item to open bill - FIXED VERSION
export const addItemToOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const { error, value } = addOrderItemSchema.validate(req.body);
    
    if (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { menuItem, quantity, subtotal, notes, guestName } = value;

    console.log('➕ Adding item to open bill:', { orderId: id, menuItem, quantity, subtotal });

    // Find the open bill order
    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    if (order.status === 'Completed' || order.status === 'Canceled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot add items to completed or canceled order'
      });
    }

    // Add new item
    const newItem = {
      menuItem,
      quantity,
      subtotal,
      notes: notes || '',
      guestName: guestName || '',
      dineType: 'Dine-In',
      addedAt: getWIBNow(),
      kitchenStatus: 'pending',
      isPrinted: false,
      batchNumber: order.currentBatch
    };

    order.items.push(newItem);

    // Recalculate totals
    const itemsTotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
    const customAmountTotal = order.customAmountItems.reduce((sum, item) => sum + item.amount, 0);
    
    order.totalBeforeDiscount = itemsTotal;
    order.totalAfterDiscount = itemsTotal;
    order.grandTotal = itemsTotal + customAmountTotal;
    order.lastItemAddedAt = getWIBNow();

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Item added to order ${order.order_id}`);

    // Populate the updated order
    const updatedOrder = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    res.json({
      success: true,
      message: 'Item added successfully',
      data: updatedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error adding item to open bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to open bill',
      error: error.message
    });
  }
};

// Remove item from open bill - FIXED VERSION
export const removeItemFromOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id, itemId } = req.params;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    console.log('➖ Removing item from open bill:', { orderId: id, itemId });

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    if (order.status === 'Completed' || order.status === 'Canceled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot remove items from completed or canceled order'
      });
    }

    // Find and remove the item
    const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Item not found in order'
      });
    }

    order.items.splice(itemIndex, 1);

    // Recalculate totals
    const itemsTotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
    const customAmountTotal = order.customAmountItems.reduce((sum, item) => sum + item.amount, 0);
    
    order.totalBeforeDiscount = itemsTotal;
    order.totalAfterDiscount = itemsTotal;
    order.grandTotal = itemsTotal + customAmountTotal;

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Item removed from order ${order.order_id}`);

    const updatedOrder = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    res.json({
      success: true,
      message: 'Item removed successfully',
      data: updatedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error removing item from open bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from open bill',
      error: error.message
    });
  }
};

// controllers/openBill.controller.js - Close Open Bill (Pending Payment)
export const closeOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const { error, value } = closeOrderSchema.validate(req.body);
    
    if (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { final_notes, payment_method, amount_paid, change } = value;

    console.log('💰 Closing open bill (Pending Payment):', { 
      orderId: id, 
      payment_method, 
      amount_paid,
      status: 'Pending' 
    });

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    if (order.status === 'Completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Order is already completed'
      });
    }

    if (order.status === 'Canceled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot complete canceled order'
      });
    }

    // Validasi jumlah bayar
    if (amount_paid < order.grandTotal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Amount paid (${amount_paid}) is less than total amount (${order.grandTotal})`
      });
    }

    // ✅ PERBAIKAN: Update order status menjadi "Pending" saja, bukan "Completed"
    order.status = 'Pending'; // Customer bayar di kasir
    order.isOpenBill = false; // Tetap tutup open bill
    order.paymentMethod = payment_method;
    order.change = change || 0;
    
    if (final_notes) {
      order.notes = order.notes ? `${order.notes}\n${final_notes}` : final_notes;
    }

    // ✅ PERBAIKAN: Jangan update reservation status ke 'completed'
    // Biarkan reservation status sesuai dengan flow reservation
    if (order.reservation) {
      const reservation = await Reservation.findById(order.reservation).session(session);
      if (reservation) {
        // Hanya update check_out_time jika diperlukan
        // Tapi status reservation tetap sesuai business flow
        reservation.check_out_time = getWIBNow();
        await reservation.save({ session });
      }
    }

    // ✅ PERBAIKAN: Create payment record dengan status 'pending'
    const paymentCode = `PAY-${order.order_id}-${Date.now()}`;
    const paymentRecord = new Payment({
      order_id: order.order_id,
      payment_code: paymentCode,
      method: payment_method,
      status: 'pending', // Status payment pending - customer bayar di kasir
      paymentType: 'Full', // Gunakan 'Full' sesuai enum Payment model
      amount: order.grandTotal,
      totalAmount: order.grandTotal,
      remainingAmount: 0,
      phone: '',
      currency: 'IDR',
      amount_paid: amount_paid,
      change: change || 0,
      // Tambahan field untuk struk
      tendered_amount: amount_paid,
      change_amount: change || 0
    });

    await paymentRecord.save({ session });
    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Order ${order.order_id} closed successfully with Pending status`);

    // Populate the updated order
    const updatedOrder = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    res.json({
      success: true,
      message: 'Order closed successfully. Customer will pay at cashier.',
      data: {
        order: updatedOrder,
        payment: paymentRecord
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error closing open bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing open bill',
      error: error.message
    });
  }
};

// Cancel open bill - FIXED VERSION
export const cancelOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    console.log('❌ Canceling open bill:', { orderId: id, cancellation_reason });

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    if (order.status === 'Completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed order'
      });
    }

    // Update order status
    order.status = 'Canceled';
    order.isOpenBill = false;
    
    if (cancellation_reason) {
      order.cancellationReason = cancellation_reason;
    }

    // Update reservation status jika exists
    if (order.reservation) {
      const reservation = await Reservation.findById(order.reservation).session(session);
      if (reservation) {
        reservation.status = 'cancelled';
        await reservation.save({ session });
      }
    }

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Order ${order.order_id} canceled successfully`);

    res.json({
      success: true,
      message: 'Order canceled successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error canceling open bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error canceling open bill',
      error: error.message
    });
  }
};

export default {
  getOpenBills,
  getOpenBillById,
  addItemToOpenBill,
  removeItemFromOpenBill,
  closeOpenBill,
  cancelOpenBill
};