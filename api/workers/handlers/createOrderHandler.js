import { startSession } from 'mongoose';
import { Order } from '../../models/Order.model.js';

export async function createOrderHandler(data) {
  const session = await startSession();
  session.startTransaction();
  try {
    // Proses order kamu di sini
    const { orderDetails } = data;
    const order = new Order(orderDetails);
    await order.save({ session });

    // Update stok bahan baku, dll

    await session.commitTransaction();
    return { success: true, orderId: order._id };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
