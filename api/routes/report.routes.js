import express from 'express';
import {
  salesReport
} from '../controllers/report.controller.js';
import {
  getSalesSummary,
  getOrderDetails,
  getSalesAnalytics,
  getCashierPerformance,
  exportToCSV,
  getCashiersList
} from '../controllers/cashierReport.controller.js'

import {
  generateSalesReport,
  getAvailablePaymentMethods,
  getPaymentDetails
} from '../controllers/report/payment.report.controller.js';


import stockOpnameController from '../controllers/stockopname.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { validateSalesReportQuery } from '../utils/salesReportQuery.js';

const router = express.Router();


// Middleware for admin and superadmin access
const adminAccess = verifyToken(['admin', 'superadmin']);

router.get('/sales', salesReport); // Get all Sales


//cashier report
router.get('/sales/summary', getSalesSummary);
router.get('/sales/order-detail', getOrderDetails);
router.get('/sales/analytics', getSalesAnalytics);
router.get('/sales/performance', getCashierPerformance);
router.get('/sales/export-to-cvs', exportToCSV);
router.get('/sales/cashier-list', getCashiersList);

router.get('/sales-report', generateSalesReport);

// router.get('/sales-report/export', exportSalesReport);
// router.get('/sales-report/payment-detail', getPaymentMethodDetail);

router.get('/stock-opname/monthly', stockOpnameController.getMonthlyStockOpname);

// Profit & Loss report
router.get('/profit-loss', stockOpnameController.generateProfitLossReport);

// Balance sheet
router.get('/balance-sheet', stockOpnameController.generateBalanceSheet);

// Stock movement report
router.get('/stock-movement', stockOpnameController.generateStockMovementReport);

// Inventory aging report
router.get('/inventory-aging', stockOpnameController.generateInventoryAgingReport);

router.post('/stock-opname', stockOpnameController.performStockOpname); // Perform stock opname

export default router;
