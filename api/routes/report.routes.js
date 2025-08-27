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
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();


// Middleware for admin and superadmin access
const adminAccess = verifyToken(['admin', 'superadmin']);


// router.post('/raw-material', adminAccess, createRawMaterial); // Create a new Raw Material
router.get('/sales', salesReport); // Get all Sales
// router.put('/raw-material/:id', adminAccess, updateRawMaterial); // Update a specific Raw Material
// router.delete('/raw-material/:id', adminAccess, deleteRawMaterial); // Delete a specific Raw Material

//cashier report
router.get('/sales/summary', getSalesSummary);
router.get('/sales/order-detail', getOrderDetails);
router.get('/sales/analytics', getSalesAnalytics);
router.get('/sales/performance', getCashierPerformance);
router.get('/sales/export-to-cvs', exportToCSV);
router.get('/sales/cashier-list', getCashiersList);

export default router;
