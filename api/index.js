import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
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
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});


io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (orderId) => {
    socket.join(orderId);
    console.log(`Socket ${socket.id} joined room ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


// Buat io bisa diakses dari controller
app.set('io', io);
app.use(express.static(path.join(__dirname, '/client/dist')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

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

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

