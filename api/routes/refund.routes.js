// routes/refundRoutes.js
import express from 'express';
import { refundController } from '../controllers/refund.controller.js';
import { verifyToken, authMiddleware } from '../utils/verifyUser.js';

const router = express.Router();

// Apply auth middleware untuk semua routes
router.use(authMiddleware);

// Request refund untuk item
router.post('/request', refundController.requestRefund);

// Check jika item bisa di-refund
router.get('/check/:orderId/:orderItemId', refundController.checkRefundability);

// Approve refund (admin only)
router.patch('/:refundId/approve', refundController.approveRefund);

// Process refund (admin only)
router.patch('/:refundId/process', refundController.processRefund);

// Reject refund (admin only)
router.patch('/:refundId/reject', refundController.rejectRefund);

// Get refund history untuk order
router.get('/history/:orderId', refundController.getRefundHistory);

export default router;