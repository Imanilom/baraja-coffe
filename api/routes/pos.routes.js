import express from 'express';
import { billBar, billKitchen } from '../controllers/pos.controller.js';
const router = express.Router();

router.get('/kitchen', billKitchen);
router.get('/bar', billBar);

export default router;
