import { io } from '../index.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';

export const midtransWebhook = async (req, res) => {
  let requestId = Math.random().toString(36).substr(2, 9);

  try {
    const notificationJson = req.body;
    let {
      transaction_status,
      order_id, // ✅ Ini adalah order_id internal kita dari Midtrans
      fraud_status,
      payment_type,
      gross_amount,
      transaction_time,
      settlement_time,
      signature_key,
      merchant_id
    } = notificationJson;

    console.log(`[WEBHOOK ${requestId}] Received Midtrans notification:`, {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      gross_amount,
      timestamp: new Date().toISOString()
    });

    // ✅ VALIDASI: Pastikan field required ada
    if (!order_id || !transaction_status) {
      console.warn(`[WEBHOOK ${requestId}] Invalid notification: Missing required fields`);
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ PERBAIKAN 1: Langsung cari payment berdasarkan order_id (bukan payment_code)
    const existingPayment = await Payment.findOne({ order_id });

    if (!existingPayment) {
      console.error(`[WEBHOOK ${requestId}] Payment record not found for order_id: ${order_id}`);
      return res.status(404).json({ message: 'Payment record not found' });
    }

    console.log(`[WEBHOOK ${requestId}] Processing webhook for payment:`, existingPayment._id);

    // ✅ PERBAIKAN 2: Update payment record dengan data lengkap dari Midtrans
    const paymentUpdateData = {
      status: transaction_status,
      fraud_status: fraud_status,
      payment_type: payment_type,
      gross_amount: parseFloat(gross_amount) || existingPayment.amount,
      transaction_time: transaction_time,
      settlement_time: settlement_time,
      signature_key: signature_key,
      merchant_id: merchant_id,
      paidAt: ['settlement', 'capture'].includes(transaction_status) ? new Date() : existingPayment.paidAt,
      updatedAt: new Date()
    };

    // Update raw_response untuk menyimpan notifikasi lengkap
    const rawResponseUpdate = {
      ...existingPayment.raw_response,
      ...notificationJson,
      webhook_received_at: new Date()
    };

    const updatedPayment = await Payment.findOneAndUpdate(
      { order_id },
      { 
        ...paymentUpdateData,
        raw_response: rawResponseUpdate
      },
      { new: true, runValidators: true }
    );

    if (!updatedPayment) {
      console.error(`[WEBHOOK ${requestId}] Failed to update payment for order_id ${order_id}`);
      return res.status(404).json({ message: 'Payment update failed' });
    }

    console.log(`[WEBHOOK ${requestId}] Payment record updated successfully for order_id ${order_id}`);

    // ✅ PERBAIKAN 3: Cari order berdasarkan order_id
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

    console.log(`[WEBHOOK ${requestId}] Order ${order_id} found. Current status: ${order.status}, Payment status: ${order.paymentStatus}`);

    // ✅ PERBAIKAN 4: Handle transaction status dengan logic yang lebih robust
    let orderUpdateData = {};
    let shouldUpdateOrder = false;

    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        if (fraud_status === 'accept') {
          // ✅ Pembayaran berhasil
          orderUpdateData = {
            paymentStatus: 'Paid',
            status: order.status === 'Pending' ? 'Pending' : order.status // Jangan ubah status jika sudah diproses
          };
          shouldUpdateOrder = true;
          
          console.log(`[WEBHOOK ${requestId}] Payment successful for order ${order_id}`);

        } else if (fraud_status === 'challenge') {
          // ✅ Pembayaran butuh verifikasi
          orderUpdateData = {
            paymentStatus: 'Challenged'
          };
          shouldUpdateOrder = true;
          console.log(`[WEBHOOK ${requestId}] Payment challenged for order ${order_id}`);
        }
        break;

      case 'deny':
      case 'cancel':
      case 'expire':
        // ✅ Pembayaran gagal
        orderUpdateData = {
          paymentStatus: 'Failed',
          status: 'Canceled'
        };
        shouldUpdateOrder = true;
        console.log(`[WEBHOOK ${requestId}] Payment failed for order ${order_id}: ${transaction_status}`);
        break;

      case 'pending':
        // ✅ Pembayaran pending
        orderUpdateData = {
          paymentStatus: 'Pending'
        };
        shouldUpdateOrder = true;
        console.log(`[WEBHOOK ${requestId}] Payment pending for order ${order_id}`);
        break;

      default:
        console.warn(`[WEBHOOK ${requestId}] Unhandled transaction status: ${transaction_status}`);
    }

    // ✅ PERBAIKAN 5: Update order jika diperlukan
    if (shouldUpdateOrder) {
      Object.assign(order, orderUpdateData);
      await order.save();
      console.log(`[WEBHOOK ${requestId}] Order ${order_id} updated:`, orderUpdateData);
    }

    // ✅ PERBAIKAN 6: Emit events dengan data yang konsisten
    const emitData = {
      order_id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      transaction_status,
      fraud_status,
      payment_type,
      gross_amount,
      timestamp: new Date()
    };

    // Emit ke room order yang spesifik
    io.to(`order_${order_id}`).emit('payment_status_update', emitData);
    io.to(`order_${order_id}`).emit('order_status_update', emitData);

    console.log(`[WEBHOOK ${requestId}] Emitted updates to room: order_${order_id}`);

    // ✅ PERBAIKAN 7: Jika pembayaran berhasil, broadcast ke cashier
    if (transaction_status === 'settlement' && fraud_status === 'accept') {
      const mappedOrder = mapOrderForCashier(order);
      io.to('cashier_room').emit('new_order', { mappedOrders: mappedOrder });
      console.log(`[WEBHOOK ${requestId}] Broadcasted order to cashier room`);
    }

    console.log(`[WEBHOOK ${requestId}] Webhook processed successfully`);
    res.status(200).json({ 
      status: 'ok',
      message: 'Webhook processed successfully',
      order_id,
      transaction_status 
    });

  } catch (error) {
    console.error(`[WEBHOOK ${requestId}] Webhook processing error:`, {
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      message: 'Failed to process webhook',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ PERBAIKAN 8: Helper function yang konsisten
function mapOrderForCashier(order) {
  return {
    _id: order._id,
    order_id: order.order_id,
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
        categories: item.menuItem?.category || [],
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
    paymentStatus: order.paymentStatus,
    orderType: order.orderType,
    deliveryAddress: order.deliveryAddress,
    tableNumber: order.tableNumber,
    pickupTime: order.pickupTime,
    type: order.type,
    paymentMethod: order.paymentMethod || "QRIS", // ✅ Update sesuai payment_type
    totalPrice: order.totalBeforeDiscount,
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