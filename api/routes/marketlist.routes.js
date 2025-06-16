// routes/marketlist.routes.js
import express from 'express';
import {
  createMarketList,
  getUnpaidMarketLists,
  payMarketList,
  getAllRequests,
  createRequest,
  approveRequestItems,
  rejectRequest,
  getRequests,
  getCashFlow,
  addCashIn,
  getFilteredCashFlow,
  getWeeklyReport,
  getMarketListReportByDate
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

// router.get('/product', getAllProducts);

router.get('/product', searchProducts);

router.get('/product/:id', getProductById);

router.patch('/product/:id', updateProduct);

router.delete('/product/:id', deleteProduct);

router.post('/supplier', createSupplier);

router.get('/supplier', getAllSuppliers);

router.get('/supplier/:id', getSupplierById);

router.patch('/supplier/:id', updateSupplier);

router.delete('/supplier/:id', deleteSupplier);

router.post('/supplier/bulk', createBulkSuppliers);

export default router;
