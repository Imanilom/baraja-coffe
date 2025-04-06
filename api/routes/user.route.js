import express from 'express';
import {
  test,
  updateUser,
  deleteUser,
  getUSerById,
  getUserProfile,
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak tersedia' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Simpan user ID ke req.user
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

const router = express.Router();

router.get('/', verifyToken(["customer", "admin", "superadmin"]), test);
router.get('/getUSerById/:id', getUSerById);
router.get('/profile', authMiddleware, getUserProfile);
router.post('/update/:id', verifyToken(["customer", "admin", "superadmin"]), updateUser);
router.delete('/delete/:id', verifyToken(["customer", "admin", "superadmin"]), deleteUser);

export default router;
