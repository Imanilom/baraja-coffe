import express from 'express';
import {
  test,
  updateUser,
  deleteUser,
  getUSerById,
  assignOutlets,
  listStaff,
  getUserProfile,
  createEmployee,
  assignOutletsToEmployee,
  updateEmployeeRole,
  deleteEmployee,
  getAllEmployees
} from '../controllers/user.controller.js';
import { authMiddleware, verifyToken } from '../utils/verifyUser.js';

const staffAccess = verifyToken(['staff']);
const adminAccess = verifyToken(['admin', 'superadmin']);

const router = express.Router();

router.get('/', test);

// Get user by ID (tidak memerlukan middleware spesifik, tapi sebaiknya tetap dijaga dengan auth)
router.get('/getUSerById/:id', authMiddleware, getUSerById);

// Get profile pengguna berdasarkan token
router.get('/profile', authMiddleware, getUserProfile);

// Update user (user sendiri atau admin)
router.put('/update/:id', authMiddleware, updateUser);

// Hapus user (user sendiri atau admin)
router.delete('/delete/:id', verifyToken(["customer", "admin", "superadmin"]), deleteUser);

// Assign outlet ke user (hanya admin/superadmin)
router.put('/assign-outlets/:id', adminAccess, assignOutlets);

// List staff dengan filter (hanya admin/superadmin)
router.get('/staff', adminAccess, listStaff);

// Create karyawan baru (hanya admin/superadmin)
router.post('/create', adminAccess, createEmployee);
router.put('/assign-outlets/:id', adminAccess, assignOutletsToEmployee);
router.put('/update-role/:id', adminAccess, updateEmployeeRole);
router.delete('/delete/:id', adminAccess, deleteEmployee);
router.get('/', adminAccess, getAllEmployees);

export default router;