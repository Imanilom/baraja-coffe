import express from 'express';
import {
  createOutlet,
  getOutlets,
  getOutletById,
  updateOutlet,
  deleteOutlet,
  findNearestOutlet,
} from '../controllers/outlet.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

const adminAccess = verifyToken(['admin', 'superadmin']);

// Create new outlet
router.post('/', adminAccess, createOutlet);

// Get all outlets
router.get('/', getOutlets);

// Get outlet by ID
router.get('/:id', getOutletById);

// Update outlet
router.put('/:id', adminAccess, updateOutlet);

// Delete outlet
router.delete('/:id', adminAccess, deleteOutlet);

// Find nearest outlet
router.get('/nearest', findNearestOutlet);

export default router;
