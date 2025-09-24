import { io } from '../index.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';

export const midtransWebhook = async (req, res) => {
  let requestId = Math.random().toString(36).substr(2, 9);

  try {
    const notificationJson = req.body;
    let {
      transaction_status,
      order_id, // awalnya ini payment_code dari Midtrans
      fraud_status,
      payment_type
    } = notificationJson;

    console.log(`[WEBHOOK ${requestId}] Received Midtrans notification:`, {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      timestamp: new Date().toISOString()
    });

    // Validate critical fields
    if (!order_id || !transaction_status) {
      console.warn(`[WEBHOOK ${requestId}] Invalid notification: Missing required fields`);
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Retry mechanism untuk menunggu payment record
    let existingPayment = null;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds

    while (retryCount < maxRetries) {
      existingPayment = await Payment.findOne({ payment_code: order_id });

      if (existingPayment) {
        console.log(
          `[WEBHOOK ${requestId}] Payment record found for payment_code ${order_id} after ${retryCount} retries`
        );

        // timpa order_id dengan order_id internal dari payment record
        order_id = existingPayment.order_id;

        console.log(`[WEBHOOK ${requestId}] Overriding order_id with value from Payment record: ${order_id}`);
        break;
      }

      console.log(
        `[WEBHOOK ${requestId}] Payment record not found for payment_code ${order_id}, retry ${retryCount + 1}/${maxRetries}`
      );
      retryCount++;

      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    if (!existingPayment) {
      console.error(`[WEBHOOK ${requestId}] Payment record not found after retries`);
      return res.status(404).json({ message: 'Payment record not found' });
    }

    console.log(`[WEBHOOK ${requestId}] Processing webhook for existing payment:`, existingPayment._id);

    // Update payment record (gunakan payment_code dari existingPayment)
    const paymentData = {
      status: transaction_status,
      fraud_status: fraud_status,
      paidAt: ['settlement', 'capture'].includes(transaction_status) ? new Date() : null,
      updatedAt: new Date()
    };

    // Update payment record by internal order_id
    const updatedPayment = await Payment.findOneAndUpdate(
      { order_id }, // pakai order_id yang sudah ditimpa
      paymentData,
      { new: true, runValidators: true }
    );

    if (!updatedPayment) {
      console.error(`[WEBHOOK ${requestId}] Failed to update payment for payment_code ${existingPayment.payment_code}`);
      return res.status(404).json({ message: 'Payment record not found' });
    }

    console.log(`[WEBHOOK ${requestId}] Payment record updated successfully for payment_code ${existingPayment.payment_code}`);

    // Update raw_response untuk konsistensi
    if (updatedPayment.raw_response) {
      updatedPayment.raw_response.transaction_status = transaction_status;
      updatedPayment.raw_response.fraud_status = fraud_status;
      updatedPayment.markModified('raw_response');
      await updatedPayment.save();
      console.log(`[WEBHOOK ${requestId}] Raw response updated`);
    }

    // ✅ PERBAIKAN: Populate order dengan data lengkap untuk mapping yang konsisten
    const order = await Order.findOne({ order_id })
      .populate('user_id', 'name email phone')
      .populate('cashierId', 'name')
      .populate({
        path: 'items.menuItem',
        select: 'name price image category description'
      })
      .populate('outlet', 'name address');

    if (!order) {
      console.warn(`[WEBHOOK ${requestId}] Order with ID ${order_id} not found`);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`[WEBHOOK ${requestId}] Order ${order_id} found. Source: ${order.source}`);

    // Handle transaction status
    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        if (fraud_status === 'accept') {
          // ✅ PERBAIKAN: Update order status untuk pembayaran berhasil
          order.paymentStatus = 'Paid';
          await order.save();

          const paymentUpdateData = {
            order_id,
            status: order.status,
            paymentStatus: 'Paid', // ✅ Update status pembayaran
            transaction_status,
            fraud_status,
            timestamp: new Date()
          };

          // Emit ke room order yang spesifik
          io.to(`order_${order_id}`).emit('payment_status_update', paymentUpdateData);
          io.to(`order_${order_id}`).emit('order_status_update', paymentUpdateData);

          console.log(`[WEBHOOK ${requestId}] Emitted updates to room: order_${order_id}`);

          // ✅ PERBAIKAN: Gunakan mapping yang konsisten dengan endpoint lain
          const mappedOrder = mapOrderForCashier(order);
          
          // ✅ PERBAIKAN: Emit dengan struktur yang sama seperti endpoint lain
          io.to('cashier_room').emit('new_order', { mappedOrders: mappedOrder });
          console.log(`[WEBHOOK ${requestId}] Broadcasted order to cashier room with consistent mapping`);

        } else if (fraud_status === 'challenge') {
          const challengeData = {
            order_id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            transaction_status,
            fraud_status,
            timestamp: new Date()
          };

          io.to(`order_${order_id}`).emit('payment_status_update', challengeData);
          io.to(`order_${order_id}`).emit('order_status_update', challengeData);

          console.log(`[WEBHOOK ${requestId}] Order ${order_id} payment challenged`);
        }
        break;

      case 'deny':
      case 'cancel':
      case 'expire':
        order.status = 'Canceled';
        order.paymentStatus = 'Failed';
        await order.save();

        console.log(`[WEBHOOK ${requestId}] Order ${order_id} payment failed: ${transaction_status}`);

        const failedData = {
          order_id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          transaction_status,
          fraud_status,
          timestamp: new Date()
        };

        io.to(`order_${order_id}`).emit('payment_status_update', failedData);
        io.to(`order_${order_id}`).emit('order_status_update', failedData);
        break;

      case 'pending':
        const pendingData = {
          order_id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          transaction_status,
          fraud_status,
          timestamp: new Date()
        };

        io.to(`order_${order_id}`).emit('payment_status_update', pendingData);
        io.to(`order_${order_id}`).emit('order_status_update', pendingData);

        console.log(`[WEBHOOK ${requestId}] Order ${order_id} is still pending`);
        break;

      default:
        console.warn(`[WEBHOOK ${requestId}] Unhandled transaction status: ${transaction_status}`);
    }

    console.log(`[WEBHOOK ${requestId}] Webhook processed successfully`);
    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error(`[WEBHOOK ${requestId}] Webhook processing error:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      message: 'Failed to process webhook',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ PERBAIKAN: Helper function yang konsisten dengan endpoint lain
function mapOrderForCashier(order) {
  return {
    _id: order._id,
    userId: order.user_id?._id || order.user_id,
    customerName: order.user_id?.name || order.user,
    customerPhone: order.user_id?.phone || order.phoneNumber,
    cashierId: order.cashierId?._id || order.cashierId,
    cashierName: order.cashierId?.name,
    items: order.items.map(item => ({
      _id: item._id,
      quantity: item.quantity,
      subtotal: item.subtotal,
      isPrinted: item.isPrinted || false,
      menuItem: {
        _id: item.menuItem?._id,
        name: item.menuItem?.name || item.name,
        price: item.menuItem?.price || item.price,
        image: item.menuItem?.image,
        categories: item.menuItem?.category || [], // ✅ Konsisten dengan struktur lain
        description: item.menuItem?.description
      },
      selectedAddons: item.addons?.length > 0 ? item.addons.map(addon => ({
        name: addon.name,
        _id: addon._id,
        options: [{
          id: addon._id,
          label: addon.label || addon.name,
          price: addon.price
        }]
      })) : [],
      selectedToppings: item.toppings?.length > 0 ? item.toppings.map(topping => ({
        id: topping._id || topping.id,
        name: topping.name,
        price: topping.price
      })) : []
    })),
    status: order.status,
    paymentStatus: order.paymentStatus, // ✅ Tambahkan payment status
    orderType: order.orderType,
    deliveryAddress: order.deliveryAddress,
    tableNumber: order.tableNumber,
    pickupTime: order.pickupTime,
    type: order.type,
    paymentMethod: order.paymentMethod || "Cash",
    totalPrice: order.totalBeforeDiscount, // ✅ Konsisten dengan nama field
    totalBeforeDiscount: order.totalBeforeDiscount,
    totalAfterDiscount: order.totalAfterDiscount,
    taxAndService: order.taxAndService,
    grandTotal: order.grandTotal,
    voucher: order.voucher || null,
    outlet: order.outlet || null,
    promotions: order.promotions || [],
    appliedPromos: order.appliedPromos || [],
    source: order.source,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    __v: order.__v,
    isOpenBill: order.isOpenBill || false
  };
}

// ✅ TAMBAHAN: Helper function untuk backward compatibility
function mapOrderForFrontend(order) {
  // Gunakan mapping yang sama untuk konsistensi
  return mapOrderForCashier(order);
}