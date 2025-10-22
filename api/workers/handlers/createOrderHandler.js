import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { processOrderItems } from '../../services/order.service.js';
import { orderQueue } from '../../queues/order.queue.js';
import { runWithTransactionRetry } from '../../utils/transactionHandler.js';
import { updateTableStatusAfterPayment } from '../../controllers/webhookController.js';

export async function createOrderHandler({ 
  orderId, 
  orderData, 
  source, 
  isOpenBill, 
  isReservation, 
  requiresDelivery, 
  recipientData 
}) {
  let session;
  try {
    session = await mongoose.startSession();

    const orderResult = await runWithTransactionRetry(async () => {
      const { 
        customerId, 
        loyaltyPointsToRedeem, 
        orderType, 
        customAmountItems = [] 
      } = orderData;

      console.log('Order Handler - Starting Order Creation:', {
        orderId,
        orderType,
        requiresDelivery,
        hasRecipientData: !!recipientData,
        source,
        hasCustomAmount: customAmountItems && customAmountItems.length > 0,
        customAmountItemsCount: customAmountItems ? customAmountItems.length : 0
      });

      // Process order items dengan custom amount
      const processed = await processOrderItems({
        ...orderData,
        customAmountItems: customAmountItems || []
      }, session);
      
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
        console.log('Source Cashier - isOpenBill:', isOpenBill);
        initialStatus = isOpenBill ? 'Pending' : 'Waiting';
      }

      // Cleanup menyeluruh - hapus SEMUA field delivery yang tidak diperlukan
      const {
        delivery_option,
        recipient_data,
        deliveryStatus,
        deliveryProvider,
        deliveryTracking,
        recipientInfo,
        customAmountItems: cleanedCustomAmountItems, // Already processed
        ...cleanOrderData
      } = orderData;

      const baseOrderData = {
        ...cleanOrderData,
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
        taxAndServiceDetails: taxesAndFees,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Tambahkan loyalty data jika applied
      if (loyalty.isApplied) {
        baseOrderData.loyalty = {
          pointsUsed: loyalty.pointsUsed,
          pointsEarned: loyalty.pointsEarned,
          discountAmount: loyalty.discountAmount,
          customerId: loyalty.customerId
        };
      }

      // Handle delivery fields hanya untuk delivery orders
      const isDeliveryOrder = (orderType === 'Delivery' || requiresDelivery) && source === 'App';
      console.log('Delivery Order Check:', {
        isDeliveryOrder,
        orderType,
        requiresDelivery,
        source
      });

      if (isDeliveryOrder) {
        console.log('Creating delivery order with recipient data:', recipientData);
        baseOrderData.deliveryStatus = 'pending';
        baseOrderData.deliveryProvider = 'GoSend';

        if (recipientData) {
          baseOrderData.recipientInfo = {
            name: recipientData.name || '',
            phone: recipientData.phone || '',
            address: recipientData.address || '',
            coordinates: recipientData.coordinates || '',
            note: recipientData.note || ''
          };
        }

        // Set deliveryTracking sebagai object kosong
        baseOrderData.deliveryTracking = {};
      } else {
        console.log('Non-delivery order - skipping delivery fields');
      }

      // Handle reservation data
      if (isReservation && orderData.reservationData) {
        baseOrderData.reservation = orderData.reservationData._id || orderData.reservationData;
      }

      // Log data sebelum save untuk debugging
      console.log('Order data before save:', {
        orderId,
        orderType: baseOrderData.orderType,
        source: baseOrderData.source,
        totalItems: baseOrderData.items.length,
        customAmountItems: baseOrderData.items.filter(item => item.isCustomAmount).length,
        regularItems: baseOrderData.items.filter(item => !item.isCustomAmount).length,
        grandTotal: baseOrderData.grandTotal,
        hasDeliveryStatus: baseOrderData.deliveryStatus !== undefined,
        hasDeliveryProvider: baseOrderData.deliveryProvider !== undefined
      });

      // Create and save the order
      const newOrder = new Order(baseOrderData);

      // Validasi manual sebelum save
      const validationError = newOrder.validateSync();
      if (validationError) {
        console.error('Validation error before save:', validationError.errors);
        throw new Error(`VALIDATION_ERROR: ${validationError.message}`);
      }

      await newOrder.save({ session });

      console.log('Order created successfully:', {
        orderId: newOrder._id.toString(),
        orderNumber: orderId,
        orderType: newOrder.orderType,
        status: newOrder.status,
        totalItems: newOrder.items.length,
        customAmountItems: newOrder.items.filter(item => item.isCustomAmount).length,
        grandTotal: newOrder.grandTotal,
        deliveryStatus: newOrder.deliveryStatus,
        deliveryProvider: newOrder.deliveryProvider
      });

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
      loyalty: orderResult.loyalty
    };

  } catch (err) {
    console.error('Order processing failed:', {
      error: err.message,
      stack: err.stack,
      orderId,
      source,
      orderType: orderData?.orderType,
      hasCustomAmount: orderData?.customAmountItems?.length > 0
    });

    if (err.message.includes('Failed to process order items')) {
      throw new Error(`ORDER_PROCESSING_FAILED: ${err.message}`);
    }
    if (err instanceof mongoose.Error.ValidationError) {
      // Log detail validation error
      console.error('Validation Error Details:', Object.keys(err.errors).map(key => ({
        field: key,
        value: err.errors[key]?.value,
        kind: err.errors[key]?.kind,
        message: err.errors[key]?.message
      })));
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
    // Filter out custom amount items dari inventory update
    const regularItems = orderResult.processedItems.filter(item => !item.isCustomAmount);

    const jobData = {
      type: 'update_inventory',
      payload: {
        orderId: orderResult.orderId,
        orderNumber: orderResult.orderNumber,
        items: regularItems // Hanya regular items yang mempengaruhi inventory
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

    console.log('Inventory update enqueued:', {
      orderId: orderResult.orderId,
      regularItemsCount: regularItems.length,
      totalItemsCount: orderResult.processedItems.length
    });

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