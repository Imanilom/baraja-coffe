import express from 'express';
import { getAvailableVouchers, claimVoucher, applyVoucherToOrder } from '../controllers/voucher.user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
const router = express.Router();

router.get('/available', verifyToken(["user", "admin", "superadmin"]), getAvailableVouchers);
router.post('/claim', verifyToken(["user", "admin", "superadmin"]), claimVoucher);
router.post('/apply', verifyToken(["user", "admin", "superadmin"]), applyVoucherToOrder);

export default router;
