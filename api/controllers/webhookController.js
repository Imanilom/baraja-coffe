import { io } from '../index.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';
import Table from '../models/Table.model.js';
import { socketManagement } from '../utils/socketManagement.js';
import GoSendBooking from '../models/GoSendBooking.js';
import { MenuItem } from '../models/MenuItem.model.js';

export const midtransWebhook = async (req, res) => {
  let requestId = Math.random().toString(36).substr(2, 9);

  try {
    const notificationJson = req.body;
    let {
      transaction_status,
      order_id, // This is your payment_code
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

    // VALIDASI: Pastikan field required ada
    if (!order_id || !transaction_status) {
      console.warn(`[WEBHOOK ${requestId}] Invalid notification: Missing required fields`);
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ FIX: Search by payment_code since Midtrans order_id = your payment_code
    const existingPayment = await Payment.findOne({ order_id: order_id });

    if (!existingPayment) {
      console.error(`[WEBHOOK ${requestId}] Payment record not found for payment_code: ${order_id}`);
      return res.status(404).json({ message: 'Payment record not found' });
    }

    console.log(`[WEBHOOK ${requestId}] Processing webhook for payment:`, existingPayment._id);

    // Update payment record
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

    const rawResponseUpdate = {
      ...existingPayment.raw_response,
      ...notificationJson,
      webhook_received_at: new Date()
    };

    // ✅ FIX: Update by payment_code (which matches Midtrans order_id)
    const updatedPayment = await Payment.findOneAndUpdate(
      { order_id: order_id },  
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

    // ✅ FIX: Also fix this reference - change payment_order to order
    const order = await Order.findOne({ order_id })
      .populate('user_id', 'name email phone')
      .populate('cashierId', 'name')
      .populate({
        path: 'items.menuItem',
        select: 'name price image mainCategory workstation category description'
      })
      .populate('outlet', 'name address');

    console.log("order:", order);

    if (!order) {
      console.warn(`[WEBHOOK ${requestId}] Order with ID ${order_id} not found`);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`[WEBHOOK ${requestId}] Order ${order_id} found. Current status: ${order.status}, Payment status: ${order.paymentStatus}`);

    // Handle transaction status
    let orderUpdateData = {};
    let shouldUpdateOrder = false;

    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        if (fraud_status === 'accept') {
          orderUpdateData = {
            paymentStatus: 'Paid',
            status: order.status === 'Pending' ? 'Pending' : order.status
          };
          shouldUpdateOrder = true;
          console.log(`[WEBHOOK ${requestId}] Payment successful for order ${order_id}`);
        } else if (fraud_status === 'challenge') {
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
        orderUpdateData = {
          paymentStatus: 'Failed',
          status: 'Canceled'
        };
        shouldUpdateOrder = true;
        console.log(`[WEBHOOK ${requestId}] Payment failed for order ${order_id}: ${transaction_status}`);
        break;

      case 'pending':
        orderUpdateData = {
          paymentStatus: 'Pending'
        };
        shouldUpdateOrder = true;
        console.log(`[WEBHOOK ${requestId}] Payment pending for order ${order_id}`);
        break;

      default:
        console.warn(`[WEBHOOK ${requestId}] Unhandled transaction status: ${transaction_status}`);
    }

    // Update order jika diperlukan
    if (shouldUpdateOrder) {
      Object.assign(order, orderUpdateData);
      await order.save();
      console.log(`[WEBHOOK ${requestId}] Order ${order_id} updated:`, orderUpdateData);
    }

    // ✅ FIX: Change payment_order to order
    const emitData = {
      order_id: order.order_id,  // ✅ Fixed reference
      status: order.status,
      paymentStatus: order.paymentStatus,
      transaction_status,
      fraud_status,
      payment_type,
      gross_amount,
      timestamp: new Date()
    };

    io.to(`order_${order_id}`).emit('payment_status_update', emitData);
    io.to(`order_${order_id}`).emit('order_status_update', emitData);

    console.log(`[WEBHOOK ${requestId}] Emitted updates to room: order_${order_id}`);

    // JIKA PEMBAYARAN BERHASIL: Broadcast ke device yang sesuai
    if (transaction_status === 'settlement' && fraud_status === 'accept') {
      const mappedOrder = mapOrderForCashier(order);

      console.log(`[WEBHOOK ${requestId}] 🎯 Processing order broadcast for table: ${order.tableNumber}`);

      // ✅ BROADCAST KE DEVICE YANG SESUAI DENGAN AREA & TABLE
      await broadcastOrderToTargetDevices(order, mappedOrder);

      // ✅ Update status meja
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

export const handleGoSendWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('📩 Received GoSend webhook:', {
      booking_id: webhookData.booking_id,
      status: webhookData.status,
      timestamp: new Date().toISOString()
    });

    // 1. VALIDASI X-CALLBACK-TOKEN - IMPORTANT!
    const receivedToken = req.headers['x-callback-token'];
    const expectedToken = process.env.GOSEND_WEBHOOK_SECRET;

    if (!receivedToken) {
      console.warn('❌ X-Callback-Token header missing');
      return res.status(401).json({ 
        success: false, 
        message: 'X-Callback-Token header required' 
      });
    }

    if (receivedToken !== expectedToken) {
      console.warn('❌ Invalid X-Callback-Token received:', receivedToken);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    console.log('✅ X-Callback-Token validation passed');

    // 2. VALIDASI PAYLOAD WAJIB
    if (!webhookData.booking_id || !webhookData.status) {
      console.warn('⚠️ Incomplete webhook payload:', webhookData);
      // Tetap return 200 ke GoSend tapi log warning
      return res.status(200).json({ 
        success: true, 
        message: 'Webhook received but missing required fields' 
      });
    }

    // 3. CARI BOOKING DI DATABASE
    const goSendBooking = await GoSendBooking.findOne({ 
      goSend_order_no: webhookData.booking_id 
    });

    if (!goSendBooking) {
      console.warn(`❌ GoSend booking not found: ${webhookData.booking_id}`);
      // Tetap return 200 ke GoSend untuk avoid retry
      return res.status(200).json({ 
        success: true, 
        message: 'Booking not found in system' 
      });
    }

    console.log(`✅ Found booking: ${goSendBooking.order_id}`);

    // 4. UPDATE GOSEND BOOKING RECORD
    const updateData = {
      status: webhookData.status,
      ...(webhookData.driver_name && {
        'driver_info.driver_name': webhookData.driver_name
      }),
      ...(webhookData.driver_phone && {
        'driver_info.driver_phone': webhookData.driver_phone
      }),
      ...(webhookData.driver_photo_url && {
        'driver_info.driver_photo': webhookData.driver_photo_url
      }),
      ...(webhookData.live_tracking_url && {
        live_tracking_url: webhookData.live_tracking_url
      })
    };

    await GoSendBooking.findOneAndUpdate(
      { goSend_order_no: webhookData.booking_id },
      updateData
    );

    // 5. UPDATE ORDER STATUS
    const orderUpdateData = {
      'deliveryTracking.status': webhookData.status,
      ...(webhookData.driver_name && {
        'deliveryTracking.driver_name': webhookData.driver_name
      }),
      ...(webhookData.driver_phone && {
        'deliveryTracking.driver_phone': webhookData.driver_phone
      }),
      ...(webhookData.live_tracking_url && {
        'deliveryTracking.live_tracking_url': webhookData.live_tracking_url
      })
    };

    // Map GoSend status ke internal delivery status
    const deliveryStatus = mapGoSendStatus(webhookData.status);
    if (deliveryStatus) {
      orderUpdateData.deliveryStatus = deliveryStatus;
    }

    // Jika delivered, update order status jadi completed
    if (webhookData.status === 'delivered') {
      orderUpdateData.status = 'completed';
    }

    await Order.findOneAndUpdate(
      { order_id: goSendBooking.order_id },
      orderUpdateData
    );

    // 6. REALTIME NOTIFICATION
    const io = req.app.get('io');
    io.to(`order_${goSendBooking.order_id}`).emit('delivery_status_update', {
      order_id: goSendBooking.order_id,
      status: webhookData.status,
      driver_info: {
        name: webhookData.driver_name,
        phone: webhookData.driver_phone
      },
      live_tracking_url: webhookData.live_tracking_url,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Webhook processed successfully for ${webhookData.booking_id}`);

    // 7. SELALU RETURN 200 KE GOSEND
    return res.status(200).json({ 
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ Error handling GoSend webhook:', error);
    
    // IMPORTANT: Tetap return 200 ke GoSend meskipun error
    // Untuk menghindari retry mechanism GoSend
    return res.status(200).json({ 
      success: true,
      message: 'Webhook received (error logged internally)'
    });
  }
};

// Helper function untuk mapping status
const mapGoSendStatus = (goSendStatus) => {
  const statusMap = {
    'confirmed': 'pending',
    'allocated': 'driver_assigned', 
    'out_for_pickup': 'pickup_started',
    'picked': 'picked_up',
    'out_for_delivery': 'on_delivery',
    'on_hold': 'on_hold',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'rejected': 'failed',
    'no_driver': 'failed'
  };
  
  return statusMap[goSendStatus];
};

// FUNCTION: BROADCAST ORDER KE TARGET DEVICES
async function broadcastOrderToTargetDevices(order, mappedOrder) {
  try {
    const { tableNumber, outlet, items } = order;

    if (!tableNumber) {
      console.log('📦 No table number, using fallback broadcast');
      // Fallback: broadcast ke semua cashier
      io.to('cashier_room').emit('new_order', {
        mappedOrders: mappedOrder,
        broadcastType: 'fallback_all_cashiers'
      });
      return;
    }

    // Analisis jenis order berdasarkan mainCategory dan workstation
    const isBeverageOrder = analyzeOrderType(items);
    const orderType = isBeverageOrder ? 'beverage' : 'food';
    const areaCode = getAreaCodeFromTable(tableNumber);

    console.log(`🎯 Order analysis - Table: ${tableNumber}, Area: ${areaCode}, Type: ${orderType}`);
    console.log(`📊 Order items analysis:`, items.map(item => ({
      name: item.menuItem?.name,
      mainCategory: item.menuItem?.mainCategory,
      workstation: item.menuItem?.workstation,
      isBeverage: isItemBeverage(item.menuItem)
    })));

    // Dapatkan target devices menggunakan socketManagement
    const targetInfo = await socketManagement.getTargetDevicesForOrder({
      tableNumber,
      items,
      orderType,
      outletId: outlet?._id || outlet
    });

    if (targetInfo.targetDevices.length === 0) {
      console.warn('⚠️ No target devices found, using fallback');
      await fallbackBroadcast(order, mappedOrder, areaCode, orderType);
      return;
    }

    // Broadcast ke masing-masing target device
    let broadcastCount = 0;

    for (const device of targetInfo.targetDevices) {
      if (device.socket && device.socket.connected) {
        const broadcastData = {
          order: mappedOrder,
          targetInfo: {
            assignedArea: areaCode,
            orderType: orderType,
            tableNumber: tableNumber,
            assignedBy: 'system_auto_routing',
            priority: getOrderPriority(orderType, items)
          },
          metadata: {
            broadcastId: `broadcast_${Date.now()}`,
            deviceTarget: device.deviceName,
            deviceRole: device.role,
            itemAnalysis: items.map(item => ({
              name: item.menuItem?.name,
              mainCategory: item.menuItem?.mainCategory,
              workstation: item.menuItem?.workstation
            }))
          }
        };

        device.socket.emit('new_order', broadcastData);
        broadcastCount++;

        console.log(`📤 Order sent to: ${device.deviceName} (${device.role}) - Area: ${areaCode}`);
      }
    }

    // Juga broadcast ke area room untuk monitoring
    if (areaCode) {
      const areaRoom = `area_${areaCode}`;
      io.to(areaRoom).emit('area_new_order', {
        order: mappedOrder,
        areaCode: areaCode,
        tableNumber: tableNumber,
        orderType: orderType,
        targetDevices: targetInfo.targetDevices.map(d => ({
          deviceName: d.deviceName,
          role: d.role
        })),
        itemBreakdown: getOrderBreakdown(items),
        timestamp: new Date()
      });
    }

    // Broadcast ke system monitor
    io.to('system_monitor').emit('order_broadcast_summary', {
      orderId: order.order_id,
      tableNumber: tableNumber,
      areaCode: areaCode,
      orderType: orderType,
      targetDevicesCount: broadcastCount,
      totalDevicesAvailable: targetInfo.targetDevices.length,
      itemBreakdown: getOrderBreakdown(items),
      timestamp: new Date()
    });

    console.log(`✅ Successfully broadcasted order to ${broadcastCount} devices`);

  } catch (error) {
    console.error('Error in broadcastOrderToTargetDevices:', error);
    // Fallback ke legacy broadcast
    io.to('cashier_room').emit('new_order', {
      mappedOrders: mappedOrder,
      broadcastType: 'error_fallback'
    });
  }
}

// FUNCTION: ANALYZE ORDER TYPE - DIPERBAIKI
function analyzeOrderType(items) {
  if (!items || !Array.isArray(items)) return false;

  // Cek apakah ada items yang termasuk minuman berdasarkan mainCategory dan workstation
  return items.some(item => {
    return isItemBeverage(item.menuItem);
  });
}

// FUNCTION: CHECK INDIVIDUAL ITEM - DIPERBAIKI
function isItemBeverage(menuItem) {
  if (!menuItem) return false;

  // 1. Cek berdasarkan mainCategory
  const isBeverageByCategory = menuItem.mainCategory === 'minuman';

  // 2. Cek berdasarkan workstation
  const isBeverageByWorkstation = menuItem.workstation === 'bar' || menuItem.workstation === 'bar-belakang';

  // 3. Cek berdasarkan nama item (fallback)
  const itemName = menuItem.name?.toLowerCase() || '';
  const beverageKeywords = ['minuman', 'drink', 'juice', 'soda', 'kopi', 'coffee', 'tea', 'es', 'soft drink', 'mocktail', 'cocktail', 'bir', 'beer', 'wine'];
  const isBeverageByName = beverageKeywords.some(keyword => itemName.includes(keyword));

  return isBeverageByCategory || isBeverageByWorkstation || isBeverageByName;
}

// FUNCTION: GET ORDER BREAKDOWN
function getOrderBreakdown(items) {
  const breakdown = {
    totalItems: items.length,
    beverageItems: 0,
    foodItems: 0,
    mixedOrder: false,
    beverageDetails: [],
    foodDetails: []
  };

  items.forEach(item => {
    const isBeverage = isItemBeverage(item.menuItem);
    const itemInfo = {
      name: item.menuItem?.name,
      mainCategory: item.menuItem?.mainCategory,
      workstation: item.menuItem?.workstation,
      quantity: item.quantity
    };

    if (isBeverage) {
      breakdown.beverageItems += item.quantity;
      breakdown.beverageDetails.push(itemInfo);
    } else {
      breakdown.foodItems += item.quantity;
      breakdown.foodDetails.push(itemInfo);
    }
  });

  breakdown.mixedOrder = breakdown.beverageItems > 0 && breakdown.foodItems > 0;

  return breakdown;
}

// FUNCTION: FALLBACK BROADCAST
async function fallbackBroadcast(order, mappedOrder, areaCode, orderType) {
  console.log('🔄 Using fallback broadcast strategy');

  const fallbackRooms = [];
  const orderBreakdown = getOrderBreakdown(order.items);

  // Tentukan fallback rooms berdasarkan area dan order type
  if (areaCode && areaCode <= 'I') {
    // Area A-I -> coba bar_depan dulu
    fallbackRooms.push('bar_depan', 'cashier_senior', 'cashier_junior');
  } else if (areaCode && areaCode >= 'J') {
    // Area J-O -> coba bar_belakang dulu  
    fallbackRooms.push('bar_belakang', 'cashier_senior');
  } else {
    // Unknown area -> broadcast ke semua
    fallbackRooms.push('cashier_senior', 'cashier_junior', 'bar_depan', 'bar_belakang');
  }

  // Tambahkan berdasarkan order type dan breakdown
  if (orderType === 'beverage' || orderBreakdown.beverageItems > 0) {
    fallbackRooms.unshift('bar_depan', 'bar_belakang'); // Prioritize bars
  }

  if (orderType === 'food' || orderBreakdown.foodItems > 0) {
    fallbackRooms.unshift('cashier_senior', 'cashier_junior'); // Prioritize cashiers
  }

  // Untuk mixed orders, prioritaskan kedua-duanya
  if (orderBreakdown.mixedOrder) {
    fallbackRooms.unshift('cashier_senior', 'bar_depan', 'bar_belakang');
  }

  // Hapus duplikat
  const uniqueRooms = [...new Set(fallbackRooms)];

  // Broadcast ke fallback rooms
  uniqueRooms.forEach(room => {
    io.to(room).emit('new_order_fallback', {
      order: mappedOrder,
      fallbackReason: 'no_specific_device_available',
      suggestedRoom: room,
      areaCode: areaCode,
      orderType: orderType,
      orderBreakdown: orderBreakdown,
      timestamp: new Date()
    });
  });

  // Juga broadcast ke cashier_room legacy
  io.to('cashier_room').emit('new_order', {
    mappedOrders: mappedOrder,
    broadcastType: 'fallback_strategy',
    orderBreakdown: orderBreakdown
  });

  console.log(`🔄 Fallback broadcast to rooms: ${uniqueRooms.join(', ')}`);
}

// FUNCTION: GET AREA CODE FROM TABLE NUMBER
function getAreaCodeFromTable(tableNumber) {
  if (!tableNumber) return null;

  // Extract first character from table number (e.g., "A1" -> "A")
  const firstChar = tableNumber.charAt(0).toUpperCase();

  // Validasi area code (A-O)
  if (firstChar >= 'A' && firstChar <= 'O') {
    return firstChar;
  }

  return null;
}

// FUNCTION: GET ORDER PRIORITY - DIPERBAIKI
function getOrderPriority(orderType, items) {
  let priority = 'normal';

  if (orderType === 'beverage') {
    // Beverage orders biasanya lebih cepat
    priority = 'high';
  }

  // Cek jika ada items yang perlu segera disajikan
  const urgentItems = items.some(item => {
    const menuItem = item.menuItem;
    if (!menuItem) return false;

    const itemName = menuItem.name?.toLowerCase() || '';
    const urgentKeywords = ['hot', 'panas', 'espresso', 'fresh', 'ice cream', 'es krim', 'milkshake'];

    return urgentKeywords.some(keyword => itemName.includes(keyword)) ||
      menuItem.workstation === 'bar' || // Minuman dari bar biasanya urgent
      menuItem.mainCategory === 'minuman'; // Semua minuman dapat priority
  });

  if (urgentItems) {
    priority = 'urgent';
  }

  return priority;
}

// FUNCTION: UPDATE TABLE STATUS AFTER PAYMENT
export async function updateTableStatusAfterPayment(order) {
  try {
    if (order.tableNumber && order.orderType.toLowerCase() === 'dine-in') {
      console.log(`[TABLE UPDATE] Updating table status for table: ${order.tableNumber}, order: ${order.order_id}`);

      const table = await Table.findOne({
        table_number: order.tableNumber.toUpperCase()
      }).populate('area_id');

      if (!table) {
        console.warn(`[TABLE UPDATE] Table not found: ${order.tableNumber}`);
        return;
      }

      table.status = 'occupied';
      table.is_available = false;
      table.updatedAt = new Date();

      await table.save();

      // Emit update status meja ke frontend
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

// FUNCTION: MAP ORDER FOR CASHIER - DIPERBAIKI
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
        _id: item.menuItem?._id,
        name: item.menuItem?.name,
        price: item.menuItem?.price,
        image: item.menuItem?.image,
        mainCategory: item.menuItem?.mainCategory,
        workstation: item.menuItem?.workstation,
        category: item.menuItem?.category
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
    paymentMethod: order.paymentMethod || "QRIS",
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
    isOpenBill: isOpenBill,
    // Tambahan field untuk analysis
    orderAnalysis: getOrderBreakdown(order.items)
  };
}