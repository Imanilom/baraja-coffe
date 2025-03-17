import { Order } from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';
import { MenuItem } from "../models/MenuItem.model.js";
import Topping from "../models/Topping.model.js";
import { RawMaterial } from "../models/RawMaterial.model.js";
import midtransClient from 'midtrans-client';
import mongoose from 'mongoose';

// Midtrans Configuration
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const orderData = req.body.order;
    const { user, cashier, items, paymentMethod, orderType, deliveryAddress, tableNumber, type, voucher } = orderData;

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

      const toppings = await Topping.find({ _id: { $in: item.toppings || [] } }).session(session);
      const toppingsTotal = toppings.reduce((sum, topping) => sum + (topping.price || 0), 0);
      const subtotal = (menuItem.price + toppingsTotal) * item.quantity;

      orderItems.push({
        menuItem: item.menuItem,
        toppings: item.toppings || [],
        quantity: item.quantity,
        subtotal,
        isPrinted: false,
      });

      totalPrice += subtotal;
    }

    // Buat order
    const order = new Order({
      user,
      cashier,
      items: orderItems,
      totalPrice,
      paymentMethod,
      orderType,
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
      // Konfigurasi pembayaran digital
      const parameter = {
        transaction_details: {
          order_id: order._id.toString(),
          gross_amount: totalPrice,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: user.name || 'Customer', // Asumsikan user memiliki properti name
          email: user.email || 'customer@example.com',
        }
      };

      // Set payment type berdasarkan metode pembayaran
      switch(paymentMethod.toLowerCase()) {
        case 'qris':
          parameter.enabled_payments = ['qris'];
          break;
        case 'gopay':
          parameter.enabled_payments = ['gopay'];
          break;
        case 'credit_card':
          parameter.enabled_payments = ['credit_card'];
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      // Create Midtrans transaction
      const midtransTransaction = await snap.createTransaction(parameter);

      // Simpan detail pembayaran
      payment = new Payment({
        order: order._id,
        amount: totalPrice,
        paymentMethod,
        status: "Pending",
        paymentDate: new Date(),
        transactionId: midtransTransaction.transaction_id,
        paymentDetails: midtransTransaction,
      });
      
      await payment.save({ session });
      paymentResponse = midtransTransaction;
    }

    // Update stok bahan baku (asumsi fungsi ini sudah ada)
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


    // Update stok bahan baku untuk toppings
    const toppings = await Topping.find({ _id: { $in: item.toppings || [] } }).session(session);
    for (const topping of toppings) {
      for (const material of topping.rawMaterials) {
        await mongoose.model("RawMaterial").updateOne(
          { _id: material.materialId },
          { $inc: { quantity: -material.quantityRequired * item.quantity } },
          { session }
        );
      }
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
      .populate('items.toppings')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};