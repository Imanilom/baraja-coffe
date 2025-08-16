import express from 'express';
import {
  getReceiptSettingByOutlet,
  createOrUpdateReceiptSetting,
  updateReceiptSetting,
  getAllReceiptSettings,
} from '../controllers/receiptSetting.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();
const marketingAccess = verifyToken(['marketing', 'admin', 'superadmin']);

// Ambil setting berdasarkan outlet
router.get('/:outletId', getReceiptSettingByOutlet);

// Buat atau update setting untuk outlet tertentu
router.post('/:outletId', marketingAccess, createOrUpdateReceiptSetting);

// Update langsung via ID setting (opsional)
router.put('/:id', marketingAccess, updateReceiptSetting);

// [Admin] Ambil semua setting
router.get('/', getAllReceiptSettings);

export default router;