// sockets/orderHandlers.js
import { socketManagement } from '../utils/socketManagement.js';
import { Order } from '../models/order.model.js';

export const setupOrderHandlers = (io) => {
  // Simpan io instance globally untuk akses di utils
  global.io = io;

  io.on('connection', (socket) => {
    console.log('🔌 New socket connection:', socket.id);

    // ✅ DEVICE AUTHENTICATION
    socket.on('device_authenticate', async (data) => {
      try {
        const device = await socketManagement.registerDevice(socket, data);
        socket.emit('device_authenticated', {
          success: true,
          device: {
            deviceName: device.deviceName,
            role: device.role,
            assignedAreas: device.assignedAreas,
            assignedTables: device.assignedTables
          }
        });
      } catch (error) {
        socket.emit('device_authenticated', {
          success: false,
          error: error.message
        });
      }
    });

    // ✅ NEW ORDER FROM SYSTEM
    socket.on('new_order_created', async (orderData) => {
      try {
        console.log('🆕 New order received:', orderData.order_id);
        await socketManagement.broadcastOrder(orderData);
      } catch (error) {
        console.error('Error handling new order:', error);
      }
    });

    // ✅ ORDER STATUS UPDATE
    socket.on('order_status_update', async (data) => {
      try {
        // Broadcast status update ke room order
        socket.to(`order_${data.order_id}`).emit('order_status_updated', data);
        
        // Juga broadcast ke kitchen/bar jika diperlukan
        if (data.status === 'preparing') {
          const order = await Order.findById(data.order_id).populate('items.menuItem');
          const isBeverage = socketManagement.isBeverageOrder(order.items);
          
          const targetRoom = isBeverage ? 'bar_depan' : 'kitchen';
          socket.to(targetRoom).emit('order_preparing', data);
        }
      } catch (error) {
        console.error('Error updating order status:', error);
      }
    });

    // ✅ DEVICE STATUS REQUEST
    socket.on('get_devices_status', () => {
      const status = socketManagement.getConnectedDevicesStatus();
      socket.emit('devices_status', status);
    });

    // ✅ DISCONNECTION HANDLER
    socket.on('disconnect', () => {
      socketManagement.handleDisconnection(socket.id);
    });
  });
};