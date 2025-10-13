// sockets/socketHandler.js - VERSI OPTIMIZED
import { socketManagement } from '../utils/socketManagement.js';
import { Device } from '../models/Device.model.js';
import { DeviceSession } from '../models/DeviceSession.model.js';
import { getAreaGroup } from '../utils/areaGrouping.js';

import dotenv from 'dotenv';
dotenv.config();

export default function socketHandler(io) {
    global.io = io;

    io.on('connection', (socket) => {
        console.log(' Client connected:', socket.id);

        // Ping interval
        const pingInterval = setInterval(() => {
            socket.emit('ping', { message: 'Keep alive', timestamp: new Date().toISOString() });
        }, 30000);

        //  OPTIMIZED: SINGLE AUTHENTICATION HANDLER
        socket.on('device_authenticate_session', async (data, callback) => {
            try {
                const { sessionId, deviceId } = data;
                console.log(` Device session authentication: ${sessionId}, Device: ${deviceId}`);

                const session = await DeviceSession.findOne({
                    _id: sessionId, 
                    device: deviceId, 
                    isActive: true
                })
                    .populate('device')
                    .populate('user')
                    .populate('outlet');

                if (!session) throw new Error('Session tidak valid atau sudah logout');

                // Update session & device dengan socketId
                session.socketId = socket.id;
                await session.save();
                
                await Device.findByIdAndUpdate(deviceId, { 
                    socketId: socket.id, 
                    isOnline: true 
                });

                // Register device ke socket management
                const deviceData = {
                    deviceId: session.device.deviceId,
                    outletId: session.outlet._id,
                    role: session.role,
                    location: session.device.location,
                    deviceName: session.device.deviceName,
                    assignedAreas: session.device.assignedAreas,
                    assignedTables: session.device.assignedTables,
                    orderTypes: session.device.orderTypes
                };
                
                await socketManagement.registerDevice(socket, deviceData);

<<<<<<< HEAD
                //    PERBAIKAN: AUTO-JOIN ROOMS BERDASARKAN DEVICE CONFIG
                const joinResult = await joinDeviceRooms(socket, session);

                console.log(` Device authenticated: ${session.device.deviceName} - ${session.user.name} (${session.role})`);
                console.log(` Auto-joined ${joinResult.totalRooms} rooms for areas: ${session.device.assignedAreas?.join(', ') || 'None'}`);
=======
                // Join rooms berdasarkan role dan area
                socket.join(session.role);

                if (session.device.assignedAreas && session.device.assignedAreas.length > 0) {
                    session.device.assignedAreas.forEach(area => {
                        socket.join(`area_${area}`);
                        socket.join(room);
                        console.log(`Device ${session.device.deviceName} joined ${room}`);

                    });
                }

                // Join outlet room
                socket.join(`outlet_${session.outlet._id}`);

                // Join legacy rooms untuk compatibility
                socket.join('cashier_room');

                // Join bar room berdasarkan role
                if (session.role.includes('bar')) {
                    const barType = session.role.includes('depan') ? 'depan' : 'belakang';
                    socket.join(`bar_${barType}`);
                    console.log(`✅ Joined bar room: bar_${barType}`);
                }

                // Join kitchen room jika role kitchen
                if (session.role.includes('kitchen')) {
                    socket.join('kitchen_room');
                    socket.join(`kitchen_${session.outlet._id}`);
                }

                console.log(`✅ Device authenticated: ${session.device.deviceName} - ${session.user.name} (${session.role}) - Socket: ${socket.id}`);
>>>>>>> 5957ac4d08df55ff16d5ed45df73df865fb95fa1

                const response = {
                    success: true,
                    session: { 
                        id: session._id, 
                        user: session.user, 
                        device: session.device, 
                        outlet: session.outlet, 
                        role: session.role 
                    },
                    device: { 
                        deviceName: session.device.deviceName, 
                        role: session.role, 
                        assignedAreas: session.device.assignedAreas,
                        assignedTables: session.device.assignedTables, 
                        orderTypes: session.device.orderTypes, 
                        location: session.device.location 
                    },
                    joinedRooms: joinResult.joinedRooms,
                    message: 'Device authenticated successfully'
                };

                callback?.(response);

                // Broadcast device online status
                socket.to(`outlet_${session.outlet._id}`).emit('device_online', {
                    deviceId: session.device._id, 
                    deviceName: session.device.deviceName,
                    userName: session.user.name, 
                    role: session.role, 
                    socketId: socket.id, 
                    assignedAreas: session.device.assignedAreas,
                    timestamp: new Date()
                });

            } catch (error) {
                console.error('Device session authentication error:', error);
<<<<<<< HEAD
                callback?.({ success: false, error: error.message });
=======

                const response = {
                    success: false,
                    error: error.message
                };

                if (typeof callback === 'function') {
                    callback(response);
                }

>>>>>>> 5957ac4d08df55ff16d5ed45df73df865fb95fa1
                socket.disconnect();
            }
        });

        //  OPTIMIZED: LEGACY AUTHENTICATION (simplified)
        socket.on('device_authenticate', async (data, callback) => {
            try {
                const { deviceId, outletId, role, location, deviceName } = data;
<<<<<<< HEAD
                console.log(` Legacy device authentication: ${deviceId}, Role: ${role}`);

                const device = await socketManagement.registerDevice(socket, { deviceId, outletId, role, location, deviceName });
                
                // Join basic rooms
                socket.join(['cashier_room', `outlet_${outletId}`]);
                if (role.includes('bar')) socket.join(`bar_${role.includes('depan') ? 'depan' : 'belakang'}`);
                if (role.includes('kitchen')) socket.join(['kitchen_room', `kitchen_${outletId}`]);
=======

                console.log(`🔐 Legacy device authentication: ${deviceId}, Role: ${role}`);
>>>>>>> 5957ac4d08df55ff16d5ed45df73df865fb95fa1

                callback?.({ success: true, device, message: 'Device authenticated successfully' });

            } catch (error) {
                console.error('Device authentication failed:', error);
<<<<<<< HEAD
                callback?.({ success: false, error: error.message });
=======

                const response = {
                    success: false,
                    error: error.message
                };

                if (typeof callback === 'function') {
                    callback(response);
                }
>>>>>>> 5957ac4d08df55ff16d5ed45df73df865fb95fa1
            }
        });

        //  OPTIMIZED: ROOM MANAGEMENT
        socket.on('join_order_room', (orderId, callback) => {
            const roomName = `order_${orderId}`;
            socket.join(roomName);
            console.log(`Client ${socket.id} joined room: ${roomName}`);
            callback?.({ status: 'joined', room: roomName });
        });

        socket.on('join_cashier_room', (payload, callback) => {
            const rooms = ['cashier_room'];
            if (payload?.outletId) rooms.push(`cashiers_${payload.outletId}`);
            socket.join(rooms);
            console.log(`Client ${socket.id} joined rooms: ${rooms.join(', ')}`);
            callback?.({ status: 'joined', rooms });
        });

        //  OPTIMIZED: SINGLE AREA MANAGEMENT HANDLER
        socket.on('manage_area_monitoring', async (data, callback) => {
            try {
                const { action, areaCode, tableNumbers } = data;
                let result;

                switch (action) {
                    case 'join':
                        result = await joinArea(socket, areaCode, tableNumbers);
                        break;
                    case 'leave':
                        result = leaveArea(socket, areaCode);
                        break;
                    case 'status':
                        result = await getAreaStatus(socket, io);
                        break;
                    case 'toggle':
                        result = toggleAreaMonitoring(socket, areaCode, data.enable);
                        break;
                    default:
                        throw new Error('Action tidak valid');
                }

                callback?.({ success: true, ...result });
            } catch (error) {
                console.error('Area management error:', error);
                callback?.({ success: false, error: error.message });
            }
        });

        //  OPTIMIZED: ORDER HANDLING
        socket.on('new_order_created', async (orderData) => {
            try {
<<<<<<< HEAD
                console.log(' New order received:', orderData.order_id);
                
                // Single broadcast function
                await broadcastOrderEfficiently(orderData, io);
                
=======
                console.log('🆕 New order received:', orderData.order_id);

                // Gunakan sistem management baru untuk broadcast
                await socketManagement.broadcastOrder(orderData);

                // Juga broadcast legacy untuk compatibility
                broadcastNewOrderLegacy(orderData.outlet?._id || orderData.outlet, orderData);

>>>>>>> 5957ac4d08df55ff16d5ed45df73df865fb95fa1
            } catch (error) {
                console.error('Error handling new order:', error);
            }
        });

        //  OPTIMIZED: ORDER STATUS UPDATES
        socket.on('update_order_status', (data) => {
            const { orderId, status, cashierId, cashierName, tableNumber } = data;
            
            // Single notification function
            notifyOrderStatusUpdate(orderId, status, { id: cashierId, name: cashierName }, tableNumber);
            console.log(`Order status updated: ${orderId} -> ${status}`);
        });

        //  OPTIMIZED: KITCHEN HANDLERS
        socket.on('kitchen_order_action', (data) => {
            const { action, orderId, kitchenId, kitchenName, tableNumber, ...rest } = data;
            
            const handlers = {
                confirm: () => handleKitchenConfirm(orderId, kitchenId, kitchenName, tableNumber),
                complete: () => handleKitchenComplete(orderId, tableNumber, rest.completedItems),
                update: () => handleKitchenUpdate(orderId, rest.status, kitchenName, tableNumber)
            };

            handlers[action]?.();
        });

<<<<<<< HEAD
        //  OPTIMIZED: BAR HANDLERS
        socket.on('bar_order_action', async (data) => {
            try {
                const { action, orderId, bartenderName, tableNumber, ...rest } = data;
                
                const handlers = {
                    start: () => handleBarOrderStart(orderId, bartenderName, tableNumber),
                    complete: () => handleBarOrderComplete(orderId, bartenderName, tableNumber, rest.completedItems),
                    update_status: () => handleBarStatusUpdate(orderId, rest.status, rest.bartenderId, bartenderName, tableNumber),
                    update_item: () => handleBarItemUpdate(orderId, rest.itemId, rest.status, bartenderName)
                };

                await handlers[action]?.();
                
            } catch (error) {
                console.error('Bar order action error:', error);
                socket.emit('beverage_order_error', { error: `Failed to ${data.action} beverage order`, message: error.message });
=======
        socket.on('kitchen_order_complete', (data) => {
            const { orderId, completedItems, tableNumber } = data;

            const updateData = {
                orderId,
                completedItems,
                orderStatus: 'Ready',
                message: 'Order is ready for serving',
                timestamp: new Date()
            };

            // Notify cashier
            socket.to('cashier_room').emit('kitchen_update', updateData);

            // Notify customer
            socket.to(`order_${orderId}`).emit('order_status_update', updateData);

            // ✅ Notify area-specific
            if (tableNumber) {
                notifyAreaSpecificUpdate(orderId, 'Ready', 'Kitchen', tableNumber);
            }

            console.log(`Kitchen completed order: ${orderId}`);
        });

        // === BAR/BEVERAGE HANDLERS ===

        // ✅ START BEVERAGE ORDER PREPARATION
        socket.on('bar_order_start', async (data) => {
            try {
                const { orderId, bartenderName, tableNumber } = data;

                console.log(`🍹 Starting beverage order: ${orderId} by ${bartenderName}`);

                // Determine which bar should handle based on table number
                const areaCode = getAreaCodeFromTable(tableNumber);
                const barRoom = areaCode <= 'I' ? 'bar_depan' : 'bar_belakang';

                // Call API to update order status
                const response = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/orders/${orderId}/beverage-start`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        bartenderName: bartenderName
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to start beverage order via API');
                }

                const result = await response.json();

                // Notify the specific bar room
                socket.to(barRoom).emit('beverage_preparation_started', {
                    orderId,
                    tableNumber,
                    bartenderName,
                    assignedBar: barRoom,
                    timestamp: new Date(),
                    message: 'Beverage order started preparation'
                });

                // Notify cashier
                socket.to('cashier_room').emit('beverage_preparation_started', {
                    orderId,
                    tableNumber,
                    bartenderName,
                    timestamp: new Date()
                });

                // Notify customer
                socket.to(`order_${orderId}`).emit('beverage_preparation_started', {
                    orderId,
                    message: 'Your beverages are being prepared',
                    timestamp: new Date()
                });

                console.log(`✅ Beverage order ${orderId} started by ${bartenderName} in ${barRoom}`);

            } catch (error) {
                console.error('Error starting beverage order:', error);

                // Notify client about the error
                socket.emit('beverage_order_error', {
                    error: 'Failed to start beverage order',
                    message: error.message
                });
            }
        });

        // ✅ COMPLETE BEVERAGE ORDER (MARK AS READY)
        socket.on('bar_order_complete', async (data) => {
            try {
                const { orderId, bartenderName, completedItems, tableNumber } = data;

                console.log(`🍹 Completing beverage order: ${orderId} by ${bartenderName}`);

                // Call API to update order status
                const response = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/orders/${orderId}/beverage-complete`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        bartenderName: bartenderName,
                        completedItems: completedItems || []
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to complete beverage order via API');
                }

                const result = await response.json();

                // Determine bar room for notification
                const areaCode = getAreaCodeFromTable(tableNumber);
                const barRoom = areaCode <= 'I' ? 'bar_depan' : 'bar_belakang';

                // Notify customer
                socket.to(`order_${orderId}`).emit('beverage_ready', {
                    orderId,
                    tableNumber,
                    message: 'Your beverages are ready',
                    preparedBy: bartenderName,
                    completedItems: completedItems,
                    timestamp: new Date()
                });

                // Notify cashier
                socket.to('cashier_room').emit('beverage_ready', {
                    orderId,
                    tableNumber,
                    bartenderName,
                    completedItems: completedItems,
                    timestamp: new Date()
                });

                // Notify waitstaff/runner
                socket.to('waitstaff_room').emit('beverage_ready_for_serve', {
                    orderId,
                    tableNumber,
                    bartenderName,
                    completedItems: completedItems,
                    timestamp: new Date()
                });

                // Notify bar room
                socket.to(barRoom).emit('beverage_ready', {
                    orderId,
                    tableNumber,
                    bartenderName,
                    completedItems: completedItems,
                    timestamp: new Date()
                });

                console.log(`✅ Beverage order ${orderId} completed by ${bartenderName}`);

            } catch (error) {
                console.error('Error completing beverage order:', error);

                socket.emit('beverage_order_error', {
                    error: 'Failed to complete beverage order',
                    message: error.message
                });
            }
        });

        // ✅ UPDATE INDIVIDUAL BEVERAGE ITEM STATUS
        socket.on('update_beverage_item_status', async (data) => {
            try {
                const { orderId, itemId, status, bartenderName } = data;

                console.log(`🔄 Updating beverage item status: ${orderId} - ${itemId} to ${status}`);

                const response = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/orders/${orderId}/items/${itemId}/beverage-status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: status,
                        bartenderName: bartenderName
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update beverage item status via API');
                }

                const result = await response.json();

                // Notify bar rooms about item status update
                io.to('bar_depan').to('bar_belakang').emit('beverage_item_status_updated', {
                    orderId,
                    itemId,
                    status,
                    bartenderName,
                    timestamp: new Date()
                });

                console.log(`✅ Beverage item ${itemId} in order ${orderId} updated to ${status}`);

            } catch (error) {
                console.error('Error updating beverage item status:', error);

                socket.emit('beverage_order_error', {
                    error: 'Failed to update beverage item status',
                    message: error.message
                });
            }
        });

        // ✅ BEVERAGE ORDER RECEIVED (Auto-assign to bar)
        socket.on('beverage_order_received', (data) => {
            const { orderId, tableNumber, items } = data;

            // Determine which bar should handle based on table number
            const areaCode = getAreaCodeFromTable(tableNumber);
            const barRoom = areaCode <= 'I' ? 'bar_depan' : 'bar_belakang';

            socket.to(barRoom).emit('beverage_order_received', {
                orderId,
                tableNumber,
                items,
                assignedBar: barRoom,
                timestamp: new Date(),
                message: 'New beverage order received'
            });

            console.log(`🍹 Beverage order ${orderId} assigned to ${barRoom} for table ${tableNumber}`);
        });

        // ✅ UPDATE BAR ORDER STATUS (General)
        socket.on('update_bar_order_status', async (data) => {
            try {
                const { orderId, status, bartenderId, bartenderName, tableNumber } = data;

                console.log(`🔄 Updating bar order status: ${orderId} to ${status}`);

                const response = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/orders/${orderId}/bar-status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: status,
                        bartenderId: bartenderId,
                        bartenderName: bartenderName
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update bar order status via API');
                }

                const result = await response.json();

                // Determine bar room
                const areaCode = getAreaCodeFromTable(tableNumber);
                const barRoom = areaCode <= 'I' ? 'bar_depan' : 'bar_belakang';

                // Notify customer
                socket.to(`order_${orderId}`).emit('order_status_update', {
                    order_id: orderId,
                    status: status,
                    bartender: { id: bartenderId, name: bartenderName },
                    timestamp: new Date()
                });

                // Notify cashier
                socket.to('cashier_room').emit('beverage_order_updated', {
                    orderId,
                    status,
                    updatedBy: { id: bartenderId, name: bartenderName },
                    timestamp: new Date()
                });

                // Notify bar room
                socket.to(barRoom).emit('beverage_order_updated', {
                    orderId,
                    status,
                    updatedBy: { id: bartenderId, name: bartenderName },
                    timestamp: new Date()
                });

                console.log(`✅ Bar order ${orderId} status updated to ${status} by ${bartenderName}`);

            } catch (error) {
                console.error('Error updating bar order status:', error);

                socket.emit('beverage_order_error', {
                    error: 'Failed to update bar order status',
                    message: error.message
                });
            }
        });

        // ✅ DEVICE STATUS MANAGEMENT
        socket.on('get_connected_devices', (callback) => {
            const status = socketManagement.getConnectedDevicesStatus();

            if (typeof callback === 'function') {
                callback(status);
            }
        });

        socket.on('update_device_assignment', async (data, callback) => {
            try {
                const { deviceId, assignedAreas, assignedTables, orderTypes } = data;

                const updatedDevice = await Device.findOneAndUpdate(
                    { deviceId },
                    {
                        assignedAreas,
                        assignedTables,
                        orderTypes
                    },
                    { new: true }
                );

                // Update in-memory data jika device sedang connected
                for (const [socketId, device] of socketManagement.connectedDevices.entries()) {
                    if (device.deviceId === deviceId) {
                        device.assignedAreas = assignedAreas;
                        device.assignedTables = assignedTables;
                        device.orderTypes = orderTypes;
                        break;
                    }
                }

                const response = {
                    success: true,
                    device: updatedDevice,
                    message: 'Device assignment updated successfully'
                };

                if (typeof callback === 'function') {
                    callback(response);
                }

            } catch (error) {
                console.error('Error updating device assignment:', error);

                if (typeof callback === 'function') {
                    callback({ success: false, error: error.message });
                }
>>>>>>> 5957ac4d08df55ff16d5ed45df73df865fb95fa1
            }
        });

        //  OPTIMIZED: DEVICE MANAGEMENT
        socket.on('device_management', async (data, callback) => {
            try {
<<<<<<< HEAD
                const { action, deviceId, ...rest } = data;
                
                const handlers = {
                    get_connected: () => ({ status: socketManagement.getConnectedDevicesStatus() }),
                    update_assignment: () => updateDeviceAssignment(deviceId, rest),
                    force_logout: () => forceLogoutDevice(deviceId, rest.reason)
                };

                const result = await handlers[action]?.();
                callback?.({ success: true, ...result });
                
            } catch (error) {
                console.error('Device management error:', error);
                callback?.({ success: false, error: error.message });
=======
                const { deviceId, reason } = data;

                // Cari session aktif untuk device
                const activeSession = await DeviceSession.findOne({
                    device: deviceId,
                    isActive: true
                }).populate('device').populate('user');

                if (!activeSession) {
                    throw new Error('Tidak ada session aktif untuk device ini');
                }

                // Update session
                activeSession.isActive = false;
                activeSession.logoutTime = new Date();
                await activeSession.save();

                // Update device
                await Device.findByIdAndUpdate(deviceId, {
                    isOnline: false,
                    socketId: null
                });

                // Emit force logout ke device
                if (activeSession.socketId) {
                    io.to(activeSession.socketId).emit('force_logout', {
                        reason: reason || 'Logged out by admin',
                        timestamp: new Date()
                    });
                }

                // Hapus dari socket management
                socketManagement.handleDisconnection(activeSession.socketId);

                const response = {
                    success: true,
                    message: `Device ${activeSession.device.deviceName} berhasil di logout`,
                    data: {
                        deviceName: activeSession.device.deviceName,
                        userName: activeSession.user.name,
                        logoutTime: activeSession.logoutTime
                    }
                };

                if (typeof callback === 'function') {
                    callback(response);
                }

            } catch (error) {
                console.error('Force logout error:', error);

                if (typeof callback === 'function') {
                    callback({ success: false, error: error.message });
                }
>>>>>>> 5957ac4d08df55ff16d5ed45df73df865fb95fa1
            }
        });

        // Leave room (simple)
        socket.on('leave_room', (roomName) => {
            socket.leave(roomName);
            console.log(`Client ${socket.id} left room: ${roomName}`);
        });

<<<<<<< HEAD
        //  OPTIMIZED: DISCONNECTION HANDLER
=======
        socket.on('device:leaveAll', (cb) => {
            try {
                // Lepas semua room kecuali room pribadi socket.id
                for (const room of socket.rooms) {
                    if (room !== socket.id) socket.leave(room);
                }
                cb?.({ ok: true });
            } catch (e) {
                cb?.({ ok: false, error: e?.message });
            }
        });

        socket.on('leave_area_room', (tableCode) => {
            const group = getAreaGroup(tableCode);
            if (group) {
                socket.leave(group);
                console.log(`Device ${socket.id} left area ${areaRoom} and group ${group}`);
            } else {
                console.log('Area room not found');
            }
        });

        // ✅ HANDLE DISCONNECTION
>>>>>>> 5957ac4d08df55ff16d5ed45df73df865fb95fa1
        socket.on('disconnect', async () => {
            console.log('Client disconnected:', socket.id);
            clearInterval(pingInterval);
<<<<<<< HEAD
            await handleDisconnection(socket.id);
=======

            try {
                // Cari session berdasarkan socketId
                const session = await DeviceSession.findOne({
                    socketId: socket.id,
                    isActive: true
                });

                if (session) {
                    // Update session
                    session.isActive = false;
                    session.logoutTime = new Date();
                    await session.save();

                    // Update device
                    await Device.findByIdAndUpdate(session.device, {
                        isOnline: false,
                        socketId: null
                    });

                    console.log(`❌ Device session ended: ${socket.id} - User: ${session.user.name}`);

                    // Broadcast device offline status
                    socket.to(`outlet_${session.outlet}`).emit('device_offline', {
                        deviceId: session.device,
                        socketId: socket.id,
                        userName: session.user.name,
                        timestamp: new Date()
                    });
                }

                // Handle disconnection di socket management
                socketManagement.handleDisconnection(socket.id);

            } catch (error) {
                console.error('Disconnection handling error:', error);
            }
>>>>>>> 5957ac4d08df55ff16d5ed45df73df865fb95fa1
        });

    });

    // ==================== HELPER FUNCTIONS ====================

<<<<<<< HEAD
    //  OPTIMIZED: ROOM JOINING LOGIC
    const joinDeviceRooms = async (socket, session) => {
        const joinedRooms = {
            basic: [],
            role: [],
            areas: [],
            groups: [],
            tables: []
        };

        //  BASIC ROOMS
        const basicRooms = [
            session.role,
            `outlet_${session.outlet._id}`,
            'system_monitor'
        ];
        
        socket.join(basicRooms);
        joinedRooms.basic = basicRooms;

        //  ROLE-SPECIFIC ROOMS
        if (session.role.includes('cashier') || session.role.includes('bar')) {
            const cashierRooms = ['cashier_room', `cashiers_${session.outlet._id}`];
            socket.join(cashierRooms);
            joinedRooms.role.push(...cashierRooms);
        }

        if (session.role.includes('bar')) {
            const barType = session.role.includes('depan') ? 'depan' : 'belakang';
            const barRoom = `bar_${barType}`;
            socket.join(barRoom);
            joinedRooms.role.push(barRoom);
        }

        if (session.role.includes('kitchen')) {
            const kitchenRooms = ['kitchen_room', `kitchen_${session.outlet._id}`];
            socket.join(kitchenRooms);
            joinedRooms.role.push(...kitchenRooms);
        }

        //    AREA ROOMS BERDASARKAN assignedAreas DI DEVICE
        if (session.device.assignedAreas && session.device.assignedAreas.length > 0) {
            console.log(` Auto-joining areas for ${session.device.deviceName}:`, session.device.assignedAreas);
            
            session.device.assignedAreas.forEach(area => {
                const areaRoom = `area_${area}`;
                socket.join(areaRoom);
                joinedRooms.areas.push(areaRoom);
                
                // Join area group
                const areaGroup = getAreaGroup(area);
                if (areaGroup) {
                    socket.join(areaGroup);
                    joinedRooms.groups.push(areaGroup);
                }
=======
    // ✅ AREA-SPECIFIC NOTIFICATION
    const notifyAreaSpecificUpdate = (orderId, status, updatedBy, tableNumber = null) => {
        if (!tableNumber) return;

        const areaCode = getAreaCodeFromTable(tableNumber);
        if (areaCode) {
            const areaRoom = `area_${areaCode}`;
            io.to(areaRoom).emit('area_order_update', {
                orderId,
                status,
                updatedBy,
                tableNumber,
                areaCode,
                timestamp: new Date()
>>>>>>> 5957ac4d08df55ff16d5ed45df73df865fb95fa1
            });
        }

        //  TABLE ROOMS BERDASARKAN assignedTables (OPSIONAL)
        if (session.device.assignedTables && session.device.assignedTables.length > 0) {
            // Batasi jumlah table rooms untuk menghindari performance issue
            const tableRooms = session.device.assignedTables.slice(0, 50).map(table => `table_${table}`);
            socket.join(tableRooms);
            joinedRooms.tables = tableRooms;
        }

        // Hitung total rooms
        const allRooms = [
            ...joinedRooms.basic,
            ...joinedRooms.role, 
            ...joinedRooms.areas,
            ...joinedRooms.groups,
            ...joinedRooms.tables
        ];

        return {
            totalRooms: allRooms.length,
            joinedRooms: allRooms,
            details: joinedRooms
        };
    };

<<<<<<< HEAD

    //  OPTIMIZED: AREA MANAGEMENT
    const joinArea = (socket, areaCode, tableNumbers = []) => {
        const rooms = [`area_${areaCode}`];
        const areaGroup = getAreaGroup(areaCode);
        if (areaGroup) rooms.push(areaGroup);
        
        tableNumbers.forEach(table => rooms.push(`table_${table}`));
        socket.join(rooms);
        
        return { joinedRooms: rooms, message: `Berhasil join area ${areaCode}` };
=======
    // ✅ GET AREA CODE FROM TABLE NUMBER
    const getAreaCodeFromTable = (tableNumber) => {
        if (!tableNumber) return null;

        // Extract first character from table number (e.g., "A1" -> "A")
        const firstChar = tableNumber.charAt(0).toUpperCase();
        return firstChar;
>>>>>>> 5957ac4d08df55ff16d5ed45df73df865fb95fa1
    };

    const leaveArea = (socket, areaCode) => {
        const rooms = [`area_${areaCode}`, getAreaGroup(areaCode)].filter(Boolean);
        socket.leave(rooms);
        return { leftRooms: rooms, message: `Left area ${areaCode}` };
    };

    const toggleAreaMonitoring = (socket, areaCode, enable) => {
        const room = `area_${areaCode}`;
        enable ? socket.join(room) : socket.leave(room);
        return { areaCode, enabled: enable, message: `Area ${areaCode} monitoring ${enable ? 'enabled' : 'disabled'}` };
    };

    const getAreaStatus = async (socket, io) => {
        const session = await DeviceSession.findOne({ socketId: socket.id, isActive: true }).populate('device');
        if (!session) throw new Error('Session tidak ditemukan');
        
        const areaStatus = session.device.assignedAreas?.map(areaCode => ({
            areaCode,
            roomName: `area_${areaCode}`,
            connectedDevices: io.sockets.adapter.rooms.get(`area_${areaCode}`)?.size || 0,
            isMonitoring: socket.rooms.has(`area_${areaCode}`)
        })) || [];
        
        return { deviceName: session.device.deviceName, assignedAreas: session.device.assignedAreas, areaStatus };
    };

    //  OPTIMIZED: ORDER BROADCASTING
    const broadcastOrderEfficiently = async (orderData, io) => {
        const tableNumber = orderData.tableNumber;
        if (!tableNumber) {
            console.log(' No table number, skipping broadcast');
            return;
        }

        const areaCode = tableNumber.charAt(0).toUpperCase();
        const areaRoom = `area_${areaCode}`;
        const areaGroup = getAreaGroup(areaCode);

        // Prepare base data
        const baseData = {
            orderId: orderData.order_id,
            tableNumber,
            areaCode,
            orderData,
            timestamp: new Date()
        };

        // Single efficient broadcast
        const rooms = ['cashier_room', areaRoom];
        if (areaGroup) rooms.push(areaGroup);

        rooms.forEach(room => {
            io.to(room).emit('new_order', {
                ...baseData,
                message: room === 'cashier_room' ? `Order baru - Meja ${tableNumber}` : ` ORDER BARU - Area ${areaCode}, Meja ${tableNumber}`
            });
        });

        console.log(` Order ${orderData.order_id} broadcasted to ${rooms.length} rooms`);
    };

    //  OPTIMIZED: NOTIFICATION FUNCTIONS
    const notifyOrderStatusUpdate = (orderId, status, updatedBy, tableNumber = null) => {
        const updateData = { orderId, status, updatedBy, timestamp: new Date() };
        
        // Notify order room and cashiers
        io.to(`order_${orderId}`).emit('order_status_update', updateData);
        io.to('cashier_room').emit('order_updated', updateData);
        
        // Notify area if table number provided
        if (tableNumber) {
            const areaCode = tableNumber.charAt(0).toUpperCase();
            io.to(`area_${areaCode}`).emit('area_order_update', { ...updateData, tableNumber, areaCode });
        }
    };

    //  OPTIMIZED: KITCHEN HANDLERS
    const handleKitchenConfirm = (orderId, kitchenId, kitchenName, tableNumber) => {
        const data = { orderId, orderStatus: 'Cooking', kitchen: { id: kitchenId, name: kitchenName }, timestamp: new Date() };
        io.to([`order_${orderId}`, 'cashier_room', 'kitchen_room']).emit('kitchen_order_confirmed', data);
        if (tableNumber) notifyAreaSpecificUpdate(orderId, 'Cooking', kitchenName, tableNumber);
    };

    const handleKitchenComplete = (orderId, tableNumber, completedItems = []) => {
        const data = { orderId, completedItems, orderStatus: 'Ready', timestamp: new Date() };
        io.to([`order_${orderId}`, 'cashier_room']).emit('kitchen_order_complete', data);
        if (tableNumber) notifyAreaSpecificUpdate(orderId, 'Ready', 'Kitchen', tableNumber);
    };

    //  OPTIMIZED: BAR HANDLERS
    const handleBarOrderStart = async (orderId, bartenderName, tableNumber) => {
        const barRoom = getBarRoomFromTable(tableNumber);
        await callOrderAPI(`/api/orders/${orderId}/beverage-start`, { bartenderName });
        
        io.to([barRoom, 'cashier_room', `order_${orderId}`]).emit('beverage_preparation_started', {
            orderId, tableNumber, bartenderName, assignedBar: barRoom, timestamp: new Date()
        });
    };

    const handleBarOrderComplete = async (orderId, bartenderName, tableNumber, completedItems = []) => {
        const barRoom = getBarRoomFromTable(tableNumber);
        await callOrderAPI(`/api/orders/${orderId}/beverage-complete`, { bartenderName, completedItems });
        
        io.to([barRoom, 'cashier_room', `order_${orderId}`, 'waitstaff_room']).emit('beverage_ready', {
            orderId, tableNumber, bartenderName, completedItems, timestamp: new Date()
        });
    };

    //  OPTIMIZED: UTILITY FUNCTIONS
    const getBarRoomFromTable = (tableNumber) => {
        const areaCode = tableNumber?.charAt(0).toUpperCase();
        return areaCode && areaCode <= 'I' ? 'bar_depan' : 'bar_belakang';
    };

    const callOrderAPI = async (endpoint, data) => {
        const response = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`API call failed: ${response.statusText}`);
        return response.json();
    };

    const handleDisconnection = async (socketId) => {
        try {
            const session = await DeviceSession.findOne({ socketId, isActive: true });
            if (session) {
                session.isActive = false;
                session.logoutTime = new Date();
                await session.save();
                await Device.findByIdAndUpdate(session.device, { isOnline: false, socketId: null });
                
                io.to(`outlet_${session.outlet}`).emit('device_offline', {
                    deviceId: session.device, socketId, userName: session.user.name, timestamp: new Date()
                });
            }
            socketManagement.handleDisconnection(socketId);
        } catch (error) {
            console.error('Disconnection handling error:', error);
        }
    };

    return { io };
}