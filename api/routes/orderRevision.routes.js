import express from 'express';
import { createRevision, captureAdjustment, paymentSettle } from '../controllers/orderRevision.controller.js';

const router = express.Router();

router.post('/orders/:orderId/revisions', createRevision);
router.post('/payments/adjustments/:id/capture', captureAdjustment);
router.post('/payments/:paymentId/settle', paymentSettle);

export default router;