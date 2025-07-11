import { io } from '../index.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';
import { orderQueue } from '../queues/order.queue.js';
import { broadcastNewOrder } from '../index.js';

export const midtransWebhook = async (req, res) => {
  try {
    const notificationJson = req.body;
    const {
      transaction_status,
      order_id,
      fraud_status,
      payment_type
    } = notificationJson;

    console.log('📥 Received Midtrans notification:', {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      timestamp: new Date().toISOString()
    });

    // Validate critical fields
    if (!order_id || !transaction_status) {
      console.warn('⚠️ Invalid notification: Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Update payment record
    const paymentData = {
      status: transaction_status,
      fraudStatus: fraud_status,
      paymentType: payment_type,
      paidAt: ['settlement', 'capture'].includes(transaction_status) ? new Date() : null,
      updatedAt: new Date()
    };

    const updatedPayment = await Payment.findOneAndUpdate(
      { order_id: order_id },
      paymentData,
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`💰 Payment record updated for order ${order_id}`);

    // Find and validate order
    const order = await Order.findOne({ order_id: order_id })
      .populate('userId', 'name email phone')
      .populate('cashierId', 'name');

    if (!order) {
      console.warn(`⚠️ Order with ID ${order_id} not found`);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Handle different transaction statuses
    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        if (fraud_status === 'accept') {
          // Process successful payment
          order.status = 'Pending';
          order.paymentStatus = 'Paid';
          await order.save();

          // Add to processing queue
          await orderQueue.add('create_order', {
            order: order.toObject(),
            paymentDetails: updatedPayment.toObject()
          }, {
            jobId: order._id.toString(),
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
          });

          // Emit to client
          io.to(order._id.toString()).emit('payment_status_update', {
            order_id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            transaction_status,
            timestamp: new Date()
          });

          // Broadcast to cashier
          const mappedOrder = mapOrderForFrontend(order);
          io.to('cashier_room').emit('new_order', mappedOrder);
          console.log(`✅ Order ${order._id} queued for processing`);

        } else if (fraud_status === 'challenge') {
          // Handle fraud challenge
          order.status = 'Pending';
          order.paymentStatus = 'Challenge';
          await order.save();
          console.log(`⚠️ Payment for order ${order._id} requires fraud review`);
        }
        break;

      case 'deny':
      case 'cancel':
      case 'expire':
        // Handle failed payments
        order.status = 'Canceled';
        order.paymentStatus = 'Failed';
        await order.save();
        console.log(`❌ Order ${order._id} payment failed (${transaction_status})`);
        break;

      case 'pending':
        // Handle pending payments
        order.status = 'Pending';
        order.paymentStatus = 'Pending';
        await order.save();
        console.log(`ℹ️ Order ${order._id} payment pending`);
        break;

      default:
        console.warn(`⚠️ Unhandled transaction status: ${transaction_status}`);
    }

    // Emit global status update
    io.emit('order_status_update', {
      order_id: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      timestamp: new Date()
    });

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('❌ Webhook processing error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      message: 'Failed to process webhook',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to map order data for frontend
function mapOrderForFrontend(order) {
  return {
    _id: order._id,
    orderId: order.order_id,
    userId: order.userId?._id || order.userId,
    customerName: order.userId?.name || order.user,
    customerPhone: order.userId?.phone || order.phoneNumber,
    cashierId: order.cashierId?._id || order.cashierId,
    cashierName: order.cashierId?.name,
    items: order.items.map(item => ({
      _id: item._id,
      menuItemId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      isPrinted: item.isPrinted || false,
      selectedAddons: item.selectedAddons?.map(addon => ({
        _id: addon._id || addon.id,
        name: addon.name,
        options: addon.options?.map(opt => ({
          id: opt._id || opt.id,
          label: opt.label,
          price: opt.price
        })) || []
      })) || [],
      selectedToppings: item.selectedToppings?.map(topping => ({
        id: topping._id || topping.id,
        name: topping.name,
        price: topping.price
      })) || []
    })),
    status: order.status,
    paymentStatus: order.paymentStatus,
    orderType: order.orderType,
    deliveryAddress: order.deliveryAddress,
    tableNumber: order.tableNumber,
    paymentMethod: order.paymentMethod,
    totalBeforeDiscount: order.totalBeforeDiscount,
    totalAfterDiscount: order.totalAfterDiscount,
    taxAndService: order.taxAndService,
    grandTotal: order.grandTotal,
    appliedPromos: order.appliedPromos || [],
    source: order.source,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}