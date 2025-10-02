import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { processOrderItems } from '../../services/order.service.js';
import { orderQueue } from '../../queues/order.queue.js';
import { runWithTransactionRetry } from '../../utils/transactionHandler.js';

export async function createOrderHandler({ orderId, orderData, source, isOpenBill }) {
  let session;
  try {
    session = await mongoose.startSession();
    
    const orderResult = await runWithTransactionRetry(async () => {
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
        console.log('Source Cashier ', isOpenBill);
        initialStatus = isOpenBill ? 'Pending' : 'Waiting';
      }

      // Build complete order document
      const fullOrderData = {
        ...orderData,
        order_id: orderId,
        items: orderItems,
        totalBeforeDiscount: totals.beforeDiscount,
        totalAfterDiscount: totals.afterDiscount,
        totalTax: totals.totalTax,
        totalServiceFee: totals.totalServiceFee,
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
        orderNumber: orderId,
        processedItems: orderItems,
        // Jangan sertakan session info dalam job data
        totals: totals
      };
    }, session);

    // Enqueue inventory update setelah transaction selesai
    const queueResult = await enqueueInventoryUpdate(orderResult);
    
    if (orderData.orderType === 'Dine-In') {
      // Panggil setelah transaction commit
      setTimeout(() => {
        updateTableStatusAfterPayment(orderResult.orderId);
      }, 100);
    }

    return {
      ...queueResult,
      orderNumber: orderId,
      grandTotal: orderResult.totals.grandTotal
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
  } finally {
    if (session) {
      await session.endSession();
    }
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
        items: orderResult.processedItems
        // Hapus sessionInfo dari payload
      }
    };

    await orderQueue.add(
      'inventory_update',
      jobData,
      {
        jobId: `inventory-update-${orderResult.orderId}-${Date.now()}`,
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

    throw new Error('INVENTORY_UPDATE_ENQUEUE_FAILED');
  }
}