import express from 'express';
import AnalyticsController from '../controllers/analytics.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

const accountingaccess = verifyToken(['superadmin', 'admin', 'accounting']);

router.get('/promo-usage', accountingaccess, AnalyticsController.promoUsage);
router.get('/voucher-usage', accountingaccess, AnalyticsController.voucherUsage);
router.get('/revenue-impact', accountingaccess, AnalyticsController.revenueImpact);
router.get('/customer-segmentation',accountingaccess ,AnalyticsController.customerSegmentation);
router.get('/trend-analysis',accountingaccess ,AnalyticsController.trendAnalysis);
router.get('/loyalty-performance',accountingaccess ,AnalyticsController.loyaltyPerformance);
router.get('/overview-metrics',accountingaccess ,AnalyticsController.overviewMetrics);
router.get('/effectiveness-analysis',accountingaccess ,AnalyticsController.effectivenessAnalysis);
router.get('/channel-performance',accountingaccess ,AnalyticsController.channelPerformance);
router.get('/time-performance',accountingaccess ,AnalyticsController.timePerformance);

export default router;
