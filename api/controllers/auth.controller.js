import User from '../models/user.model.js';
import Role from "../models/Role.model.js";
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { Device } from "../models/Device.model.js";
import { DeviceQuota } from "../models/DeviceQuota.model.js";
import { verifyToken } from '../utils/verifyUser.js';
import { Outlet } from '../models/Outlet.model.js';
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import { logActivity } from '../helpers/logActivity.js';

// Initialize Firebase Admin
// admin.initializeApp({
//   credential: admin.credential.cert({
//     projectId: "import.meta.env.VITE_FIREBASE_PROJECT_ID",
//     clientEmail: "import.meta.env.VITE_FIREBASE_CLIENT_EMAIL",
//     privateKey: "import.meta.env.VITE_FIREBASE_PRIVATE_KEY"?.replace(/\\n/g, '\n'),
//   }),
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
// });

export const sendOTP = async (req, res, next) => {
  const { phoneNumber } = req.body;

  try {
    const formattedPhoneNumber = `+62${phoneNumber.replace(/^0+/, '')}`;
    // Kirim OTP menggunakan Firebase Authentication
    const sessionInfo = await admin.auth().createCustomToken(formattedPhoneNumber);
    res.status(200).json({ sessionInfo });
  } catch (error) {
    next(errorHandler(500, 'Failed to send OTP'));
  }
};

export const verifyOTP = async (req, res, next) => {
  const { phoneNumber, otpCode } = req.body;

  try {
    // Verifikasi OTP
    const decodedToken = await admin.auth().verifyIdToken(otpCode);

    if (decodedToken.phone_number === phoneNumber) {
      const user = await User.findOne({ phoneNumber });
      if (!user) return next(errorHandler(404, 'User not found'));

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const { password: hashedPassword, ...rest } = user._doc;

      res
        .cookie('access_token', token, {
          httpOnly: true,
          maxAge: 3600000, // 1 hour
        })
        .status(200)
        .json(rest);
    } else {
      return next(errorHandler(400, 'Invalid OTP'));
    }
  } catch (error) {
    next(errorHandler(500, 'Failed to verify OTP'));
  }
};

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return next(errorHandler(400, "Username, email, and password are required"));
    }

    // Hash password
    const hashedPassword = bcryptjs.hashSync(password, 10);

    // Cari role default = customer
    const customerRole = await Role.findOne({ name: "customer" });
    if (!customerRole) {
      return next(errorHandler(500, "Default role 'customer' not found. Please seed roles first."));
    }

    // Buat user baru
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: customerRole._id,  // 🔑 pakai ObjectId dari role
      authType: "local",       // set default authType
      loyaltyPoints: 0,
    });

    const savedUser = await newUser.save();

    // Buat token
    const token = jwt.sign(
      { id: savedUser._id, role: customerRole.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Kirim response
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        role: customerRole.name,   // ✅ tampilkan nama role, bukan ObjectId
        authType: savedUser.authType,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};


export const signin = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      await logActivity({
        identifier,
        action: "LOGIN",
        module: "Authentication",
        description: "Login gagal: identifier/password kosong",
        status: "FAILED",
        req,
      });
      return next(errorHandler(400, "Identifier and password are required"));
    }

    let user = null;
    let tokenExpiry = "1h";

    // Customer login pakai email
    if (typeof identifier === "string" && identifier.includes("@")) {
      user = await User.findOne({ email: identifier }).populate("role");
      if (!user || user.role.name !== "customer") {
        await logActivity({
          identifier,
          action: "LOGIN",
          module: "Authentication",
          description: "Login gagal: bukan customer",
          status: "FAILED",
          req,
        });
        return next(errorHandler(403, "Access denied"));
      }
      tokenExpiry = "7d";
    } else {
      // Staff / Admin login pakai username
      user = await User.findOne({ username: identifier })
        .populate("role")
        .populate({
          path: "outlet.outletId",
          select: ["name", "admin"],
          populate: { path: "admin", select: "name" },
        });

      const allowedRoles = [
        "superadmin",
        "admin",
        "marketing",
        "akuntan",
        "inventory",
        "operational",
        "jro",
        "qc",
        "hrd",
        "staff",
        "cashier junior",
        "cashier senior",
      ];

      if (!user || !allowedRoles.includes(user.role.name)) {
        await logActivity({
          identifier,
          action: "LOGIN",
          module: "Authentication",
          description: "Login gagal: role tidak diizinkan",
          status: "FAILED",
          req,
        });
        return next(errorHandler(403, "Access denied"));
      }

      tokenExpiry = "7d";
    }

    if (!user) {
      await logActivity({
        identifier,
        action: "LOGIN",
        module: "Authentication",
        description: "Login gagal: user tidak ditemukan",
        status: "FAILED",
        req,
      });
      return next(errorHandler(404, "User not found"));
    }

    // ✅ Tambahkan default authType kalau belum ada
    if (!user.authType || user.authType === "") {
      user.authType = "local";
      await user.save();
      console.log("Updated authType to 'local' for user:", user.email || user.username);
    }

    const isValidPassword = bcryptjs.compareSync(password, user.password);
    if (!isValidPassword) {
      await logActivity({
        userId: user._id,
        identifier,
        action: "LOGIN",
        module: "Authentication",
        description: "Login gagal: password salah",
        status: "FAILED",
        req,
      });
      return next(errorHandler(401, "Wrong credentials"));
    }

    // ✅ Simpan role.name, bukan ObjectId
    const token = jwt.sign(
      {
        id: user._id,
        rolePermission: user.role.permissions,
        role: user.role.name,
        cashierType: user.cashierType,
      },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    const { password: hashedPassword, ...rest } = user._doc;
    let response = { ...rest, role: user.role.name, rolePermission: user.role.permissions, token };

    // Jika admin, ambil daftar cashier
    if (user.role.name === "admin") {
      const cashierRoles = await Role.find({
        name: { $in: ["cashier junior", "cashier senior"] },
      });
      const cashierRoleIds = cashierRoles.map((r) => r._id);

      const cashiers = await User.find({ role: { $in: cashierRoleIds } })
        .populate("role")
        .populate("outlet.outletId", "admin");

      response.cashiers = cashiers.map((c) => ({
        ...c._doc,
        role: c.role.name,
      }));
    }

    // ✅ Catat log sukses
    await logActivity({
      userId: user._id,
      identifier,
      action: "LOGIN",
      module: "Authentication",
      description: "Login berhasil",
      status: "SUCCESS",
      req,
    });

    res
      .cookie("access_token", token, {
        httpOnly: true,
        maxAge:
          tokenExpiry === "7d"
            ? 7 * 24 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json(response);
  } catch (error) {
    next(error);
  }
};


export const googleAuth = async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Cari role default "customer"
    const customerRole = await Role.findOne({ name: "customer" });
    if (!customerRole) {
      return res
        .status(500)
        .json({ message: "Default role 'customer' not found. Please seed roles first." });
    }

    let user = await User.findOne({ email }).populate("role");

    if (!user) {
      user = new User({
        username: name,
        email,
        password: "-", // karena Google login
        profilePicture: picture,
        role: customerRole._id,  // 🔑 simpan ObjectId
        authType: "google",
      });
      await user.save();
    } else {
      // update authType jika user sudah ada
      user.authType = "google";
      await user.save();
      console.log("Updated authType to 'google' for user:", user.email);
    }

    // Buat token (simpan role.name supaya gampang dipakai frontend)
    const token = jwt.sign(
      { id: user._id, role: user.role?.name || customerRole.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Buat response user (hilangkan password)
    const { password, ...userData } = user._doc;

    res.status(200).json({
      user: {
        ...userData,
        role: user.role?.name || customerRole.name,
      },
      token,
    });
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(401).json({ message: "Invalid Google token" });
  }
};


export const signout = async (req, res) => {
  try {
    await logActivity({
      userId: req.user?.id,
      identifier: req.user?.email || req.user?.username,
      action: "LOGOUT",
      module: "Authentication",
      description: "User logout",
      status: "SUCCESS",
      req,
    });
  } catch (err) {
    console.error("Log error:", err.message);
  }

  res.clearCookie("access_token").status(200).json("Signout success!");
};



