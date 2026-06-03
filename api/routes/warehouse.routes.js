// routes/warehouse.routes.js
import express from 'express';
import {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  restoreWarehouse
} from '../controllers/Warehouse.controller.js';

const router = express.Router();

router.get('/', getAllWarehouses);
router.get('/:id', getWarehouseById);
router.post('/', createWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);
router.patch('/:id/restore', restoreWarehouse);

export default router;