import express from "express";
import {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/", createNotification); // POST /notifications
router.get("/:userId", getUserNotifications); // GET /notifications/:userId
router.patch("/:id/read", markAsRead); // PATCH /notifications/:id/read
router.patch("/:userId/read-all", markAllAsRead); // PATCH /notifications/:userId/read-all

export default router;