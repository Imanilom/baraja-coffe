import admin from 'firebase-admin';
import serviceAccount from './service-account-key.json' with { type: 'json' };

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('✅ Firebase Admin SDK initialized successfully');
        } catch (error) {
            console.error('💥 Error initializing Firebase Admin SDK:', error);
        }
    }
};

export { initializeFirebase };
