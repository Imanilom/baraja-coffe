import express from 'express';
import {
  createTableLayout,
  getTableLayoutByOutlet,
  updateTableLayout,
  deleteTableLayout,
  getTableStatusByOutlet,
  getAvailableTablesByPeople
} from '../controllers/tableLayout.controller.js';

const router = express.Router();

// POST /api/table-layout
router.post('/', createTableLayout);

// GET /api/table-layout/:outletId
router.get('/:outletId', getTableLayoutByOutlet);

// PUT /api/table-layout/:outletId
router.put('/:outletId', updateTableLayout);

// DELETE /api/table-layout/:outletId
router.delete('/:outletId', deleteTableLayout);

// Ambil status meja berdasarkan outlet
router.get('/table-status/:outletId', getTableStatusByOutlet);

// Ambil status meja berdasarkan outlet
router.get('/available-bypeople/:outletId', getAvailableTablesByPeople);

export default router;