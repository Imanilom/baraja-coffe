import express from 'express';
import {
  createOrder,
  handleMidtransNotification,
  getUserOrders,
  getUserOrderHistory,
  getCashierOrderHistory,
} from '../controllers/order.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Route untuk membuat order dan pembayaran
router.post('/order', createOrder);
// router.get('/order-all', getOrderAll);


// Route untuk membatalkan order
// router.put('/order/:id/cancel', verifyToken(['customer']), cancelOrder);

// Route untuk menangani notifikasi Midtrans
router.post('/midtrans/notification', handleMidtransNotification);

// Route untuk mendapatkan daftar order berdasarkan user
router.get('/orders/:userId', verifyToken(['customer']), getUserOrders);

router.get('/orders/history/:userId', getUserOrderHistory);
router.get('/orders/cashier/:cashierId', getCashierOrderHistory);

export default router;
