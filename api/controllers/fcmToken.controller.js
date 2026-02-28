import FcmToken from "../models/FcmToken.model.js";
import { errorHandler } from "../utils/error.js";

// export const saveFcmToken = async (req, res, next) => {
//     try {
//         console.log("🔄 FCM Token save request received");
//         console.log("👤 User ID:", req.user.id);
//         console.log("📱 Request body:", req.body);

//         const userId = req.user.id;
//         const { fcm_token, device_type } = req.body;

//         if (!fcm_token) {
//             console.log("❌ FCM token is missing");
//             return next(errorHandler(400, "FCM token is required"));
//         }

//         console.log("🔍 Checking existing token for user:", userId);

//         // Check if token already exists
//         const existingToken = await FcmToken.findOne({
//             user: userId,
//             fcmToken: fcm_token
//         });

//         if (existingToken) {
//             console.log("🔄 Token already exists, updating lastUsedAt");
//             existingToken.lastUsedAt = new Date();
//             existingToken.deviceType = device_type || "android";
//             await existingToken.save();

//             return res.status(200).json({
//                 message: "FCM token updated",
//                 token: existingToken,
//                 action: "updated"
//             });
//         }

//         // Create new token
//         console.log("➕ Creating new FCM token");
//         const tokenDoc = new FcmToken({
//             user: userId,
//             fcmToken: fcm_token,
//             deviceType: device_type || "android",
//             lastUsedAt: new Date()
//         });

//         await tokenDoc.save();
//         console.log("✅ FCM token saved successfully:", tokenDoc._id);

//         res.status(200).json({
//             message: "FCM token saved",
//             token: tokenDoc,
//             action: "created"
//         });
//     } catch (err) {
//         console.error("💥 Error in saveFcmToken:", err);

//         // Handle duplicate key error specifically
//         if (err.code === 11000) {
//             console.log("🔄 Duplicate key error, trying to update existing token");
//             try {
//                 const userId = req.user.id;
//                 const { fcm_token, device_type } = req.body;

//                 const tokenDoc = await FcmToken.findOneAndUpdate(
//                     { user: userId, fcmToken: fcm_token },
//                     {
//                         user: userId,
//                         fcmToken: fcm_token,
//                         deviceType: device_type || "android",
//                         lastUsedAt: new Date()
//                     },
//                     { new: true }
//                 );

//                 return res.status(200).json({
//                     message: "FCM token updated",
//                     token: tokenDoc,
//                     action: "updated_after_duplicate"
//                 });
//             } catch (updateErr) {
//                 console.error("💥 Error updating after duplicate:", updateErr);
//                 return next(errorHandler(500, "Failed to save FCM token"));
//             }
//         }

//         next(err);
//     }
// };

// export const removeFcmToken = async (req, res, next) => {
//     try {
//         console.log("🗑️ FCM Token remove request received");
//         console.log("👤 User ID:", req.user.id);
//         console.log("📱 Request body:", req.body);

//         const userId = req.user.id;
//         const { fcm_token } = req.body;

//         if (!fcm_token) {
//             console.log("❌ FCM token is missing");
//             return next(errorHandler(400, "FCM token is required"));
//         }

//         const result = await FcmToken.findOneAndDelete({
//             user: userId,
//             fcmToken: fcm_token
//         });

//         if (result) {
//             console.log("✅ FCM token removed successfully");
//         } else {
//             console.log("⚠️ FCM token not found for removal");
//         }

//         res.status(200).json({
//             message: "FCM token removed",
//             found: !!result
//         });
//     } catch (err) {
//         console.error("💥 Error in removeFcmToken:", err);
//         next(err);
//     }
// };


export const saveFcmToken = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { fcm_token, device_type } = req.body;

        if (!fcm_token) {
            return next(errorHandler(400, "FCM token is required"));
        }

        // Cari dokumen user
        let tokenDoc = await FcmToken.findOne({ user: userId });

        if (!tokenDoc) {
            // buat baru kalau belum ada
            tokenDoc = new FcmToken({
                user: userId,
                fcmTokens: [
                    {
                        token: fcm_token,
                        deviceType: device_type || "android",
                        lastUsedAt: new Date()
                    }
                ]
            });
        } else {
            // cek apakah token sudah ada
            const existing = tokenDoc.fcmTokens.find(t => t.token === fcm_token);

            if (existing) {
                existing.lastUsedAt = new Date();
                existing.deviceType = device_type || "android";
            } else {
                // push token baru
                tokenDoc.fcmTokens.push({
                    token: fcm_token,
                    deviceType: device_type || "android",
                    lastUsedAt: new Date()
                });
            }
        }

        await tokenDoc.save();

        res.status(200).json({
            message: "FCM tokens updated",
            tokens: tokenDoc.fcmTokens
        });
    } catch (err) {
        console.error("💥 Error in saveFcmToken:", err);
        next(err);
    }
};
export const removeFcmToken = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { fcm_token } = req.body;

        const tokenDoc = await FcmToken.findOneAndUpdate(
            { user: userId },
            { $pull: { fcmTokens: { token: fcm_token } } },
            { new: true }
        );

        res.status(200).json({
            message: "FCM token removed",
            tokens: tokenDoc ? tokenDoc.fcmTokens : []
        });
    } catch (err) {
        console.error("💥 Error in removeFcmToken:", err);
        next(err);
    }
};

export const getUserTokens = async (req, res, next) => {
    try {
        console.log("📋 Get user tokens request received");
        console.log("👤 User ID:", req.user.id);

        const userId = req.user.id;
        const tokens = await FcmToken.find({ user: userId });

        console.log("📊 Found tokens:", tokens.length);

        res.status(200).json({
            count: tokens.length,
            tokens: tokens
        });
    } catch (err) {
        console.error("💥 Error in getUserTokens:", err);
        next(err);
    }
};