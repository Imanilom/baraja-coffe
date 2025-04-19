import { Order } from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';
import { MenuItem } from "../models/MenuItem.model.js";
import { RawMaterial } from "../models/RawMaterial.model.js";
import { snap, coreApi } from '../utils/MidtransConfig.js';
import mongoose from 'mongoose';
import axios from 'axios';

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { 
      order: orderData, 
      order: { 
      userId, 
      user, 
      cashier, 
      items, 
      paymentMethod, 
      orderType, 
      outlet, 
      deliveryAddress, 
      tableNumber, 
      type, 
      voucher 
      } 
    } = req.body;
    // Validasi dasar
    if (!items || items.length === 0) {
      throw new Error("Order items cannot be empty");
    }

    // Hitung total harga dan validasi item
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem).session(session);
      if (!menuItem) {
        throw new Error(`Menu item ${item.menuItem} not found`);
      }

      orderItems.push({
        menuItem: item.menuItem,
        toppings: item.toppings || [],
        quantity: item.quantity,
        subtotal,
        isPrinted: false,
      });

      totalPrice += subtotal;
    }

    // Pastikan gross_amount adalah integer
    totalPrice = Math.round(totalPrice);

    // Buat order
    const order = new Order({
      userId,
      user,
      cashier,
      items: orderItems,
      totalPrice,
      paymentMethod,
      orderType,
      outlet,
      deliveryAddress: orderType === 'Delivery' ? deliveryAddress : undefined,
      tableNumber: orderType === 'Dine-In' ? tableNumber : undefined,
      type: orderType === 'Dine-In' ? type : undefined,
      voucher: voucher || undefined,
      status: "Pending",
    });

    await order.save({ session });

    // Proses pembayaran
    let paymentResponse = {};
    let payment;

    if (paymentMethod === "Cash") {
      payment = new Payment({
        order: order._id,
        amount: totalPrice,
        paymentMethod,
        status: "Pending",
      });
      await payment.save({ session });
      paymentResponse = { cashPayment: "Pending confirmation" };
    } else {

      // Parameter transaksi
      const parameter = {
        transaction_details: {
          order_id: order._id.toString(),
          gross_amount: totalPrice,
        },
        customer_details: {
          first_name: user.name || 'Customer',
          email: user.email || 'customer@example.com',
        }
      };

      // Tentukan payment type
      switch (paymentMethod.toLowerCase()) {
        case 'qris':
          parameter.payment_type = 'qris';
          break;
        case 'gopay':
          parameter.payment_type = 'gopay';
          parameter.gopay = {
            enable_callback: true,
            callback_url: 'yourapp://callback'
          };
          break;
        case 'credit_card':
          parameter.payment_type = 'credit_card';
          parameter.credit_card = {
            secure: true
          };
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      // Create Midtrans transaction
      const midtransResponse = await coreApi.charge(parameter);

      // Simpan detail pembayaran
      payment = new Payment({
        order: order._id,
        amount: totalPrice,
        paymentMethod,
        status: "Pending",
        paymentDate: new Date(),
        transactionId: midtransResponse.transaction_id,
        paymentDetails: midtransResponse,
      });

      await payment.save({ session });
      paymentResponse = midtransResponse;
    }

    // Update stok bahan baku
    await updateStock(order, session);

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      order: order.toJSON(),
      payment: paymentResponse
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Order Error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  } finally {
    session.endSession();
  }
};


export const checkout = async (req, res) => {
  const { orders, user, cashier, table, paymentMethod, orderType, type, voucher} = req.body;
 
  try {
    // Hitung total dari semua order
    const orderItems = orders.map(order => {
      const basePrice = order.item.price || 0;
      const addons = order.item.addons || [];
      const toppings = order.item.toppings || [];

      const addonsTotal = addons.reduce((sum, a) => sum + (a.price || 0), 0);
      const toppingsTotal = toppings.reduce((sum, t) => sum + (t.price || 0), 0);
      const itemTotal = basePrice + addonsTotal + toppingsTotal;

      return {
        menuItem: order.item.id,
        quantity: 1,
        subtotal: itemTotal,
        addons,
        toppings,
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Buat data transaksi untuk Midtrans
    const transactionData = {
      payment_type: 'gopay', // Hanya E-Wallet (GoPay)
      transaction_details: {
        order_id: `order-${Date.now()}`,
        gross_amount: totalAmount,
      },
      item_details: orders.map(order => {
        const basePrice = order.item.price || 0;
        const addons = order.item.addons || [];
        const toppings = order.item.toppings || [];

        const addonsTotal = addons.reduce((sum, a) => sum + (a.price || 0), 0);
        const toppingsTotal = toppings.reduce((sum, t) => sum + (t.price || 0), 0);
        const itemTotal = basePrice + addonsTotal + toppingsTotal;

        return {
          id: order.item.id,
          name: order.item.name,
          price: itemTotal,
          quantity: 1,
        };
      }),
      customer_details: {
        name: 'Customer',
        email: 'customer@example.com',
        phone: '081234567890',
      },
    };

    // Request ke Midtrans
    const generateRandomToken = () => Math.random().toString().slice(2, 12);
    const order_id = `order-${generateRandomToken()}`;
    const midtransSnapResponse = await axios.post(
      process.env.MIDTRANS_SANDBOX_ENDPOINT_TRANSACTION,
      {
      transaction_details: {
        order_id: order_id,
        gross_amount: totalAmount,
      },
      item_details: transactionData.item_details,
      customer_details: transactionData.customer_details,
      },
      {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
      },
      }
    );

    // Simpan ke database
    const newOrder = new Order({
      order_id: order_id,
      user,
      cashier,
      items: orderItems,
      paymentMethod: paymentMethod,
      orderType: orderType,
      type: type, 
      tableNumber: table
    });

    await newOrder.save();

    // Kembalikan URL pembayaran
    res.json({ redirect_url: midtransSnapResponse.data.redirect_url });
  } catch (error) {
    if (error.response) {
      console.error('Midtrans error:', error.response.data);
      res.status(error.response.status).json({ message: error.response.data.message || 'Payment processing failed.' });
    } else if (error.request) {
      console.error('No response received:', error.request);
      res.status(500).json({ message: 'No response from payment gateway.' });
    } else {
      console.error('Checkout error:', error.message);
      res.status(500).json({ message: 'An error occurred while processing your checkout.' });
    }
  }
};

// Handling Midtrans Notification 
export const paymentNotification = async (req, res) => {
  const notification = req.body;

  // Log the notification for debugging
  console.log('Payment notification received:', notification);

  // Extract relevant information from the notification
  const { transaction_status, order_id, gross_amount, payment_type } = notification;

  try {
      // Update the payment record in the database based on the transaction status
      let status;
      switch (transaction_status) {
          case 'capture':
          case 'settlement':
              // Payment has been captured or settled
              status = 'Success';
              break;
          case 'pending':
              // Payment is pending
              status = 'Pending';
              break;
          case 'deny':
          case 'cancel':
          case 'expire':
              // Payment was denied, canceled, or expired
              status = 'Failed';
              break;
          default:
              console.log('Unknown transaction status:', transaction_status);
              return res.status(400).json({ message: 'Unknown transaction status' });
      }

      // Update or create a payment record
      await Payment.updateOne(
          { order_id: order_id },
          {
              $set: {
                  amount: parseFloat(gross_amount),
                  paymentDate: new Date(),
                  paymentMethod: payment_type,
                  status: status,
              },
              $setOnInsert: {
                  order_id: order_id, // Insert if not exists
              },
          },
          { upsert: true }
      );

      console.log('Payment record updated successfully for order:', order_id);
      res.status(200).json({ message: 'Notification processed and database updated' });

  } catch (error) {
      console.error('Error updating payment record:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};



async function updateStock(order, session) {
  if (!Array.isArray(order.items)) {
    throw new Error("Order items must be an array");
  }

  for (const item of order.items) {
    const menuItem = await MenuItem.findById(item.menuItem).session(session);
    if (!menuItem) {
      throw new Error(`Menu item ${item.menuItem} not found`);
    }

    // Update stok bahan baku untuk menu item
    for (const material of menuItem.rawMaterials) {
      await mongoose.model("RawMaterial").updateOne(
        { _id: material.materialId },
        { $inc: { quantity: -material.quantityRequired * item.quantity } },
        { session }
      );
    }
  }
}

export const handleMidtransNotification = async (req, res) => {
  try {
    const { order_id, transaction_status } = req.body;

    const payment = await Payment.findOne({ order: order_id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    payment.status = transaction_status === 'settlement' ? 'Success' : 'Failed';
    await payment.save();

    res.status(200).json({ message: 'Payment status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get User Orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};


// Get History User orders
export const getUserOrderHistory = async (req, res) => {
  try {
    const userId = req.params.userId; // Mengambil ID user dari parameter URL
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Mencari semua pesanan dengan field "user" yang sesuai dengan ID user
    const orders = await Order.find({ customerId: userId })
      .populate('items.menuItem') // Mengisi detail menu item (opsional)
      .populate('voucher'); // Mengisi detail voucher (opsional)

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No order history found for this user.' });
    }

    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get Cashier Order History
export const getCashierOrderHistory = async (req, res) => {
  try {
    const cashierId = req.params.cashierId; // Mengambil ID kasir dari parameter URL
    if (!cashierId) {
      return res.status(400).json({ message: 'Cashier ID is required.' });
    }

    // Mencari semua pesanan dengan field "cashier" yang sesuai dengan ID kasir
    const orders = await Order.find({ cashier: cashierId })
      .populate('items.menuItem') // Mengisi detail menu item (opsional)
      .populate('voucher'); // Mengisi detail voucher (opsional)

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No order history found for this cashier.' });
    }

    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};