import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
createMenuItem,
getMenuItems,
deleteMenuItem,
getMenuItemById,
getMenuItemsByCategory,
updateMenuItem
} from '../controllers/menu.controller.js';

import { assignMenuItemsToCategory, filterMenuByCategory, getCategories } from '../controllers/category.controller.js';

const router = express.Router();

// Middleware for admin and superadmin only
const adminAccess = verifyToken(['admin', 'superadmin', 'marketing', 'operational']);

// MenuItem Routes
router.post('/menu-items', createMenuItem); // Create a new MenuItem
router.get('/menu-items', getMenuItems); // Get all MenuItems
router.get('/simple-menus', getMenuItemsByCategory); // Get all MenuItems
router.get('/menu-items/:id', getMenuItemById); // Get a specific MenuItem by ID
router.put('/menu-items/:id', adminAccess, updateMenuItem); // Update a specific MenuItem
router.delete('/menu-items/:id', adminAccess, deleteMenuItem); // Delete a specific MenuItem

// Category Routes
router.post('/categories', adminAccess, assignMenuItemsToCategory); // Assign menu items to a category
router.get('/categories', getCategories); // Get all categories
router.get('/categories/filter', filterMenuByCategory); // Filter menu items by category


export default router;
