import admin from "firebase-admin";

// Inisialisasi Firebase Admin hanya sekali
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        // atau gunakan admin.credential.cert(serviceAccount)
    });
}

export const sendNotification = async (tokens, title, body, data = {}) => {
    if (!tokens || tokens.length === 0) return;

    const message = {
        notification: { title, body },
        data,
        tokens, // kirim ke banyak token sekaligus
    };

    try {
        const response = await admin.messaging().sendMulticast(message);
        console.log("✅ Notification sent:", response.successCount, "success,", response.failureCount, "failed");
    } catch (err) {
        console.error("❌ Error sending notification:", err);
    }
};
