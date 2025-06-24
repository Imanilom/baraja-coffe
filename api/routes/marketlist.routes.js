// routes/marketlist.routes.js
import express from 'express';
import {
  createMarketList,
  getUnpaidMarketLists,
  payMarketList,
  getAllRequests,
  getAllRequestWithSuppliers,
  createRequest,
  approveRequestItems,
  rejectRequest,
  getRequests,
  getCashFlow,
  addCashIn,
  getFilteredCashFlow,
  getWeeklyReport,
  getMarketListReportByDate,
  getAllDebts,
  getDebtById,
  getDebtSummaryBySupplier,
  payDebt,
  updateDebt,
  deleteDebt
} from '../controllers/marketlist.controller.js';

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts
} from '../controllers/product.controller.js';

import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  createBulkSuppliers
} from '../controllers/supplier.controller.js';

import { authMiddleware, verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Middleware akses berdasarkan role
const staffAccess = verifyToken(['staff', 'inventory', 'admin', 'superadmin']);
const inventoryAccess = verifyToken(['inventory', 'admin', 'superadmin']);
const allAuthenticated = authMiddleware;

router.post('/request', staffAccess, createRequest);

router.get('/requests', staffAccess, getAllRequests);

router.get('/requests-with-suppliers', staffAccess, getAllRequestWithSuppliers);

router.post('/approve/:id', staffAccess, approveRequestItems);

router.post('/reject/:id', staffAccess, rejectRequest);

router.get('/pending-requests', staffAccess, getRequests);

router.post('/marketlist', inventoryAccess, createMarketList);

router.get('/unpaid', getUnpaidMarketLists);

router.post('/pay/:id', payMarketList);

router.post('/cashflow/in', inventoryAccess, addCashIn);

router.post('/lastbalance', inventoryAccess, addCashIn);

router.get('/cashflow', allAuthenticated, getCashFlow);

router.get('/cashflow', getFilteredCashFlow);

router.get('/marketlist', getMarketListReportByDate);

router.get('/cashflow/weekly-report', getWeeklyReport);

router.post('/product', createProduct);

router.get('/products', getAllProducts);

router.get('/product', searchProducts);

router.get('/product/:id', getProductById);

router.patch('/product/:id', inventoryAccess, updateProduct);

router.delete('/product/:id', inventoryAccess, deleteProduct);

router.post('/supplier', inventoryAccess, createSupplier);

router.get('/supplier', getAllSuppliers);

router.get('/supplier/:id', getSupplierById);

router.patch('/supplier/:id', inventoryAccess, updateSupplier);

router.delete('/supplier/:id',inventoryAccess, deleteSupplier);

router.post('/supplier/bulk', inventoryAccess, createBulkSuppliers);

router.get('/debts', getAllDebts);

router.get('/debts/:id', getDebtById);

router.get('/debts/supplier', getDebtSummaryBySupplier);

router.post('/debts/pay/:id', payDebt); 

router.patch('/debts/:id', updateDebt);

router.delete('/debts/:id', deleteDebt);

export default router;
