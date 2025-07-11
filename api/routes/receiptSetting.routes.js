import express from 'express';
import {
  getSettingByOutletId,
  createOrUpdateSetting,
  deleteSetting
} from '../controllers/receiptSetting.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();
const marketingAccess = verifyToken(['marketing', 'admin', 'superadmin']);

router.get('/:outletId',  getSettingByOutletId);
router.post('/', marketingAccess, createOrUpdateSetting);
router.put('/:outletId', marketingAccess, createOrUpdateSetting); // optional update via PUT
router.delete('/:outletId', marketingAccess, deleteSetting);

export default router;
