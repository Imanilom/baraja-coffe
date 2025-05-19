import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import amqp from 'amqp';
import WebSocket from 'ws';
// Routes imports...
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import orderRoutes from './routes/order.routes.js';
import menuRoutes from './routes/menu.routes.js';
import promotionRoutes from './routes/promotion.routes.js'; 
import storageRoutes from './routes/storage.routes.js';
import contentRoutes from './routes/content.routes.js';
import outletRoutes from './routes/outlet.routes.js'; 
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

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

export { io };

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Debug ping (keep for debugging)
  setInterval(() => {
    io.emit('ping', { message: 'Ping from server', timestamp: new Date().toISOString() });
    console.log('Sent ping to all clients');
  }, 10000);

  // Handle room joining with acknowledgement
  socket.on('join_order_room', (orderId, callback) => {
    console.log(`Client ${socket.id} joining room for order: ${orderId}`);
    socket.join(orderId);

    // Send acknowledgement back to client
    if (typeof callback === 'function') {
      callback({ status: 'joined', room: orderId });
    }

    // Emit a message to verify room joining
    socket.to(orderId).emit('room_joined', { message: `You joined room ${orderId}` });

    // Log rooms after joining
    console.log('Rooms after joining:', io.sockets.adapter.rooms);
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
app.use('/api/outlet', outletRoutes);
app.use('/api/workstation', posRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/history', historyRoutes);

// Start server
server.listen(3000, () => {
  console.log('Socket.IO + Express server listening on port 3000');
});

// Create a connection to RabbitMQ
const connection = amqp.createConnection({ host: 'dev.rabbitmq.com' });

// Local references to the exchange, queue, and consumer tag
let _exchange = null;
let _queue = null;
let _consumerTag = null;

// Report connection errors
connection.on('error', (err) => {
    console.error('Connection error', err);
});

// Update the stored tag when it changes
connection.on('tag.change', (event) => {
    if (_consumerTag === event.oldConsumerTag) {
        _consumerTag = event.consumerTag;
        // Unsubscribe from the old tag just in case it lingers
        _queue.unsubscribe(event.oldConsumerTag);
    }
});

// Initialize the exchange, queue, and subscription
connection.on('ready', () => {
    // Create or get the exchange
    connection.exchange('exchange-name', (exchange) => {
        _exchange = exchange;

        // Create or get the queue
        connection.queue('queue-name', (queue) => {
            _queue = queue;

            // Bind the queue to the exchange
            queue.bind('exchange-name', 'routing-key');

            // Subscribe to the queue
            queue.subscribe((message) => {
                // Handle the incoming message
                console.log('Got message:', message);
                queue.shift(false, false); // Acknowledge the message
            }).addCallback((res) => {
                // Hold on to the consumer tag for future unsubscribing
                _consumerTag = res.consumerTag;
            });
        });
    });
});

// Unsubscribe or shutdown after a certain timeout (1 minute in this case)
setTimeout(() => {
    if (_queue) {
        _queue.unsubscribe(_consumerTag).addCallback(() => {
            console.log('Unsubscribed from the queue');
        });
    } else {
        console.log('No queue to unsubscribe from');
    }
}, 60000);

// WebSocket server setup
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  // Handle incoming messages from WebSocket clients
  ws.on('message', (message) => {
    console.log('Received message from WebSocket client:', message);
    // Handle the message as needed
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
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