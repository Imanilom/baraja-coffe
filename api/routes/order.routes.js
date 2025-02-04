import express from 'express';
import {
  cancelOrder,
  createOrderAndPayment,
  handleMidtransNotification,
  getUserOrders
} from '../controllers/order.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Route untuk membuat order dan pembayaran
router.post('/order', verifyToken(['customer']), createOrderAndPayment);

// Route untuk membatalkan order
router.put('/order/:id/cancel', verifyToken(['customer']), cancelOrder);

// Route untuk menangani notifikasi Midtrans
router.post('/midtrans/notification', handleMidtransNotification);

// Route untuk mendapatkan daftar order berdasarkan user
router.get('/orders/:userId', verifyToken(['customer']),  getUserOrders);

export default router;
