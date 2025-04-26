import express from 'express';
import {
  createOrder,
  checkout,
  paymentNotification,
  confirmOrder,
  getPendingOrders,
  getAllOrders,
  getUserOrders,
  getUserOrderHistory,
  getCashierOrderHistory,
} from '../controllers/order.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Route untuk membuat order dan pembayaran
router.post('/order', createOrder);

router.post("/checkout", checkout);

router.post("/payment-notification", paymentNotification);

router.get("/pending-orders", getPendingOrders);

router.post("/confirm-order", confirmOrder);

router.get('/orders',  getAllOrders);

// Route untuk membatalkan order
// router.put('/order/:id/cancel', verifyToken(['customer']), cancelOrder);

// Route untuk mendapatkan daftar order berdasarkan user
router.get('/orders/:userId', verifyToken(['customer']), getUserOrders);

router.get('/orders/history/:userId', getUserOrderHistory);
router.get('/orders/cashier/:cashierId', getCashierOrderHistory);

export default router;
