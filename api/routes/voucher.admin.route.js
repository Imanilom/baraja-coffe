import express from 'express';
import { createVoucher, getAllVouchers, updateVoucher, deleteVoucher, getVoucherById} from '../controllers/voucher.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
const router = express.Router();

router.post('/', verifyToken(["admin", "superadmin"]), createVoucher);
router.get('/', verifyToken(["admin", "superadmin"]), getAllVouchers);
router.get('/:id', verifyToken(["admin", "superadmin"]), getVoucherById);
router.put('/:id', verifyToken(["admin", "superadmin"]), updateVoucher);
router.delete('/:id', verifyToken(["admin", "superadmin"]), deleteVoucher);

export default router;
