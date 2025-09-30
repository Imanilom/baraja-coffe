// sockets/socketHandler.js
import { socketManagement } from '../utils/socketManagement.js';
import { Device } from '../models/Device.model.js';
import { DeviceSession } from '../models/DeviceSession.model.js';

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

                // Verifikasi session
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

                // Update session dengan socketId
                session.socketId = socket.id;
                await session.save();

                // Update device dengan socketId dan status online
                await Device.findByIdAndUpdate(deviceId, {
                    socketId: socket.id,
                    isOnline: true
                });

                // Register device ke socket management system
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

                // Join rooms berdasarkan role dan area
                socket.join(session.role);
                
                if (session.device.assignedAreas && session.device.assignedAreas.length > 0) {
                    session.device.assignedAreas.forEach(area => {
                        socket.join(`area_${area}`);
                    });
                }

                // Join outlet room
                socket.join(`outlet_${session.outlet._id}`);

                // Join legacy rooms untuk compatibility
                socket.join('cashier_room');
                if (session.role.includes('bar')) {
                    socket.join(`bar_${session.role}`);
                }

                console.log(`✅ Device authenticated: ${session.device.deviceName} - ${session.user.name} (${session.role}) - Socket: ${socket.id}`);

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
        socket.on('join_area_room', (areaCode, callback) => {
            const areaRoom = `area_${areaCode.toUpperCase()}`;
            socket.join(areaRoom);
            console.log(`Client ${socket.id} joined area room: ${areaRoom}`);

            if (typeof callback === 'function') {
                callback({ status: 'joined', room: areaRoom });
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

        // ✅ BEVERAGE ORDER HANDLERS
        socket.on('bar_order_start', (data) => {
            const { orderId, tableNumber, bartenderName, items } = data;
            
            // Determine which bar should handle based on table number
            const areaCode = getAreaCodeFromTable(tableNumber);
            const barRoom = areaCode <= 'I' ? 'bar_depan' : 'bar_belakang';
            
            socket.to(barRoom).emit('beverage_order_received', {
                orderId,
                tableNumber,
                bartenderName,
                items,
                assignedBar: barRoom,
                timestamp: new Date()
            });

            console.log(`Beverage order sent to ${barRoom} for table ${tableNumber}`);
        });

        socket.on('bar_order_complete', (data) => {
            const { orderId, tableNumber, bartenderName } = data;
            
            // Notify cashier and customer
            socket.to(`order_${orderId}`).emit('beverage_ready', {
                orderId,
                tableNumber,
                message: 'Beverages are ready',
                preparedBy: bartenderName,
                timestamp: new Date()
            });

            socket.to('cashier_room').emit('beverage_order_completed', {
                orderId,
                tableNumber,
                bartenderName,
                timestamp: new Date()
            });

            console.log(`Beverage order completed for table ${tableNumber}`);
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