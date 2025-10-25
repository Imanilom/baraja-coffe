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

  // ✅ GET TARGET DEVICES FOR ORDER - DIPERBAIKI
  async getTargetDevicesForOrder(orderData) {
    try {
      const { tableNumber, items, orderType = 'both', outletId } = orderData;
      
      if (!tableNumber) {
        throw new Error('Table number is required for device targeting');
      }

      // Cari area berdasarkan table number
      const table = await Table.findOne({ table_number: tableNumber.toUpperCase() })
        .populate('area_id');
      
      if (!table) {
        throw new Error(`Table ${tableNumber} not found`);
      }

      const areaCode = table.area_id.area_code;
      const isBeverageOrder = this.isBeverageOrder(items);
      const targetOrderType = isBeverageOrder ? 'beverage' : 'food';

      console.log(`📦 Order analysis: Table ${tableNumber}, Area ${areaCode}, Type: ${targetOrderType}`);
      console.log(`🔍 Beverage detection: ${isBeverageOrder} based on items analysis`);

      // Cari devices yang aktif dan terkoneksi
      const targetDevices = [];
      
      for (const [socketId, device] of this.connectedDevices.entries()) {
        // Cek outlet match
        if (device.outlet.toString() !== outletId.toString()) {
          continue;
        }
        
        // Cek apakah device bisa handle table ini
        if (!this.canHandleTable(device, tableNumber)) continue;
        
        // Cek apakah device bisa handle area ini  
        if (!this.canHandleArea(device, areaCode)) continue;
        
        // Cek apakah device bisa handle order type ini
        if (!this.canHandleOrderType(device, targetOrderType)) continue;
        
        // Cek role yang sesuai
        if (this.isEligibleRole(device.role, targetOrderType, areaCode)) {
          targetDevices.push(device);
        }
      }

      console.log(`🎯 Found ${targetDevices.length} target devices for order`);
      console.log(`📋 Target devices:`, targetDevices.map(d => ({
        deviceName: d.deviceName,
        role: d.role,
        areas: d.assignedAreas,
        orderTypes: d.orderTypes
      })));
      
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

  // ✅ CHECK IF ORDER IS BEVERAGE - DIPERBAIKI
  isBeverageOrder(items) {
    if (!items || !Array.isArray(items)) return false;
    
    return items.some(item => {
      const menuItem = item.menuItem;
      if (!menuItem) return false;
      
      // Gunakan mainCategory dan workstation dari MenuItem
      const isBeverageByCategory = menuItem.mainCategory === 'minuman';
      const isBeverageByWorkstation = menuItem.workstation === 'bar' || menuItem.workstation === 'bar-belakang';
      
      return isBeverageByCategory || isBeverageByWorkstation;
    });
  }

  // ✅ HELPER: CAN HANDLE TABLE
  canHandleTable(device, tableNumber) {
    if (!device.assignedTables || device.assignedTables.length === 0) {
      return true; // Jika tidak ada konfigurasi, handle semua
    }
    return device.assignedTables.includes(tableNumber.toUpperCase());
  }

  // ✅ HELPER: CAN HANDLE AREA
  canHandleArea(device, areaCode) {
    if (!device.assignedAreas || device.assignedAreas.length === 0) {
      return true; // Jika tidak ada konfigurasi, handle semua
    }
    return device.assignedAreas.includes(areaCode.toUpperCase());
  }

  // ✅ HELPER: CAN HANDLE ORDER TYPE
  canHandleOrderType(device, orderType) {
    if (!device.orderTypes || device.orderTypes.length === 0) {
      return true;
    }
    return device.orderTypes.includes(orderType) || device.orderTypes.includes('both');
  }

  // ✅ CHECK ELIGIBLE ROLE
  isEligibleRole(role, orderType, areaCode) {
    const roleConfig = {
      'cashier_senior': { 
        types: ['food', 'beverage', 'both'], 
        areas: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] 
      },
      'cashier_junior': { 
        types: ['food', 'beverage', 'both'], 
        areas: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] 
      },
      'bar_depan': { 
        types: ['beverage'], 
        areas: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] 
      },
      'bar_belakang': { 
        types: ['beverage'], 
        areas: ['J', 'K', 'L', 'M', 'N', 'O'] 
      },
      'kitchen': { 
        types: ['food'], 
        areas: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] 
      }
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
      const io = global.io;
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
        orderTypes: device.orderTypes,
        isActive: device.isActive,
        lastLogin: device.lastLogin,
        socketId: device.socketId
      });
    }
    
    return status;
  }
}

export const socketManagement = new SocketManagement();