// routes/marketlist.routes.js
import express from 'express';
import {
  createMarketList,
  getUnpaidMarketLists,
  payMarketList,
  getAllRequestWithSuppliers,
  updateMarketList,
  updateMarketListItem,
  updateAdditionalExpense,
  partialUpdateMarketList,
  deleteMarketList,
  deleteMarketListItem,
  deleteAdditionalExpense,
  getRequests,
  getCashFlow,
  addCashIn,
  withdrawCash,
  getBalanceSummary,
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
  updateProductPrice,
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

import RequestController from '../controllers/request.controller.js';

import { authMiddleware, verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Middleware akses berdasarkan role
const staffAccess = verifyToken(['staff', 'inventory', 'admin', 'superadmin']);
const inventoryAccess = verifyToken(['inventory', 'admin', 'superadmin']);
const allAuthenticated = authMiddleware;

router.post('/request', staffAccess, RequestController.createRequest);

router.get('/requests', staffAccess, RequestController.getRequests);

router.get('/requests/:requestId', staffAccess, RequestController.getRequestDetail);

router.post('/approve/:requestId', staffAccess, RequestController.approveAndFulfillRequest);

router.post('/reject/:requestId', staffAccess, RequestController.rejectRequest);

router.get('/requests-with-suppliers', getAllRequestWithSuppliers);

router.get('/pending-requests', staffAccess, getRequests);

router.post('/marketlist', inventoryAccess, createMarketList);

// Update seluruh transaksi marketlist
router.put('marketlist/:id', updateMarketList);

// Partial update transaksi marketlist
router.patch('marketlist/:id', partialUpdateMarketList);

// Update item tertentu dalam transaksi
router.put('marketlist/:id/items/:itemId', updateMarketListItem);

// Update pengeluaran tambahan
router.put('marketlist/:id/expenses/:expenseId', updateAdditionalExpense);

// Delete seluruh transaksi marketlist
router.delete('marketlist/:id', deleteMarketList);

// Delete item tertentu dalam transaksi
router.delete('marketlist/:id/items/:itemId', deleteMarketListItem);

// Delete pengeluaran tambahan
router.delete('marketlist/:id/expenses/:expenseId', deleteAdditionalExpense);


router.get('/unpaid', getUnpaidMarketLists);

router.post('/pay/:id', payMarketList);

router.post('/cashflow/in', inventoryAccess, addCashIn);

router.post('/cashflow/out', inventoryAccess, withdrawCash);

router.get('/cashflow/balance', inventoryAccess, getBalanceSummary);

router.get('/cashflow', allAuthenticated, getCashFlow);

router.get('/cashflow', getFilteredCashFlow);

router.get('/marketlist', getMarketListReportByDate);

router.get('/cashflow/weekly-report', getWeeklyReport);

router.post('/product', createProduct);

router.get('/products', getAllProducts);

router.get('/product', searchProducts);

router.get('/product/:id', getProductById);

router.patch('/product/:id', inventoryAccess, updateProduct);

router.patch('/product/price/:id', inventoryAccess, updateProductPrice);

router.delete('/product/:id', inventoryAccess, deleteProduct);

router.post('/supplier', inventoryAccess, createSupplier);

router.get('/supplier', getAllSuppliers);

router.get('/supplier/:id', getSupplierById);

router.patch('/supplier/:id', inventoryAccess, updateSupplier);

router.delete('/supplier/:id', inventoryAccess, deleteSupplier);

router.post('/supplier/bulk', inventoryAccess, createBulkSuppliers);

router.get('/debts', getAllDebts);

router.get('/debts/:id', getDebtById);

router.get('/debts/supplier', getDebtSummaryBySupplier);

router.post('/debts/pay/:id', payDebt);

router.patch('/debts/:id', updateDebt);

router.delete('/debts/:id', deleteDebt);

export default router;
