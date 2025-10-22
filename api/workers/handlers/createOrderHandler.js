import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { processOrderItems } from '../../services/order.service.js'; // Asumsi service terpisah
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
        customAmountItems // UBAH: customAmount menjadi customAmountItems array
      } = orderData;

      console.log('Order Handler - Starting Order Creation:', {
        orderId,
        orderType,
        requiresDelivery,
        hasRecipientData: !!recipientData,
        source,
        hasCustomAmountItems: customAmountItems && customAmountItems.length > 0, // UBAH
        customAmountItemsCount: customAmountItems ? customAmountItems.length : 0
      });

      // Process order items dengan custom amount items terpisah
      const processed = await processOrderItems({
        ...orderData,
        customAmountItems: customAmountItems || [] // UBAH: customAmount menjadi customAmountItems
      }, session);

      if (!processed) {
        throw new Error('Failed to process order items');
      }

      const {
        orderItems,
        customAmountItems: processedCustomAmountItems, // UBAH
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

      // Cleanup menyeluruh
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
        items: orderItems, // HANYA menu items
        customAmountItems: processedCustomAmountItems, // UBAH: Custom amount items array
        totalBeforeDiscount: totals.beforeDiscount,
        totalAfterDiscount: totals.afterDiscount,
        totalCustomAmount: totals.totalCustomAmount, // UBAH: Tambahkan total custom amount
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
        totalMenuItems: baseOrderData.items.length,
        hasCustomAmountItems: baseOrderData.customAmountItems.length > 0, // UBAH
        customAmountItemsCount: baseOrderData.customAmountItems.length,
        totalCustomAmount: baseOrderData.totalCustomAmount,
        grandTotal: baseOrderData.grandTotal,
        menuItemsTotal: baseOrderData.totalAfterDiscount
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
        totalMenuItems: newOrder.items.length,
        hasCustomAmountItems: newOrder.customAmountItems.length > 0, // UBAH
        customAmountItemsCount: newOrder.customAmountItems.length,
        totalCustomAmount: newOrder.totalCustomAmount,
        grandTotal: newOrder.grandTotal
      });

      return {
        success: true,
        orderId: newOrder._id.toString(),
        orderNumber: orderId,
        processedItems: orderItems,
        customAmountItems: processedCustomAmountItems, // UBAH
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
      loyalty: orderResult.loyalty,
      hasCustomAmountItems: orderResult.customAmountItems.length > 0 // UBAH
    };

  } catch (err) {
    console.error('Order processing failed:', {
      error: err.message,
      stack: err.stack,
      orderId,
      source,
      orderType: orderData?.orderType,
      hasCustomAmountItems: orderData?.customAmountItems?.length > 0 // UBAH
    });

    if (err.message.includes('Failed to process order items')) {
      throw new Error(`ORDER_PROCESSING_FAILED: ${err.message}`);
    }
    if (err instanceof mongoose.Error.ValidationError) {
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
    // Hanya update inventory untuk regular menu items
    const jobData = {
      type: 'update_inventory',
      payload: {
        orderId: orderResult.orderId,
        orderNumber: orderResult.orderNumber,
        items: orderResult.processedItems // Hanya regular items
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
      regularItemsCount: orderResult.processedItems.length,
      hasCustomAmountItems: orderResult.customAmountItems.length > 0 // UBAH
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