import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  createTopping,
  getToppings,
  getToppingById,
  updateTopping,
  deleteTopping,
  createAddOn,
  getAddOnById,
  getAllAddOns,
  updateAddOn,
  deleteAddOn,
} from '../controllers/menu.controller.js';

const router = express.Router();

// Middleware for admin and superadmin only
const adminAccess = verifyToken(['admin', 'superadmin']);

// MenuItem Routes
router.post('/menu-items', adminAccess, createMenuItem); // Create a new MenuItem
router.get('/menu-items', getMenuItems); // Get all MenuItems
router.get('/menu-items/:id', getMenuItemById); // Get a specific MenuItem by ID
router.put('/menu-items/:id', adminAccess, updateMenuItem); // Update a specific MenuItem
router.delete('/menu-items/:id', adminAccess, deleteMenuItem); // Delete a specific MenuItem

// Topping Routes
router.post('/toppings', adminAccess, createTopping); // Create a new Topping
router.get('/toppings', getToppings); // Get all Toppings
router.get('/toppings/:id', getToppingById); // Get a specific Topping by ID
router.put('/toppings/:id', adminAccess, updateTopping); // Update a specific Topping
router.delete('/toppings/:id', adminAccess, deleteTopping); // Delete a specific Topping

// AddOn Routes
router.post('/addons', adminAccess, createAddOn); // Create a new AddOn
router.get('/addons', getAllAddOns); // Get all AddOns
router.get('/addons/:id', getAddOnById); // Get a specific AddOn by ID
router.put('/addons/:id', adminAccess, updateAddOn); // Update a specific AddOn
router.delete('/addons/:id', adminAccess, deleteAddOn); // Delete a specific AddOn

export default router;
