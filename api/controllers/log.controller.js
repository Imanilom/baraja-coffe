// controllers/log.controller.js
import { Log } from "../models/Log.model.js";

// Menampilkan semua log aktivitas (opsional: dengan pagination & filter)
export const getAllLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, action, status } = req.query;

    // Bangun filter query
    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (status) filter.status = status;

    const logs = await Log.find(filter)
      .sort({ createdAt: -1 }) // urutkan dari terbaru
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("userId", "username email") // opsional: populate user jika userId adalah ObjectId
      .exec();

    const total = await Log.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching logs",
    });
  }
};

// Opsional: Ambil log berdasarkan ID
export const getLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await Log.findById(id).populate("userId", "username email");

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Log not found",
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("Error fetching log by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};