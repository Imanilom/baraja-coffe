// import { getAreaGroup } from '../utils/areaGrouping.js';
// import { io } from '../index.js';


// // BROADCAST CASH ORDER TO KITCHEN/BAR (KHUSUS UNTUK CASH PAYMENT)
// export const broadcastCashOrderToKitchen = async (orderInfo) => {
//   try {
//     const { orderId, tableNumber, orderData, outletId, isAppOrder = false, isWebOrder = false, deliveryOption } = orderInfo;

//     const areaCode = tableNumber?.charAt(0).toUpperCase();

//     console.log(`Broadcasting CASH order ${orderId} to kitchen/bar`);

//     const kitchenData = {
//       orderId,
//       tableNumber,
//       areaCode,
//       orderData,
//       paymentMethod: 'Cash',
//       orderSource: isAppOrder ? 'App' : isWebOrder ? 'Web' : 'Cashier',
//       deliveryOption: deliveryOption,
//       timestamp: new Date(),
//       message: `ORDER CASH - ${isAppOrder ? 'App' : isWebOrder ? 'Web' : 'Cashier'} - Meja ${tableNumber}`
//     };

//     if (global.io) {
//       // Broadcast ke kitchen
//       global.io.to('kitchen_room').emit('kitchen_new_order', kitchenData);
//       global.io.to(`kitchen_${outletId}`).emit('kitchen_new_order', kitchenData);

//       // Broadcast ke bar berdasarkan area
//       if (areaCode) {
//         const barRoom = areaCode <= 'I' ? 'bar_depan' : 'bar_belakang';
//         global.io.to(barRoom).emit('beverage_order_received', {
//           ...kitchenData,
//           assignedBar: barRoom,
//           items: orderData.items?.filter(item =>
//             item.category === 'beverage' || item.category === 'drink'
//           ) || []
//         });
//       }

//       // Broadcast ke waitstaff jika ada
//       global.io.to('waitstaff_room').emit('new_order_ready', kitchenData);

//       console.log(`Cash order ${orderId} broadcasted to kitchen/bar`);
//     }

//   } catch (error) {
//     console.error('Error broadcasting cash order to kitchen:', error);
//   }
// };


// // ✅ BROADCAST ORDER CREATION (DI PANGGIL SETELAH JOB COMPLETE)
// export const broadcastOrderCreation = async (orderId, orderData) => {
//   try {
//     const { tableNumber, source, outletId, paymentDetails } = orderData;

//     if (!tableNumber) {
//       console.log('⚠️ No table number, skipping broadcast');
//       return;
//     }

//     console.log(`📢 Broadcasting order ${orderId} from ${source} for table ${tableNumber}`);

//     // ✅ BROADCAST KE AREAS UNTUK SEMUA ORDER (Web & App)
//     await broadcastNewOrderToAreas({
//       orderId,
//       tableNumber,
//       orderData,
//       source,
//       outletId,
//       paymentMethod: paymentDetails?.method
//     });

//     // ✅ JIKA PAYMENT METHOD CASH, BROADCAST KE KITCHEN JUGA
//     const isCashPayment = paymentDetails?.method?.toLowerCase() === 'cash';
//     if (isCashPayment) {
//       await broadcastCashOrderToKitchen({
//         orderId,
//         tableNumber,
//         orderData,
//         outletId,
//         isAppOrder: source === 'App',
//         isWebOrder: source === 'Web'
//       });
//     }

//     console.log(`✅ Order ${orderId} broadcast completed for ${source}`);

//   } catch (error) {
//     console.error('Error in broadcastOrderCreation:', error);
//   }
// };

// // ✅ BROADCAST NEW ORDER TO AREAS (UNTUK SEMUA PAYMENT METHOD - Web & App)
// export const broadcastNewOrderToAreas = async (orderInfo) => {
//   try {
//     const { orderId, tableNumber, orderData, source, outletId, paymentMethod } = orderInfo;

//     if (!tableNumber) {
//       console.log('⚠️ No table number, skipping area broadcast');
//       return;
//     }

//     const areaCode = tableNumber.charAt(0).toUpperCase();
//     const areaRoom = `area_${areaCode}`;
//     const areaGroup = getAreaGroup(areaCode);

//     console.log(`📍 Broadcasting ${source} order ${orderId} to area ${areaCode}, table ${tableNumber}`);

//     // Prepare broadcast data
//     const broadcastData = {
//       orderId,
//       tableNumber,
//       areaCode,
//       orderData,
//       source,
//       paymentMethod,
//       timestamp: new Date(),
//       message: `🆕 ORDER BARU - ${source} - Area ${areaCode}, Meja ${tableNumber}`
//     };

//     // Broadcast to area room
//     if (global.io) {
//       // ✅ Broadcast ke area room (untuk kasir di area tersebut)
//       global.io.to(areaRoom).emit('new_order_in_area', broadcastData);

//       // ✅ Broadcast ke area group
//       if (areaGroup) {
//         global.io.to(areaGroup).emit('new_order_in_group', {
//           ...broadcastData,
//           areaGroup
//         });
//       }

//       // ✅ Broadcast ke cashier room (untuk semua kasir)
//       global.io.to('cashier_room').emit('new_order', broadcastData);

//       // ✅ Broadcast ke outlet-specific room
//       global.io.to(`outlet_${outletId}`).emit('new_order', broadcastData);

//       console.log(`✅ ${source} Order ${orderId} broadcasted to area ${areaCode}`);

//       // Log connected devices di area ini untuk debugging
//       const areaRoomClients = global.io.sockets.adapter.rooms.get(areaRoom)?.size || 0;
//       const cashierRoomClients = global.io.sockets.adapter.rooms.get('cashier_room')?.size || 0;
//       console.log(`📊 Connected devices - Area ${areaCode}: ${areaRoomClients}, Cashier room: ${cashierRoomClients}`);

//     } else {
//       console.warn('❌ Socket IO not available for broadcasting');
//     }

//   } catch (error) {
//     console.error('Error broadcasting order to areas:', error);
//   }
// };

// ==========================================
// 1. broadcast-helper.js - IMMEDIATE PRINT TRIGGER
// ==========================================

import { getAreaGroup } from '../utils/areaGrouping.js';
import { io } from '../index.js';
import { PrintLogger } from '../services/print-logger.service.js';

// 🔥 NEW: Trigger immediate print tanpa menunggu apapun
export const triggerImmediatePrint = async (orderInfo) => {
  try {
    const { orderId, tableNumber, orderData, outletId, source, isAppOrder, isWebOrder } = orderInfo;

    console.log(`\n🖨️ ========== PRINT TRIGGER ==========`);
    console.log(`📋 Order ID: ${orderId}`);
    console.log(`🪑 Table: ${tableNumber || 'N/A'}`);
    console.log(`📱 Source: ${isAppOrder ? 'App' : isWebOrder ? 'Web' : source || 'Cashier'}`);

    // Prepare minimal print data - TIDAK perlu data lengkap
    const printData = {
      orderId,
      tableNumber,
      areaCode: tableNumber?.charAt(0).toUpperCase(),
      orderItems: orderData.items || [],
      source: isAppOrder ? 'App' : isWebOrder ? 'Web' : source || 'Cashier',
      orderType: orderData.orderType || 'dine-in',
      timestamp: new Date(),
      printTrigger: 'immediate',
      paymentMethod: orderData.paymentMethod || 'Cash'
    };

    // Count items by workstation
    const kitchenItems = printData.orderItems.filter(item => item.workstation === 'kitchen');
    const barItems = printData.orderItems.filter(item =>
      item.workstation === 'bar' || item.category === 'beverage' || item.category === 'drink'
    );

    // ✅ LOGGING: Log pending attempts on server side for traceability
    const logPromises = [];

    // Log Kitchen Items
    kitchenItems.forEach(item => {
      logPromises.push(PrintLogger.logPrintAttempt(
        orderId,
        item,
        'kitchen',
        { type: 'unknown', info: 'Server Broadcast' },
        { is_auto_print: true }
      ));
    });

    // Log Bar Items
    barItems.forEach(item => {
      const areaCode = printData.areaCode;
      const barRoom = areaCode && areaCode <= 'I' ? 'bar_depan' : 'bar_belakang';
      logPromises.push(PrintLogger.logPrintAttempt(
        orderId,
        item,
        barRoom,
        { type: 'unknown', info: 'Server Broadcast' },
        { is_auto_print: true }
      ));
    });

    // Wait for logs to be created (non-blocking for print emission if possible, but safely awaited here)
    // OPTIMIZATION: Fire-and-forget (Non-blocking)
    Promise.allSettled(logPromises).then((results) => {
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      console.log(`📝 [BACKGROUND] Logged ${successCount}/${logPromises.length} pending print attempts`);
    }).catch(logErr => {
      console.error('⚠️ [BACKGROUND] Failed to log print attempts:', logErr);
    });

    if (!global.io) {
      console.warn('❌ Socket IO not available for immediate print');
      console.log(`====================================\n`);
      return false;
    }

    const areaCode = printData.areaCode;

    // 🔥 EMIT ke kitchen IMMEDIATELY untuk print
    if (kitchenItems.length > 0) {
      global.io.to('kitchen_room').emit('kitchen_immediate_print', printData);
      global.io.to(`kitchen_${outletId}`).emit('kitchen_immediate_print', printData);
      console.log(`🍳 → Kitchen: ${kitchenItems.length} items sent to kitchen_room`);
    }

    // 🔥 EMIT ke bar IMMEDIATELY untuk beverage items
    if (areaCode && barItems.length > 0) {
      const barRoom = areaCode <= 'I' ? 'bar_depan' : 'bar_belakang';
      global.io.to(barRoom).emit('beverage_immediate_print', {
        ...printData,
        orderItems: barItems,
        assignedBar: barRoom
      });
      console.log(`🍹 → Bar: ${barItems.length} items sent to ${barRoom}`);
    }

    console.log(`✅ Print commands sent successfully`);
    console.log(`====================================\n`);
    return true;
  } catch (error) {
    console.error('❌ Error triggering immediate print:', error);
    console.log(`====================================\n`);
    return false;
  }
};

// BROADCAST CASH ORDER TO KITCHEN/BAR (KHUSUS UNTUK CASH PAYMENT)
// export const broadcastCashOrderToKitchen = async (orderInfo) => {
//   try {
//     const { orderId, tableNumber, orderData, outletId, isAppOrder = false, isWebOrder = false, deliveryOption } = orderInfo;

//     const areaCode = tableNumber?.charAt(0).toUpperCase();

//     console.log(`📢 Broadcasting CASH order ${orderId} to kitchen/bar`);

//     const kitchenData = {
//       orderId,
//       tableNumber,
//       areaCode,
//       orderData,
//       paymentMethod: 'Cash',
//       orderSource: isAppOrder ? 'App' : isWebOrder ? 'Web' : 'Cashier',
//       deliveryOption: deliveryOption,
//       timestamp: new Date(),
//       message: `ORDER CASH - ${isAppOrder ? 'App' : isWebOrder ? 'Web' : 'Cashier'} - Meja ${tableNumber}`
//     };

//     if (global.io) {
//       // Broadcast ke kitchen
//       global.io.to('kitchen_room').emit('kitchen_new_order', kitchenData);
//       global.io.to(`kitchen_${outletId}`).emit('kitchen_new_order', kitchenData);

//       // Broadcast ke bar berdasarkan area
//       if (areaCode) {
//         const barRoom = areaCode <= 'I' ? 'bar_depan' : 'bar_belakang';
//         global.io.to(barRoom).emit('beverage_order_received', {
//           ...kitchenData,
//           assignedBar: barRoom,
//           items: orderData.items?.filter(item =>
//             item.category === 'beverage' || item.category === 'drink'
//           ) || []
//         });
//       }

//       // Broadcast ke waitstaff jika ada
//       global.io.to('waitstaff_room').emit('new_order_ready', kitchenData);

//       console.log(`✅ Cash order ${orderId} broadcasted to kitchen/bar`);
//     }

//   } catch (error) {
//     console.error('❌ Error broadcasting cash order to kitchen:', error);
//   }
// };


// controllers/order.controller.js - UPDATE

export const broadcastCashOrderToKitchen = async (params) => {
  const { orderId, tableNumber, orderData, outletId, cashierId } = params;

  try {
    // 🔧 SMART ROUTING: Lookup cashier's device area
    let sourceCashierArea = null;
    if (cashierId) {
      try {
        const User = (await import('../models/user.model.js')).default;
        const { Device } = await import('../models/Device.model.js');

        const cashierUser = await User.findById(cashierId)
          .populate('device_id')
          .lean();

        if (cashierUser?.device_id?.location) {
          sourceCashierArea = cashierUser.device_id.location;
          console.log(`📍 Cashier device area: ${sourceCashierArea}`);
        }
      } catch (lookupError) {
        console.warn('⚠️ Could not lookup cashier device:', lookupError.message);
      }
    }

    // ✅ Use socketManagement for intelligent broadcast
    if (global.socketManagement && global.socketManagement.broadcastOrder) {
      await global.socketManagement.broadcastOrder({
        orderId,
        tableNumber,
        items: orderData.orderItems || [],
        outletId,
        source: orderData.source || 'Cashier',
        orderType: orderData.orderType || 'dine-in',
        name: orderData.name || orderData.customer_name || 'Guest',
        service: orderData.service || 'Dine-In',
        paymentMethod: orderData.paymentDetails?.method || 'Cash',
        // 🔧 NEW: Device-based routing parameters
        sourceCashierArea: sourceCashierArea,
        isReservation: orderData.orderType === 'reservation',
        isGROOrder: orderData.source === 'Gro'
      });

      console.log(`✅ Order ${orderId} broadcasted via socketManagement${sourceCashierArea ? ` (cashier area: ${sourceCashierArea})` : ''}`);
    } else {
      // 🔧 FIXED: Legacy fallback with SMART BAR ROUTING
      console.warn('⚠️ Using legacy broadcast for order:', orderId);

      // Separate items by workstation type
      const beverageItems = (orderData.orderItems || []).filter(item => {
        const mainCat = (item.mainCategory || '').toLowerCase();
        const ws = (item.workstation || item.station || '').toLowerCase();
        return mainCat.includes('beverage') || mainCat.includes('minuman') || ws.includes('bar');
      });

      const kitchenItems = (orderData.orderItems || []).filter(item => {
        const mainCat = (item.mainCategory || '').toLowerCase();
        const ws = (item.workstation || item.station || '').toLowerCase();
        return !mainCat.includes('beverage') && !mainCat.includes('minuman') && !ws.includes('bar');
      });

      const printPayload = {
        orderId,
        tableNumber,
        orderType: orderData.orderType || 'dine-in',
        source: orderData.source || 'Cashier',
        name: orderData.customer_name || orderData.name || 'Guest',
        service: orderData.service || 'Dine-In',
        timestamp: new Date()
      };

      // Broadcast to KITCHEN (all kitchen items go to kitchen)
      if (kitchenItems.length > 0) {
        io.to('kitchen_room').emit('kitchen_immediate_print', {
          ...printPayload,
          orderItems: kitchenItems
        });
        console.log(`   ✅ Kitchen broadcast: ${kitchenItems.length} items`);
      }

      // 🔧 SMART BAR ROUTING: Route to correct bar based on sourceCashierArea
      if (beverageItems.length > 0) {
        let targetBarRoom = 'bar_depan'; // Default

        if (sourceCashierArea === 'belakang') {
          targetBarRoom = 'bar_belakang';
        } else if (sourceCashierArea === 'depan') {
          targetBarRoom = 'bar_depan';
        }
        // If no sourceCashierArea, default to bar_depan

        io.to(targetBarRoom).emit('beverage_immediate_print', {
          ...printPayload,
          orderItems: beverageItems
        });
        console.log(`   ✅ Bar broadcast to ${targetBarRoom}: ${beverageItems.length} items (cashier area: ${sourceCashierArea || 'default'})`);
      }
    }
  } catch (error) {
    console.error('Error broadcasting cash order:', error);
  }
};

// ✅ BROADCAST ORDER CREATION (DI PANGGIL SETELAH JOB COMPLETE)
export const broadcastOrderCreation = async (orderId, orderData) => {
  try {
    const { tableNumber, source, outletId, paymentDetails } = orderData;

    if (!tableNumber) {
      console.log('⚠️ No table number, skipping broadcast');
      return;
    }

    console.log(`\n📡 ========== ORDER BROADCAST ==========`);
    console.log(`📋 Order ID: ${orderId}`);
    console.log(`🪑 Table: ${tableNumber}`);
    console.log(`📱 Source: ${source}`);
    console.log(`💳 Payment: ${paymentDetails?.method || 'N/A'}`);

    // ✅ BROADCAST KE AREAS UNTUK SEMUA ORDER (Web & App)
    await broadcastNewOrderToAreas({
      orderId,
      tableNumber,
      orderData,
      source,
      outletId,
      paymentMethod: paymentDetails?.method
    });

    // ✅ OPTIMIZATION: Single broadcast path via socketManagement (no duplicate)
    const isCashPayment = paymentDetails?.method?.toLowerCase() === 'cash';
    if (isCashPayment) {
      console.log(`💰 Cash payment detected - broadcasting to kitchen/bar`);
      await broadcastCashOrderToKitchen({
        orderId,
        tableNumber,
        orderData,
        outletId,
        isAppOrder: source === 'App',
        isWebOrder: source === 'Web'
      });
    }

    console.log(`✅ Broadcast completed`);
    console.log(`======================================\n`);

  } catch (error) {
    console.error('❌ Error in broadcastOrderCreation:', error);
    console.log(`======================================\n`);
  }
};

// ✅ BROADCAST NEW ORDER TO AREAS (UNTUK SEMUA PAYMENT METHOD - Web & App)
export const broadcastNewOrderToAreas = async (orderInfo) => {
  try {
    const { orderId, tableNumber, orderData, source, outletId, paymentMethod } = orderInfo;

    if (!tableNumber) {
      console.log('⚠️ No table number, skipping area broadcast');
      return;
    }

    const areaCode = tableNumber.charAt(0).toUpperCase();
    const areaRoom = `area_${areaCode}`;
    const areaGroup = getAreaGroup(areaCode);

    // Prepare broadcast data
    const broadcastData = {
      orderId,
      tableNumber,
      areaCode,
      orderData,
      source,
      paymentMethod,
      timestamp: new Date(),
      message: `🆕 ORDER BARU - ${source} - Area ${areaCode}, Meja ${tableNumber}`
    };

    // Broadcast to area room
    if (global.io) {
      // ✅ Broadcast ke area room (untuk kasir di area tersebut)
      global.io.to(areaRoom).emit('new_order_in_area', broadcastData);

      // ✅ Broadcast ke area group
      if (areaGroup) {
        global.io.to(areaGroup).emit('new_order_in_group', {
          ...broadcastData,
          areaGroup
        });
      }

      // ✅ Broadcast ke cashier room (untuk semua kasir)
      global.io.to('cashier_room').emit('new_order', broadcastData);

      // ✅ Broadcast ke outlet-specific room
      global.io.to(`outlet_${outletId}`).emit('new_order', broadcastData);

      // Log connected devices
      const areaRoomClients = global.io.sockets.adapter.rooms.get(areaRoom)?.size || 0;
      const cashierRoomClients = global.io.sockets.adapter.rooms.get('cashier_room')?.size || 0;
      console.log(`📍 → Area ${areaCode}: ${areaRoomClients} devices | Cashier room: ${cashierRoomClients} devices`);

    } else {
      console.warn('❌ Socket IO not available for broadcasting');
    }

  } catch (error) {
    console.error('❌ Error broadcasting order to areas:', error);
  }
};