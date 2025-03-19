import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
  createMenuItem,
  getMenuItems,
  getSimpleMenuItems,
  getMenuItemById,
  // updateMenuItem,
  deleteMenuItem,
  createTopping,
  getToppings,
  getToppingById,
  updateTopping,
  deleteTopping,
} from '../controllers/menu.controller.js';

import { assignMenuItemsToCategory, filterMenuByCategory, getCategories } from '../controllers/category.comtroller.js';

const router = express.Router();

// Middleware for admin and superadmin only
const adminAccess = verifyToken(['admin', 'superadmin']);

// MenuItem Routes
router.post('/menu-items', adminAccess, createMenuItem); // Create a new MenuItem
router.get('/menu-items', getMenuItems); // Get all MenuItems
router.get('/simple-menus', getSimpleMenuItems); // Get all MenuItems
router.get('/menu-items/:id', getMenuItemById); // Get a specific MenuItem by ID
// router.put('/menu-items/:id', adminAccess, updateMenuItem); // Update a specific MenuItem
router.delete('/menu-items/:id', adminAccess, deleteMenuItem); // Delete a specific MenuItem

// Topping Routes
router.post('/toppings', adminAccess, createTopping); // Create a new Topping
router.get('/toppings', getToppings); // Get all Toppings
router.get('/toppings/:id', getToppingById); // Get a specific Topping by ID
router.put('/toppings/:id', adminAccess, updateTopping); // Update a specific Topping
router.delete('/toppings/:id', adminAccess, deleteTopping); // Delete a specific Topping

// Category Routes
router.post('/categories', adminAccess, assignMenuItemsToCategory); // Assign menu items to a category
router.get('/categories', getCategories); // Get all categories
router.get('/categories/filter', filterMenuByCategory); // Filter menu items by category


export default router;
