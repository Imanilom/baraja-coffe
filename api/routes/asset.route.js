import express from 'express';
import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getAssetsByWarehouse,
  getAssetsSummary,
} from '../controllers/asset.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

const accountingaccess = verifyToken(['superadmin', 'admin', 'accounting']);


router.post('/', createAsset);
router.get('/', getAssets);
router.get('/summary', getAssetsSummary); // ringkasan asset
router.get('/warehouse/:warehouseId', getAssetsByWarehouse);
router.get('/:id', getAssetById);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

export default router;
