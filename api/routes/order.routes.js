import express from 'express';
import {
  createOrder,
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
  getOrderId,
  getCashierOrderById,
  getQueuedOrders,
  confirmOrderByCashier,
  testSocket,
  getPendingPaymentOrders,
  getKitchenOrder,
  updateKitchenOrderStatus,
  // chargeCash,
  cashierCharge,
  confirmOrderViaCashier,
  getPaymentStatus,
  createFinalPayment,
  processPaymentCashier,
} from '../controllers/order.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { midtransWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Route untuk membuat order dan pembayaran
router.post('/order', createOrder);

router.post("/unified-order", createUnifiedOrder);
// TODO: Start route untuk melakukan charge from aplication

router.post('/orderApp', createAppOrder);

router.post("/charge", charge);

router.post('/final-payment', createFinalPayment);

router.get("/getPaymentStatus/:orderId", getPaymentStatus);


router.get("/getPayment/:orderId", getPendingPaymentOrders);
// router.post("/chargeCash", chargeCash);

router.post('/midtrans/webhook', midtransWebhook);

// TODO: End route untuk melakukan charge from aplication

router.post("/payment-notification", paymentNotification);

router.get("/pending-orders/:rawOutletId", getPendingOrders);

router.post("/confirm-order/:orderId", confirmOrder);

router.get('/orders', getAllOrders);

// TODO: Start route untuk mendapatkan order yang belum dicetak di dapur

router.get('/orders/kitchen', getKitchenOrder);

router.put('/orders/:orderId/status', updateKitchenOrderStatus);

// TODO: End route untuk mendapatkan order yang belum dicetak di dapur

router.get('/orders/queued', getQueuedOrders);

router.post('/orders/:jobId/confirm', confirmOrderByCashier);

// Route untuk membatalkan order
// router.put('/order/:id/cancel', verifyToken(['customer']), cancelOrder);

// Route untuk mendapatkan daftar order berdasarkan user
router.get('/orders/:userId', getUserOrders);
// router.get('/orders/:userId', verifyToken(['customer']), getUserOrders);

router.get('/orders/history/:userId', getUserOrderHistory);

router.get('/order/:orderId', getOrderById);

router.get('/order-id/:orderId', getOrderId);

router.get('/cashier-order/:orderId', getCashierOrderById);
router.get('/orders/cashier/:cashierId', getCashierOrderHistory);

//test socket
router.get('/testsocket', testSocket);

//cashierCharge
router.post('/cashierCharge', cashierCharge);

router.post('/order/cashier/confirm-order', confirmOrderViaCashier);

router.post('/order/cashier/process-payment', processPaymentCashier);

export default router;
