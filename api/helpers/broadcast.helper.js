import { getAreaGroup } from '../utils/areaGrouping.js';
import { io } from '../index.js';


export const broadcastNewOrderToAreas = async (orderInfo) => {
  try {
    const { orderId, tableNumber, orderData, source, outletId, paymentMethod } = orderInfo;
    
    const areaCode = tableNumber.charAt(0).toUpperCase();
    const areaRoom = `area_${areaCode}`;
    const areaGroup = getAreaGroup(areaCode);

    console.log(`Broadcasting order ${orderId} to area ${areaCode}`);

    // Prepare broadcast data
    const broadcastData = {
      orderId,
      tableNumber,
      areaCode,
      orderData,
      source,
      paymentMethod,
      timestamp: new Date(),
      message: `ORDER BARU - ${source} - Area ${areaCode}, Meja ${tableNumber}`
    };

    // Broadcast to area room
    if (global.io) {
      // Broadcast ke area room
      global.io.to(areaRoom).emit('new_order_in_area', broadcastData);
      
      // Broadcast ke area group
      if (areaGroup) {
        global.io.to(areaGroup).emit('new_order_in_group', {
          ...broadcastData,
          areaGroup
        });
      }

      // Broadcast ke cashier room (untuk semua kasir)
      global.io.to('cashier_room').emit('new_order', broadcastData);

      // Broadcast ke outlet-specific room
      global.io.to(`outlet_${outletId}`).emit('new_order', broadcastData);

      console.log(`Order ${orderId} broadcasted to area ${areaCode}`);
    } else {
      console.warn('Socket IO not available for broadcasting');
    }

  } catch (error) {
    console.error('Error broadcasting order to areas:', error);
  }
};


// BROADCAST CASH ORDER TO KITCHEN/BAR (KHUSUS UNTUK CASH PAYMENT)
export const broadcastCashOrderToKitchen = async (orderInfo) => {
  try {
    const { orderId, tableNumber, orderData, outletId, isAppOrder = false, isWebOrder = false, deliveryOption } = orderInfo;
    
    const areaCode = tableNumber?.charAt(0).toUpperCase();
    
    console.log(`Broadcasting CASH order ${orderId} to kitchen/bar`);

    const kitchenData = {
      orderId,
      tableNumber,
      areaCode,
      orderData,
      paymentMethod: 'Cash',
      orderSource: isAppOrder ? 'App' : isWebOrder ? 'Web' : 'Cashier',
      deliveryOption: deliveryOption,
      timestamp: new Date(),
      message: `ORDER CASH - ${isAppOrder ? 'App' : isWebOrder ? 'Web' : 'Cashier'} - Meja ${tableNumber}`
    };

    if (global.io) {
      // Broadcast ke kitchen
      global.io.to('kitchen_room').emit('kitchen_new_order', kitchenData);
      global.io.to(`kitchen_${outletId}`).emit('kitchen_new_order', kitchenData);

      // Broadcast ke bar berdasarkan area
      if (areaCode) {
        const barRoom = areaCode <= 'I' ? 'bar_depan' : 'bar_belakang';
        global.io.to(barRoom).emit('beverage_order_received', {
          ...kitchenData,
          assignedBar: barRoom,
          items: orderData.items?.filter(item => 
            item.category === 'beverage' || item.category === 'drink'
          ) || []
        });
      }

      // Broadcast ke waitstaff jika ada
      global.io.to('waitstaff_room').emit('new_order_ready', kitchenData);

      console.log(`Cash order ${orderId} broadcasted to kitchen/bar`);
    }

  } catch (error) {
    console.error('Error broadcasting cash order to kitchen:', error);
  }
};

// BROADCAST ORDER CREATION (DI PANGGIL SETELAH JOB COMPLETE)
export const broadcastOrderCreation = async (orderId, orderData) => {
  try {
    const { tableNumber, source, outletId, paymentDetails } = orderData;
    
    if (!tableNumber) {
      console.log('⚠️ No table number, skipping broadcast');
      return;
    }

    // BROADCAST KE AREAS UNTUK SEMUA ORDER
    await broadcastNewOrderToAreas({
      orderId,
      tableNumber,
      orderData,
      source,
      outletId,
      paymentMethod: paymentDetails?.method
    });

    // JIKA PAYMENT METHOD CASH, BROADCAST KE KITCHEN JUGA
    const isCashPayment = paymentDetails?.method?.toLowerCase() === 'cash';
    if (isCashPayment) {
      await broadcastCashOrderToKitchen({
        orderId,
        tableNumber,
        orderData,
        outletId,
        isAppOrder: source === 'App',
        isWebOrder: source === 'Web'
      });
    }

    console.log(`Order ${orderId} broadcast completed`);

  } catch (error) {
    console.error('Error in broadcastOrderCreation:', error);
  }
};