import { Log } from "../models/Log.model.js";

export const logActivity = async ({
  userId,
  identifier,
  action,
  status,
  req,
}) => {
  try {
    await Log.create({
      userId,
      identifier,
      action,
      status,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error("Failed to save log:", err.message);
  }
};
