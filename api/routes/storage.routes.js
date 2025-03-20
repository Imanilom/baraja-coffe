import express from 'express';
import {
  createRawMaterial,
  getRawMaterials,
  updateRawMaterial,
  deleteRawMaterial,
  createStockOpname,
  getStockOpnames,
  getStockOpnameById,
  updateStockOpname,
  deleteStockOpname
} from '../controllers/storage.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Middleware for admin and superadmin access
const adminAccess = verifyToken(['admin', 'superadmin', 'inventory']);

// Raw Material Routes
router.post('/raw-material', adminAccess, createRawMaterial); // Create a new Raw Material
router.get('/raw-material', getRawMaterials); // Get all Raw Materials
router.put('/raw-material/:id', adminAccess, updateRawMaterial); // Update a specific Raw Material
router.delete('/raw-material/:id', adminAccess, deleteRawMaterial); // Delete a specific Raw Material

// Stock Opname Routes
router.post('/stock-opname', adminAccess, createStockOpname); // Create a new Stock Opname
router.get('/stock-opname', getStockOpnames); // Get all Stock Opnames
router.get('/stock-opname/:id', getStockOpnameById); // Get a specific Stock Opname by ID
router.put('/stock-opname/:id', adminAccess, updateStockOpname); // Update a specific Stock Opname
router.delete('/stock-opname/:id', adminAccess, deleteStockOpname); // Delete a specific Stock Opname

export default router;
