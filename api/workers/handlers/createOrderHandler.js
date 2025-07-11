import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { processOrderItems } from '../../services/order.service.js';
import { orderQueue } from '../../queues/order.queue.js';
import { runWithTransactionRetry } from '../../utils/transactionHandler.js';



export async function createOrderHandler({ orderId, orderData, source }) {
  try {
    const orderResult = await runWithTransactionRetry(async (session) => {
      const processed = await processOrderItems(orderData, session);
      if (!processed) {
        throw new Error('Failed to process order items');
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
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newOrder = new Order(fullOrderData);
      await newOrder.save({ session });

      return { 
        success: true, 
        orderId: newOrder._id.toString(),
        processedItems: processed.orderItems,
        sessionId: session.id // Pass session info for debugging
      };
    });

    // Only proceed to queue if transaction succeeded
    const queueResult = await enqueueInventoryUpdate(orderResult);
    console.log('Order and inventory queue processed:', queueResult);
    return queueResult;

  } catch (err) {
    console.error('Order processing failed:', {
      error: err.message,
      stack: err.stack,
      orderId,
      source
    });
    if (err.message.includes('Failed to process order items')) {
      throw new Error(`Order processing failed: ${err.message}`);
    }
    throw err;
  }
}


// Separate function to handle queue operations after successful transaction
export async function enqueueInventoryUpdate(orderResult) {
  try {
    if (!orderResult.success) {
      throw new Error('Cannot enqueue inventory update for failed order');
    }

    await orderQueue.add(
      'update_inventory', // This is the queue name, not the job type
      {
        type: 'update_inventory', // Add this required field
        payload: {
          orderId: orderResult.orderId,
          items: orderResult.processedItems,
          sessionInfo: orderResult.sessionId
        }
      },
      {
        jobId: `update_inventory-${orderResult.orderId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: true
      }
    );

    return { success: true, orderId: orderResult.orderId };
  } catch (err) {
    console.error('enqueueInventoryUpdate error:', err);
    throw err;
  }
}

// Updated usage example:
/*
try {
  const orderResult = await createOrderHandler({ orderId, orderData, source });
  const queueResult = await enqueueInventoryUpdate(orderResult);
  return queueResult;
} catch (err) {
  // Handle error
}
*/