// Updated Socket.io server configuration in index.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
// Routes imports...

// Route
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import orderRoutes from './routes/order.routes.js';
import menuRoutes from './routes/menu.routes.js';
import promotionRoutes from './routes/promotion.rotues.js';
import storageRoutes from './routes/storage.routes.js';
import contentRoutes from './routes/content.routes.js';
import OutletRoutes from './routes/outlet.routes.js';
import posRoutes from './routes/pos.routes.js';
import reportRoutes from './routes/report.routes.js';
import historyRoutes from './routes/history.routes.js';
import paymentMethodsRouter from './routes/paymentMethode.js';

dotenv.config();

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });

const __dirname = path.resolve();
const app = express();
const server = http.createServer(app);

// Improved Socket.io configuration with proper CORS
const io = new Server(server, {
  cors: {
    origin: "*", // You might want to restrict this in production
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  },
  pingTimeout: 60000, // Increase timeout to 60 seconds
  pingInterval: 25000, // Send ping every 25 seconds
  transports: ['websocket', 'polling'] // Explicitly define transports
});

// Export io for use in other files
export { io };

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Debug ping (keep for debugging)
  setInterval(() => {
    io.emit('ping', { message: 'Ping from server', timestamp: new Date().toISOString() });
    console.log('Sent ping to all clients');
  }, 10000);

  // Log all rooms for debugging
  console.log('Current rooms on connect:', io.sockets.adapter.rooms);

  // Handle room joining with acknowledgement
  socket.on('join_order_room', (orderId, callback) => {
    console.log(`Client ${socket.id} joining room for order: ${orderId}`);
    socket.join(orderId);

    // Send acknowledgement back to client
    if (typeof callback === 'function') {
      callback({ status: 'joined', room: orderId });
    }

    // Emit a test message to verify room joining
    socket.to(orderId).emit('room_joined', { message: `You joined room ${orderId}` });

    // Log rooms after joining
    console.log('Rooms after joining:', io.sockets.adapter.rooms);
    console.log(`Does room ${orderId} exist?`, io.sockets.adapter.rooms.has(orderId));
  });

  // Handle explicit disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware and routes setup...
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

// Route definitions...
app.use('/api/user', userRoutes);
app.use('/api/staff', posRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', orderRoutes);
app.use('/api/paymentlist', paymentMethodsRouter);
app.use('/api/menu', menuRoutes);
app.use('/api/promotion', promotionRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/outlet', OutletRoutes);
app.use('/api/workstation', posRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/history', historyRoutes);

// Start server
server.listen(3000, () => {
  console.log('Socket.IO + Express server listening on port 3000');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});