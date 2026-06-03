import mongoose from "mongoose";

const FcmTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true, // pastikan 1 user = 1 dokumen
    },
    fcmTokens: [
        {
            token: { type: String, required: true },
            deviceType: { type: String, default: "android" },
            lastUsedAt: { type: Date, default: Date.now }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const FcmToken = mongoose.model("FcmToken", FcmTokenSchema);
export default FcmToken;
