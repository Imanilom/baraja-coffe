import mongoose from 'mongoose';
import { Order } from '../../models/order.model.js';
import { processOrderItems } from '../../services/order.service.js';
import { orderQueue } from '../../queues/order.queue.js';
import { runWithTransactionRetry } from '../../utils/transactionHandler.js';
import { updateTableStatusAfterPayment } from '../../controllers/webhookController.js';
import Payment from '../../models/Payment.model.js';
import { triggerImmediatePrint, broadcastCashOrderToKitchen } from '../../helpers/broadcast.helper.js';

export async function createOrderHandler({
  orderId,
  orderData,
  source,
  isOpenBill,
  isReservation,
  requiresDelivery,
  recipientData,
  paymentDetails,
  selectedPromoBundles = [] // ✅ NEW: Accept selected bundles
}) {
  let session = null;

  // 🔥 CRITICAL FIX: Simplify transaction logic
  // Only use transactions when absolutely necessary
  const useTransaction = (source === 'Web' || source === 'App') && 
                        (orderData.loyaltyPointsToRedeem > 0 || orderData.customerId);
  
  // For Cashier, only use transaction if loyalty operations needed
  const cashierNeedsTransaction = source === 'Cashier' && 
                                 (orderData.loyaltyPointsToRedeem > 0 || orderData.customerId);
  
  const shouldUseTransaction = useTransaction || cashierNeedsTransaction;

  try {
    console.log(`📝 createOrderHandler: source=${source}, useTransaction=${shouldUseTransaction}, hasLoyalty=${orderData.loyaltyPointsToRedeem > 0}, selectedBundles=${selectedPromoBundles?.length || 0}`);

    if (shouldUseTransaction) {
      session = await mongoose.startSession();
    }

    // 🔥 FIX: Use simpler transaction logic without complex retry wrapper
    const orderResult = await createOrderWithSimpleTransaction({
      session: shouldUseTransaction ? session : null,
      orderId,
      orderData,
      source,
      isOpenBill,
      isReservation,
      requiresDelivery,
      recipientData,
      paymentDetails,
      selectedPromoBundles, // ✅ PASS TO PROCESSOR
      useTransaction: shouldUseTransaction
    });

    // 🔥 PERBAIKAN: Verifikasi order tersimpan di database
    console.log('🔄 Verifying order in database...');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verifikasi order ada di database
    const verifiedOrder = await Order.findOne({ order_id: orderId });
    if (!verifiedOrder) {
      throw new Error(`Order ${orderId} not found in database after creation`);
    }

    console.log('✅ Order verified in database:', {
      orderId: verifiedOrder.order_id,
      status: verifiedOrder.status,
      grandTotal: verifiedOrder.grandTotal,
      itemsCount: verifiedOrder.items.length,
      customAmountItemsCount: verifiedOrder.customAmountItems.length,
      totalCustomAmount: verifiedOrder.totalCustomAmount,
      isSplitPayment: verifiedOrder.isSplitPayment,
      splitPaymentStatus: verifiedOrder.splitPaymentStatus,
      selectedBundlesCount: verifiedOrder.selectedPromoBundles?.length || 0,
      paymentsTotal: verifiedOrder.payments.reduce((sum, p) => sum + p.amount, 0)
    });

    // ✅ FIX: Emit socket event IMMEDIATELY for workstation to receive order
    try {
      // Prepare items with workstation info for routing
      const itemsForPrint = verifiedOrder.items.map(item => ({
        _id: item._id?.toString(),
        menuItemId: item.menuItem?.toString(),
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
        addons: item.addons,
        toppings: item.toppings,
        workstation: item.workstation || 'kitchen',
        mainCategory: item.mainCategory,
        category: item.category
      }));

      // ✅ ADDED: Include customAmount items in print payload (Routed to Bar Depan)
      if (verifiedOrder.customAmountItems && verifiedOrder.customAmountItems.length > 0) {
        verifiedOrder.customAmountItems.forEach(customItem => {
          itemsForPrint.push({
            _id: customItem._id?.toString() || `custom-${Date.now()}`,
            name: customItem.name || 'Custom Amount',
            quantity: 1,
            notes: customItem.description || '',
            workstation: 'bar',
            mainCategory: 'custom',
            category: 'custom',
            isCustomAmount: true,
            price: customItem.amount
          });
        });

        console.log(`➕ Added ${verifiedOrder.customAmountItems.length} custom amount items to print payload (Routed to Bar)`);
      }

      await triggerImmediatePrint({
        orderId: verifiedOrder.order_id,
        tableNumber: verifiedOrder.tableNumber,
        orderData: {
          items: itemsForPrint,
          orderType: verifiedOrder.orderType,
          paymentMethod: verifiedOrder.paymentMethod,
          name: verifiedOrder.name || 'Guest',
          service: verifiedOrder.orderType || 'Dine-In'
        },
        outletId: verifiedOrder.outletId?.toString(),
        source: source,
        isAppOrder: source === 'App',
        isWebOrder: source === 'Web',
        isOpenBill: isOpenBill || false
      });

      console.log(`📡 Immediate print triggered for order ${orderId}`);
    } catch (printError) {
      console.error('⚠️ Failed to trigger immediate print (non-blocking):', printError.message);
    }

    // Enqueue inventory update setelah order berhasil
    const queueResult = await enqueueInventoryUpdate(orderResult);

    // Update table status untuk Dine-In orders
    if (orderData.orderType === 'Dine-In' && orderData.tableNumber) {
      setTimeout(() => {
        updateTableStatusAfterPayment(orderResult.orderId);
      }, 100);
    }

    return {
      ...queueResult,
      orderNumber: orderId,
      grandTotal: orderResult.totals.grandTotal,
      loyalty: orderResult.loyalty,
      hasCustomAmountItems: orderResult.customAmountItems && orderResult.customAmountItems.length > 0,
      isSplitPayment: orderResult.isSplitPayment,
      selectedPromoBundles: orderResult.selectedPromoBundles, // ✅ RETURN SELECTED BUNDLES
      orderStatus: verifiedOrder.status,
      orderId: verifiedOrder._id
    };

  } catch (err) {
    console.error('Order processing failed:', {
      error: err.message,
      stack: err.stack,
      orderId,
      source,
      orderType: orderData?.orderType,
      hasCustomAmountItems: orderData?.customAmountItems?.length > 0,
      selectedBundlesCount: selectedPromoBundles?.length || 0,
      outletId: orderData?.outletId,
      tableNumber: orderData?.tableNumber,
      isSplitPayment: orderData?.isSplitPayment
    });

    if (err.message.includes('Failed to process order items')) {
      throw new Error(`ORDER_PROCESSING_FAILED: ${err.message}`);
    }
    if (err instanceof mongoose.Error.ValidationError) {
      console.error('Mongoose Validation Error Details:', Object.keys(err.errors).map(key => ({
        field: key,
        value: err.errors[key]?.value,
        kind: err.errors[key]?.kind,
        message: err.errors[key]?.message
      })));
      throw new Error(`VALIDATION_ERROR: ${err.message}`);
    }
    if (err.name === 'MongoError') {
      console.error('MongoDB Error:', {
        code: err.code,
        message: err.message
      });
      throw new Error(`DATABASE_ERROR: ${err.message}`);
    }

    throw err;
  } finally {
    if (session) {
      try {
        await session.endSession();
        console.log('MongoDB session ended');
      } catch (e) {
        console.warn('Failed to end session:', e.message);
      }
    }
  }
}

// 🔥 NEW: Simplified order creation without complex retry logic
async function createOrderWithSimpleTransaction({
  session,
  orderId,
  orderData,
  source,
  isOpenBill,
  isReservation,
  requiresDelivery,
  recipientData,
  paymentDetails,
  selectedPromoBundles = [], // ✅ NEW
  useTransaction
}) {
  console.log('Order Handler - Starting Order Creation:', {
    orderId,
    orderType: orderData.orderType,
    requiresDelivery,
    hasRecipientData: !!recipientData,
    source,
    selectedBundlesCount: selectedPromoBundles.length,
    hasCustomAmountItems: orderData.customAmountItems && orderData.customAmountItems.length > 0,
    customAmountItemsCount: orderData.customAmountItems ? orderData.customAmountItems.length : 0,
    menuItemsCount: orderData.items ? orderData.items.length : 0,
    outletId: orderData.outletId,
    customerId: orderData.customerId || 'none',
    paymentMethod: orderData.paymentMethod,
    isSplitPayment: orderData.isSplitPayment,
    paymentDetailsType: Array.isArray(paymentDetails) ? 'array' : 'object',
    useTransaction
  });

  try {
    if (useTransaction && session) {
      session.startTransaction();
      console.log('🔷 Transaction started');
    }

    const {
      customerId,
      loyaltyPointsToRedeem,
      orderType,
      customAmountItems = [],
      outletId,
      voucherCode,
      customerType,
      items = [],
      paymentDetails: orderPaymentDetails,
      tableNumber,
      type,
      user,
      contact,
      notes,
      isSplitPayment = false,
      delivery_option,
      recipient_data,
      cashierId,
      paymentMethod,
      device_id,
      ...cleanOrderData
    } = orderData;

    // Process order items dengan selected bundles
    const processed = await processOrderItems({
      items,
      outlet: outletId,
      orderType,
      voucherCode,
      customerType,
      source,
      customerId,
      loyaltyPointsToRedeem,
      customAmountItems,
      selectedPromoBundles // ✅ PASS SELECTED BUNDLES
    }, useTransaction ? session : null);

    if (!processed) {
      throw new Error('Failed to process order items');
    }

    const {
      orderItems,
      customAmountItems: processedCustomAmountItems,
      totals,
      discounts,
      promotions,
      loyalty,
      taxesAndFees
    } = processed;

    // ✅ FORMAT SELECTED BUNDLES UNTUK DISIMPAN
    const formattedSelectedBundles = promotions.selectedPromoBundles?.map(bundle => ({
      promoId: bundle.promoId,
      promoName: bundle.promoName,
      bundleSets: bundle.bundleSets,
      appliedDiscount: bundle.appliedDiscount,
      affectedItems: bundle.affectedItems.map(item => ({
        menuItem: item.menuItem,
        menuItemName: item.menuItemName,
        quantityInBundle: item.quantityInBundle,
        discountShare: item.discountShare,
        originalSubtotal: item.originalSubtotal,
        discountedSubtotal: item.discountedSubtotal
      }))
    })) || [];

    const formattedAppliedPromos = (promotions.appliedPromos || []).map(promo => ({
      promoId: promo.promoId,
      promoName: promo.promoName,
      promoType: promo.promoType,
      discount: promo.discount,
      affectedItems: (promo.affectedItems || []).map(item => ({
        menuItem: item.menuItem,
        menuItemName: item.menuItemName,
        quantity: item.quantity,
        originalSubtotal: item.originalSubtotal,
        discountAmount: item.discountAmount,
        discountedSubtotal: item.discountedSubtotal,
        discountPercentage: item.discountPercentage
      })),
      freeItems: (promo.freeItems || []).map(freeItem => ({
        menuItem: freeItem.menuItem,
        menuItemName: freeItem.menuItemName,
        quantity: freeItem.quantity,
        price: freeItem.price,
        isFree: freeItem.isFree || true
      }))
    }));

    console.log('📊 Formatted Promos & Bundles:', {
      selectedBundlesCount: formattedSelectedBundles.length,
      selectedBundles: formattedSelectedBundles.map(b => ({
        name: b.promoName,
        sets: b.bundleSets,
        discount: b.appliedDiscount
      })),
      appliedPromosCount: formattedAppliedPromos.length
    });

    // Determine initial status based on source and payment method
    let initialStatus = 'Pending';
    let paymentMethodData = 'Cash';

    // Handle split payment status determination
    if (source === 'Cashier') {
      console.log('Source Cashier - isOpenBill:', isOpenBill);
      initialStatus = isOpenBill ? 'Pending' : 'Waiting';

      // Untuk split payment, gunakan metode pertama atau 'Multiple'
      if (Array.isArray(orderPaymentDetails) && orderPaymentDetails.length > 0) {
        paymentMethodData = orderPaymentDetails[0].method || 'Multiple';
      } else {
        paymentMethodData = paymentMethod || 'Cash';
      }
    } else if (source === 'App' || source === 'Web') {
      const isCashPayment = orderPaymentDetails?.method?.toLowerCase() === 'cash';
      initialStatus = isCashPayment ? 'Pending' : 'Waiting';
      paymentMethodData = orderPaymentDetails?.method;
    }

    console.log('Order Status Determination:', {
      source,
      initialStatus,
      paymentMethod: paymentMethodData,
      isOpenBill,
      isSplitPayment,
      paymentDetails: orderPaymentDetails
    });

    // Validasi payment details vs order total
    const totalPaymentAmount = orderPaymentDetails ?
      (Array.isArray(orderPaymentDetails) ?
        orderPaymentDetails.reduce((sum, p) => sum + (p.amount || 0), 0) :
        (orderPaymentDetails.amount || 0)) : 0;

    const totalCustomAmount = processedCustomAmountItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const effectiveOrderTotal = totals.grandTotal + totalCustomAmount;

    console.log('💰 Payment Validation:', {
      totalPaymentAmount,
      orderGrandTotal: totals.grandTotal,
      totalCustomAmount,
      effectiveOrderTotal,
      difference: totalPaymentAmount - effectiveOrderTotal
    });

    // Prepare payments array untuk split payment
    let payments = [];

    if (isSplitPayment && Array.isArray(orderPaymentDetails)) {
      console.log('Processing split payment in createOrderHandler:', {
        paymentCount: orderPaymentDetails.length,
        totalAmount: orderPaymentDetails.reduce((sum, p) => sum + (p.amount || 0), 0),
        payments: orderPaymentDetails.map(p => ({
          method: p.method,
          amount: p.amount,
          status: p.status
        }))
      });

      // Process split payment details
      payments = orderPaymentDetails.map((payment, index) => {
        const paymentStatus = mapPaymentStatus(payment.status || 'completed');

        console.log(`Creating payment ${index + 1}:`, {
          method: payment.method,
          amount: payment.amount,
          status: paymentStatus,
          originalStatus: payment.status
        });

        const paymentData = {
          paymentMethod: payment.method,
          amount: payment.amount,
          status: paymentStatus,
          processedBy: cashierId,
          processedAt: new Date(),
          notes: `Split payment ${index + 1} of ${orderPaymentDetails.length}`
        };

        // Tambahkan payment details berdasarkan metode
        if (payment.method === 'Cash' || payment.method === 'cash') {
          paymentData.paymentDetails = {
            cashTendered: payment.tenderedAmount || payment.amount,
            change: payment.changeAmount || 0
          };
        } else if (payment.method === 'QRIS') {
          paymentData.paymentDetails = {
            transactionId: payment.transactionId || `QRIS-${orderId}-${index}`,
            ewallets: payment.ewallets || 'Other'
          };
        } else if (payment.method === 'Debit' || payment.method === 'Card') {
          paymentData.paymentDetails = {
            cardType: payment.method,
            cardLast4: payment.cardLast4 || '',
            cardTransactionId: payment.transactionId || `${payment.method}-${orderId}-${index}`
          };
        }

        return paymentData;
      });

      console.log('Final payments array:', {
        count: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        payments: payments.map(p => ({
          method: p.paymentMethod,
          amount: p.amount,
          status: p.status
        }))
      });
    } else {
      // Single payment (legacy) - handle both array dengan 1 element dan object
      const effectivePayment = Array.isArray(orderPaymentDetails) ?
        orderPaymentDetails[0] : orderPaymentDetails;

      payments = [{
        paymentMethod: effectivePayment?.method || paymentMethodData,
        amount: effectivePayment?.amount || totals.grandTotal,
        status: 'completed',
        processedBy: cashierId,
        processedAt: new Date()
      }];
    }

    // Prepare base order data
    const baseOrderData = {
      order_id: orderId,
      user: user || 'Customer',
      cashierId: cashierId || null,
      items: orderItems,
      customAmountItems: processedCustomAmountItems,
      // ✅ SIMPAN SELECTED BUNDLES
      selectedPromoBundles: formattedSelectedBundles,
      status: initialStatus,
      payments: payments,
      paymentMethod: paymentMethodData,
      orderType: orderType || 'Dine-In',
      tableNumber: tableNumber || '',
      type: type || 'Indoor',
      outlet: outletId,
      outletId: outletId,
      totalBeforeDiscount: totals.beforeDiscount,
      totalAfterDiscount: totals.afterDiscount,
      totalCustomAmount: totals.totalCustomAmount,
      totalTax: totals.totalTax,
      totalServiceFee: totals.totalServiceFee,
      grandTotal: totals.grandTotal,
      source: source,
      isOpenBill: isOpenBill || false,
      isSplitPayment: isSplitPayment,
      splitPaymentStatus: calculateSplitPaymentStatus(payments, totals.grandTotal),
      discounts: {
        selectedBundleDiscount: discounts.selectedBundleDiscount || 0, // ✅ BARU
        autoPromoDiscount: discounts.autoPromoDiscount || 0,
        manualDiscount: discounts.manualDiscount || 0,
        voucherDiscount: discounts.voucherDiscount || 0,
        loyaltyDiscount: discounts.loyaltyDiscount || 0,
        customAmountDiscount: discounts.customAmountDiscount || 0,
        total: discounts.total || 0
      },
      appliedPromos: formattedAppliedPromos,
      appliedManualPromo: promotions.appliedManualPromo || null,
      appliedVoucher: promotions.appliedVoucher || null,
      taxAndServiceDetails: taxesAndFees || [],
      notes: notes || '',
      currentBatch: 1,
      deliveryStatus: "false",
      deliveryProvider: "false",
      transferHistory: [],
      kitchenNotifications: [],
      created_by: {
        employee_id: null,
        employee_name: null,
        created_at: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Tambahkan customer data jika ada
    if (customerId) {
      baseOrderData.customerId = customerId;
    }

    if (contact) {
      baseOrderData.contact = contact;
    }

    if (device_id) {
      baseOrderData.device_id = device_id;
    }

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
      source,
      delivery_option: orderData.delivery_option
    });

    if (isDeliveryOrder) {
      console.log('Creating delivery order with recipient data:', recipientData);
      baseOrderData.deliveryStatus = 'pending';
      baseOrderData.deliveryProvider = 'GoSend';
      baseOrderData.delivery_option = delivery_option || 'delivery';

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
      baseOrderData.deliveryStatus = "false";
      baseOrderData.deliveryProvider = "false";
    }

    // Handle reservation data
    if (isReservation && orderData.reservationData) {
      baseOrderData.reservation = orderData.reservationData._id || orderData.reservationData;
      baseOrderData.orderType = 'Reservation';
      console.log('Reservation order linked:', baseOrderData.reservation);
    }

    // Log data sebelum save untuk debugging
    console.log('Order data before save:', {
      orderId,
      cashierId: baseOrderData.cashierId,
      orderType: baseOrderData.orderType,
      source: baseOrderData.source,
      status: baseOrderData.status,
      totalMenuItems: baseOrderData.items.length,
      selectedBundlesCount: baseOrderData.selectedPromoBundles?.length || 0,
      hasCustomAmountItems: baseOrderData.customAmountItems.length > 0,
      customAmountItemsCount: baseOrderData.customAmountItems.length,
      totalCustomAmount: baseOrderData.totalCustomAmount,
      grandTotal: baseOrderData.grandTotal,
      discounts: baseOrderData.discounts,
      deliveryStatus: baseOrderData.deliveryStatus,
      isOpenBill: baseOrderData.isOpenBill,
      isSplitPayment: baseOrderData.isSplitPayment,
      splitPaymentStatus: baseOrderData.splitPaymentStatus,
      paymentsCount: baseOrderData.payments.length,
      totalPaymentsAmount: baseOrderData.payments.reduce((sum, p) => sum + p.amount, 0)
    });

    // Validasi data required
    if (!baseOrderData.order_id) {
      throw new Error('Order ID is required');
    }

    if (!baseOrderData.outletId) {
      throw new Error('Outlet ID is required');
    }

    if (baseOrderData.items.length === 0 && baseOrderData.customAmountItems.length === 0) {
      throw new Error('Order must have at least one item or custom amount');
    }

    // Create and save the order
    const newOrder = new Order(baseOrderData);

    // Validasi manual sebelum save
    const validationError = newOrder.validateSync();
    if (validationError) {
      console.error('Validation error before save:', validationError.errors);
      const errorDetails = Object.keys(validationError.errors).map(key => ({
        field: key,
        value: validationError.errors[key]?.value,
        kind: validationError.errors[key]?.kind,
        message: validationError.errors[key]?.message
      }));
      console.error('Validation Error Details:', errorDetails);
      throw new Error(`VALIDATION_ERROR: ${validationError.message}`);
    }

    // 🔥 FIX: Save with session only if using transaction
    const saveOptions = useTransaction && session ? { session } : {};
    await newOrder.save(saveOptions);

    // ✅ LOG ORDER CREATION SUCCESS (User-Friendly Format)
    console.log(`\n✅ ========== ORDER CREATED ==========`);
    console.log(`📋 Order ID: ${newOrder.order_id}`);
    console.log(`🪑 Table: ${newOrder.tableNumber || 'N/A'}`);
    console.log(`👤 Customer: ${newOrder.user || 'Guest'}`);
    console.log(`📦 Items: ${newOrder.items.length} items`);
    if (newOrder.customAmountItems && newOrder.customAmountItems.length > 0) {
      console.log(`💵 Custom Amounts: ${newOrder.customAmountItems.length} items`);
    }
    if (newOrder.selectedPromoBundles && newOrder.selectedPromoBundles.length > 0) {
      console.log(`🎁 Selected Bundles: ${newOrder.selectedPromoBundles.length} bundles`);
      newOrder.selectedPromoBundles.forEach(bundle => {
        console.log(`   • ${bundle.promoName}: ${bundle.bundleSets} set(s) - Discount: Rp ${bundle.appliedDiscount.toLocaleString('id-ID')}`);
      });
    }
    console.log(`💰 Total: Rp ${newOrder.grandTotal.toLocaleString('id-ID')}`);
    console.log(`📱 Source: ${newOrder.source}`);
    console.log(`🔖 Status: ${newOrder.status}`);
    console.log(`💳 Payment: ${newOrder.paymentMethod}`);
    if (newOrder.isSplitPayment) {
      console.log(`💳 Split Payment: ${newOrder.payments.length} methods`);
    }
    if (newOrder.isOpenBill) {
      console.log(`📝 Type: Open Bill`);
    }
    console.log(`=====================================\n`);

    console.log('Order created successfully:', {
      orderId: newOrder._id.toString(),
      orderNumber: orderId,
      orderType: newOrder.orderType,
      status: newOrder.status,
      totalMenuItems: newOrder.items.length,
      selectedBundlesCount: newOrder.selectedPromoBundles?.length || 0,
      hasCustomAmountItems: newOrder.customAmountItems.length > 0,
      customAmountItemsCount: newOrder.customAmountItems.length,
      totalCustomAmount: newOrder.totalCustomAmount,
      grandTotal: newOrder.grandTotal,
      discounts: newOrder.discounts,
      source: newOrder.source,
      isSplitPayment: newOrder.isSplitPayment,
      splitPaymentStatus: newOrder.splitPaymentStatus,
      paymentsCount: newOrder.payments.length,
      totalPaymentsAmount: newOrder.payments.reduce((sum, p) => sum + p.amount, 0),
      createdAt: newOrder.createdAt
    });

    // Commit transaction jika aktif
    if (useTransaction && session?.transaction?.isActive) {
      await session.commitTransaction();
      console.log('✅ Transaction committed successfully');
    }

    return {
      success: true,
      orderId: newOrder._id.toString(),
      orderNumber: orderId,
      processedItems: orderItems,
      customAmountItems: processedCustomAmountItems,
      totals: totals,
      loyalty: loyalty,
      selectedPromoBundles: formattedSelectedBundles, // ✅ RETURN SELECTED BUNDLES
      isSplitPayment: isSplitPayment,
      orderData: baseOrderData
    };

  } catch (error) {
    // Rollback transaction jika aktif
    if (useTransaction && session?.transaction?.isActive) {
      try {
        await session.abortTransaction();
        console.log('🔴 Transaction aborted due to error');
      } catch (abortErr) {
        console.warn('Failed to abort transaction:', abortErr.message);
      }
    }
    
    throw error;
  }
}

// Helper function untuk map payment status
function mapPaymentStatus(status) {
  const statusMap = {
    'partial': 'pending',
    'settlement': 'completed',
    'pending': 'pending',
    'completed': 'completed',
    'failed': 'failed'
  };
  return statusMap[status] || 'pending';
}

// Helper function untuk calculate split payment status
function calculateSplitPaymentStatus(payments, grandTotal) {
  if (!payments || payments.length === 0) {
    return 'not_started';
  }

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  if (totalPaid === 0) {
    return 'not_started';
  } else if (totalPaid < grandTotal) {
    return 'partial';
  } else if (totalPaid === grandTotal) {
    return 'completed';
  } else {
    return 'overpaid';
  }
}

// Helper function untuk memverifikasi order exists dengan retry
export async function verifyOrderExists(orderId, maxRetries = 5, initialDelay = 100) {
  let delay = initialDelay;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const order = await Order.findOne({ order_id: orderId });
      if (order) {
        console.log(`✅ Order ${orderId} verified successfully (attempt ${i + 1})`);
        return order;
      }

      if (i < maxRetries - 1) {
        console.log(`🔄 Order ${orderId} not found, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    } catch (error) {
      console.error(`Error verifying order ${orderId} (attempt ${i + 1}):`, error.message);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }

  throw new Error(`Order ${orderId} not found after ${maxRetries} retries`);
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

    console.log('Inventory update enqueued:', {
      orderId: orderResult.orderId,
      regularItemsCount: orderResult.processedItems.length,
      hasCustomAmountItems: orderResult.customAmountItems && orderResult.customAmountItems.length > 0
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