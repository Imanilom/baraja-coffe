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


router.post('/', accountingaccess, createAsset);
router.get('/', accountingaccess, getAssets);
router.get('/summary', accountingaccess, getAssetsSummary); // ringkasan asset
router.get('/warehouse/:warehouseId', accountingaccess, getAssetsByWarehouse);
router.get('/:id', accountingaccess, getAssetById);
router.put('/:id',  accountingaccess, updateAsset);
router.delete('/:id', accountingaccess, deleteAsset);

export default router;
