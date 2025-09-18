export default function socketHandler(io) {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Ping to keep connection alive
        const pingInterval = setInterval(() => {
            socket.emit('ping', {
                message: 'Keep alive',
                timestamp: new Date().toISOString()
            });
        }, 30000);

        // 🔹 Join room for specific order (pakai orderId)
        socket.on('join_order_room', (orderId, callback) => {
            console.log(`Client ${socket.id} joining order room: order_${orderId}`);
            socket.join(`order_${orderId}`);

            if (typeof callback === 'function') {
                callback({ status: 'joined', room: `order_${orderId}` });
            }
            console.log(`Client joined room: order_${orderId}`);
        });

        // 🔹 Join cashier room
        socket.on('join_cashier_room', (payload, callback) => {
            console.log(`Client ${socket.id} joining cashier room`);
            socket.join('cashier_room');

            // Join outlet-specific room kalau ada outletId
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

            if (typeof callback === 'function') {
                callback({ status: 'joined', room: kitchenRoom });
            }
            console.log(`Kitchen client joined room: ${kitchenRoom}`);
        });

        // 🔹 Handle order status updates dari kasir
        socket.on('update_order_status', (data) => {
            const { orderId, status, cashierId, cashierName } = data;

            // Broadcast ke customer app
            socket.to(`order_${orderId}`).emit('order_status_update', {
                order_id: orderId,
                status,
                cashier: { id: cashierId, name: cashierName },
                timestamp: new Date()
            });

            // Broadcast ke kasir lain
            socket.to('cashier_room').emit('order_updated', {
                orderId,
                status,
                updatedBy: { id: cashierId, name: cashierName },
                timestamp: new Date()
            });

            console.log(`Order status updated: ${orderId} -> ${status}`);
        });

        // 🔹 Handle kitchen order completion
        socket.on('kitchen_order_complete', (data) => {
            const { orderId, completedItems } = data;

            // Notify cashier
            socket.to('cashier_room').emit('kitchen_update', {
                orderId,
                completedItems,
                status: 'ready_for_serving',
                timestamp: new Date()
            });

            // Notify customer
            socket.to(`order_${orderId}`).emit('order_status_update', {
                order_id: orderId,
                status: 'Ready',
                timestamp: new Date()
            });

            console.log(`Kitchen completed order: ${orderId}`);
        });

        // 🔹 Leave specific room
        socket.on('leave_room', (roomName) => {
            socket.leave(roomName);
            console.log(`Client ${socket.id} left room: ${roomName}`);
        });

        // 🔹 Disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            clearInterval(pingInterval);
        });
    });

    // ==============================
    // ✅ Helper functions (pakai orderId)
    // ==============================

    // Broadcast new orders ke kasir
    const broadcastNewOrder = (outletId, orderData) => {
        const roomName = `cashiers_${outletId}`;
        io.to(roomName).emit('new_order', {
            event: 'new_order',
            data: orderData,
            timestamp: new Date()
        });

        // Juga ke general cashier room
        io.to('cashier_room').emit('new_order', {
            event: 'new_order',
            data: orderData,
            timestamp: new Date()
        });

        console.log(`Broadcast new order to rooms: ${roomName}, cashier_room`);
    };

    // Broadcast order status change
    const broadcastOrderStatusChange = (orderId, statusData) => {
        // To customer
        io.to(`order_${orderId}`).emit('order_status_update', {
            order_id: orderId,
            ...statusData,
            timestamp: new Date()
        });

        // To cashier
        io.to('cashier_room').emit('order_status_changed', {
            orderId,
            ...statusData,
            timestamp: new Date()
        });

        console.log(`Broadcast status change for order: ${orderId}`);
    };

    // Broadcast payment updates
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
        io // return io instance kalau butuh langsung
    };
}
