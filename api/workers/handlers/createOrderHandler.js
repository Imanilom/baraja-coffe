import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { processOrderItems } from '../../services/order.service.js';
import { orderQueue } from '../../queues/order.queue.js';

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

    await session.commitTransaction();

    await orderQueue.add('update_inventory', {
      orderId: newOrder._id.toString(),
      items: processed.orderItems,
    }, { jobId: `update_inventory-${newOrder._id.toString()}` });

    return { success: true, orderId: newOrder._id };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
