// socket.js
import { Server } from 'socket.io';

let io;

// Initialize Socket.IO
export const initializeSocketIO = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*', // Replace with your frontend origin in production
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected');

        // You can add more socket event handlers here

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    return io;
};

// Get Socket.IO instance
export const getIo = () => {
    if (!io) {
        console.warn('Socket.IO has not been initialized yet.');
        return null;
    }
    return io;
};