export default function socketHandler(io) {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Optional: Send ping every 30 seconds instead of 10 (reduce network traffic)
        const pingInterval = setInterval(() => {
            socket.emit('ping', {
                message: 'Keep alive',
                timestamp: new Date().toISOString()
            });
        }, 30000);

        // Join room for specific order (for customer app)
        socket.on('join_order_room', (orderId, callback) => {
            console.log(`Client ${socket.id} joining order room: ${orderId}`);
            socket.join(`order_${orderId}`);

            if (typeof callback === 'function') {
                callback({ status: 'joined', room: `order_${orderId}` });
            }
            console.log(`Client joined room: order_${orderId}`);
        });

        // Join cashier room (for cashier app)
        socket.on('join_cashier_room', (callback) => {
            console.log(`Client ${socket.id} joining cashier room`);
            socket.join('cashier_room');

            if (typeof callback === 'function') {
                callback({ status: 'joined', room: 'cashier_room' });
            }
            console.log('Client joined cashier room');
        });

        // Leave specific room
        socket.on('leave_room', (roomName) => {
            socket.leave(roomName);
            console.log(`Client ${socket.id} left room: ${roomName}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            clearInterval(pingInterval);
        });
    });
}