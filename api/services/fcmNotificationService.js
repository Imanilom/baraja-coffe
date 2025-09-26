// services/fcmNotificationService.js
import admin from 'firebase-admin';
import FcmToken from '../models/FcmToken.model.js';

class FCMNotificationService {
    /**
     * Send notification to specific user
     */

    async sendToUser(userId, notification, data = {}) {
        try {
            console.log(`📤 Sending notification to user: ${userId}`);

            // Ambil 1 dokumen user
            const userTokensDoc = await FcmToken.findOne({ user: userId });

            if (!userTokensDoc || !userTokensDoc.fcmTokens || userTokensDoc.fcmTokens.length === 0) {
                console.log(`⚠️ No FCM tokens found for user: ${userId}`);
                return { success: false, message: 'No FCM tokens found' };
            }

            const tokens = userTokensDoc.fcmTokens.map(t => t.token);

            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body,
                    ...(notification.imageUrl && { imageUrl: notification.imageUrl })
                },
                data: {
                    // Ensure all data values are strings
                    ...this.stringifyDataValues(data),
                    timestamp: new Date().toISOString(),
                    click_action: 'FLUTTER_NOTIFICATION_CLICK'
                }
            };

            const results = await Promise.allSettled(
                tokens.map(token => this.sendToToken(token, message))
            );

            let successCount = 0;
            const invalidTokens = [];

            results.forEach((result, idx) => {
                if (result.status === 'fulfilled' && result.value.success) {
                    successCount++;
                } else {
                    const error = result.reason || result.value.error;
                    console.log(`❌ Failed to send to token ${idx}: ${error}`);
                    if (this.isInvalidTokenError(error)) {
                        invalidTokens.push(tokens[idx]);
                    }
                }
            });

            if (invalidTokens.length > 0) {
                await this.cleanupInvalidTokens(userId, invalidTokens);
            }

            console.log(`✅ Notification sent successfully to ${successCount}/${tokens.length} tokens`);

            return {
                success: successCount > 0,
                message: `Sent to ${successCount}/${tokens.length} devices`,
                successCount,
                totalTokens: tokens.length
            };
        } catch (error) {
            console.error('💥 Error sending notification to user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Convert all data values to strings for FCM compatibility
     */
    stringifyDataValues(data) {
        const stringifiedData = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== null && value !== undefined) {
                stringifiedData[key] = String(value);
            }
        }
        return stringifiedData;
    }

    async sendToToken(token, message) {
        try {
            const result = await admin.messaging().send({ ...message, token });
            return { success: true, messageId: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    isInvalidTokenError(error) {
        const invalidErrors = [
            'registration-token-not-registered',
            'invalid-registration-token',
            'invalid-argument'
        ];
        return invalidErrors.some(e => error.toLowerCase().includes(e));
    }

    async cleanupInvalidTokens(userId, invalidTokens) {
        try {
            const result = await FcmToken.updateOne(
                { user: userId },
                { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
            );
            console.log(`🧹 Cleaned up ${result.modifiedCount} invalid tokens`);
        } catch (err) {
            console.error('💥 Error cleaning up invalid tokens:', err);
        }
    }

    async sendOrderConfirmationNotification(userId, orderData) {
        const notification = {
            title: '✅ Pesanan Dikonfirmasi!',
            body: `Pesanan anda sedang diproses`
            // body: `Pesanan ${orderData.orderId} sedang diproses oleh ${orderData.cashier.name}`
        };
        const data = {
            type: 'order_confirmation',
            order_id: orderData.orderId,
            status: 'OnProcess',
            cashier_id: orderData.cashier.id, // Will be converted to string by stringifyDataValues
            cashier_name: orderData.cashier.name
        };
        return this.sendToUser(userId, notification, data);
    }
}

export default new FCMNotificationService();