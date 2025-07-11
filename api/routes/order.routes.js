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
  charge,
  createAppOrder,
  createUnifiedOrder,
  getOrderById,
  getQueuedOrders,
  confirmOrderByCashier,
  testSocket,
  getPendingPaymentOrders,
  getKitchenOrder,
  // chargeCash,
} from '../controllers/order.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { midtransWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Route untuk membuat order dan pembayaran
router.post('/order', createOrder);


router.post("/checkout", checkout);

router.post("/unified-order", createUnifiedOrder);
// TODO: Start route untuk melakukan charge from aplication

router.post('/orderApp', createAppOrder);

router.post("/charge", charge);

router.get("/getPayment/:orderId", getPendingPaymentOrders);
// router.post("/chargeCash", chargeCash);

router.post('/midtrans/webhook', midtransWebhook);

// TODO: End route untuk melakukan charge from aplication

router.post("/payment-notification", paymentNotification);

router.get("/pending-orders/:rawOutletId", getPendingOrders);

router.post("/confirm-order/:orderId", confirmOrder);

router.get('/orders', getAllOrders);

router.get('/orders/kitchen', getKitchenOrder);

router.get('/orders/queued', getQueuedOrders);

router.post('/orders/:jobId/confirm', confirmOrderByCashier);

// Route untuk membatalkan order
// router.put('/order/:id/cancel', verifyToken(['customer']), cancelOrder);

// Route untuk mendapatkan daftar order berdasarkan user
router.get('/orders/:userId', getUserOrders);
// router.get('/orders/:userId', verifyToken(['customer']), getUserOrders);

router.get('/orders/history/:userId', getUserOrderHistory);

router.get('/order/:orderId', getOrderById);
router.get('/orders/cashier/:cashierId', getCashierOrderHistory);

//test socket
router.get('/testsocket', testSocket);

export default router;
