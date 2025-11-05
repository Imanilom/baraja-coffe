import express from 'express';
import bodyParser from 'body-parser';
import { handleADMSUpload } from '../controllers/hr/adms.controller.js';

const router = express.Router();

// Mesin fingerprint X105 ADMS upload endpoint
router.post('/iclock/cdata', bodyParser.text({ type: '*/*' }), handleADMSUpload);

export default router;
