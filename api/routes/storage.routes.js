import express from 'express';
import {
  batchInsertStock,
  getRawMaterials,
  updateRawMaterial,
  deleteRawMaterial,
  createStockOpname,
  getStockOpnames,
  getStockOpnameById,
  updateStockOpname,
  deleteStockOpname
} from '../controllers/storage.controller.js';

import { assignMenuItemsToCategory, createCategory, deleteCategory, filterMenuByCategory, getAllCategories, getCategories, getCategoryById, updateCategory } from '../controllers/category.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Middleware for admin and superadmin access
const adminAccess = verifyToken(['admin', 'superadmin', 'inventory']);

// Stock Routes
router.post('/stock/batch', adminAccess, batchInsertStock); // Batch insert stock data

// Raw Material Routes
router.get('/raw-material', getRawMaterials); // Get all Raw Materials
router.put('/raw-material/:id', adminAccess, updateRawMaterial); // Update a specific Raw Material
router.delete('/raw-material/:id', adminAccess, deleteRawMaterial); // Delete a specific Raw Material

// Stock Opname Routes
router.post('/stock-opname', adminAccess, createStockOpname); // Create a new Stock Opname
router.get('/stock-opname', getStockOpnames); // Get all Stock Opnames
router.get('/stock-opname/:id', getStockOpnameById); // Get a specific Stock Opname by ID
router.put('/stock-opname/:id', adminAccess, updateStockOpname); // Update a specific Stock Opname
router.delete('/stock-opname/:id', adminAccess, deleteStockOpname); // Delete a specific Stock Opname

// Category Routes
router.get('/categories', getAllCategories); // Get all categories
router.get('/categories/:id', getCategoryById); // Get category by ID
router.post('/categories', adminAccess, createCategory); // Create a new category
router.put('/categories/:id', adminAccess, updateCategory); // Update a category
router.delete('/categories/:id', adminAccess, deleteCategory); // Delete a category

export default router;
