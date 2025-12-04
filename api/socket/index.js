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

                if (!sessionId || !deviceId) {
                    throw new Error('Session ID dan Device ID diperlukan');
                }

                // Validasi session dengan transaction-like approach
                const session = await DeviceSession.findOne({
                    _id: sessionId,
                    device: deviceId,
                    isActive: true
                })
                    .populate('device')
                    .populate('user')
                    .populate('outlet')
                    .populate('role');

                if (!session) {
                    throw new Error('Session tidak valid atau sudah logout');
                }

                // Cek jika device sudah memiliki session aktif dengan socket berbeda
                const existingSocketSession = await DeviceSession.findOne({
                    device: deviceId,
                    isActive: true,
                    socketId: { $exists: true, $ne: '' }
                });

                if (existingSocketSession && existingSocketSession.socketId !== socket.id) {
                    console.warn(`⚠️ Device ${deviceId} sudah memiliki session aktif: ${existingSocketSession.socketId}`);

                    // Force logout session sebelumnya
                    await DeviceSession.findByIdAndUpdate(existingSocketSession._id, {
                        isActive: false,
                        logoutTime: new Date(),
                        logoutReason: 'replaced_by_new_session'
                    });

                    // Emit force logout ke socket sebelumnya
                    if (existingSocketSession.socketId) {
                        io.to(existingSocketSession.socketId).emit('force_logout', {
                            reason: 'Session digantikan oleh login baru',
                            timestamp: new Date()
                        });
                    }
                }

                // Update session & device
                session.socketId = socket.id;
                session.lastActivity = new Date();
                session.loginTime = session.loginTime || new Date(); // Set loginTime jika belum ada
                await session.save();

                await Device.findByIdAndUpdate(deviceId, {
                    socketId: socket.id,
                    isOnline: true,
                    lastActivity: new Date()
                });

                // Register device ke socket management
                const deviceData = {
                    deviceId: session.device.deviceId,
                    outletId: session.outlet._id,
                    role: session.role?.name || session.role,
                    location: session.device.location,
                    deviceName: session.device.deviceName,
                    assignedAreas: session.device.assignedAreas,
                    assignedTables: session.device.assignedTables,
                    orderTypes: session.device.orderTypes,
                    sessionId: session._id
                };

                await socketManagement.registerDevice(socket, deviceData);

                // ✅ ENHANCED AUTO-JOIN ROOMS
                const joinedRooms = await joinRelevantRooms(socket, session);

                console.log(`✅ Device authenticated: ${session.device.deviceName} - ${session.user.name} (${session.role?.name || session.role})`);
                console.log(`📍 Total joined rooms: ${joinedRooms.length}`);

                const response = {
                    success: true,
                    session: {
                        id: session._id,
                        user: session.user,
                        device: session.device,
                        outlet: session.outlet,
                        role: session.role?.name || session.role
                    },
                    device: {
                        deviceName: session.device.deviceName,
                        role: session.role?.name || session.role,
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
                    role: session.role?.name || session.role,
                    socketId: socket.id,
                    assignedAreas: session.device.assignedAreas,
                    sessionId: session._id,
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

        // ✅ SESSION HEARTBEAT
        socket.on('session_heartbeat', async (data, callback) => {
            try {
                const { sessionId, deviceId } = data;

                if (!sessionId || !deviceId) {
                    throw new Error('Session ID dan Device ID diperlukan');
                }

                // Update session last activity
                const session = await DeviceSession.findOneAndUpdate(
                    {
                        _id: sessionId,
                        device: deviceId,
                        isActive: true
                    },
                    {
                        lastActivity: new Date()
                    },
                    { new: true }
                );

                if (!session) {
                    throw new Error('Session tidak ditemukan atau tidak aktif');
                }

                // Update device last activity
                await Device.findByIdAndUpdate(deviceId, {
                    lastActivity: new Date()
                });

                if (typeof callback === 'function') {
                    callback({
                        success: true,
                        lastActivity: session.lastActivity
                    });
                }

            } catch (error) {
                console.error('Session heartbeat error:', error);

                if (typeof callback === 'function') {
                    callback({
                        success: false,
                        error: error.message
                    });
                }
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

        socket.on('validate_session', async (data, callback) => {
            try {
                const { sessionId, deviceId } = data;

                const session = await DeviceSession.findOne({
                    _id: sessionId,
                    device: deviceId,
                    isActive: true
                })
                    .populate('device')
                    .populate('user')
                    .populate('outlet')
                    .populate('role');

                if (!session) {
                    throw new Error('Session tidak valid');
                }

                // Cek jika session expired (lebih dari 8 jam)
                const sessionAge = Date.now() - new Date(session.loginTime).getTime();
                const maxSessionAge = 8 * 60 * 60 * 1000; // 8 jam

                if (sessionAge > maxSessionAge) {
                    // Auto logout session expired
                    await DeviceSession.findByIdAndUpdate(sessionId, {
                        isActive: false,
                        logoutTime: new Date(),
                        logoutReason: 'session_expired'
                    });

                    await Device.findByIdAndUpdate(deviceId, {
                        isOnline: false,
                        socketId: null
                    });

                    throw new Error('Session telah expired');
                }

                const response = {
                    success: true,
                    session: {
                        id: session._id,
                        user: session.user,
                        device: session.device,
                        outlet: session.outlet,
                        role: session.role?.name || session.role,
                        loginTime: session.loginTime,
                        lastActivity: session.lastActivity
                    },
                    isValid: true
                };

                if (typeof callback === 'function') {
                    callback(response);
                }

            } catch (error) {
                console.error('Validate session error:', error);

                if (typeof callback === 'function') {
                    callback({
                        success: false,
                        error: error.message,
                        isValid: false
                    });
                }
            }
        });

        // ✅ MANUAL SESSION LOGOUT
        socket.on('session_logout', async (data, callback) => {
            try {
                const { sessionId, deviceId, reason = 'manual_logout' } = data;

                const session = await DeviceSession.findOne({
                    _id: sessionId,
                    device: deviceId,
                    isActive: true
                });

                if (!session) {
                    throw new Error('Session tidak ditemukan atau sudah logout');
                }

                // Update session
                session.isActive = false;
                session.logoutTime = new Date();
                session.logoutReason = reason;
                await session.save();

                // Update device
                await Device.findByIdAndUpdate(deviceId, {
                    isOnline: false,
                    socketId: null
                });

                // Hapus dari socket management
                socketManagement.handleDisconnection(socket.id);

                // Leave semua rooms
                await leaveAllRooms(socket);

                const response = {
                    success: true,
                    message: 'Session logout berhasil',
                    sessionId: session._id,
                    logoutTime: session.logoutTime
                };

                if (typeof callback === 'function') {
                    callback(response);
                }

                // Disconnect socket
                socket.disconnect();

            } catch (error) {
                console.error('Session logout error:', error);

                if (typeof callback === 'function') {
                    callback({
                        success: false,
                        error: error.message
                    });
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
        // socket.on('new_order_created', async (orderData) => {
        //     try {
        //         console.log('🆕 New order received:', orderData.order_id);

        //         // Gunakan sistem management baru untuk broadcast
        //         await socketManagement.broadcastOrder(orderData);

        //         // Juga broadcast legacy untuk compatibility
        //         broadcastNewOrderLegacy(orderData.outlet?._id || orderData.outlet, orderData);

        //     } catch (error) {
        //         console.error('Error handling new order:', error);
        //     }
        // });

        // socketHandler.js - UPDATE

        socket.on('new_order_created', async (orderData) => {
            try {
                console.log('🆕 New order received:', orderData.order_id);

                // ✅ Use new broadcast system with device filtering
                if (global.socketManagement && global.socketManagement.broadcastOrder) {
                    await global.socketManagement.broadcastOrder(orderData);
                } else {
                    console.warn('⚠️ socketManagement not available, using legacy broadcast');
                    broadcastNewOrderLegacy(orderData.outlet?._id || orderData.outlet, orderData);
                }

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

        // ✅ UPDATE DEVICE ASSIGNMENT (Real-time update)
        socket.on('update_device_assignment', async (data, callback) => {
            try {
                const { deviceId, assignedAreas, assignedTables, orderTypes } = data;

                const updatedDevice = await Device.findOneAndUpdate(
                    { _id: deviceId },
                    {
                        assignedAreas,
                        assignedTables,
                        orderTypes
                    },
                    { new: true }
                );

                if (!updatedDevice) {
                    throw new Error('Device tidak ditemukan');
                }

                // Update in-memory data jika device sedang connected
                for (const [socketId, device] of socketManagement.connectedDevices.entries()) {
                    if (device.deviceId === updatedDevice.deviceId) {
                        device.assignedAreas = assignedAreas;
                        device.assignedTables = assignedTables;
                        device.orderTypes = orderTypes;

                        // Re-join rooms berdasarkan assignment baru
                        const session = await DeviceSession.findOne({
                            device: deviceId,
                            isActive: true,
                            socketId: socketId
                        }).populate('role');

                        if (session) {
                            await joinRelevantRooms(io.sockets.sockets.get(socketId), session);
                        }
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

                // Notify device tentang update assignment
                socket.to(`device_${deviceId}`).emit('device_assignment_updated', {
                    deviceId,
                    assignedAreas,
                    assignedTables,
                    orderTypes,
                    timestamp: new Date()
                });

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
                const { deviceId, reason = 'forced_by_admin' } = data;

                // Cari semua session aktif untuk device
                const activeSessions = await DeviceSession.find({
                    device: deviceId,
                    isActive: true
                }).populate('device').populate('user');

                if (activeSessions.length === 0) {
                    throw new Error('Tidak ada session aktif untuk device ini');
                }

                // Update semua session
                const sessionIds = activeSessions.map(session => session._id);
                await DeviceSession.updateMany(
                    { _id: { $in: sessionIds } },
                    {
                        isActive: false,
                        logoutTime: new Date(),
                        logoutReason: reason
                    }
                );

                // Update device
                await Device.findByIdAndUpdate(deviceId, {
                    isOnline: false,
                    socketId: null
                });

                // Emit force logout ke semua socket terkait
                activeSessions.forEach(session => {
                    if (session.socketId) {
                        io.to(session.socketId).emit('force_logout', {
                            reason: reason,
                            timestamp: new Date(),
                            initiatedBy: 'admin'
                        });

                        // Hapus dari socket management
                        socketManagement.handleDisconnection(session.socketId);
                    }
                });

                const response = {
                    success: true,
                    message: `Device ${activeSessions[0].device.deviceName} berhasil di logout`,
                    data: {
                        deviceName: activeSessions[0].device.deviceName,
                        loggedOutSessions: activeSessions.length,
                        logoutTime: new Date()
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

        // ✅ GET DEVICE SESSION INFO
        socket.on('get_device_session', async (data, callback) => {
            try {
                const { deviceId } = data;

                const sessions = await DeviceSession.find({
                    device: deviceId,
                    isActive: true
                })
                    .populate('user', 'name username email')
                    .populate('role', 'name')
                    .sort({ loginTime: -1 });

                const response = {
                    success: true,
                    sessions: sessions.map(session => ({
                        id: session._id,
                        user: session.user,
                        role: session.role,
                        loginTime: session.loginTime,
                        lastActivity: session.lastActivity,
                        socketId: session.socketId,
                        ipAddress: session.ipAddress
                    })),
                    total: sessions.length
                };

                if (typeof callback === 'function') {
                    callback(response);
                }

            } catch (error) {
                console.error('Get device session error:', error);

                if (typeof callback === 'function') {
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            }
        });

        // Leave room
        socket.on('leave_room', (roomName) => {
            socket.leave(roomName);
            console.log(`Client ${socket.id} left room: ${roomName}`);
        });

        socket.on('device:leaveAll', async (cb) => {
            try {
                await leaveAllRooms(socket);
                cb?.({ ok: true });
            } catch (e) {
                console.error('Leave all rooms error:', e);
                cb?.({ ok: false, error: e?.message });
            }
        });

        socket.on('leave_area_room', (tableCode) => {
            const areaRoom = `area_${tableCode}`;
            const group = getAreaGroup(tableCode);

            socket.leave(areaRoom);
            if (group) {
                socket.leave(group);
            }
            console.log(`Device ${socket.id} left area ${areaRoom} and group ${group}`);
        });

        socket.on('disconnect', async (reason) => {
            console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
            clearInterval(pingInterval);

            try {
                // Cari session berdasarkan socketId
                const sessions = await DeviceSession.find({
                    socketId: socket.id,
                    isActive: true
                });

                if (sessions.length > 0) {
                    for (const session of sessions) {
                        // Update session
                        session.isActive = false;
                        session.logoutTime = new Date();
                        session.logoutReason = `socket_disconnect_${reason}`;
                        await session.save();

                        // Update device - hanya set offline jika tidak ada session aktif lainnya
                        const otherSessions = await DeviceSession.countDocuments({
                            device: session.device,
                            isActive: true,
                            socketId: { $exists: true, $ne: '' }
                        });

                        if (otherSessions === 0) {
                            await Device.findByIdAndUpdate(session.device, {
                                isOnline: false,
                                socketId: null
                            });
                        }

                        console.log(`❌ Device session ended: ${socket.id} - User: ${session.user?.name || 'Unknown'}`);

                        // Broadcast device offline status
                        socket.to(`outlet_${session.outlet}`).emit('device_offline', {
                            deviceId: session.device,
                            socketId: socket.id,
                            userName: session.user?.name || 'Unknown',
                            sessionId: session._id,
                            timestamp: new Date(),
                            reason: reason
                        });
                    }
                }

                // Handle disconnection di socket management
                socketManagement.handleDisconnection(socket.id);

                // Leave semua rooms
                await leaveAllRooms(socket);

            } catch (error) {
                console.error('Disconnection handling error:', error);
            }
        });
    });

    // === Helper Functions ===

    const joinRelevantRooms = async (socket, session) => {
        const joinedRooms = [];
        const roleName = session.role?.name || session.role;

        try {
            // Basic rooms
            const basicRooms = [
                roleName,
                `outlet_${session.outlet._id}`,
                'cashier_room',
                `device_${session.device._id}`,
                `session_${session._id}`
            ];

            basicRooms.forEach(room => {
                socket.join(room);
                joinedRooms.push(room);
            });

            // ✅ AUTO-JOIN AREA ROOMS BERDASARKAN assignedAreas
            if (session.device.assignedAreas && session.device.assignedAreas.length > 0) {
                session.device.assignedAreas.forEach(area => {
                    const areaRoom = `area_${area}`;
                    socket.join(areaRoom);
                    joinedRooms.push(areaRoom);

                    // Join area group
                    const areaGroup = getAreaGroup(area);
                    if (areaGroup) {
                        socket.join(areaGroup);
                        joinedRooms.push(areaGroup);
                    }
                });
            }

            // Role-specific rooms
            if (roleName.includes('bar')) {
                const barType = roleName.includes('depan') ? 'depan' : 'belakang';
                const barRoom = `bar_${barType}`;
                socket.join(barRoom);
                joinedRooms.push(barRoom);
            }

            if (roleName.includes('kitchen')) {
                const kitchenRooms = [
                    'kitchen_room',
                    `kitchen_${session.outlet._id}`
                ];
                kitchenRooms.forEach(room => {
                    socket.join(room);
                    joinedRooms.push(room);
                });
            }

            // Join assigned tables
            if (session.device.assignedTables && session.device.assignedTables.length > 0) {
                session.device.assignedTables.forEach(table => {
                    const tableRoom = `table_${table}`;
                    socket.join(tableRoom);
                    joinedRooms.push(tableRoom);
                });
            }

            console.log(`📍 Device ${session.device.deviceName} joined ${joinedRooms.length} rooms`);
            return joinedRooms;

        } catch (error) {
            console.error('Error joining rooms:', error);
            return joinedRooms;
        }
    };

    // ✅ LEAVE ALL ROOMS FUNCTION
    const leaveAllRooms = async (socket) => {
        try {
            const rooms = Array.from(socket.rooms);

            for (const room of rooms) {
                if (room !== socket.id) {
                    socket.leave(room);
                }
            }

            console.log(`📍 Device ${socket.id} left all rooms`);
        } catch (error) {
            console.error('Error leaving rooms:', error);
        }
    };


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

    // ✅ SESSION CLEANUP TASK (Run periodically)
    const cleanupExpiredSessions = async () => {
        try {
            const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

            const expiredSessions = await DeviceSession.find({
                isActive: true,
                lastActivity: { $lt: eightHoursAgo }
            });

            if (expiredSessions.length > 0) {
                console.log(`🧹 Cleaning up ${expiredSessions.length} expired sessions`);

                const sessionIds = expiredSessions.map(session => session._id);
                const deviceIds = [...new Set(expiredSessions.map(session => session.device))];

                // Update sessions
                await DeviceSession.updateMany(
                    { _id: { $in: sessionIds } },
                    {
                        isActive: false,
                        logoutTime: new Date(),
                        logoutReason: 'auto_cleanup_expired'
                    }
                );

                // Update devices
                for (const deviceId of deviceIds) {
                    const activeSessions = await DeviceSession.countDocuments({
                        device: deviceId,
                        isActive: true
                    });

                    if (activeSessions === 0) {
                        await Device.findByIdAndUpdate(deviceId, {
                            isOnline: false,
                            socketId: null
                        });
                    }
                }

                // Emit cleanup events
                expiredSessions.forEach(session => {
                    if (session.socketId) {
                        io.to(session.socketId).emit('force_logout', {
                            reason: 'Session expired (auto cleanup)',
                            timestamp: new Date()
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Session cleanup error:', error);
        }
    };

    // Run cleanup every hour
    setInterval(cleanupExpiredSessions, 60 * 60 * 1000);


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
        getActiveSessions: async (outletId = null) => {
            try {
                let filter = { isActive: true };
                if (outletId) filter.outlet = outletId;

                return await DeviceSession.find(filter)
                    .populate('device')
                    .populate('user')
                    .populate('outlet')
                    .populate('role')
                    .sort({ loginTime: -1 });
            } catch (error) {
                console.error('Get active sessions error:', error);
                return [];
            }
        },
        io
    };
}