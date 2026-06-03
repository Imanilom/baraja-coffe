export default function socketHandler(io) {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Ping to keep connection alive
        // Ping to keep connection alive
        const pingInterval = setInterval(() => {
            socket.emit('ping', {
                message: 'Keep alive',
                timestamp: new Date().toISOString()
            });
        }, 30000);

        // 🔹 Join room for specific order (pakai orderId)
        socket.on('join_order_room', (orderId, callback) => {
            const roomName = `order_${orderId}`;
            socket.join(roomName);
            console.log(`Client ${socket.id} joined room: ${roomName}`);

            if (typeof callback === 'function') {
                callback({ status: 'joined', room: roomName });
            }
        });

        // 🔹 Join cashier room
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

        // === CASHIER HANDLERS ===
        socket.on('update_order_status', (data) => {
            const { orderId, status, cashierId, cashierName } = data;

            // Notify customer
            socket.to(`order_${orderId}`).emit('order_status_update', {
                order_id: orderId,
                status,
                cashier: { id: cashierId, name: cashierName },
                timestamp: new Date()
            });

            // Notify other cashiers
            socket.to('cashier_room').emit('order_updated', {
                orderId,
                status,
                updatedBy: { id: cashierId, name: cashierName },
                timestamp: new Date()
            });

            console.log(`Order status updated by cashier: ${orderId} -> ${status}`);
        });

        // === KITCHEN HANDLERS ===

        // Kitchen confirms order (mulai masak)
        socket.on('kitchen_confirm_order', (data) => {
            const { orderId, kitchenId, kitchenName, status } = data;

            const updateData = {
                orderId,
                orderStatus: status || 'Cooking',
                kitchen: { id: kitchenId, name: kitchenName },
                message: 'Your order is being prepared by kitchen',
                timestamp: new Date()
            };

            // Notify customer
            socket.to(`order_${orderId}`).emit('order_status_update', updateData);

            // Notify cashier
            socket.to('cashier_room').emit('kitchen_order_confirmed', updateData);

            // Notify kitchen room (broadcast antar dapur)
            socket.to('kitchen_room').emit('kitchen_order_confirmed', updateData);

            console.log(`Kitchen confirmed order: ${orderId} -> ${updateData.orderStatus}`);
        });

        // Kitchen completes order (makanan siap)
        socket.on('kitchen_order_complete', (data) => {
            const { orderId, completedItems } = data;

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

            console.log(`Kitchen completed order: ${orderId}`);
        });

        // Leave room
        socket.on('leave_room', (roomName) => {
            socket.leave(roomName);
            console.log(`Client ${socket.id} left room: ${roomName}`);
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            clearInterval(pingInterval);
        });
    });

    // === Helper Functions ===
    const broadcastNewOrder = (outletId, orderData) => {
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

        console.log(`Broadcast new order to rooms: ${roomName}, cashier_room`);
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

    return {
        broadcastNewOrder,
        broadcastOrderStatusChange,
        broadcastPaymentUpdate,
        io
    };
}

