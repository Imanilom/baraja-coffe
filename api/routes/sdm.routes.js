import express from 'express';
import { fingerprintController } from '../controllers/hr/fingerprint.controller';

const router = express.Router();

// Fingerprint routes dengan deviceUserId
router.post('/fingerprints/register', fingerprintController.registerFingerprint);
router.get('/fingerprints/employee/:employeeId', fingerprintController.getFingerprintsByEmployee);
router.get('/fingerprints/device-user/:deviceUserId', fingerprintController.getFingerprintByDeviceUserId);
router.post('/fingerprints/verify', fingerprintController.verifyFingerprint);
router.put('/fingerprints/:id/device-user', fingerprintController.updateDeviceUserId);
router.post('/fingerprints/sync', fingerprintController.syncWithDevice);
router.post('/fingerprints/bulk-sync', fingerprintController.bulkSyncWithDevice);
router.get('/fingerprints/device-users', fingerprintController.getAllDeviceUsers);
router.delete('/fingerprints/:id', fingerprintController.deleteFingerprint);
router.put('/fingerprints/:id/deactivate', fingerprintController.deactivateFingerprint);

export default router;