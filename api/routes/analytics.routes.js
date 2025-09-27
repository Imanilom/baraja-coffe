import express from 'express';
import AnalyticsController from '../controllers/analytics.controller.js';

const router = express.Router();

router.get('/promo-usage', AnalyticsController.promoUsage);
router.get('/voucher-usage', AnalyticsController.voucherUsage);
router.get('/revenue-impact', AnalyticsController.revenueImpact);
router.get('/customer-segmentation', AnalyticsController.customerSegmentation);
router.get('/outlet-source', AnalyticsController.outletAndSource);
router.get('/time-performance', AnalyticsController.timePerformance);
router.get('/overview-Metrics', AnalyticsController.overviewMetrics);
router.get('/effectiveness-Analysis', AnalyticsController.effectivenessAnalysis);
router.get('/trend-Analysis', AnalyticsController.trendAnalysis);
router.get('/channel-Performance', AnalyticsController.channelPerformance);

export default router;
