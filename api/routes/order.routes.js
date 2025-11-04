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
  // chargeCash,
  cashierCharge,
  confirmOrderViaCashier,
  getPaymentStatus,
  createFinalPayment,
  processPaymentCashier,
  deleteOrderItemAtOrder,
  getOrderByIdAfterItemDelete,
  patchEditOrder,
} from '../controllers/order.controller.js';

import {
  completeBeverageOrder,
  getAllBeverageOrders,
  getBarOrder,
  getKitchenOrder,
  bulkUpdateKitchenItems,
  updateKitchenItemStatus,
  startBeverageOrder,
  updateBarOrderStatus,
  updateBeverageItemStatus,
  updateKitchenOrderStatus,
  getPrintStats,
  getOrderPrintHistory,
  logPrintAttempt,
  logPrintSuccess,
  logPrintFailure,
  logSkippedItem,
  logProblematicItem,
  getProblematicPrintReport
} from '../controllers/operation.controller.js';

import {
  getActiveOrders,
  getAvailableTables,
  transferOrderTable,
  getOrderTableHistory,
  getTableOccupancyStatus,
  bulkUpdateTableStatus
} from '../controllers/gro.controller.js';

import { verifyToken } from '../utils/verifyUser.js';
import { midtransWebhook } from '../controllers/webhookController.js';
import { chargeWithLocking, createAppOrderWithLocking } from '../controllers/testapporder.controller.js';

const router = express.Router();

// Route untuk membuat order dan pembayaran
router.post('/order', createOrder);

router.post("/unified-order", createUnifiedOrder);
// TODO: Start route untuk melakukan charge from aplication

router.post('/orderApp', createAppOrderWithLocking);

router.post("/charge", chargeWithLocking);

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
router.put('/orders/kitchen/items/status', updateKitchenItemStatus);
router.put('/orders/kitchen/items/bulk-update', bulkUpdateKitchenItems);


router.put('/orders/beverage/:orderId/status', updateBeverageItemStatus);
router.get('/orders/beverage', getAllBeverageOrders);
router.put('/orders/bar/:orderId/status', updateBarOrderStatus);
router.get('/orders/bar', getBarOrder);
router.put('/orders/beverage/:orderId/complete', completeBeverageOrder);
router.post('/orders/beverage/:orderId/start', startBeverageOrder);
router.get('/orders/workstation/print-stats', getPrintStats);
router.get('/orders/workstation/print-history/:orderId', getOrderPrintHistory);
router.post('/orders/workstation/print-attempt', logPrintAttempt);
router.post('/orders/workstation/print-success', logPrintSuccess);
router.post('/orders/workstation/print-failure', logPrintFailure);
router.post('/orders/workstation/print-skipped', logSkippedItem);
router.post('/orders/workstation/print-problematic', logProblematicItem);
// Tambahkan route baru
router.get('/orders/workstation/problematic-report', getProblematicPrintReport);


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

router.post('/order/delete-order-item', deleteOrderItemAtOrder);

router.get('/order/:orderId/cashier', getOrderByIdAfterItemDelete);

router.get('/outlet/:outletId/active-orders', getActiveOrders);
router.get('/tables/available', getAvailableTables);
router.get('/table-occupancy/:outletId', getTableOccupancyStatus);
router.post('/orders/:orderId/transfer-table', transferOrderTable);
router.get('/orders/:orderId/table-history', getOrderTableHistory);
router.post('/tables/bulk-update-status', bulkUpdateTableStatus);

router.patch('/orders/:orderId/edit', patchEditOrder);

export default router;
