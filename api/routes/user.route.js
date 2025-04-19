import express from 'express';
import {
  test,
  updateUser,
  deleteUser,
  getUSerById,
  getUserProfile,
} from '../controllers/user.controller.js';
import { authMiddleware, verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/', verifyToken(["customer", "admin", "superadmin"]), test);
router.get('/getUSerById/:id', getUSerById);
router.get('/profile', authMiddleware, getUserProfile);
router.post('/update/:id', verifyToken(["customer", "admin", "superadmin"]), updateUser);
router.delete('/delete/:id', verifyToken(["customer", "admin", "superadmin"]), deleteUser);


export default router;
