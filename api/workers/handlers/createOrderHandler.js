import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { processOrderItems } from '../../services/order.service.js';
import { orderQueue } from '../../queues/order.queue.js';
import { runWithTransactionRetry } from '../../utils/transactionHandler.js';

export async function createOrderHandler({ orderId, orderData, source }) {
  try {
    const orderResult = await runWithTransactionRetry(async (session) => {
      // Process order items with inventory updates
      const processed = await processOrderItems(orderData, session);
      if (!processed) {
        throw new Error('Failed to process order items');
      }

      const {
        orderItems,
        totals,
        discounts,
        promotions,
        taxesAndFees
      } = processed;

      // Determine initial status based on source and payment method
      let initialStatus = 'Pending';
      if (source === 'Cashier') {
        initialStatus = orderData.paymentMethod === 'Cash' ? 'Completed' : 'Pending';
      }

      // Build complete order document
      const fullOrderData = {
        ...orderData,
        order_id: orderId,
        items: orderItems,
        totalBeforeDiscount: totals.beforeDiscount,
        totalAfterDiscount: totals.afterDiscount,
        tax: totals.tax,
        serviceFee: totals.serviceFee,
        grandTotal: totals.grandTotal,
        status: initialStatus,
        source,
        appliedPromos: promotions.appliedPromos,
        appliedManualPromo: promotions.appliedManualPromo,
        appliedVoucher: promotions.appliedVoucher,
        discounts: {
          autoPromoDiscount: discounts.autoPromoDiscount,
          manualDiscount: discounts.manualDiscount,
          voucherDiscount: discounts.voucherDiscount,
          total: discounts.total
        },
        taxAndServiceDetails: taxesAndFees,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create and save the order
      const newOrder = new Order(fullOrderData);
      await newOrder.save({ session });

      return {
        success: true,
        orderId: newOrder._id.toString(),
        orderNumber: orderId, // Keep the original order ID for reference
        processedItems: orderItems,
        sessionInfo: {
          id: session.id,
          transactionId: session.transaction.id
        }
      };
    });

    // Enqueue inventory update after successful transaction
    const queueResult = await enqueueInventoryUpdate(orderResult);
    console.log('Order and inventory queue processed:', queueResult);
    
    return {
      ...queueResult,
      orderNumber: orderId,
      grandTotal: orderResult.grandTotal
    };

  } catch (err) {
    console.error('Order processing failed:', {
      error: err.message,
      stack: err.stack,
      orderId,
      source
    });
    
    // Handle specific error cases
    if (err.message.includes('Failed to process order items')) {
      throw new Error(`ORDER_PROCESSING_FAILED: ${err.message}`);
    }
    if (err instanceof mongoose.Error.ValidationError) {
      throw new Error(`VALIDATION_ERROR: ${err.message}`);
    }
    
    throw err;
  }
}

export async function enqueueInventoryUpdate(orderResult) {
  if (!orderResult?.success) { 
    throw new Error('Cannot enqueue inventory update for failed order');
  }

  try {
    const jobData = {
      type: 'update_inventory',
      payload: {
        orderId: orderResult.orderId,
        orderNumber: orderResult.orderNumber,
        items: orderResult.processedItems,
        sessionInfo: orderResult.sessionInfo
      }
    };

    await orderQueue.add(
      'inventory_update', // Queue name
      jobData,
      {
        jobId: `inventory-update-${orderResult.orderId}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: true
      }
    );

    return { 
      success: true, 
      orderId: orderResult.orderId,
      orderNumber: orderResult.orderNumber
    };
  } catch (err) {
    console.error('Failed to enqueue inventory update:', {
      error: err.message,
      orderId: orderResult?.orderId
    });
    
    // Implement fallback mechanism here if needed
    throw new Error('INVENTORY_UPDATE_ENQUEUE_FAILED');
  }
}