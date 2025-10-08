import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { processOrderItems } from '../../services/order.service.js';
import { orderQueue } from '../../queues/order.queue.js';
import { runWithTransactionRetry } from '../../utils/transactionHandler.js';
import { updateTableStatusAfterPayment } from '../../controllers/webhookController.js';

// Update createOrderHandler function
export async function createOrderHandler({ orderId, orderData, source, isOpenBill }) {
  let session;
  try {
    session = await mongoose.startSession();
    
    const orderResult = await runWithTransactionRetry(async () => {
      // Validasi customerId untuk loyalty program
      const { customerId, loyaltyPointsToRedeem } = orderData;
      
      console.log('Order Handler - Loyalty Check:', {
        customerId,
        loyaltyPointsToRedeem,
        source,
        hasCustomerId: !!customerId,
        isValidCustomerId: customerId ? mongoose.Types.ObjectId.isValid(customerId) : false
      });

      // Process order items dengan loyalty program
      const processed = await processOrderItems(orderData, session);
      if (!processed) {
        throw new Error('Failed to process order items');
      }

      const {
        orderItems,
        totals,
        discounts,
        promotions,
        loyalty,
        taxesAndFees
      } = processed;

      // Determine initial status based on source and payment method
      let initialStatus = 'Pending';
      if (source === 'Cashier') {
        console.log('Source Cashier ', isOpenBill);
        initialStatus = isOpenBill ? 'Pending' : 'Waiting';
      }

      // Build complete order document with loyalty data
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
          loyaltyDiscount: discounts.loyaltyDiscount,
          total: discounts.total
        },
        loyalty: {
          pointsUsed: loyalty.pointsUsed,
          pointsEarned: loyalty.pointsEarned,
          discountAmount: loyalty.discountAmount,
          isEligible: loyalty.isEligible,
          customerId: loyalty.isEligible ? customerId : null
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
        totals: totals,
        loyalty: loyalty
      };
    }, session);

    // Enqueue inventory update setelah transaction selesai
    const queueResult = await enqueueInventoryUpdate(orderResult);
    
    if (orderData.orderType === 'Dine-In') {
      setTimeout(() => {
        updateTableStatusAfterPayment(orderResult.orderId);
      }, 100);
    }

    return {
      ...queueResult,
      orderNumber: orderId,
      grandTotal: orderResult.totals.grandTotal,
      loyaltyPointsEarned: orderResult.loyalty?.pointsEarned || 0,
      isLoyaltyEligible: orderResult.loyalty?.isEligible || false
    };

  } catch (err) {
    console.error('Order processing failed:', {
      error: err.message,
      stack: err.stack,
      orderId,
      source
    });

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