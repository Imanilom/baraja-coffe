import express from 'express';
import {
  createLocation,
  getLocationById,
  updateLocation,
  deleteLocation,
  setPrimaryLocation,
  toggleLocationStatus,
  getLocationsNearby
} from '../controllers/location.controller.js';

const router = express.Router();

router.post('/', createLocation);
router.get('/:id', getLocationById);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);
router.patch('/:id/set-primary', setPrimaryLocation);
router.patch('/:id/toggle-status', toggleLocationStatus);
router.get('/nearby/locations', getLocationsNearby);

export default router;