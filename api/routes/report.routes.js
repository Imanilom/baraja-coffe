import express from 'express';
import {
  salesReport,
  getCashRecap
} from '../controllers/report.controller.js';
import {
  getSalesSummary,
  getOrderDetails,
  getSalesAnalytics,
  getCashierPerformance,
  exportToCSV,
  getCashiersList,
} from '../controllers/cashierReport.controller.js'

import {
  getCustomerReports,
  getCustomerDetailReport,
  getCustomerInsightsOverview,
  getCashierPerformanceReport,
  exportCustomerReport
} from '../controllers/customer.controller.js';

import {
  getProfitLossReport,
  getDiscountUsageReport,
  getCommissionLossReport,
  getDailyProfitLossReport,
  getWeeklyProfitLossReport,
  getMonthlyProfitLossReport,
  exportProfitLossReport
} from '../controllers/profitLossController.js';

import {
  generateSalesReport,
  getPaymentMethodDetailReport,
  getAvailablePaymentMethods,
  getPaymentDetails
} from '../controllers/report/payment.report.controller.js';

import DailyProfitController from '../controllers/report/sales.report.controller.js';
import DashboardController from '../controllers/report/dashboard.report.controller.js';
import stockOpnameController from '../controllers/stockopname.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { validateSalesReportQuery } from '../utils/salesReportQuery.js';

const router = express.Router();


// Middleware for admin and superadmin access
const adminAccess = verifyToken(['admin', 'superadmin']);

router.post('/cash-recap', getCashRecap); // New Cash Recap Endpoint
router.get('/sales', salesReport); // Get all Sales

router.get('/customers', getCustomerReports);
router.get('/customers/:customerId', getCustomerDetailReport);
router.get('/customers/insights/overview', getCustomerInsightsOverview);
router.get('/cashiers/performance', getCashierPerformanceReport);
router.get('/customers/export', exportCustomerReport);


// Main profit loss report with various groupings
router.get('/main/profit-loss', getProfitLossReport);

// Discount usage analysis
router.get('/main/discount-usage', getDiscountUsageReport);

// Commission loss due to discounts
router.get('/main/commission-loss', getCommissionLossReport);

// Pre-configured period reports
router.get('/main/profit-loss/daily', getDailyProfitLossReport);
router.get('/main/profit-loss/weekly', getWeeklyProfitLossReport);
router.get('/main/profit-loss/monthly', getMonthlyProfitLossReport);

// Export functionality
router.get('/main/profit-loss/export', exportProfitLossReport);

//cashier report
router.get('/sales/summary', getSalesSummary);
router.get('/sales/product-sales', DailyProfitController.getProductSalesReport);
router.get('/sales/order-detail', getOrderDetails);
router.get('/sales/analytics', getSalesAnalytics);
router.get('/sales/performance', getCashierPerformance);
router.get('/sales/export-to-cvs', exportToCSV);
router.get('/sales/cashier-list', getCashiersList);

router.get('/sales-report', generateSalesReport);

// router.get('/sales-report/payment-method-detail', getPaymentMethodDetailReport);

router.get('/sales-report/payment-detail', getPaymentDetails);

router.get('/sales-report/payment-methods', getAvailablePaymentMethods);

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

// GET /api/daily-profit?date=2024-01-15&outletId=...
router.get('/daily-profit', DailyProfitController.getDailyProfit);

// GET /api/daily-profit/range?startDate=2024-01-01&endDate=2024-01-31&outletId=...
router.get('/daily-profit/range', DailyProfitController.getDailyProfitRange);

// GET /api/hourly-profit/range?startDate=2024-01-01&endDate=2024-01-31&outletId=...
router.get('/hourly-profit/range', DailyProfitController.getHourlySalesRange);

// GET /api/daily-profit/today?outletId=...
router.get('/daily-profit/today', DailyProfitController.getTodayProfit);

// GET /api/daily-profit/dashboard?days=7&outletId=...
router.get('/daily-profit/dashboard', DailyProfitController.getProfitDashboard);

router.get('/order-details/:orderId', DailyProfitController.getOrderDetailReport);

router.get('/orders', DailyProfitController.getOrdersWithPayments);

router.get('/sales-report/payment-method-detail', DailyProfitController.getPaymentMethodDetailReport);

router.get('/sales-report/transaction-category', DailyProfitController.getCategorySalesReport);

router.get('/sales-report/transaction-type', DailyProfitController.getTypeSalesReport);

router.get('/sales-report/transaction-outlet', DailyProfitController.getSalesOutlet);

router.get('/sales-report/device', DailyProfitController.getDeviceSalesReport);

// router.delete('/sales-report/bulk', DailyProfitController.deleteMultipleOrders);

router.delete('/sales-report/:id', DailyProfitController.deleteSingleOrder);

router.get('/sales-report/transaction-customer', DailyProfitController.getCustomerSalesReport);

router.get('/sales-report/summary', DailyProfitController.getSalesSummary);

// @route   GET /api/dashboard/data
// @desc    Get complete dashboard data (summary, products, charts)
// @access  Private
// @query   startDate, endDate, outlet (optional)
router.get('/dashboard', DashboardController.getDashboardData);

// @route   GET /api/dashboard/quick-stats
// @desc    Get quick stats only (for fast initial load)
// @access  Private
// @query   startDate, endDate, outlet (optional)
router.get('/quick-stats', DashboardController.getQuickStats);


export default router;
