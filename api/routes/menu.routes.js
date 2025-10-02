import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import upload from '../utils/middleware/upload.js'; // Multer config
import {
  createMenuItem,
  getMenuItems,
  getMenuItemsByOutletWithRecipes,
  getMenuItemsWithRecipes,
  deleteMenuItem,
  getMenuItemById,
  getMenuItemsByCategory,
  updateMenuItem,
  filterMenuItems,
  getAvailableMenuItems,
  getMenuByOutlet,
  getMenuByRating,
  updateMenuActivated
} from '../controllers/menu.controller.js';

import { assignMenuItemsToCategory, createCategory, filterMenuByCategory, getCategories } from '../controllers/category.controller.js';

const router = express.Router();

// Middleware for admin and superadmin only
const adminAccess = verifyToken(['admin', 'superadmin', 'marketing', 'operational']);

// MenuItem Routes
router.post('/menu-items', upload.single('images'), createMenuItem); // Create a new MenuItem
router.get('/menu-items', getMenuItemsWithRecipes); // Get all MenuItems with Recipes
router.get('/all-menu-items', getMenuItems); // Get all MenuItems
router.get('/with-recipes/outlet/:outletId', getMenuItemsByOutletWithRecipes); // Get MenuItems by Outlet ID with Recipes
router.get('/menu-items/category/:categoryId', getMenuItemsByCategory); // Get MenuItems by Category ID
router.get('/menu-items/:id', getMenuItemById); // Get a specific MenuItem by ID
router.put('/menu-items/:id', adminAccess, updateMenuItem); // Update a specific MenuItem
router.put('/menu-items/activated/:id', adminAccess, updateMenuActivated); // Update a specific MenuItem
router.delete('/menu-items/:id', adminAccess, deleteMenuItem); // Delete a specific MenuItem
router.get('/menu-items/filter', filterMenuItems); // Filter MenuItems by name, category, or type
router.get('/menu-items/available', getAvailableMenuItems); // Get available MenuItems
router.get('/menu-items/outlet/:outletId', getMenuByOutlet); // Get MenuItems by Outlet ID
router.get('/menu-items/rating', getMenuByRating); // Get MenuItems by rating

// Category Routes
// router.post('/categories', adminAccess, assignMenuItemsToCategory); // Assign menu items to a category
router.post('/categories', adminAccess, createCategory); // Create a new category
router.get('/categories', getCategories); // Get all categories
router.get('/categories/filter', filterMenuByCategory); // Filter menu items by category


export default router;
