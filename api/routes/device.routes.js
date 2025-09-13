// routes/device.routes.js
import { Router } from 'express';
import {
  createDevice,
  getDevicesByOutlet,
  updateDevice,
  deleteDevice,
  setDeviceQuotas,
  getDeviceQuotas,
} from '../controllers/device.controller.js';

const router = Router();

// Device CRUD
router.post('/devices', createDevice);
router.get('/devices', getDevicesByOutlet);
router.put('/devices/:id', updateDevice);
router.delete('/devices/:id', deleteDevice);

// Quota Management
router.post('/quotas', setDeviceQuotas);
router.get('/quotas', getDeviceQuotas);


export default router;