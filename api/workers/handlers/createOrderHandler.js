import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { processOrderItems } from '../../services/order.service.js';

export async function createOrderHandler({ orderId, orderData, source }) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Proses order items lengkap di sini
    const processed = await processOrderItems(orderData, session);

    // Gabungkan hasil dengan order data asli
    const fullOrderData = {
      ...orderData,
      order_id: orderId,
      items: processed.orderItems,
      totalBeforeDiscount: processed.totalBeforeDiscount,
      totalAfterDiscount: processed.totalAfterDiscount,
      discounts: processed.discounts,
      status: source === 'Cashier' ? 'Completed' : 'Pending',
      source,
    };

    const newOrder = new Order(fullOrderData);
    await newOrder.save({ session });

    // Update stok dan lain-lain di sini atau dengan job terpisah

    await session.commitTransaction();

    return { success: true, orderId: newOrder._id };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
