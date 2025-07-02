import User from '../models/user.model.js';
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
    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });

    const savedUser = await newUser.save();

    // Buat payload untuk token
    const payload = {
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email
    };

    // Generate token
    const token = jwt.sign({ id: payload.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Kirimkan response
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return next(errorHandler(400, "Identifier and password are required"));
    }

    let user = null;
    let tokenExpiry = "1h";

    // Login sebagai customer
    if (typeof identifier === "string" && identifier.includes("@")) {
      user = await User.findOne({ email: identifier });
      if (!user || user.role !== "customer") {
        return next(errorHandler(403, "Access denied"));
      }
      tokenExpiry = "7d";
    } else {
      // Login sebagai admin, staff, kasir, dll
      user = await User.findOne({ username: identifier }).populate({
        path: "outlet.outletId",
        select: ["name", "admin"],
        populate: { path: "admin", select: "name" },
      });

      if (
        !user ||
        !["superadmin", "admin", "marketing", "akuntan", "inventory", "operational", "staff", "cashier junior", "cashier senior"].includes(user.role)
      ) {
        return next(errorHandler(403, "Access denied"));
      }

      tokenExpiry = "7d";


      // Komentar ini bisa diaktifkan kembali jika validasi diperlukan
      /*
      const { deviceId, deviceName, location } = req.body;
      const isDeviceRestricted = !["customer", "superadmin"].includes(user.role);
      if (isDeviceRestricted) {
        if (!deviceId || !location) {
          return next(errorHandler(400, "Device ID dan lokasi wajib diisi"));
        }

        const outletId = user.outlet?.outletId?._id || user.outlet?.outletId;

        const quota = await DeviceQuota.findOne({ outlet: outletId });
        const roleQuota = quota?.quotas?.find(q => q.role === user.role);
        const maxAllowed = roleQuota?.maxDevices || 0;

        const activeDevicesCount = await Device.countDocuments({
          outlet: outletId,
          role: user.role,
          isActive: true
        });

        if (activeDevicesCount >= maxAllowed) {
          return next(errorHandler(403, `Kuota perangkat untuk role ${user.role} sudah penuh di outlet ini.`));
        }

        await Device.findOneAndUpdate(
          { deviceId, outlet: outletId },
          {
            outlet: outletId,
            role: user.role,
            deviceName: deviceName || `Perangkat ${user.role}`,
            location,
            isActive: true,
            lastLogin: new Date()
          },
          { upsert: true, new: true }
        );
      }
      */
    }

    if (!user) return next(errorHandler(404, "User not found"));

    const isValidPassword = bcryptjs.compareSync(password, user.password);
    if (!isValidPassword) return next(errorHandler(401, "Wrong credentials"));

    const token = jwt.sign(
      { id: user._id, role: user.role, cashierType: user.cashierType },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    const { password: hashedPassword, ...rest } = user._doc;
    let response = { ...rest, token };
    // console.log('proses login berhasil');
    // Tambahkan daftar kasir jika user adalah admin
    if (user.role === "admin") {
      const cashier = await User.find({
        role: ["cashier junior", "cashier senior"],
      }).populate("outlet.outletId", "admin");
      response.cashiers = cashier;
    }

    res.cookie("access_token", token, {
      httpOnly: true,
      maxAge: tokenExpiry === "7d" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    }).status(200).json(response);
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

    // console.log("ID TOKEN YANG DITERIMA:", idToken);


    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: name,
        email,
        password: "-", // Atau set default yang aman
        profilePicture: picture,
        role: "customer",
        consumerType: 'bronze', // <-- Tambahkan ini untuk mastiin
      });
      console.log("Creating user:", user);
      await user.save();
    }


    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const { password, ...userData } = user._doc;

    res.status(200).json({ user: userData, token });
  } catch (err) {
    res.status(401).json({ message: "Invalid Google token" });
  }
};

export const signout = (req, res) => {
  res.clearCookie('access_token').status(200).json('Signout success!');
};



