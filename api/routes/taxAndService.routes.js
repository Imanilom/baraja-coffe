import express from 'express';
import {
  getAllChargesForCashier,
  getChargeById,
  createCharge,
  updateCharge,
  deleteCharge,
  getTax
} from '../controllers/taxAndService.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const marketingAccess = verifyToken(['admin', 'superadmin', 'marketing']);

const router = express.Router();

router.get('/', getTax);
router.get('/cashier', getAllChargesForCashier);
router.get('/:id', getChargeById);
router.post('/', marketingAccess, createCharge);
router.put('/:id', marketingAccess, updateCharge);
router.delete('/:id', marketingAccess, deleteCharge);

export default router;
