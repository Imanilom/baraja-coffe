import express from 'express';
import AnalyticsController from '../controllers/analytics.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

const accountingaccess = verifyToken(['superadmin', 'admin', 'accounting']);

router.get('/promo-usage', accountingaccess, AnalyticsController.promoUsage);
router.get('/voucher-usage', AnalyticsController.voucherUsage);
router.get('/revenue-impact', accountingaccess, AnalyticsController.revenueImpact);
router.get('/customer-segmentation', AnalyticsController.customerSegmentation);
router.get('/outlet-source', accountingaccess, AnalyticsController.outletAndSource);
router.get('/time-performance', accountingaccess, AnalyticsController.timePerformance);
router.get('/overview-Metrics', accountingaccess, AnalyticsController.overviewMetrics);
router.get('/effectiveness-Analysis', accountingaccess, AnalyticsController.effectivenessAnalysis);
router.get('/trend-Analysis', accountingaccess, AnalyticsController.trendAnalysis);
router.get('/channel-Performance', accountingaccess, AnalyticsController.channelPerformance);

export default router;
