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

const router = express.Router();

router.post('/', createAsset);
router.get('/', getAssets);
router.get('/summary', getAssetsSummary); // ringkasan asset
router.get('/warehouse/:warehouseId', getAssetsByWarehouse);
router.get('/:id', getAssetById);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

export default router;
