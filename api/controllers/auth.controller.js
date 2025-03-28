import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { verifyToken } from '../utils/verifyUser.js';
import { Outlet } from '../models/Outlet.model.js';

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

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
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


    if (typeof identifier === "string" && identifier.includes("@")) {

      user = await User.findOne({ email: identifier });
      if (!user || user.role !== "customer") {
        return next(errorHandler(403, "Access denied"));
      }
      tokenExpiry = "7d";
    } else {
      user = await User.findOne({ username: identifier })
        .populate({
          path: "outlet.outletId",
          select: ["name", "admin"],
          populate: { path: "admin", select: "name" }

        });
      if (!user || !["superadmin", "admin", "staff", "cashier junior", "cashier senior"].includes(user.role)) {
        return next(errorHandler(403, "Access denied"));
      }
      tokenExpiry = "15m";
    }
    const cashier = [];
    if (user.role === "admin") {
      //mencari user yang rolenya casir pada outlet yang smaa dengan admin?
      const cashiers = await User.find({
        role: ["cashier junior", "cashier senior"],
      }).populate("outlet.outletId", "admin");

      cashier = cashiers;
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
    res.cookie("access_token", token, {
      httpOnly: true,
      maxAge: tokenExpiry === "7d" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 hari atau 1 hari dalam ms
    }).status(200).json(user.role !== "admin" ? { ...rest, token } : { ...rest, token, cashier });

  } catch (error) {
    next(error);
  }
};




export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
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
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(randomPassword, 10);

      const newUser = new User({
        username: `${req.body.name.replace(/\s/g, '').toLowerCase()}${Math.random().toString(36).slice(-4)}`,
        email: req.body.email,
        password: hashedPassword,
        profilePicture: req.body.photo,
      });

      await newUser.save();

      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const { password: hashedPassword2, ...rest } = newUser._doc;

      res
        .cookie('access_token', token, {
          httpOnly: true,
          maxAge: 3600000, // 1 hour
        })
        .status(200)
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};

export const signout = (req, res) => {
  res.clearCookie('access_token').status(200).json('Signout success!');
};

