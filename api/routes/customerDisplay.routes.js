import express from 'express';
import { syncCart, showQris, clearDisplay } from '../controllers/customerDisplay.controller.js';

const router = express.Router();

router.post('/sync-cart', syncCart);
router.post('/show-qris', showQris);
router.post('/clear', clearDisplay);

export default router;
