import express from 'express';
import { createBatchShifts } from '../controllers/hr.controller.js';

import { verifyToken } from '../utils/verifyUser.js';

const adminAccess = verifyToken(['admin', 'superadmin']);
const operationalAccess = verifyToken(['superadmin','admin','operational']);
const cashierAccess = verifyToken(['bar-1-amphi', 'bar-2-amphi', 'bar-3-amphi', 'bar-tp', 'bar-dp', 'drive-thru']);

const router = express.Router();

// Dashboard untuk Admin & Cashier
router.get('/dashboard', adminAccess, (req, res) => {
    res.json({ message: "Welcome to dashboard Admin" });
});

// Halaman khusus untuk Cashier Bar
router.get('/cashier', cashierAccess, (req, res) => {
    res.json({ message: "Welcome Cashier" });
});

// Hanya Admin bisa membuat jadwal shift
router.post('/batch-shifts', createBatchShifts);

export default router;
