import express from 'express';

import { assignMenuItemsToCategory, createCategory, deleteCategory, filterMenuByCategory, getAllCategories, getCategories, getCategoryById, updateCategory } from '../controllers/category.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Middleware for admin and superadmin access
const adminAccess = verifyToken(['admin', 'superadmin', 'inventory']);


// Category Routes
router.get('/categories', getAllCategories); // Get all categories
router.get('/categories/:id', getCategoryById); // Get category by ID
router.post('/categories', adminAccess, createCategory); // Create a new category
router.put('/categories/:id', adminAccess, updateCategory); // Update a category
router.delete('/categories/:id', adminAccess, deleteCategory); // Delete a category

export default router;
