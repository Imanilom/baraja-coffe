// routes/adms.routes.js
import express from 'express';
import bodyParser from 'body-parser';
import { 
  handleADMSUpload, 
  getFingerprintActivityLog,
  cleanupHistoricalData,
  clearDeviceBuffer,
  getDeviceStatus
} from '../controllers/hr/adms.controller.js';

const router = express.Router();

// Mesin fingerprint X105 ADMS upload endpoint
router.post('/iclock/cdata', bodyParser.text({ type: '*/*' }), handleADMSUpload);

// Device management endpoints
router.post('/device/clear-buffer', clearDeviceBuffer);
router.get('/device/status', getDeviceStatus);

// Get activity log untuk monitoring
router.get('/fingerprint/activities', getFingerprintActivityLog);

// Cleanup historical data
router.delete('/fingerprint/cleanup', cleanupHistoricalData);

export default router;