import express from 'express';
import { 
  createOrderAndPayment, 
  getUserOrders 
} from '../controllers/order.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Customer Routes
router.post('/order', verifyToken(['customer']), createOrderAndPayment);
router.get('/order/user/:userId', verifyToken(['customer']), getUserOrders);


export default router;
