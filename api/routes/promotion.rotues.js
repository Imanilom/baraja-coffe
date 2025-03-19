import express from 'express';

import { createPromo, deletePromo, getPromoById, getPromos, updatePromo} from '../controllers/promo.controller.js';
import { createAutoPromo, deleteAutoPromo, getAutoPromoById, getAutoPromos, updateAutoPromo } from '../controllers/autopromo.controller.js';
import { createVoucher, deleteVoucher, generateVoucherQR, getAllVouchers, getVoucherById, updateVoucher } from '../controllers/voucher.controller.js';

import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Middleware for admin and superadmin access
const adminAccess = verifyToken(['admin', 'superadmin']);



router.post('/promo-create', createPromo); // Create a new promo
router.post('/autopromo-create', createAutoPromo); // Get all promos
router.post('/voucher-create', createVoucher); // Create a new voucher
router.get('/generate-qr/:id', generateVoucherQR); // Get all promos

export default router;
