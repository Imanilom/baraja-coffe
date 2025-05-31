import { orderQueue } from '../queues/order.queue.js';
import { processOrderItems } from '../services/order.service.js';
import Order from '../models/Order.model.js';
import mongoose from 'mongoose';

orderQueue.process(async (job) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { data } = job;
    const {
      source,
      socketId,
      userId,
      userName,
      cashierId,
      items,
      orderType,
      tableNumber,
      deliveryAddress,
      pickupTime,
      paymentMethod,
      voucherCode,
      totalPrice,
      outlet,
      type
    } = data;

    // Validasi input dasar
    if (!items || !outlet) throw new Error('Invalid order data');

    // Proses item pesanan
    const orderItems = await processOrderItems(items, session);

    // Hitung total harga awal
    const baseTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Simpan order ke database
    const newOrder = new Order({
      order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: userName || (await User.findById(userId))?.name || 'Guest',
      cashier: cashierId || null,
      items: orderItems,
      paymentMethod,
      orderType,
      tableNumber,
      deliveryAddress,
      pickupTime,
      voucher: voucherCode || null,
      outlet,
      type: type || (orderType === 'Dine-In' ? 'Indoor' : null),
      status: 'Pending',
      source
    });

    await newOrder.save({ session });

    // Jika pembayaran langsung lunas
    if (paymentMethod === 'Cash' || paymentMethod === 'EDC') {
      newOrder.status = 'Completed';
      await newOrder.save({ session });
    }

    await session.commitTransaction();

    // Emit via socket.io jika ada
    if (socketId) {
      io.to(socketId).emit('orderCreated', newOrder);
    }

    io.emit('newOrder', newOrder); // Broadcast ke semua client

    return {
      success: true,
      orderId: newOrder._id,
      order_id: newOrder.order_id,
      totalAmount: newOrder.totalPrice
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
});