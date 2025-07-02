import express from 'express';
import {
  getAllCharges,
  getChargeById,
  createCharge,
  updateCharge,
  deleteCharge
} from '../controllers/taxAndService.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const marketingAccess = verifyToken(['admin', 'superadmin', 'marketing']);

const router = express.Router();

router.get('/', getAllCharges);
router.get('/:id', getChargeById);
router.post('/', marketingAccess, createCharge);
router.put('/:id', marketingAccess, updateCharge);
router.delete('/:id', marketingAccess, deleteCharge);

export default router;
