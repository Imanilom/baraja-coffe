import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { processOrderItems } from '../../services/order.service.js';
import { orderQueue } from '../../queues/order.queue.js';

export async function createOrderHandler({ orderId, orderData, source }) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const processed = await processOrderItems(orderData, session);
    if (!processed) {
      throw new Error('Gagal memproses item order');
    }

    const fullOrderData = {
      ...orderData,
      order_id: orderId,
      items: processed.orderItems,
      totalBeforeDiscount: processed.totalBeforeDiscount,
      totalAfterDiscount: processed.totalAfterDiscount,
      status: source === 'Cashier' ? 'Completed' : 'Pending',
      source,
      appliedPromos: processed.appliedPromos,
      taxAndServiceDetails: processed.taxAndServiceDetails,
      grandTotal: processed.grandTotal,
    };

    const newOrder = new Order(fullOrderData);
    await newOrder.save({ session });

    // Commit transaksi sebelum melakukan operasi async lain
    await session.commitTransaction();

    // Tambahkan job update inventory setelah transaksi sukses
    const orderObjectId = newOrder._id.toString();
    await orderQueue.add(
      'update_inventory',
      {
        orderId: orderObjectId,
        items: processed.orderItems,
      },
      {
        jobId: `update_inventory-${orderObjectId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );

    return { success: true, orderId: orderObjectId };
  } catch (err) {
    // Rollback transaksi jika masih aktif
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error('createOrderHandler error:', err);
    throw err;
  } finally {
    // Tutup sesi database
    await session.endSession();
  }
}
