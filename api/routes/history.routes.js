import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { getHistoryAll } from '../controllers/history.controller.js';

const router = express.Router();

// Middleware for admin and superadmin only
const adminAccess = verifyToken(['admin', 'superadmin']);

// MenuItem Routes
router.get('/', getHistoryAll); // Get all History

export default router;
