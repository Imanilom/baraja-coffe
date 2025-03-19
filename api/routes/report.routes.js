import express from 'express';
import {
    salesReport
} from '../controllers/report.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();


// Middleware for admin and superadmin access
const adminAccess = verifyToken(['admin', 'superadmin']);


// router.post('/raw-material', adminAccess, createRawMaterial); // Create a new Raw Material
router.get('/sales', salesReport); // Get all Sales
// router.put('/raw-material/:id', adminAccess, updateRawMaterial); // Update a specific Raw Material
// router.delete('/raw-material/:id', adminAccess, deleteRawMaterial); // Delete a specific Raw Material

export default router;
