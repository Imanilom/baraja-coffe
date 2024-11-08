import express from 'express';
import { createVoucher, getAllVouchers, updateVoucher, deleteVoucher } from '../controllers/voucher.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
const router = express.Router();

router.post('/create', verifyToken(["admin", "superadmin"]), createVoucher);
router.get('/all', verifyToken(["admin", "superadmin"]), getAllVouchers);
router.put('/update/:id', verifyToken(["admin", "superadmin"]), updateVoucher);
router.delete('/delete/:id', verifyToken(["admin", "superadmin"]), deleteVoucher);

export default router;
