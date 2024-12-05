import express from 'express';
import { 
  createOrder, 
  initiatePayment, 
  handleNotification, 
  getUserOrders 
} from '../controllers/order.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Customer Routes
router.post('/order', verifyToken(['customer']), createOrder);
router.get('/order/user/:userId', verifyToken(['customer']), getUserOrders);
router.post('/order/:orderId/payment', verifyToken(['customer']), initiatePayment);

// Midtrans Notification (Public endpoint)
router.post('/payment/notification', handleNotification);

export default router;
