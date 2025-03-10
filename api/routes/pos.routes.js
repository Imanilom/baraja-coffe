import express from 'express';
import { generateBill } from '../controllers/pos.controller.js';
const router = express.Router();

router.get('/generateBills/:id', generateBill);

export default router;
