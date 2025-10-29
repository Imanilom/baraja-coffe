import express from 'express';
import AnalyticsController from '../controllers/analytics.controller.js';

const router = express.Router();

// Promo & Voucher Analytics
router.get('/promo-usage', AnalyticsController.promoUsage);
router.get('/voucher-usage', AnalyticsController.voucherUsage);
router.get('/revenue-impact', AnalyticsController.revenueImpact);

// Customer Analytics
router.get('/customer-segmentation', AnalyticsController.customerSegmentation);
router.get('/loyalty-performance', AnalyticsController.loyaltyPerformance);

// Business Performance Analytics
router.get('/outlet-source', AnalyticsController.outletAndSource);
router.get('/overview-metrics', AnalyticsController.overviewMetrics);
router.get('/effectiveness', AnalyticsController.effectivenessAnalysis);
router.get('/trends', AnalyticsController.trendAnalysis);
router.get('/channel-performance', AnalyticsController.channelPerformance);
router.get('/time-performance', AnalyticsController.timePerformance);

export default router;