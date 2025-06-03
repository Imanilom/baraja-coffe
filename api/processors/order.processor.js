import { orderQueue } from '../queues/order.queue.js';
import { processOrderItems } from '../services/order.service.js';
import Order from '../models/Order.model.js';
import mongoose from 'mongoose';

// Ambil tanggal (misal: 31)
const today = new Date();
const day = String(today.getDate()).padStart(2, '0');

// Hitung jumlah orang yang sudah order di meja ini hari ini
const startOfDay = new Date(today.setHours(0, 0, 0, 0));
const endOfDay = new Date(today.setHours(23, 59, 59, 999));

const orderCount = await Order.countDocuments({
  tableNumber,
  createdAt: { $gte: startOfDay, $lte: endOfDay }
});

// Format: ORD-31E03-003
const personNumber = String(orderCount + 1).padStart(3, '0');
const formattedOrderId = `ORD-${day}${tableNumber}-${personNumber}`;


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
      order_id: formattedOrderId,
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