import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { processOrderItems } from '../../services/order.service.js';
import { orderQueue } from '../../queues/order.queue.js';
import { runWithTransactionRetry } from '../../utils/transactionHandler.js';
import { updateTableStatusAfterPayment } from '../../controllers/webhookController.js';

export async function createOrderHandler({ orderId, orderData, source, isOpenBill, isReservation, requiresDelivery, recipientData }) {
  let session;
  try {
    session = await mongoose.startSession();
    
    const orderResult = await runWithTransactionRetry(async () => {
      const { customerId, loyaltyPointsToRedeem, orderType } = orderData;
      
      console.log('Order Handler - Delivery Check:', {
        orderType,
        requiresDelivery,
        hasRecipientData: !!recipientData,
        source
      });

      // Process order items dengan loyalty program opsional
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

      // PERBAIKAN: Cleanup menyeluruh - hapus SEMUA field delivery
      const { 
        delivery_option, 
        recipient_data, 
        deliveryStatus, 
        deliveryProvider, 
        deliveryTracking, 
        recipientInfo,
        ...cleanOrderData 
      } = orderData;
      
      const baseOrderData = {
        ...cleanOrderData, // Gunakan data yang sudah dibersihkan
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
        updatedAt: new Date()
      };

      // PERBAIKAN: Hanya tambahkan loyalty data jika applied
      if (loyalty.isApplied) {
        baseOrderData.loyalty = {
          pointsUsed: loyalty.pointsUsed,
          pointsEarned: loyalty.pointsEarned,
          discountAmount: loyalty.discountAmount,
          customerId: loyalty.customerId
        };
      }

      // PERBAIKAN: Handle delivery fields hanya untuk delivery orders
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
        // PERBAIKAN: Pastikan field delivery TIDAK ADA untuk non-delivery orders
        // Dengan tidak menyetel field tersebut, mereka akan menjadi undefined
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
        hasDeliveryStatus: baseOrderData.deliveryStatus !== undefined,
        hasDeliveryProvider: baseOrderData.deliveryProvider !== undefined,
        deliveryStatus: baseOrderData.deliveryStatus,
        deliveryProvider: baseOrderData.deliveryProvider,
        // Log semua keys untuk memastikan tidak ada field delivery yang tidak diinginkan
        keys: Object.keys(baseOrderData)
      });

      // Create and save the order
      const newOrder = new Order(baseOrderData);
      
      // PERBAIKAN: Validasi manual sebelum save
      const validationError = newOrder.validateSync();
      if (validationError) {
        console.error('Validation error before save:', validationError.errors);
        throw new Error(`VALIDATION_ERROR: ${validationError.message}`);
      }
      
      await newOrder.save({ session });

      console.log('Order created successfully:', {
        orderId: newOrder._id.toString(),
        orderType: newOrder.orderType,
        status: newOrder.status,
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
      orderType: orderData?.orderType
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
    const jobData = {
      type: 'update_inventory',
      payload: {
        orderId: orderResult.orderId,
        orderNumber: orderResult.orderNumber,
        items: orderResult.processedItems
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