// utils/socketManagement.js
import { Device } from '../models/Device.model.js';
import Table from '../models/Table.model.js';
import Area from '../models/Area.model.js';

class SocketManagement {
  constructor() {
    this.connectedDevices = new Map(); // socketId -> deviceData
    this.cashierRooms = new Map(); // role -> socketIds
  }

  // ✅ DEVICE REGISTRATION
  async registerDevice(socket, deviceData) {
    try {
      const { deviceId, outletId, role, location } = deviceData;

      // Update device dengan socketId
      const updatedDevice = await Device.findOneAndUpdate(
        { deviceId, outlet: outletId },
        { 
          socketId: socket.id,
          isActive: true,
          lastLogin: new Date()
        },
        { new: true }
      );

      if (!updatedDevice) {
        throw new Error('Device not found or not authorized');
      }

      // Simpan di memory
      this.connectedDevices.set(socket.id, {
        ...updatedDevice.toObject(),
        socket
      });

      // Join room berdasarkan role
      socket.join(updatedDevice.role);
      
      // Join room khusus berdasarkan area yang ditangani
      if (updatedDevice.assignedAreas && updatedDevice.assignedAreas.length > 0) {
        updatedDevice.assignedAreas.forEach(area => {
          socket.join(`area_${area}`);
        });
      }

      // Join room berdasarkan tables yang ditangani
      if (updatedDevice.assignedTables && updatedDevice.assignedTables.length > 0) {
        updatedDevice.assignedTables.forEach(table => {
          socket.join(`table_${table}`);
        });
      }

      console.log(`✅ Device registered: ${updatedDevice.deviceName} (${updatedDevice.role}) - Socket: ${socket.id}`);
      
      return updatedDevice;

    } catch (error) {
      console.error('Device registration error:', error);
      throw error;
    }
  }

  // ✅ GET TARGET DEVICES FOR ORDER
  async getTargetDevicesForOrder(orderData) {
    try {
      const { tableNumber, items, orderType = 'both' } = orderData;
      
      // Cari area berdasarkan table number
      const table = await Table.findOne({ table_number: tableNumber })
        .populate('area_id');
      
      if (!table) {
        throw new Error(`Table ${tableNumber} not found`);
      }

      const areaCode = table.area_id.area_code;
      const isBeverageOrder = this.isBeverageOrder(items);
      const targetOrderType = isBeverageOrder ? 'beverage' : 'food';

      console.log(`📦 Order analysis: Table ${tableNumber}, Area ${areaCode}, Type: ${targetOrderType}`);

      // Cari devices yang aktif dan terkoneksi
      const targetDevices = [];
      
      for (const [socketId, device] of this.connectedDevices.entries()) {
        // Cek apakah device bisa handle table ini
        if (!device.canHandleTable(tableNumber)) continue;
        
        // Cek apakah device bisa handle area ini  
        if (!device.canHandleArea(areaCode)) continue;
        
        // Cek apakah device bisa handle order type ini
        if (!device.canHandleOrderType(targetOrderType) && !device.canHandleOrderType('both')) continue;
        
        // Cek role yang sesuai
        if (this.isEligibleRole(device.role, targetOrderType, areaCode)) {
          targetDevices.push(device);
        }
      }

      console.log(`🎯 Found ${targetDevices.length} target devices for order`);
      
      return {
        targetDevices,
        areaCode,
        tableNumber,
        orderType: targetOrderType
      };

    } catch (error) {
      console.error('Error getting target devices:', error);
      return { targetDevices: [], error: error.message };
    }
  }

  // ✅ CHECK IF ORDER IS BEVERAGE
  isBeverageOrder(items) {
    if (!items || !Array.isArray(items)) return false;
    
    // Asumsi: ada field category di menuItem yang menunjukkan jenis
    return items.some(item => {
      const categories = item.menuItem?.categories || [];
      return categories.some(cat => 
        ['beverage', 'drink', 'minuman', 'bar'].includes(cat.toLowerCase())
      );
    });
  }

  // ✅ CHECK ELIGIBLE ROLE
  isEligibleRole(role, orderType, areaCode) {
    const roleConfig = {
      'cashier_senior': { types: ['food', 'beverage', 'both'], areas: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] },
      'cashier_junior': { types: ['food', 'beverage', 'both'], areas: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] },
      'bar_depan': { types: ['beverage'], areas: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] },
      'bar_belakang': { types: ['beverage'], areas: ['J', 'K', 'L', 'M', 'N', 'O'] },
      'kitchen': { types: ['food'], areas: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] }
    };

    const config = roleConfig[role];
    if (!config) return false;

    return config.types.includes(orderType) && config.areas.includes(areaCode);
  }

  // ✅ BROADCAST ORDER TO TARGET DEVICES
  async broadcastOrder(orderData) {
    try {
      const targetInfo = await this.getTargetDevicesForOrder(orderData);
      
      if (targetInfo.targetDevices.length === 0) {
        console.warn('⚠️ No target devices found for order:', orderData.tableNumber);
        // Fallback: broadcast to all cashiers
        this.fallbackBroadcast(orderData);
        return;
      }

      // Broadcast ke masing-masing target device
      targetInfo.targetDevices.forEach(device => {
        if (device.socket && device.socket.connected) {
          device.socket.emit('new_order', {
            order: orderData,
            targetInfo: {
              assignedArea: targetInfo.areaCode,
              orderType: targetInfo.orderType,
              tableNumber: targetInfo.tableNumber
            }
          });
          
          console.log(`📤 Order sent to: ${device.deviceName} (${device.role})`);
        }
      });

      // Juga broadcast ke room umum untuk backup
      const io = global.io; // Asumsikan io tersedia secara global
      if (io) {
        io.to('cashier_backup').emit('new_order_backup', {
          order: orderData,
          primaryHandlers: targetInfo.targetDevices.map(d => ({
            deviceName: d.deviceName,
            role: d.role
          }))
        });
      }

    } catch (error) {
      console.error('Error broadcasting order:', error);
      this.fallbackBroadcast(orderData);
    }
  }

  // ✅ FALLBACK BROADCAST
  fallbackBroadcast(orderData) {
    const io = global.io;
    if (io) {
      io.to('cashier_senior').emit('new_order_fallback', orderData);
      console.log('🔄 Using fallback broadcast to senior cashiers');
    }
  }

  // ✅ DEVICE DISCONNECTION
  async handleDisconnection(socketId) {
    try {
      const device = this.connectedDevices.get(socketId);
      if (device) {
        // Update status di database
        await Device.findOneAndUpdate(
          { deviceId: device.deviceId },
          { 
            isActive: false,
            socketId: null
          }
        );
        
        this.connectedDevices.delete(socketId);
        console.log(`❌ Device disconnected: ${device.deviceName}`);
      }
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  }

  // ✅ GET CONNECTED DEVICES STATUS
  getConnectedDevicesStatus() {
    const status = {};
    
    for (const device of this.connectedDevices.values()) {
      if (!status[device.role]) {
        status[device.role] = [];
      }
      
      status[device.role].push({
        deviceName: device.deviceName,
        location: device.location,
        assignedAreas: device.assignedAreas,
        assignedTables: device.assignedTables,
        isActive: device.isActive,
        lastLogin: device.lastLogin
      });
    }
    
    return status;
  }
}

export const socketManagement = new SocketManagement();