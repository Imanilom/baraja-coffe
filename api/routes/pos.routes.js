import express from 'express';
import { billBar, billKitchen } from '../controllers/pos.controller.js';
import { createStaff, login, registerAdmin } from '../controllers/authStaff.controller.js';
// import { verifyToken } from '../utils/verifyUser.js';
import jwt from 'jsonwebtoken';
const router = express.Router();


export const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;  // <-- Harus ada ini agar `req.user` tidak undefined
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid token." });
    }
};


// Middleware tambahan untuk membatasi akses peran tertentu
const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Access denied" });
        }
        next();
    };
};

export const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Only admin can perform this action" });
    }
    next();
};

const authorizeCashier = (allowedTypes) => {
    return (req, res, next) => {
        if (req.user.role !== 'cashier') {
            return res.status(403).json({ message: "Forbidden: Only cashiers allowed" });
        }
        if (!allowedTypes.includes(req.user.cashierType)) {
            return res.status(403).json({ message: "Forbidden: Cashier type not authorized" });
        }
        next();
    };
};

// Endpoint untuk membuat admin baru
router.post('/register-admin', registerAdmin);

// LOGIN: Hanya Admin dan Cashier bisa login
router.post('/login', login);

// Hanya Admin bisa menambahkan Staff & Cashier
router.post('/add-staff', verifyToken, authorizeAdmin, createStaff);

// Dashboard untuk Admin & Cashier
router.get('/dashboard', verifyToken, authorizeRole(['admin']), (req, res) => {
    res.json({ message: "Welcome to dashboard Admin" });
});

// Halaman khusus untuk Cashier Bar
router.get('/cashier', verifyToken, authorizeCashier(['bar', 'bar-outlet-2', 'bar-outlet-3', 'drive-thru']), (req, res) => {
    res.json({ message: "Welcome Cashier" });
});

// POS Routes
router.get('/kitchen', billKitchen);
router.get('/bar', billBar);

export default router;
