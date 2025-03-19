import express from 'express';

import { createPromo, deletePromo, getPromoById, getPromos, updatePromo} from '../controllers/promo.controller.js';
import { createAutoPromo, deleteAutoPromo, getAutoPromoById, getAutoPromos, updateAutoPromo } from '../controllers/autopromo.controller.js';
import { createVoucher, deleteVoucher, generateVoucherQR, getAllVouchers, getVoucherById, updateVoucher } from '../controllers/voucher.controller.js';
import { createLoyaltyProgram, deleteLoyaltyProgram, getAllLoyaltyPrograms, getLoyaltyProgramById, updateLoyaltyProgram } from '../controllers/LoyaltyProgram.controller.js';
import { createLoyaltyLevel, updateLoyaltyLevel, getAllLoyaltyLevels } from '../controllers/LoyaltyProgram.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Middleware for admin and superadmin access
const adminAccess = verifyToken(['admin', 'superadmin']);



router.post('/promo-create', createPromo); // Create a new promo
router.get('/promos', getPromos); // Get all promos
router.get('/promos/:id', getPromoById); // Get a specific promo by ID
router.put('/promos/:id', updatePromo); // Update a specific promo
router.delete('/promos/:id', deletePromo); // Delete a specific promo

router.post('/autopromo-create', createAutoPromo); // Get all promos
router.get('/autopromos', getAutoPromos); // Get all promos
router.get('/autopromos/:id', getAutoPromoById); // Get a specific promo by ID
router.put('/autopromos/:id', updateAutoPromo); // Update a specific promo
router.delete('/autopromos/:id', deleteAutoPromo); // Delete a specific promo

router.post('/voucher-create', createVoucher); // Create a new voucher
router.get('/vouchers', getAllVouchers); // Get all vouchers
router.get('/vouchers/:id', getVoucherById); // Get a specific voucher by ID
router.put('/vouchers/:id', updateVoucher); // Update a specific voucher
router.delete('/vouchers/:id', deleteVoucher); // Delete a specific voucher

router.get('/generate-qr/:id', generateVoucherQR); // Get all promos

router.get('/loyalty', getAllLoyaltyPrograms); // Get all loyalty programs
router.get('/loyalty/:id', getLoyaltyProgramById); // Get a specific loyalty program by ID
router.put('/loyalty/:id', updateLoyaltyProgram); // Update a specific loyalty program
router.delete('/loyalty/:id', deleteLoyaltyProgram); // Delete a specific loyalty program
router.post('/loyalty', createLoyaltyProgram); // Create a new loyalty program

router.get('/loyalty-levels', getAllLoyaltyLevels); // Get all loyalty levels
router.put('/loyalty-levels/:id', updateLoyaltyLevel); // Update a specific loyalty level
router.post('/loyalty-levels', createLoyaltyLevel); // Create a new loyalty level

export default router;
