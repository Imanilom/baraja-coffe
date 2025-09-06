import express from 'express';
import { body } from 'express-validator';
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
  getAllEmployees,
  updateUserProfile,
  changeUserPassword,
  getUserAuthType
} from '../controllers/user.controller.js';
import { authMiddleware, verifyToken } from '../utils/verifyUser.js';

const staffAccess = verifyToken(['staff']);
const adminAccess = verifyToken(['admin', 'superadmin']);

const router = express.Router();

// router.get('/', test);

// Get user by ID (tidak memerlukan middleware spesifik, tapi sebaiknya tetap dijaga dengan auth)
router.get('/getUSerById/:id', authMiddleware, getUSerById);

// Get profile pengguna berdasarkan token
// router.get('/profile', authMiddleware, getUserProfile);

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

// Start account settings user (self)

const updateProfileValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username harus 3-30 karakter')
    .matches(/^[a-zA-Z0-9._\s]+$/)
    .withMessage('Username hanya boleh berisi huruf, angka, titik, underscore, dan spasi'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Format email tidak valid'),

  body('phone')
    .optional()
    .custom((value) => {
      if (value && value.trim() !== '') {
        const numbersOnly = value.replace(/[^0-9]/g, '');
        if (numbersOnly.length < 10 || numbersOnly.length > 15) {
          throw new Error('Nomor telepon harus 10-15 digit');
        }
      }
      return true;
    })
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Password saat ini diperlukan'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password baru minimal 6 karakter')
    .matches(/[a-zA-Z]/)
    .withMessage('Password harus mengandung huruf')
    .matches(/[0-9]/)
    .withMessage('Password harus mengandung angka')
];

router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateProfileValidation, updateUserProfile);
router.put('/change-password', authMiddleware, changePasswordValidation, changeUserPassword);
router.get('/auth-type', authMiddleware, getUserAuthType);

// End account settings user (self)

export default router;