import express from 'express';
import { createUser } from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
const adminAccess = verifyToken(['admin', 'superadmin']);
const cashierAccess = verifyToken(['bar-1-amphi', 'bar-2-amphi', 'bar-3-amphi', 'bar-tp', 'bar-dp', 'drive-thru']);
const router = express.Router();


// Hanya Admin bisa menambahkan Staff & Cashier
router.post('/add-staff', adminAccess, createUser);

// Dashboard untuk Admin & Cashier
router.get('/dashboard', adminAccess, (req, res) => {
    res.json({ message: "Welcome to dashboard Admin" });
});

// Halaman khusus untuk Cashier Bar
router.get('/cashier', cashierAccess, (req, res) => {
    res.json({ message: "Welcome Cashier" });
});

export default router;
