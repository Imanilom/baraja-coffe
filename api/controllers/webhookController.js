import { io } from '../index.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';
import { orderQueue } from '../queues/order.queue.js';

export const midtransWebhook = async (req, res) => {
  try {
    const notificationJson = req.body;
    const {
      transaction_status,
      order_id,
      payment_type,
      fraud_status,
      gross_amount,
      bank,
      va_numbers,
      ewallet
    } = notificationJson;

    console.log('📥 Received Midtrans notification:', notificationJson);

    // Simpan atau update data pembayaran
    const paymentData = {
      order_id,
      method: payment_type || 'unknown',
      status: transaction_status,
      amount: Number(gross_amount),
      bank: bank || (va_numbers?.[0]?.bank) || '',
      phone: ewallet?.phone || '',
      paidAt: ['settlement', 'capture'].includes(transaction_status) ? new Date() : null
    };

    await Payment.findOneAndUpdate(
      { order_id },
      paymentData,
      { upsert: true, new: true }
    );


    const order = await Order.findOne({ _id: order_id });


    if (!order) {
      console.warn(`⚠️ Order dengan order_id ${order_id} tidak ditemukan di database`);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Handle status pembayaran
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      order.status = 'Waiting';
      await order.save();

      // // ✅ Masukkan ke antrian BullMQ dengan job type yang benar: create_order
      // await orderQueue.add('create_order', order.toObject(), {
      //   jobId: order._id.toString(), // Hindari duplikasi
      // });

      io.to(order._id.toString()).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status
      });

      // Mapping data sesuai kebutuhan frontend
      const mappedOrders = {
        _id: order._id,
        userId: order.user_id, // renamed
        customerName: order.user, // renamed
        cashierId: order.cashier, // renamed
        items: order.items.map(item => ({
          _id: item._id,
          quantity: item.quantity,
          subtotal: item.subtotal,
          isPrinted: item.isPrinted,
          menuItem: {
            ...item.menuItem,
            categories: item.menuItem.category, // renamed
          },
          selectedAddons: item.addons.length > 0 ? item.addons.map(addon => ({
            name: addon.name,
            _id: addon._id,
            options: [{
              id: addon._id, // assuming _id as id for options
              label: addon.label || addon.name, // fallback
              price: addon.price
            }]
          })) : [],
          selectedToppings: item.toppings.length > 0 ? item.toppings.map(topping => ({
            id: topping._id || topping.id, // fallback if structure changes
            name: topping.name,
            price: topping.price
          })) : []
        })),
        status: order.status,
        orderType: order.orderType,
        deliveryAddress: order.deliveryAddress,
        tableNumber: order.tableNumber,
        type: order.type,
        paymentMethod: order.paymentMethod || "Cash", // default value
        totalPrice: order.items.reduce((total, item) => total + item.subtotal, 0), // dihitung dari item subtotal
        voucher: order.voucher || null,
        outlet: order.outlet || null,
        promotions: order.promotions || [],
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        __v: order.__v
      };

      // Emit ke aplikasi kasir untuk menampilkan order baru
      io.to('cashier_room').emit('new_order', { mappedOrders });
      console.log('mappedOrders:', mappedOrders);


      console.log(`✅ Order ${order._id} updated to 'OnProcess' and queued`);

    } else if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
      order.status = 'Canceled';
      await order.save();

      io.to(order._id.toString()).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status
      });

      console.log(`❌ Order ${order._id} marked as Canceled`);

    } else {
      // Status lain seperti pending
      io.to(order._id.toString()).emit('payment_status_update', {
        order_id,
        transaction_status,
        status: order.status
      });

      console.log(`ℹ️ Order ${order._id} status updated: ${transaction_status}`);
    }

    // Opsional: Emit global untuk admin panel, dashboard, dll
    io.emit('payment_status_update', {
      order_id,
      transaction_status,
      status: order.status
    });

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ message: 'Failed to handle webhook', error: error.message });
  }
};
