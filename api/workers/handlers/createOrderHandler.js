import { MenuItem } from '../../models/MenuItem.model.js';
import { TaxAndService } from '../../models/TaxAndService.model.js';
import { Order } from '../../models/order.model.js';
import Recipe from '../../models/modul_menu/Recipe.model.js';
import { checkAutoPromos, checkManualPromo, checkVoucher } from '../../helpers/promo.helper.js';
import { calculateLoyaltyPoints, redeemLoyaltyPoints } from '../../helpers/loyalty.helper.js';
import { processSelectedPromos } from '../../helpers/promo.handler.js';
import mongoose from 'mongoose';
import { updateTableStatusAfterPayment } from '../../controllers/webhookController.js';
import { triggerImmediatePrint, broadcastCashOrderToKitchen } from '../../helpers/broadcast.helper.js';

// ========== CREATE ORDER HANDLER (UPDATED) ==========
export async function createOrderHandler({
  orderId,
  orderData,
  source,
  isOpenBill,
  isReservation,
  requiresDelivery,
  recipientData,
  paymentDetails,
  appliedPromos = [],
  session: externalSession = null, // ✅ Accept external session
  idempotencyKey // ✅ Accept idempotencyKey (defaults to undefined)
}) {
  let session = externalSession;

  const useTransaction = (source === 'Web' || source === 'App') &&
    (orderData.loyaltyPointsToRedeem > 0 || orderData.customerId);

  const cashierNeedsTransaction = source === 'Cashier' &&
    (orderData.loyaltyPointsToRedeem > 0 || orderData.customerId);

  const shouldUseTransaction = useTransaction || cashierNeedsTransaction;

  try {
    console.log(`📝 createOrderHandler:`, {
      orderId,
      source,
      useTransaction,
      hasLoyalty: orderData.loyaltyPointsToRedeem > 0,
      appliedPromosCount: appliedPromos?.length || 0,
      promoTypes: appliedPromos?.map(p => p.promoType) || []
    });

    if (shouldUseTransaction && !session) {
      session = await mongoose.startSession();
    }

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
      appliedPromos,
      useTransaction: shouldUseTransaction,
      idempotencyKey // ✅ Pass idempotencyKey
    });

    // Verifikasi order tersimpan di database
    console.log('🔄 Verifying order in database...');
    await new Promise(resolve => setTimeout(resolve, 100));

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
      selectedPromosCount: verifiedOrder.selectedPromos?.length || 0,
      selectedPromoDiscount: verifiedOrder.discounts?.selectedPromoDiscount || 0,
      paymentsTotal: verifiedOrder.payments.reduce((sum, p) => sum + p.amount, 0)
    });

    // Trigger immediate print
    try {
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

      // Add customAmount items
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

        console.log(`➕ Added ${verifiedOrder.customAmountItems.length} custom amount items to print payload`);
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
      console.error('⚠️ Failed to trigger immediate print:', printError.message);
    }

    // Enqueue inventory update
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
      selectedPromos: orderResult.selectedPromos,  // ✅ RETURN SELECTED PROMOS
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
    // Only end session if we created it (no external session passed)
    if (session && !externalSession) {
      try {
        await session.endSession();
        console.log('MongoDB session ended');
      } catch (e) {
        console.warn('Failed to end session:', e.message);
      }
    }
  }
}

// ========== CREATE ORDER WITH SIMPLE TRANSACTION (UPDATED) ==========
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
  appliedPromos = [],  // ✅ RENAME parameter
  useTransaction,
  idempotencyKey // ✅ Accept idempotencyKey (defaults to undefined)
}) {
  console.log('Order Handler - Starting Order Creation:', {
    orderId,
    orderType: orderData.orderType,
    source,
    appliedPromosCount: appliedPromos.length,
    promoTypes: appliedPromos.map(p => p.promoType),
    hasCustomAmountItems: orderData.customAmountItems && orderData.customAmountItems.length > 0,
    menuItemsCount: orderData.items ? orderData.items.length : 0,
    outletId: orderData.outletId,
    customerId: orderData.customerId || 'none',
    paymentMethod: orderData.paymentMethod,
    isSplitPayment: orderData.isSplitPayment,
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
      openBillStatus, // ✅ Extract openBillStatus
      openBillClosedAt, // ✅ Extract openBillClosedAt
      openBillStartedAt, // ✅ Extract openBillStartedAt
      ...cleanOrderData
    } = orderData;


    // Process order items dengan promo selections
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
      appliedPromos
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
      taxesAndFees,
      selectedPromos  // ✅ NEW: hasil dari processSelectedPromos
    } = processed;

    console.log('📊 Processed Order Data:', {
      orderItemsCount: orderItems.length,
      customItemsCount: processedCustomAmountItems.length,
      selectedPromosCount: selectedPromos?.length || 0,
      totalDiscount: discounts.total,
      grandTotal: totals.grandTotal
    });

    // Format applied promos untuk disimpan
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

    // Determine initial status based on source and payment method
    let initialStatus = 'Pending';
    let paymentMethodData = 'Cash';

    if (source === 'Cashier') {
      // ✅ If closing Open Bill (Payment), status should be Completed
      if (isOpenBill && openBillStatus === 'closed') {
        initialStatus = 'Completed';
      } else {
        initialStatus = isOpenBill ? 'Waiting' : 'Waiting'; // ✅ Open bill needs "Waiting" status for workstation
      }

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
      isSplitPayment
    });

    // Validasi payment details vs order total
    const totalPaymentAmount = orderPaymentDetails ?
      (Array.isArray(orderPaymentDetails) ?
        orderPaymentDetails.reduce((sum, p) => sum + (p.amount || 0), 0) :
        (orderPaymentDetails.amount || 0)) : 0;

    const totalCustomAmount = processedCustomAmountItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const effectiveOrderTotal = totals.grandTotal;

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
      console.log('Processing split payment:', {
        paymentCount: orderPaymentDetails.length,
        totalAmount: orderPaymentDetails.reduce((sum, p) => sum + (p.amount || 0), 0)
      });

      payments = orderPaymentDetails.map((payment, index) => {
        const paymentStatus = mapPaymentStatus(payment.status || 'completed');

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
    } else {
      // Single payment
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

    // ✅ NEW: Apply order-level custom discount (from Flutter)
    const orderLevelCustomDiscount = orderData.customDiscountDetails?.isActive
      ? (orderData.customDiscountDetails.discountAmount || 0)
      : (cleanOrderData.discounts?.customDiscount || 0);

    console.log('💰 APPLYING ORDER-LEVEL CUSTOM DISCOUNT:', {
      orderLevelCustomDiscount,
      fromCustomDiscountDetails: orderData.customDiscountDetails?.discountAmount,
      fromCleanOrderData: cleanOrderData.discounts?.customDiscount,
      isActive: orderData.customDiscountDetails?.isActive,
      totalBeforeAdjustment: totals.afterDiscount
    });

    // Adjust totals if order-level custom discount exists
    let adjustedTotalAfterDiscount = totals.afterDiscount;
    let adjustedGrandTotal = totals.grandTotal;
    let adjustedTaxAmount = totals.totalTax;
    let adjustedServiceFee = totals.totalServiceFee;
    let adjustedTaxAndServiceDetails = taxesAndFees;

    if (orderLevelCustomDiscount > 0) {
      adjustedTotalAfterDiscount = Math.max(0, totals.afterDiscount - orderLevelCustomDiscount);

      // ✅ RECALCULATE tax properly based on adjusted total
      const recalculatedTax = await calculateTaxesAndServices(
        outletId,
        adjustedTotalAfterDiscount,
        orderItems,
        processedCustomAmountItems
      );

      adjustedTaxAmount = recalculatedTax.totalTax;
      adjustedServiceFee = recalculatedTax.totalServiceFee;
      adjustedTaxAndServiceDetails = recalculatedTax.taxAndServiceDetails;
      adjustedGrandTotal = adjustedTotalAfterDiscount + adjustedTaxAmount + adjustedServiceFee;

      console.log('💰 ADJUSTED TOTALS WITH RECALCULATED TAX:', {
        originalAfterDiscount: totals.afterDiscount,
        adjustedTotalAfterDiscount,
        originalTax: totals.totalTax,
        adjustedTaxAmount,
        originalServiceFee: totals.totalServiceFee,
        adjustedServiceFee,
        originalGrandTotal: totals.grandTotal,
        adjustedGrandTotal,
        itemCustomDiscounts: discounts.itemCustomDiscounts,
        orderLevelCustomDiscount,
        totalCustomDiscount: discounts.itemCustomDiscounts + orderLevelCustomDiscount  // ✅ Auto-calculated
      });
    }

    // Prepare base order data
    const baseOrderData = {
      order_id: orderId,
      user: user || 'Customer',
      cashierId: cashierId || null,
      items: orderItems,
      customAmountItems: processedCustomAmountItems,
      status: initialStatus,
      payments: payments,
      paymentMethod: paymentMethodData,
      orderType: orderType || 'Dine-In',
      tableNumber: tableNumber || '',
      type: type || 'Indoor',
      outlet: outletId,
      outletId: outletId,
      totalBeforeDiscount: totals.beforeDiscount,
      totalAfterDiscount: adjustedTotalAfterDiscount,  // ✅ Use adjusted value
      totalCustomAmount: totals.totalCustomAmount,
      totalTax: adjustedTaxAmount,  // ✅ Use recalculated tax
      totalServiceFee: adjustedServiceFee,  // ✅ Use recalculated service fee
      grandTotal: adjustedGrandTotal,  // ✅ Use adjusted value
      source: source,
      source: source,
      isOpenBill: isOpenBill || false,
      isOpenBill: isOpenBill || false,
      openBillStatus: openBillStatus || (isOpenBill ? 'active' : 'closed'), // ✅ Use passed status or default to active if open bill
      openBillClosedAt: openBillClosedAt || null, // ✅ Add openBillClosedAt
      openBillStartedAt: openBillStartedAt || null, // ✅ Add openBillStartedAt
      isSplitPayment: isSplitPayment,
      splitPaymentStatus: calculateSplitPaymentStatus(payments, totals.grandTotal),
      discounts: {
        selectedPromoDiscount: discounts.selectedPromoDiscount || 0,  // ✅ RENAME FIELD
        autoPromoDiscount: discounts.autoPromoDiscount || 0,
        manualDiscount: discounts.manualDiscount || 0,
        voucherDiscount: discounts.voucherDiscount || 0,
        loyaltyDiscount: discounts.loyaltyDiscount || 0,
        customAmountDiscount: discounts.customAmountDiscount || 0,
        customDiscount: discounts.itemCustomDiscounts + orderLevelCustomDiscount,  // ✅ AUTO-CALCULATED: item + order discounts
        total: discounts.total || 0
      },
      // ✅ NEW: Custom discount details from Flutter
      customDiscountDetails: orderData.customDiscountDetails || {
        isActive: false,
        discountValue: 0,
        discountAmount: 0
      },
      appliedPromos: selectedPromos,
      appliedManualPromo: promotions.appliedManualPromo || null,
      appliedVoucher: promotions.appliedVoucher || null,
      taxAndServiceDetails: adjustedTaxAndServiceDetails || [],  // ✅ Use recalculated tax details
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
      ...(idempotencyKey ? { idempotencyKey } : {}), // ✅ Save idempotencyKey only if present
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

    // Handle delivery fields
    const isDeliveryOrder = (orderType === 'Delivery' || requiresDelivery) && source === 'App';
    if (isDeliveryOrder) {
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
    } else {
      baseOrderData.deliveryStatus = "false";
      baseOrderData.deliveryProvider = "false";
    }

    // Handle reservation data
    if (isReservation && orderData.reservationData) {
      baseOrderData.reservation = orderData.reservationData._id || orderData.reservationData;
      baseOrderData.orderType = 'Reservation';
    }

    // Log data sebelum save
    console.log('Order data before save:', {
      orderId,
      orderType: baseOrderData.orderType,
      source: baseOrderData.source,
      status: baseOrderData.status,
      totalMenuItems: baseOrderData.items.length,
      selectedPromosCount: baseOrderData.selectedPromos?.length || 0,
      selectedPromoDiscount: baseOrderData.discounts.selectedPromoDiscount,
      grandTotal: baseOrderData.grandTotal,
      paymentsCount: baseOrderData.payments.length
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

    // Save dengan session
    const saveOptions = useTransaction && session ? { session } : {};
    await newOrder.save(saveOptions);

    // Log order creation success
    console.log(`\n✅ ========== ORDER CREATED ==========`);
    console.log(`📋 Order ID: ${newOrder.order_id}`);
    console.log(`🪑 Table: ${newOrder.tableNumber || 'N/A'}`);
    console.log(`👤 Customer: ${newOrder.user || 'Guest'}`);
    console.log(`📦 Items: ${newOrder.items.length} items`);

    if (newOrder.customAmountItems && newOrder.customAmountItems.length > 0) {
      console.log(`💵 Custom Amounts: ${newOrder.customAmountItems.length} items`);
    }

    if (newOrder.selectedPromos && newOrder.selectedPromos.length > 0) {
      console.log(`🎁 Selected Promos: ${newOrder.selectedPromos.length} promos`);
      newOrder.selectedPromos.forEach(promo => {
        console.log(`   • ${promo.promoName} (${promo.promoType}): Discount: Rp ${promo.appliedDiscount.toLocaleString('id-ID')}`);
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
      selectedPromosCount: newOrder.selectedPromos?.length || 0,
      selectedPromoDiscount: newOrder.discounts.selectedPromoDiscount,
      grandTotal: newOrder.grandTotal,
      isSplitPayment: newOrder.isSplitPayment,
      paymentsCount: newOrder.payments.length
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
      selectedPromos: selectedPromos,  // ✅ RETURN SELECTED PROMOS
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

// ========== PROCESS ORDER ITEMS (UPDATED) ==========
export async function processOrderItems({
  items,
  outlet,
  orderType,
  voucherCode,
  customerType,
  source,
  customerId,
  loyaltyPointsToRedeem,
  customAmountItems,
  appliedPromos = []
}, session) {

  if ((!items || !Array.isArray(items) || items.length === 0) &&
    (!customAmountItems || !Array.isArray(customAmountItems) || customAmountItems.length === 0)) {
    throw new Error('Order items cannot be empty');
  }

  const orderItems = [];
  let totalBeforeDiscount = 0;

  // Process regular menu items
  if (items && Array.isArray(items)) {
    for (const item of items) {
      if (!item.id || !item.quantity || item.quantity <= 0) {
        throw new Error(`Invalid item quantity (${item.quantity}) or missing ID for item`);
      }

      const [menuItem, recipe] = await Promise.all([
        MenuItem.findById(item.id).populate('category').session(session),
        Recipe.findOne({ menuItemId: item.id }).session(session),
      ]);

      if (!menuItem) {
        throw new Error(`Menu item ${item.id} not found`);
      }
      if (!recipe) {
        throw new Error(`Recipe for menu item ${menuItem.name} (${item.id}) not found`);
      }

      let itemPrice = menuItem.price;
      const addons = [];
      const toppings = [];

      // Process toppings
      if (item.selectedToppings?.length > 0) {
        await processToppings(item, menuItem, recipe, toppings, (added) => {
          itemPrice += added;
        });
      }

      // Process addons
      if (item.selectedAddons?.length > 0) {
        await processAddons(item, menuItem, recipe, addons, (added) => {
          itemPrice += added;
        });
      }

      const subtotal = itemPrice * item.quantity;
      totalBeforeDiscount += subtotal;

      // Check if item belongs to Bazar category
      const isBazarCategory = await checkBazarCategory(menuItem.category, session);

      orderItems.push({
        menuItem: item.id,
        menuItemName: menuItem.name,
        quantity: item.quantity,
        price: itemPrice,
        subtotal,
        addons,
        toppings,
        notes: item.notes || '',
        isPrinted: false,
        dineType: item.dineType || 'Dine-In',
        isBazarCategory,
        // ✅ NEW: Pass through customDiscount from Flutter
        customDiscount: item.customDiscount || {
          isActive: false,
          discountValue: 0,
          discountAmount: 0
        }
      });
    }
  }

  // Process custom amount items
  let customAmountItemsData = [];
  let totalCustomAmount = 0;

  if (customAmountItems && Array.isArray(customAmountItems)) {
    customAmountItemsData = customAmountItems.map(item => ({
      amount: Number(item.amount) || 0,
      name: item.name || 'Penyesuaian Pembayaran',
      description: item.description || 'Penyesuaian jumlah pembayaran',
      dineType: item.dineType || 'Dine-In',
      appliedAt: new Date(),
      isAutoCalculated: false
    }));

    totalCustomAmount = customAmountItemsData.reduce((total, item) => total + item.amount, 0);
  }

  // Gabungkan total menu items dan custom amount
  const combinedTotalBeforeDiscount = totalBeforeDiscount + totalCustomAmount;

  // LOYALTY PROGRAM (opsional)
  let loyaltyDiscount = 0;
  let loyaltyPointsUsed = 0;
  let loyaltyPointsEarned = 0;
  let loyaltyDetails = null;

  const isEligibleForLoyalty = customerId &&
    mongoose.Types.ObjectId.isValid(customerId) &&
    (source === 'app' || source === 'cashier' || source === 'Cashier');

  if (isEligibleForLoyalty && loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
    try {
      const redemptionResult = await redeemLoyaltyPoints(
        customerId,
        loyaltyPointsToRedeem,
        outlet,
        session
      );
      loyaltyDiscount = redemptionResult.discountAmount;
      loyaltyPointsUsed = redemptionResult.pointsUsed;
    } catch (redemptionError) {
      console.error('Loyalty points redemption failed:', redemptionError);
      loyaltyDiscount = 0;
      loyaltyPointsUsed = 0;
    }
  }

  // PERBAIKAN: Semua diskon diterapkan SEBELUM tax
  const totalAfterLoyaltyDiscount = Math.max(0, combinedTotalBeforeDiscount - loyaltyDiscount);

  console.log('🎯 PRE-PROMO CALCULATION:', {
    menuItemsTotal: totalBeforeDiscount,
    customAmountTotal: totalCustomAmount,
    combinedTotalBeforeDiscount,
    loyaltyDiscount,
    totalAfterLoyaltyDiscount,
    appliedPromosCount: appliedPromos.length
  });


  // ✅ PROSES SELECTED PROMOS JIKA ADA (PRIORITAS TINGGI)
  let selectedPromoResult = {
    totalDiscount: 0,
    appliedPromos: [],
    usedItems: [],
    freeItems: []
  };

  // Hanya proses untuk kasir yang memilih promo
  if (appliedPromos.length > 0 && (source === 'Cashier' || source === 'cashier')) {
    selectedPromoResult = await processSelectedPromos(
      appliedPromos,
      orderItems,
      outlet,
      session
    );

    console.log('✅ APPLIED PROMOS PROCESSED:', {
      totalDiscount: selectedPromoResult.totalDiscount,
      appliedPromosCount: selectedPromoResult.appliedPromos.length,
      usedItemsCount: selectedPromoResult.usedItems.length,
      freeItemsCount: selectedPromoResult.freeItems.length
    });
  }

  // HITUNG ITEMS YANG MASIH BISA DIKENAI AUTO PROMO
  let availableItemsForAutoPromo = [];
  if (selectedPromoResult.usedItems.length > 0) {
    const usedItemIds = new Set(selectedPromoResult.usedItems.map(item =>
      item.menuItem.toString()
    ));

    availableItemsForAutoPromo = orderItems.map(item => {
      const isUsed = usedItemIds.has(item.menuItem.toString());
      if (isUsed) {
        const usedPromo = selectedPromoResult.usedItems.find(used =>
          used.menuItem.toString() === item.menuItem.toString()
        );

        if (usedPromo && usedPromo.quantityUsed) {
          const remainingQuantity = Math.max(0, item.quantity - usedPromo.quantityUsed);
          return {
            ...item,
            quantity: remainingQuantity,
            subtotal: item.price * remainingQuantity
          };
        }
      }
      return item;
    }).filter(item => item.quantity > 0);
  } else {
    availableItemsForAutoPromo = [...orderItems];
  }

  // Tambahkan free items dari Buy X Get Y ke order items
  if (selectedPromoResult.freeItems && selectedPromoResult.freeItems.length > 0) {
    selectedPromoResult.freeItems.forEach(freeItem => {
      availableItemsForAutoPromo.push({
        menuItem: freeItem.menuItem,
        menuItemName: freeItem.menuItemName,
        quantity: freeItem.quantity,
        price: 0, // Gratis
        subtotal: 0,
        isFreeItem: true,
        dineType: 'Dine-In',
        isPrinted: false
      });
    });
  }

  // PROSES AUTO PROMO HANYA UNTUK ITEMS YANG BELUM TERPAKAI
  const autoPromoResult = await checkAutoPromos(
    availableItemsForAutoPromo,
    outlet,
    orderType
  );

  console.log('🎯 AUTO PROMO AFTER SELECTED PROMOS:', {
    totalDiscount: autoPromoResult.totalDiscount,
    appliedPromosCount: autoPromoResult.appliedPromos.length,
    itemsUsed: availableItemsForAutoPromo.length
  });

  // MANUAL PROMO & VOUCHER
  const promotionResults = await processAllDiscountsBeforeTax({
    orderItems: availableItemsForAutoPromo,
    outlet,
    orderType,
    voucherCode,
    customerType,
    totalBeforeDiscount: totalAfterLoyaltyDiscount - selectedPromoResult.totalDiscount,
    source,
    customAmountItems: customAmountItemsData,
    selectedPromoDiscount: selectedPromoResult.totalDiscount
  });

  // ✅ NEW: Calculate custom discount from items (from Flutter)
  const itemCustomDiscounts = orderItems.reduce((total, item) => {
    if (item.customDiscount?.isActive && item.customDiscount?.discountAmount) {
      return total + item.customDiscount.discountAmount;
    }
    return total;
  }, 0);

  console.log('💰 CUSTOM DISCOUNT CALCULATION:', {
    itemCustomDiscounts,
    itemsWithDiscount: orderItems.filter(item => item.customDiscount?.isActive).length
  });

  // ✅ NEW: Order-level custom discount will be passed separately through baseOrderData
  // For now, only include item-level discounts in processOrderItems
  // Order-level discount will be added later in createOrderWithSimpleTransaction

  // TOTAL SEMUA DISKON
  const totalAllDiscounts =
    selectedPromoResult.totalDiscount +
    autoPromoResult.totalDiscount +
    loyaltyDiscount +
    promotionResults.autoPromoDiscount +
    promotionResults.manualDiscount +
    promotionResults.voucherDiscount +
    itemCustomDiscounts;  // ✅ Item-level custom discounts only

  const totalAfterAllDiscounts = Math.max(0, combinedTotalBeforeDiscount - totalAllDiscounts);

  console.log('🎯 DISCOUNT BREAKDOWN:', {
    selectedPromoDiscount: selectedPromoResult.totalDiscount,
    autoPromoDiscount: autoPromoResult.totalDiscount + promotionResults.autoPromoDiscount,
    manualDiscount: promotionResults.manualDiscount,
    voucherDiscount: promotionResults.voucherDiscount,
    loyaltyDiscount,
    itemCustomDiscounts,  // ✅ Item-level only
    totalAllDiscounts,
    combinedTotalBeforeDiscount,
    totalAfterAllDiscounts
  });

  // Hitung proporsi diskon untuk custom amount
  let customAmountDiscount = 0;
  let menuItemsDiscount = totalAllDiscounts - loyaltyDiscount;

  if (totalCustomAmount > 0 && menuItemsDiscount > 0) {
    const totalEligibleAmount = totalBeforeDiscount + totalCustomAmount;
    const customAmountRatio = totalCustomAmount / totalEligibleAmount;
    customAmountDiscount = menuItemsDiscount * customAmountRatio;
    menuItemsDiscount = menuItemsDiscount - customAmountDiscount;
  }

  // LOYALTY POINTS EARNED (setelah semua diskon)
  if (isEligibleForLoyalty) {
    try {
      const eligibleAmountForLoyalty = totalAfterAllDiscounts;
      const pointsResult = await calculateLoyaltyPoints(
        eligibleAmountForLoyalty,
        customerId,
        outlet,
        session
      );
      loyaltyPointsEarned = pointsResult.pointsEarned;
      loyaltyDetails = pointsResult.loyaltyDetails;
    } catch (pointsError) {
      console.error('Loyalty points calculation failed:', pointsError);
      loyaltyPointsEarned = 0;
    }
  }

  // APPLY TAX SETELAH SEMUA DISKON
  const taxResult = await calculateTaxesAndServices(
    outlet,
    totalAfterAllDiscounts,
    orderItems,
    customAmountItemsData
  );

  // FINAL GRAND TOTAL
  const grandTotal = totalAfterAllDiscounts + taxResult.totalTax + taxResult.totalServiceFee;

  console.log('🎯 ORDER PROCESSING FINAL SUMMARY:', {
    menuItemsTotal: totalBeforeDiscount,
    customAmountTotal: totalCustomAmount,
    combinedTotalBeforeDiscount,
    selectedPromoDiscount: selectedPromoResult.totalDiscount,
    autoPromoDiscount: autoPromoResult.totalDiscount + promotionResults.autoPromoDiscount,
    manualDiscount: promotionResults.manualDiscount,
    voucherDiscount: promotionResults.voucherDiscount,
    loyaltyDiscount,
    itemCustomDiscounts,  // ✅ NEW: Log in summary
    totalAllDiscounts,
    totalAfterAllDiscounts,
    totalTax: taxResult.totalTax,
    totalServiceFee: taxResult.totalServiceFee,
    grandTotal,
    selectedPromosCount: selectedPromoResult.appliedPromos.length,
    hasCustomAmountItems: customAmountItemsData.length > 0
  });

  return {
    orderItems,
    customAmountItems: customAmountItemsData,
    totals: {
      beforeDiscount: combinedTotalBeforeDiscount,
      afterDiscount: totalAfterAllDiscounts,
      totalCustomAmount: totalCustomAmount,
      totalTax: taxResult.totalTax,
      totalServiceFee: taxResult.totalServiceFee,
      grandTotal
    },
    discounts: {
      selectedPromoDiscount: selectedPromoResult.totalDiscount,  // ✅ RENAME FIELD
      autoPromoDiscount: autoPromoResult.totalDiscount + promotionResults.autoPromoDiscount,
      manualDiscount: promotionResults.manualDiscount,
      voucherDiscount: promotionResults.voucherDiscount,
      loyaltyDiscount: loyaltyDiscount,
      customAmountDiscount: customAmountDiscount,
      itemCustomDiscounts,  // ✅ NEW: Include item custom discounts
      total: totalAllDiscounts
    },
    promotions: {
      appliedPromos: [...promotionResults.appliedPromos, ...autoPromoResult.appliedPromos],
      appliedManualPromo: promotionResults.appliedPromo,
      appliedVoucher: promotionResults.voucher
    },
    selectedPromos: selectedPromoResult.appliedPromos,  // ✅ NEW: return selected promos
    loyalty: isEligibleForLoyalty ? {
      pointsUsed: loyaltyPointsUsed,
      pointsEarned: loyaltyPointsEarned,
      discountAmount: loyaltyDiscount,
      loyaltyDetails: loyaltyDetails,
      customerId: customerId,
      isApplied: true
    } : {
      pointsUsed: 0,
      pointsEarned: 0,
      discountAmount: 0,
      isApplied: false
    },
    taxesAndFees: taxResult.taxAndServiceDetails,
    taxCalculationMethod: 'ALL_DISCOUNTS_BEFORE_TAX',
    bazarItemsExcluded: taxResult.bazarItemsExcluded
  };
}

// ========== HELPER FUNCTIONS ==========
async function processToppings(item, menuItem, recipe, toppings, addPriceCallback) {
  for (const topping of item.selectedToppings) {
    const toppingInfo = menuItem.toppings.find(t => t._id.toString() === topping.id);
    if (!toppingInfo) {
      console.warn(`Topping ${topping.id} not found in menu item ${menuItem._id}`);
      continue;
    }

    toppings.push({
      id: topping.id,
      name: toppingInfo.name,
      price: toppingInfo.price || 0
    });

    addPriceCallback(toppingInfo.price || 0);
  }
}

async function processAddons(item, menuItem, recipe, addons, addPriceCallback) {
  for (const addon of item.selectedAddons) {
    const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
    if (!addonInfo) {
      console.warn(`Addon ${addon.id} not found in menu item ${menuItem._id}`);
      continue;
    }

    if (addon.options?.length > 0) {
      for (const option of addon.options) {
        const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
        if (!optionInfo) {
          console.warn(`Addon option ${option.id} not found in addon ${addonInfo.name}`);
          continue;
        }

        addons.push({
          id: addon.id,
          name: `${addonInfo.name}`,
          price: optionInfo.price || 0,
          options: [{
            id: option.id,
            label: optionInfo.label,
            price: optionInfo.price
          }]
        });

        addPriceCallback(optionInfo.price || 0);
      }
    }
  }
}

async function checkBazarCategory(categoryId, session) {
  if (!categoryId) return false;

  try {
    const Category = mongoose.model('Category');
    const category = await Category.findById(categoryId).session(session);

    return category && (category.name === 'Bazar' || category._id.toString() === '691ab44b8c10cbe7789d7a03');
  } catch (error) {
    console.error('Error checking Bazar category:', error);
    return false;
  }
}

export async function calculateTaxesAndServices(outlet, taxableAmount, orderItems, customAmountItems = []) {
  const taxesAndServices = await TaxAndService.find({
    isActive: true,
    appliesToOutlets: new mongoose.Types.ObjectId(outlet)
  });

  const taxAndServiceDetails = [];
  let totalTax = 0;
  let totalServiceFee = 0;
  let bazarItemsExcluded = 0;
  let bazarItemsAmount = 0;

  // Hitung total amount untuk items Bazar (tidak kena pajak)
  const nonBazarItems = orderItems.filter(item => !item.isBazarCategory);
  const bazarItems = orderItems.filter(item => item.isBazarCategory);

  bazarItemsExcluded = bazarItems.length;
  bazarItemsAmount = bazarItems.reduce((total, item) => total + (item.subtotal || 0), 0);

  for (const charge of taxesAndServices) {
    let applicableAmount = taxableAmount - bazarItemsAmount;

    if (charge.appliesToMenuItems?.length > 0) {
      applicableAmount = 0;

      for (const item of nonBazarItems) {
        if (charge.appliesToMenuItems.some(menuId =>
          menuId.equals(new mongoose.Types.ObjectId(item.menuItem))
        )) {
          applicableAmount += item.subtotal || 0;
        }
      }

      for (const customItem of customAmountItems) {
        applicableAmount += customItem.amount || 0;
      }
    }

    if (charge.type === 'tax') {
      const taxAmount = (charge.percentage / 100) * applicableAmount;
      totalTax += taxAmount;

      taxAndServiceDetails.push({
        id: charge._id,
        name: charge.name,
        type: 'tax',
        amount: taxAmount,
        percentage: charge.percentage,
        appliesTo: charge.appliesToMenuItems?.length > 0 ? 'specific_items' : 'all_items',
        applicableAmount,
        bazarItemsExcluded: bazarItemsExcluded
      });
    } else if (charge.type === 'service') {
      const feeAmount = charge.fixedFee
        ? charge.fixedFee
        : (charge.percentage / 100) * applicableAmount;

      totalServiceFee += feeAmount;

      taxAndServiceDetails.push({
        id: charge._id,
        name: charge.name,
        type: 'service',
        amount: feeAmount,
        ...(charge.fixedFee
          ? { fixedFee: charge.fixedFee }
          : { percentage: charge.percentage }),
        appliesTo: charge.appliesToMenuItems?.length > 0 ? 'specific_items' : 'all_items',
        applicableAmount,
        bazarItemsExcluded: bazarItemsExcluded
      });
    }
  }

  return {
    taxAndServiceDetails,
    totalTax,
    totalServiceFee,
    bazarItemsExcluded
  };
}

export async function processAllDiscountsBeforeTax({
  orderItems,
  outlet,
  orderType,
  voucherCode,
  customerType,
  totalBeforeDiscount,
  source,
  customAmountItems,
  selectedPromoDiscount = 0
}) {
  const canUsePromo = source === 'app' || source === 'cashier' || source === 'Cashier';

  // 1. APPLY AUTO PROMO
  const autoPromoResult = await checkAutoPromos(orderItems, outlet, orderType);
  const autoPromoDiscount = autoPromoResult.totalDiscount;

  // 2. APPLY MANUAL PROMO
  const manualPromoResult = canUsePromo ?
    await checkManualPromo(totalBeforeDiscount, outlet, customerType) :
    { discount: 0, appliedPromo: null };
  const manualDiscount = manualPromoResult.discount;

  // 3. APPLY VOUCHER
  const subtotalAfterAutoManual = Math.max(0,
    totalBeforeDiscount - autoPromoDiscount - manualDiscount
  );

  const voucherResult = canUsePromo ?
    await checkVoucher(voucherCode, subtotalAfterAutoManual, outlet) :
    { discount: 0, voucher: null };
  const voucherDiscount = voucherResult.voucher ? voucherResult.discount : 0;

  // 4. TOTAL SEMUA DISKON
  const totalAllDiscounts = selectedPromoDiscount + autoPromoDiscount + manualDiscount + voucherDiscount;
  const totalAfterAllDiscounts = Math.max(0, totalBeforeDiscount - totalAllDiscounts);

  return {
    autoPromoDiscount,
    manualDiscount,
    voucherDiscount,
    totalAllDiscounts,
    totalAfterAllDiscounts,
    appliedPromos: autoPromoResult.appliedPromos,
    appliedPromo: manualPromoResult.appliedPromo,
    voucher: voucherResult.voucher
  };
}

function mapPaymentStatus(status) {
  const statusMap = {
    'settlement': 'completed',
    'pending': 'pending',
    'deny': 'failed',
    'cancel': 'failed',
    'expire': 'failed',
    'refund': 'refunded',
    'completed': 'completed',
    'failed': 'failed',
    'pending_refund': 'pending'
  };

  return statusMap[status] || 'pending';
}

function calculateSplitPaymentStatus(payments, grandTotal) {
  if (!payments || payments.length === 0) {
    return 'not_started';
  }

  const totalPaid = payments.reduce((total, payment) => {
    if (payment.status === 'completed') {
      return total + (payment.amount || 0);
    }
    return total;
  }, 0);

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
    console.error('Cannot enqueue inventory update for failed order');
    return {
      success: true, // Tetap return success agar order tidak gagal
      orderId: orderResult?.orderId,
      warning: 'Inventory update skipped - order result invalid'
    };
  }

  try {
    // Validasi orderQueue tersedia
    if (!orderQueue) {
      console.warn('⚠️ orderQueue not available, skipping inventory update');
      return {
        success: true,
        orderId: orderResult.orderId,
        warning: 'Inventory update skipped - queue not available'
      };
    }

    const jobData = {
      type: 'update_inventory',
      payload: {
        orderId: orderResult.orderId,
        orderNumber: orderResult.orderNumber,
        items: orderResult.processedItems || [],
        customAmountItems: orderResult.customAmountItems || [],
        outletId: orderResult.orderData?.outletId,
        timestamp: new Date()
      }
    };

    // Coba enqueue dengan error handling
    const job = await orderQueue.add(
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
        removeOnFail: false, // Biarkan job gagal tetap ada untuk debugging
        delay: 1000 // Delay 1 detik agar order commit dulu
      }
    );

    console.log('✅ Inventory update enqueued:', {
      orderId: orderResult.orderId,
      jobId: job.id,
      itemsCount: jobData.payload.items.length,
      customItemsCount: jobData.payload.customAmountItems.length
    });

    return {
      success: true,
      orderId: orderResult.orderId,
      orderNumber: orderResult.orderNumber,
      jobId: job.id
    };
  } catch (err) {
    console.error('⚠️ Failed to enqueue inventory update (non-blocking):', {
      error: err.message,
      orderId: orderResult?.orderId,
      errorType: err.name
    });

    // JANGAN throw error di sini, biarkan order tetap berhasil
    return {
      success: true, // Tetap return success
      orderId: orderResult?.orderId,
      warning: 'Inventory update failed but order created successfully',
      error: err.message
    };
  }
}


export default {
  createOrderHandler,
  processOrderItems,
  calculateTaxesAndServices,
  processAllDiscountsBeforeTax,
  verifyOrderExists,
};