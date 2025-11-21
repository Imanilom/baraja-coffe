import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  identifier: { type: String }, // email / username / phoneNumber
  action: { type: String, required: true }, // contoh: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, EXPORT, IMPORT
  module: { type: String }, // contoh: "User Management", "Inventory", "Outlet"
  description: { type: String }, // catatan detail: "User A membuat produk B"
  status: {
    type: String,
    enum: ["SUCCESS", "FAILED"],
    default: "SUCCESS",
  },
  ip: { type: String },
  userAgent: { type: String },
  metadata: { type: Object }, // simpan data tambahan (misalnya id object yang diedit)
  createdAt: { type: Date, default: Date.now },
});

export const Log = mongoose.model("Log", logSchema);
