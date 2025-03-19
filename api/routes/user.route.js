import express from 'express';
import {
  test,
  updateUser,
  deleteUser,
  getUSerById,
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/', test);
router.get('/getUSerById/:id', getUSerById);
router.post('/update/:id', verifyToken(["customer", "admin", "superadmin"]), updateUser);
router.delete('/delete/:id', verifyToken(["customer", "admin", "superadmin"]), deleteUser);

export default router;
