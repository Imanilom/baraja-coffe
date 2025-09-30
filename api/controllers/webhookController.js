import { io } from '../index.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';
import Table from '../models/Table.model.js'; // ✅ IMPORT MODEL TABLE

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
    const existingPayment = await Payment.findOne({
      payment_code: order_id
    });

    if (!existingPayment) {
      console.error(`[WEBHOOK ${requestId}] Payment record not found for payment_code: ${order_id}`);
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
      { payment_code: order_id },
      {
        ...paymentUpdateData,
        raw_response: rawResponseUpdate
      },
      { new: true, runValidators: true }
    );

    if (!updatedPayment) {
      console.error(`[WEBHOOK ${requestId}] Failed to update payment for payment_code ${order_id}`);
      return res.status(404).json({ message: 'Payment update failed' });
    }

    console.log(`[WEBHOOK ${requestId}] Payment record updated successfully for payment_code ${order_id}`);

    // ✅ PERBAIKAN 3: Cari order berdasarkan order_id
    const payment_order = await Payment.findOne({ payment_code: order_id }).select('order_id');
    console.log("payment_order:", payment_order);

    const order = await Order.findOne({ order_id: payment_order.order_id }) // <-- ambil field order_id
      .populate('user_id', 'name email phone')
      .populate('cashierId', 'name')
      .populate({
        path: 'items.menuItem',
        select: 'name price image category description'
      })
      .populate('outlet', 'name address');

    console.log("order:", order);


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
      order_id: payment_order.order_id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      transaction_status,
      fraud_status,
      payment_type,
      gross_amount,
      timestamp: new Date()
    };

    // Emit ke room order yang spesifik
    // ✅ Emit ke room order yang sesuai dengan order_id internal
    io.to(`order_${payment_order.order_id}`).emit('payment_status_update', emitData);
    io.to(`order_${payment_order.order_id}`).emit('order_status_update', emitData);

    console.log(`[WEBHOOK ${requestId}] Emitted updates to room: order_${payment_order.order_id}`);


    // ✅ PERBAIKAN 7: Jika pembayaran berhasil, broadcast ke cashier DAN update status meja
    if (transaction_status === 'settlement' && fraud_status === 'accept') {
      const mappedOrder = mapOrderForCashier(order);
      
      // ✅ EDIT: Broadcast ke cashier room dengan struktur data yang benar
      io.to('cashier_room').emit('new_order', { 
        mappedOrders: mappedOrder // Gunakan mappedOrder (single object) bukan mappedOrders (array)
      });
      
      console.log(`[WEBHOOK ${requestId}] Broadcasted order to cashier room:`, {
        order_id: order.order_id,
        customerName: mappedOrder.customerName,
        totalPrice: mappedOrder.totalPrice
      });

      // ✅ NEW: Update status meja jika order memiliki tableNumber
      await updateTableStatusAfterPayment(order);
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

// ✅ NEW: Function untuk update status meja setelah pembayaran berhasil
export async function updateTableStatusAfterPayment(order) {
  try {
    // Cek apakah order memiliki tableNumber dan order type adalah dine-in
    if (order.tableNumber && order.orderType === 'dine-in') {
      console.log(`[TABLE UPDATE] Updating table status for table: ${order.tableNumber}, order: ${order.order_id}`);
      
      // Cari meja berdasarkan table_number
      const table = await Table.findOne({ 
        table_number: order.tableNumber.toUpperCase() 
      }).populate('area_id');

      if (!table) {
        console.warn(`[TABLE UPDATE] Table not found: ${order.tableNumber}`);
        return;
      }

      // Update status meja menjadi 'occupied'
      table.status = 'occupied';
      table.is_available = false;
      table.updatedAt = new Date();

      await table.save();

      // ✅ Emit update status meja ke frontend
      io.to('table_management_room').emit('table_status_updated', {
        table_id: table._id,
        table_number: table.table_number,
        area_id: table.area_id,
        status: table.status,
        is_available: table.is_available,
        order_id: order.order_id,
        updatedAt: table.updatedAt
      });

      console.log(`[TABLE UPDATE] Emitted table status update for table: ${order.tableNumber}`);
      
    } else {
      console.log(`[TABLE UPDATE] No table update needed - tableNumber: ${order.tableNumber}, orderType: ${order.orderType}`);
    }
  } catch (error) {
    console.error(`[TABLE UPDATE] Error updating table status:`, {
      error: error.message,
      tableNumber: order.tableNumber,
      order_id: order.order_id
    });
  }
}

// ✅ PERBAIKAN 8: Helper function yang konsisten dengan struktur yang Anda berikan
function mapOrderForCashier(order) {
  const isOpenBill = order.isOpenBill || false;
  
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
        ...item.menuItem?.toObject?.() || item.menuItem,
        categories: item.menuItem?.category || [],
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
    paymentMethod: order.paymentMethod || payment_type || "QRIS",
    totalPrice: order.totalBeforeDiscount,
    totalAfterDiscount: order.totalAfterDiscount,
    totalTax: order.totalTax,
    totalServiceFee: order.totalServiceFee,
    taxAndServiceDetails: order.taxAndServiceDetails,
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
    isOpenBill: isOpenBill
  };
}