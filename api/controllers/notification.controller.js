import Notification from "../models/Notification.model.js";
import FCMNotificationService from "../services/fcmNotificationService.js";
import FcmToken from "../models/FcmToken.model.js";
/**
 * Create a new notification (and send via FCM if needed)
 */

export const createNotification = async (req, res) => {
    try {
        const { userId, title, message, type, imageUrl } = req.body;

        if (!userId || !title || !message) {
            return res.status(400).json({ success: false, message: "userId, title, and message are required" });
        }

        // ✅ Pastikan user punya FCM token dulu
        const userTokensDoc = await FcmToken.findOne({ user: userId });
        if (!userTokensDoc) {
            return res.status(404).json({ success: false, message: "User has no FCM token registered" });
        }

        // 1. Simpan ke MongoDB (riwayat notifikasi user)
        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
            imageUrl,
        });

        // 2. Kirim via FCM pakai token dari koleksi FcmToken
        const fcmResult = await FCMNotificationService.sendToUser(
            userId,
            {
                title,
                body: message,
                imageUrl
            },
            { type }
        );

        return res.status(201).json({
            success: true,
            message: "Notification created & sent",
            fcmResult,
            data: notification,
        });
    } catch (error) {
        console.error("❌ Error creating notification:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all notifications for a specific user
 */
export const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 });

        return res.json({ success: true, data: notifications });
    } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notif = await Notification.findByIdAndUpdate(
            id,
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notif) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        return res.json({ success: true, data: notif });
    } catch (error) {
        console.error("❌ Error marking notification as read:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Mark all notifications as read for a specific user
 */
export const markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await Notification.updateMany(
            { user: userId, isRead: false },
            { $set: { isRead: true } }
        );

        return res.json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("❌ Error marking all notifications as read:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};