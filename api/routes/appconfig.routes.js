import express from 'express';
import {
    getAppConfig,
    updateAppConfig,
    initializeDefaultConfigs
} from '../controllers/appconfig.controller.js';

const router = express.Router();

// Public endpoint - get app config (no auth required for app to fetch)
router.get('/', getAppConfig);

// Admin endpoints - require authentication
router.put('/:key', updateAppConfig);
router.post('/init', initializeDefaultConfigs);

export default router;
