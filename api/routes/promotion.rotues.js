import express from 'express';
import {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
} from '../controllers/promotion.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Middleware for admin and superadmin access
const adminAccess = verifyToken(['admin', 'superadmin']);

// Promotion Routes
router.post('/', adminAccess, createPromotion); // Create a new promotion
router.get('/', getPromotions); // Get all promotions
router.get('/:id', getPromotionById); // Get a specific promotion by ID
router.put('/:id', adminAccess, updatePromotion); // Update a promotion
router.delete('/:id', adminAccess, deletePromotion); // Delete a promotion

export default router;
