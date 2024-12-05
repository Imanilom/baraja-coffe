import express from 'express';
import { 
  claimVoucher, 
  getUserVouchers, 
  createVoucher, 
  getVouchers, 
  getVoucherById, 
  updateVoucher, 
  deleteVoucher 
} from '../controllers/voucher.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Customer Routes
const customerRoutes = express.Router();
customerRoutes.use(verifyToken(['customer'])); // Apply middleware to all customer routes

customerRoutes.post('/claim', claimVoucher);
customerRoutes.get('/user/:userId', getUserVouchers);
router.use('/customer', customerRoutes); // Prefix customer-specific routes with /customer

// Admin and Superadmin Routes
const adminRoutes = express.Router();
adminRoutes.use(verifyToken(['admin', 'superadmin'])); // Apply middleware to all admin routes

adminRoutes.post('/', createVoucher);
adminRoutes.get('/', getVouchers);
adminRoutes.get('/:id', getVoucherById);
adminRoutes.put('/:id', updateVoucher);
adminRoutes.delete('/:id', deleteVoucher);
router.use('/admin', adminRoutes); // Prefix admin-specific routes with /admin

export default router;
