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

const router = express.Router();

router.post('/', createOutlet);
router.get('/', getAllOutlets);
router.get('/:id', getOutletById);
router.put('/:id', updateOutlet);
router.patch('/:id/toggle-status', toggleOutletStatus);
router.delete('/:id', deleteOutlet);

// Location-related routes
router.get('/:id/locations', getOutletLocations);
router.post('/:id/locations', addOutletLocation);

// Geospatial query
router.get('/nearby/locations', getNearbyOutlets);

export default router;