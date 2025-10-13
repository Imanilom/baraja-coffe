// sockets/socketHandler.js
import { socketManagement } from '../utils/socketManagement.js';
import { Device } from '../models/Device.model.js';
import { DeviceSession } from '../models/DeviceSession.model.js';
import { getAreaGroup } from '../utils/areaGrouping.js';

import dotenv from 'dotenv';

dotenv.config();

export default function socketHandler(io) {
    // Set global io instance untuk socketManagement
    global.io = io;

    io.on('connection', (socket) => {
        console.log('🔌 Client connected:', socket.id);

        // Ping to keep connection alive
        const pingInterval = setInterval(() => {
            socket.emit('ping', {
                message: 'Keep alive',
                timestamp: new Date().toISOString()
            });
        }, 30000);

        // ✅ DEVICE AUTHENTICATION WITH SESSION MANAGEMENT
        socket.on('device_authenticate_session', async (data, callback) => {
            try {
                const { sessionId, deviceId } = data;

                console.log(`🔐 Device session authentication: ${sessionId}, Device: ${deviceId}`);

                const session = await DeviceSession.findOne({
                    _id: sessionId,
                    device: deviceId,
                    isActive: true
                })
                .populate('device')
                .populate('user')
                .populate('outlet');

                if (!session) {
                    throw new Error('Session tidak valid atau sudah logout');
                }

                // Update session & device
                session.socketId = socket.id;
                await session.save();
                await Device.findByIdAndUpdate(deviceId, {
                    socketId: socket.id,
                    isOnline: true
                });

                // Register device
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

                // ✅ ✅ ✅ PERBAIKAN: AUTO-JOIN AREAS YANG BENAR
                const joinedRooms = [];

                // Basic rooms
                socket.join(session.role);
                joinedRooms.push(session.role);
                
                socket.join(`outlet_${session.outlet._id}`);
                joinedRooms.push(`outlet_${session.outlet._id}`);

                socket.join('cashier_room');
                joinedRooms.push('cashier_room');

                // ✅ AUTO-JOIN AREA ROOMS BERDASARKAN assignedAreas
                if (session.device.assignedAreas && session.device.assignedAreas.length > 0) {
                    session.device.assignedAreas.forEach(area => {
                        const areaRoom = `area_${area}`;
                        socket.join(areaRoom);
                        joinedRooms.push(areaRoom);
                        console.log(`📍 Device ${session.device.deviceName} joined area room: ${areaRoom}`);
                        
                        // Join area group
                        const areaGroup = getAreaGroup(area);
                        if (areaGroup) {
                            socket.join(areaGroup);
                            joinedRooms.push(areaGroup);
                            console.log(`📍 Device ${session.device.deviceName} joined area group: ${areaGroup}`);
                        }
                    });
                }

                // Role-specific rooms
                if (session.role.includes('bar')) {
                    const barType = session.role.includes('depan') ? 'depan' : 'belakang';
                    socket.join(`bar_${barType}`);
                    joinedRooms.push(`bar_${barType}`);
                    console.log(`🍹 Joined bar room: bar_${barType}`);
                }

                if (session.role.includes('kitchen')) {
                    socket.join('kitchen_room');
                    socket.join(`kitchen_${session.outlet._id}`);
                    joinedRooms.push('kitchen_room', `kitchen_${session.outlet._id}`);
                    console.log(`👨‍🍳 Joined kitchen rooms`);
                }

                console.log(`✅ Device authenticated: ${session.device.deviceName} - ${session.user.name} (${session.role})`);
                console.log(`📍 Total joined rooms: ${joinedRooms.length}`);

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
                    joinedRooms: joinedRooms,
                    message: 'Device authenticated successfully'
                };

                if (typeof callback === 'function') {
                    callback(response);
                }

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
                
                const response = {
                    success: false,
                    error: error.message
                };

                if (typeof callback === 'function') {
                    callback(response);
                }
                
                socket.disconnect();
            }
        });

        // ✅ LEGACY DEVICE AUTHENTICATION (for backward compatibility)
        socket.on('device_authenticate', async (data, callback) => {
            try {
                const { deviceId, outletId, role, location, deviceName } = data;

                console.log(`🔐 Legacy device authentication: ${deviceId}, Role: ${role}`);

                const device = await socketManagement.registerDevice(socket, {
                    deviceId,
                    outletId,
                    role,
                    location,
                    deviceName
                });

                // Join rooms berdasarkan role
                if (role.includes('bar')) {
                    const barType = role.includes('depan') ? 'depan' : 'belakang';
                    socket.join(`bar_${barType}`);
                    console.log(`✅ Joined bar room: bar_${barType}`);
                } else if (role.includes('kitchen')) {
                    socket.join('kitchen_room');
                    socket.join(`kitchen_${outletId}`);
                }

                socket.join('cashier_room');
                socket.join(`outlet_${outletId}`);

                const response = {
                    success: true,
                    device: {
                        deviceName: device.deviceName,
                        role: device.role,
                        assignedAreas: device.assignedAreas,
                        assignedTables: device.assignedTables,
                        orderTypes: device.orderTypes,
                        location: device.location
                    },
                    message: 'Device authenticated successfully'
                };

                if (typeof callback === 'function') {
                    callback(response);
                }

                // Broadcast device status update
                socket.to('system_monitor').emit('device_connected', {
                    deviceId: device.deviceId,
                    deviceName: device.deviceName,
                    role: device.role,
                    location: device.location,
                    timestamp: new Date()
                });

            } catch (error) {
                console.error('Device authentication failed:', error);

                const response = {
                    success: false,
                    error: error.message
                };

                if (typeof callback === 'function') {
                    callback(response);
                }
            }
        });

        // 🔹 Join room for specific order
        socket.on('join_order_room', (orderId, callback) => {
            const roomName = `order_${orderId}`;
            socket.join(roomName);
            console.log(`Client ${socket.id} joined room: ${roomName}`);

            if (typeof callback === 'function') {
                callback({ status: 'joined', room: roomName });
            }
        });

        // 🔹 Join cashier room (LEGACY - for backward compatibility)
        socket.on('join_cashier_room', (payload, callback) => {
            socket.join('cashier_room');
            console.log(`Client ${socket.id} joined cashier_room`);

            if (payload && payload.outletId) {
                const outletRoom = `cashiers_${payload.outletId}`;
                socket.join(outletRoom);
                console.log(`Cashier also joined outlet room: ${outletRoom}`);
            }

            if (typeof callback === 'function') {
                callback({
                    status: 'joined',
                    rooms: payload?.outletId ? ['cashier_room', `cashiers_${payload.outletId}`] : ['cashier_room']
                });
            }
        });

        // 🔹 Join kitchen room
        socket.on('join_kitchen_room', (outletId, callback) => {
            const kitchenRoom = outletId ? `kitchen_${outletId}` : 'kitchen_room';
            socket.join(kitchenRoom);
            console.log(`Client ${socket.id} joined kitchen room: ${kitchenRoom}`);

            if (typeof callback === 'function') {
                callback({ status: 'joined', room: kitchenRoom });
            }
        });

        // ✅ JOIN SPECIFIC AREA ROOM
        socket.on('join_area', (tableCode) => {
            const areaRoom = `area_${tableCode}`;
            socket.join(areaRoom);

            const group = getAreaGroup(tableCode);
            if (group) {
                socket.join(group);
                console.log(`Device ${socket.id} joined area ${areaRoom} and group ${group}`);
            } else {
                console.log(`Device ${socket.id} joined area ${areaRoom} (no group found)`);
            }
        });


        // ✅ JOIN BAR ROOM
        socket.on('join_bar_room', (barType, callback) => {
            const barRoom = `bar_${barType}`; // bar_depan, bar_belakang
            socket.join(barRoom);
            console.log(`Client ${socket.id} joined bar room: ${barRoom}`);

            if (typeof callback === 'function') {
                callback({ status: 'joined', room: barRoom });
            }
        });

        // ✅ NEW ORDER WITH AREA CLASSIFICATION
        socket.on('new_order_created', async (orderData) => {
            try {
                console.log('🆕 New order received:', orderData.order_id);

                // Gunakan sistem management baru untuk broadcast
                await socketManagement.broadcastOrder(orderData);

                // Juga broadcast legacy untuk compatibility
                broadcastNewOrderLegacy(orderData.outlet?._id || orderData.outlet, orderData);

            } catch (error) {
                console.error('Error handling new order:', error);
            }
        });

        // === CASHIER HANDLERS ===
        socket.on('update_order_status', (data) => {
            const { orderId, status, cashierId, cashierName, tableNumber } = data;

            // Notify customer
            socket.to(`order_${orderId}`).emit('order_status_update', {
                order_id: orderId,
                status,
                cashier: { id: cashierId, name: cashierName },
                timestamp: new Date()
            });

            // Notify other cashiers (legacy)
            socket.to('cashier_room').emit('order_updated', {
                orderId,
                status,
                updatedBy: { id: cashierId, name: cashierName },
                timestamp: new Date()
            });

            // ✅ Notify area-specific rooms
            if (tableNumber) {
                notifyAreaSpecificUpdate(orderId, status, cashierName, tableNumber);
            }

            console.log(`Order status updated by cashier: ${orderId} -> ${status}`);
        });

        // === KITCHEN HANDLERS ===
        socket.on('kitchen_confirm_order', (data) => {
            const { orderId, kitchenId, kitchenName, status, tableNumber } = data;

            const updateData = {
                orderId,
                orderStatus: status || 'Cooking',
                kitchen: { id: kitchenId, name: kitchenName },
                message: 'Your order is being prepared by kitchen',
                timestamp: new Date()
            };

            // Notify customer
            socket.to(`order_${orderId}`).emit('order_status_update', updateData);

            // Notify cashier (legacy)
            socket.to('cashier_room').emit('kitchen_order_confirmed', updateData);

            // Notify kitchen room
            socket.to('kitchen_room').emit('kitchen_order_confirmed', updateData);

            // ✅ Notify area-specific
            if (tableNumber) {
                notifyAreaSpecificUpdate(orderId, 'Cooking', kitchenName, tableNumber);
            }

            console.log(`Kitchen confirmed order: ${orderId} -> ${updateData.orderStatus}`);
        });

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
            }
        });

        // ✅ FORCE LOGOUT FROM DEVICE
        socket.on('force_logout_device', async (data, callback) => {
            try {
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
            }
        });

        // Leave room
        socket.on('leave_room', (roomName) => {
            socket.leave(roomName);
            console.log(`Client ${socket.id} left room: ${roomName}`);
        });

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
        socket.on('disconnect', async () => {
            console.log('❌ Client disconnected:', socket.id);
            clearInterval(pingInterval);

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
        });
    });

    // === Helper Functions ===

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
            });
        }
    };

    // ✅ GET AREA CODE FROM TABLE NUMBER
    const getAreaCodeFromTable = (tableNumber) => {
        if (!tableNumber) return null;

        // Extract first character from table number (e.g., "A1" -> "A")
        const firstChar = tableNumber.charAt(0).toUpperCase();
        return firstChar;
    };

    // ✅ LEGACY BROADCAST (for backward compatibility)
    const broadcastNewOrderLegacy = (outletId, orderData) => {
        const roomName = `cashiers_${outletId}`;
        io.to(roomName).emit('new_order', {
            event: 'new_order',
            data: orderData,
            timestamp: new Date()
        });

        io.to('cashier_room').emit('new_order', {
            event: 'new_order',
            data: orderData,
            timestamp: new Date()
        });

        console.log(`Legacy broadcast new order to rooms: ${roomName}, cashier_room`);
    };

    const broadcastOrderStatusChange = (orderId, statusData) => {
        io.to(`order_${orderId}`).emit('order_status_update', {
            order_id: orderId,
            ...statusData,
            timestamp: new Date()
        });

        io.to('cashier_room').emit('order_status_changed', {
            orderId,
            ...statusData,
            timestamp: new Date()
        });

        console.log(`Broadcast status change for order: ${orderId}`);
    };

    const broadcastPaymentUpdate = (orderId, paymentData) => {
        io.to(`order_${orderId}`).emit('payment_status_update', {
            order_id: orderId,
            ...paymentData,
            timestamp: new Date()
        });

        console.log(`Broadcast payment update for order: ${orderId}`);
    };

    // ✅ NEW BROADCAST FUNCTION WITH AREA CLASSIFICATION
    const broadcastOrderWithClassification = async (orderData) => {
        return await socketManagement.broadcastOrder(orderData);
    };

    // ✅ GET ACTIVE SESSIONS
    const getActiveSessions = async (outletId = null) => {
        try {
            let filter = { isActive: true };
            if (outletId) filter.outlet = outletId;

            const sessions = await DeviceSession.find(filter)
                .populate('device')
                .populate('user')
                .populate('outlet')
                .sort({ loginTime: -1 });

            return sessions;
        } catch (error) {
            console.error('Get active sessions error:', error);
            return [];
        }
    };

    return {
        broadcastNewOrder: broadcastNewOrderLegacy,
        broadcastOrderStatusChange,
        broadcastPaymentUpdate,
        broadcastOrderWithClassification,
        getActiveSessions,
        io
    };
}