import { Order } from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';
import midtransClient from 'midtrans-client';

// Initialize Midtrans API client
const snap = new midtransClient.Snap({
  isProduction: false, // Change to true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Create an order
export const createOrder = async (req, res) => {
  try {
    const { user, items, totalPrice, orderType, deliveryAddress, tableNumber, voucher } = req.body;

    // Create the order
    const order = new Order({
      user,
      items,
      totalPrice,
      orderType,
      deliveryAddress,
      tableNumber,
      voucher,
    });

    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: savedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

// Initiate payment
export const initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('user');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Midtrans transaction parameters
    const parameter = {
      transaction_details: {
        order_id: `ORDER-${order._id}`,
        gross_amount: order.totalPrice,
      },
      customer_details: {
        email: order.user.email,
        first_name: order.user.name,
      },
      item_details: order.items.map(item => ({
        id: item.menuItem,
        price: item.subtotal / item.quantity,
        quantity: item.quantity,
        name: `MenuItem - ${item.menuItem}`,
      })),
    };

    const transaction = await snap.createTransaction(parameter);

    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      paymentUrl: transaction.redirect_url,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message,
    });
  }
};

// Handle Midtrans notifications
export const handleNotification = async (req, res) => {
  try {
    const notification = req.body;

    const statusResponse = await snap.transaction.notification(notification);

    const { order_id, transaction_status, gross_amount, payment_type } = statusResponse;

    // Extract Order ID from transaction ID
    const orderId = order_id.replace('ORDER-', '');

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found for notification',
      });
    }

    // Update payment status
    const payment = new Payment({
      order: orderId,
      amount: gross_amount,
      paymentDate: new Date(),
      paymentMethod: payment_type,
      status: transaction_status === 'capture' || transaction_status === 'settlement' ? 'Success' : 'Failed',
    });

    await payment.save();

    // Update order status based on payment success
    order.status = transaction_status === 'capture' || transaction_status === 'settlement' ? 'Completed' : 'Pending';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Notification handled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to handle notification',
      error: error.message,
    });
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ user: userId }).populate('items.menuItem').populate('items.toppings');

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};
