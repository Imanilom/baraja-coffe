import express from 'express';
import AnalyticsController from '../controllers/analytics.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

const accountingaccess = verifyToken(['superadmin', 'admin', 'accounting']);

router.get('/promo-usage', accountingaccess, AnalyticsController.promoUsage);
router.get('/voucher-usage', AnalyticsController.voucherUsage);
router.get('/revenue-impact', accountingaccess, AnalyticsController.revenueImpact);
<<<<<<< HEAD
router.get('/customer-segmentation',accountingaccess ,AnalyticsController.customerSegmentation);
router.get('/trend-analysis',accountingaccess ,AnalyticsController.trendAnalysis);
router.get('/loyalty-performance',accountingaccess ,AnalyticsController.loyaltyPerformance);
router.get('/overview-metrics',accountingaccess ,AnalyticsController.overviewMetrics);
router.get('/effectiveness-analysis',accountingaccess ,AnalyticsController.effectivenessAnalysis);
router.get('/channel-performance',accountingaccess ,AnalyticsController.channelPerformance);
router.get('/time-performance',accountingaccess ,AnalyticsController.timePerformance);
=======
router.get('/customer-segmentation', AnalyticsController.customerSegmentation);
router.get('/outlet-source', accountingaccess, AnalyticsController.outletAndSource);
router.get('/time-performance', accountingaccess, AnalyticsController.timePerformance);
router.get('/overview-Metrics', accountingaccess, AnalyticsController.overviewMetrics);
router.get('/effectiveness-Analysis', accountingaccess, AnalyticsController.effectivenessAnalysis);
router.get('/trend-Analysis', accountingaccess, AnalyticsController.trendAnalysis);
router.get('/channel-Performance', accountingaccess, AnalyticsController.channelPerformance);
>>>>>>> 916e70b891b7d268951abf09a707fe2714c98bf3

export default router;
