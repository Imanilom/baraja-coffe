import express from "express";
import { authMiddleware } from "../utils/verifyUser.js";
import { saveFcmToken, removeFcmToken, getUserTokens } from "../controllers/fcmToken.controller.js";

const router = express.Router();

router.post("/save-fcm-token", authMiddleware, saveFcmToken);
router.post("/remove-fcm-token", authMiddleware, removeFcmToken);
router.get("/my-fcm-tokens", authMiddleware, getUserTokens);

export default router;
