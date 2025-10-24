import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import WebSocket from 'ws';
import { initializeFirebase } from './config/firebase.js';
import { setupStockCalibrationCron } from './jobs/stockCalibration.job.js';
import { startAutoCancelScheduler } from './jobs/orderCheker.job.js';
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
import fcmRoutes from './routes/fcm.routes.js';
import reportRoutes from './routes/report.routes.js';
import historyRoutes from './routes/history.routes.js';
import paymentMethodsRouter from './routes/paymentMethode.js';
import CashierauthRoutes from './routes/cashier.auth.routes.js';
// import tableLayoutRoutes from './routes/tableLayout.routes.js';
import tableRoutes from './routes/table_routes.js';
import notificationRoutes from './routes/notification.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import deviceRoutes from './routes/device.routes.js';
import voucherRoutes from './routes/voucher.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import roleRoutes from './routes/role.route.js';
import LogRoutes from './routes/log.routes.js';
import SidebarRoutes from './routes/sidebar.routes.js';
import AnalyticsRoutes from './routes/analytics.routes.js';
import AssetRoutes from './routes/asset.route.js';
import GroRoutes from './routes/gro.routes.js';
import RefundRoutes from './routes/refund.routes.js';
// import reservationRoutes from './routes/reservation_backup.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import marketListRoutes from './routes/marketlist.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import taxAndServiceRoutes from './routes/taxAndService.routes.js';
import areaRoutes from './routes/areas.routes.js';
import ReceiptSetting from './routes/receiptSetting.routes.js';
import productStockRoutes from './routes/productStock.routes.js';
import DevRoutes from './routes/devRoutes.js';
import LocationRoutes from './routes/location.routes.js';
import EventRoutes from './routes/event.routes.js';
import TicketRoutes from './routes/ticket.routes.js';
import AccountingRoutes from './routes/accounting.routes.js';
import socketHandler from './socket/index.js';
import { midtransWebhook } from './controllers/webhookController.js';
import { fileURLToPath } from "url";
import revisionRoutes from './routes/orderRevision.routes.js';
import { generateWebhookSecret } from './utils/tokenGenerator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
initializeFirebase();
const server = http.createServer(app);

// 🔹 Setup Socket.IO
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
const { broadcastNewOrder } = socketHandler(io);
export { io, broadcastNewOrder };

// 🔹 Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'ngrok-skip-browser-warning',
    'X-Requested-With',
    'Accept'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use("/images", express.static("api/public/images")); // supaya bisa diakses dari browser

// 🔹 Routes
app.use('/api', orderRoutes);
app.use('/api/user', userRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/fcm', fcmRoutes);
app.use('/api/staff', posRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cashierauth', CashierauthRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/paymentlist', paymentMethodsRouter);
app.use('/api/menu', menuRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/promotion', promotionRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/outlet', outletRoutes);
app.use('/api/workstation', posRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/gro', GroRoutes);
// app.use('/api/table-layout', tableLayoutRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/marketlist', marketListRoutes);
app.use('/api/tax-service', taxAndServiceRoutes);
app.use('/api/receipt-setting', ReceiptSetting);
app.use('/api/product', productStockRoutes);
app.use('/api/location', LocationRoutes);
app.use('/api/dev', DevRoutes);
app.use('/api/event', EventRoutes);
app.use('/api/ticket', TicketRoutes);
app.use('/api/accounting', AccountingRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/logs', LogRoutes);
app.use('/api/sidebar', SidebarRoutes);
app.use('/api/analytics', AnalyticsRoutes);
app.use('/api/assets', AssetRoutes);
app.use('/api/refunds', RefundRoutes);
app.use('/api/revision', revisionRoutes);

// 🔹 Static files (frontend build)
app.use(express.static(path.join(__dirname, "../client/dist")));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// 🔹 WebSocket server
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    console.log('Received message from WebSocket client:', message);
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// 🔹 Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

// =====================================================
// 🔹 Start server hanya setelah MongoDB terkoneksi
// =====================================================
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO, {
      serverSelectionTimeoutMS: 10000, // 10 detik max nunggu Atlas
    });
    // await mongoose.connect(process.env.MONGO, {
    //   serverSelectionTimeoutMS: 10000, // 10 detik max nunggu Atlas
    // });
    console.log('✅ Connected to MongoDB');

    setupStockCalibrationCron();
    startAutoCancelScheduler();
    // Jalankan sekali untuk generate secret
    // console.log('Webhook Secret:', generateWebhookSecret());

    server.listen(3000, () => {
      console.log('🚀 Socket.IO + Express server listening on port 3000');
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // stop process kalau gagal connect
  }
};

startServer();
