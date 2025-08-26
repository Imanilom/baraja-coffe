import { orderQueue } from '../queues/order.queue.js';
import { processOrderItems } from '../services/order.service.js';
import Order from '../models/order.model.js';
import User from '../models/user.model.js'; // jika perlu
import LoyaltyLevel from '../models/LoyaltyLevel.model.js';
import mongoose from 'mongoose';
import { io } from '../socket.js'; // pastikan ini diimport jika pakai socket

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
      outlet,
      type,
      customerType
    } = data;

    if (!items || !outlet) throw new Error('Invalid order data');

    // Buat order ID unik: ORD-31E03-003
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Kalau tidak ada di request, ambil dari user
    if (!customerType && userId && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId).select('consumerType').lean();
      customerType = user?.consumerType || 'guest';
    }

    // Kalau masih kosong, set default
    if (!customerType) {
      customerType = 'guest';
    }
    
    const orderCount = await Order.countDocuments({
      tableNumber,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    

    const personNumber = String(orderCount + 1).padStart(3, '0');
    const formattedOrderId = `ORD-${day}${tableNumber}-${personNumber}`;

    // Proses pesanan (include tax, service, promo, dll)
    const {
      orderItems,
      totalBeforeDiscount,
      totalAfterDiscount,
      discounts,
      appliedPromos,
      appliedManualPromo,
      appliedVoucher,
      taxAndServiceDetails,
      totalTax,
      totalServiceFee,
      grandTotal
    } = await processOrderItems({ items, outletId: outlet, orderType, voucherCode, customerType }, session);

    // Simpan ke database
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
      discounts,
      appliedPromos,
      appliedManualPromo,
      appliedVoucher,
      taxAndServiceDetails,
      totalTax,
      totalServiceFee,
      totalBeforeDiscount,
      totalAfterDiscount,
      grandTotal,
      outlet,
      type: type || (orderType === 'Dine-In' ? 'Indoor' : null),
      status: (paymentMethod === 'Cash' || paymentMethod === 'EDC') ? 'Completed' : 'Pending',
      source
    });

    await newOrder.save({ session });

      // 🎯 Loyalty Points & Level
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId).populate('loyaltyLevel').session(session);
      if (user && user.loyaltyLevel) {
        const { pointsPerCurrency, currencyUnit } = user.loyaltyLevel;

        // Hitung poin tambahan
        const earnedPoints = Math.floor(grandTotal / currencyUnit) * pointsPerCurrency;

        // Tambahkan poin
        user.loyaltyPoints += earnedPoints;

        // Cek kenaikan level
        const nextLevel = await LoyaltyLevel.findOne({
          requiredPoints: { $gt: user.loyaltyLevel.requiredPoints }
        }).sort({ requiredPoints: 1 });

        if (nextLevel && user.loyaltyPoints >= nextLevel.requiredPoints) {
          user.loyaltyLevel = nextLevel._id;
          user.loyaltyPoints += nextLevel.levelUpBonusPoints || 0;
        }

        await user.save({ session });
      }
    }

    await session.commitTransaction();

    if (socketId) {
      io.to(socketId).emit('orderCreated', newOrder);
    }

    io.emit('newOrder', newOrder);

    return {
      success: true,
      orderId: newOrder._id,
      order_id: newOrder.order_id,
      totalAmount: newOrder.grandTotal
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
});
