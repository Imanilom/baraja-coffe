// routes/log.routes.js
import express from "express";
import { getAllLogs, getLogById } from "../controllers/log.controller.js";
import { verifyToken } from '../utils/verifyUser.js';
const router = express.Router();

// Middleware for admin and superadmin only
const adminAccess = verifyToken(['admin', 'superadmin']);
// GET /api/logs → menampilkan semua log aktivitas
router.get("/", adminAccess, getAllLogs);

// GET /api/logs/:id → menampilkan log berdasarkan ID
router.get("/:id", adminAccess, getLogById);

export default router;