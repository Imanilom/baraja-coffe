import express from 'express';
import {
  createOutlet,
  getAllOutlets,
  getOutletById,
  updateOutlet,
  toggleOutletStatus,
  deleteOutlet,
  getOutletLocations,
  addOutletLocation,
  getNearbyOutlets
} from '../controllers/outlet.controller.js';

import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

const outletAccess = verifyToken(['superadmin', 'admin', 'marketing']);


router.post('/', outletAccess, createOutlet);
router.get('/', getAllOutlets);
router.get('/:id', getOutletById);
router.put('/:id', outletAccess, updateOutlet);
router.patch('/:id/toggle-status', outletAccess, toggleOutletStatus);
router.delete('/:id', outletAccess, deleteOutlet);

// Location-related routes
router.get('/:id/locations', getOutletLocations);
router.post('/:id/locations', outletAccess, addOutletLocation);

// Geospatial query
router.get('/nearby/locations', getNearbyOutlets);

export default router;