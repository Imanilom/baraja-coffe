import { io } from '../index.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';

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

    // Update or create payment record
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

    // Find related order
    const order = await Order.findOne({ order_id: order_id })
      .populate('user_id', 'name email phone')
      .populate('cashierId', 'name');

    if (!order) {
      console.warn(`⚠️ Order with ID ${order_id} not found`);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`🧾 Order ${order_id} found. Source: ${order.source}`);

    // Handle transaction status
    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        if (fraud_status === 'accept') {
          order.status = 'Pending'; // Ready to process
          order.paymentStatus = 'Paid';
          await order.save();

          console.log(`✅ Order ${order_id} marked as paid`);

          // Notify client
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
        } else if (fraud_status === 'challenge') {
          order.status = 'Pending';
          order.paymentStatus = 'Challenge';
          await order.save();

          console.log(`⚠️ Order ${order_id} payment challenged`);
        }
        break;

      case 'deny':
      case 'cancel':
      case 'expire':
        order.status = 'Canceled';
        order.paymentStatus = 'Failed';
        await order.save();

        console.log(`❌ Order ${order_id} payment failed: ${transaction_status}`);
        break;

      case 'pending':
        order.status = 'Pending';
        order.paymentStatus = 'Pending';
        await order.save();

        console.log(`ℹ️ Order ${order_id} is still pending`);
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

// 🔧 Helper: map order to frontend-safe format
function mapOrderForFrontend(order) {
  return {
    _id: order._id,
    orderId: order.order_id,
    userId: order.user_id?._id || order.user_id,
    customerName: order.user_id?.name || order.user,
    customerPhone: order.user_id?.phone || order.phoneNumber,
    cashierId: order.cashierId?._id || order.cashierId,
    cashierName: order.cashierId?.name,
    items: order.items.map(item => ({
      _id: item._id,
      menuItemId: item.menuItem,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      isPrinted: item.isPrinted || false,
      selectedAddons: item.selectedAddons || [],
      selectedToppings: item.selectedToppings || []
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
