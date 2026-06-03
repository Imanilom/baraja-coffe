// helpers/firebase.helper.js
// Helper untuk mengirim Push Notification via Firebase Cloud Messaging (FCM)

import admin from 'firebase-admin';
import { DeviceSession } from '../models/DeviceSession.model.js';

/**
 * Mengirim Push Notification ke satu atau beberapa device berdasarkan FCM tokens.
 * @param {string[]} tokens - Array FCM token device tujuan
 * @param {string} title - Judul notifikasi
 * @param {string} body - Isi/body notifikasi
 * @param {object} data - Data tambahan yang dikirim bersama notifikasi (opsional)
 */
export async function sendPushNotification(tokens, title, body, data = {}) {
    if (!tokens || tokens.length === 0) {
        console.log('⚠️ [FCM] No tokens provided, skipping push notification');
        return;
    }

    // Filter token kosong
    const validTokens = tokens.filter(t => t && t.trim() !== '');
    if (validTokens.length === 0) {
        console.log('⚠️ [FCM] No valid tokens after filtering, skipping');
        return;
    }

    try {
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'orders_channel',
                    priority: 'max',
                    defaultSound: true,
                    defaultVibrateTimings: true,
                }
            },
            tokens: validTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        console.log(`📲 [FCM] Sent: ${response.successCount} success, ${response.failureCount} failed`);

        // Hapus token yang sudah tidak valid dari database
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code;
                    // Token tidak valid atau kadaluarsa
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered') {
                        failedTokens.push(validTokens[idx]);
                    }
                    console.warn(`  ❌ Token[${idx}]: ${resp.error?.message}`);
                }
            });

            // Bersihkan token invalid dari database
            if (failedTokens.length > 0) {
                await DeviceSession.updateMany(
                    { fcmToken: { $in: failedTokens } },
                    { $set: { fcmToken: '' } }
                );
                console.log(`🧹 [FCM] Cleaned ${failedTokens.length} invalid tokens from DB`);
            }
        }

        return response;
    } catch (error) {
        console.error('❌ [FCM] Error sending push notification:', error.message);
    }
}

/**
 * Mengirim Push Notification ke semua device kasir aktif pada suatu outlet.
 * @param {string} outletId - ID outlet tujuan
 * @param {string} title - Judul notifikasi
 * @param {string} body - Isi notifikasi
 * @param {object} data - Data tambahan
 */
export async function sendPushToOutletDevices(outletId, title, body, data = {}) {
    try {
        // Cari sesi yang memiliki FCM token pada outlet ini.
        // Tidak filter isActive karena saat app di-kill, session sudah di-set inactive,
        // tapi FCM token masih valid untuk push notification.
        // Batasi ke sesi yang login dalam 24 jam terakhir agar tidak kirim ke token lama.
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const sessions = await DeviceSession.find({
            outlet: outletId,
            fcmToken: { $exists: true, $ne: '' },
            loginTime: { $gte: cutoff },
        }).lean();

        // Deduplicate tokens (satu device bisa punya beberapa session)
        const uniqueTokens = [...new Set(sessions.map(s => s.fcmToken))];

        if (uniqueTokens.length === 0) {
            console.log(`⚠️ [FCM] No devices with FCM token for outlet ${outletId}`);
            return;
        }

        console.log(`📲 [FCM] Sending to ${uniqueTokens.length} devices in outlet ${outletId}`);
        return await sendPushNotification(uniqueTokens, title, body, data);
    } catch (error) {
        console.error('❌ [FCM] Error sending push to outlet devices:', error.message);
    }
}
