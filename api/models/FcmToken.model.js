import mongoose from "mongoose";

const FcmTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    fcmToken: {
        type: String,
        required: false,
    },
    deviceType: {
        type: String, // contoh: "android", "ios", "web"
        default: "android",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastUsedAt: {
        type: Date,
        default: Date.now,
    }
});

FcmTokenSchema.index({ user: 1, fcmToken: 1 }, { unique: true });

const FcmToken = mongoose.model("FcmToken", FcmTokenSchema);
export default FcmToken;
