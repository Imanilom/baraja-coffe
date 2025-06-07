import jwt from "jsonwebtoken";
import { errorHandler } from './error.js';
import User from "../models/user.model.js";

export const verifyToken = (roles) => {
  return async (req, res, next) => {
    let token = null;

    // Ambil token dari Authorization header jika ada
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Jika tidak ada di header, ambil dari cookies
    if (!token && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return next(errorHandler(401, 'You are not authenticated!'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(errorHandler(403, 'Invalid token!'));
      }

      req.user = user;

      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      next();
    } catch (err) {
      return next(errorHandler(403, 'Token is not valid!'));
    }
  };
};



export const googleToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Menyimpan decoded token di req.user
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token tidak tersedia' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Simpan user ID ke req.user
        console.log('Token valid, user ID:', decoded.id); // Tambahkan log ini
        next();
    } catch (err) {
        console.error('Token tidak valid:', err); // Tambahkan log ini
        res.status(401).json({ message: 'Token tidak valid' });
    }
};

// // Middleware tambahan untuk membatasi akses peran tertentu
// export const authorizeRole = (allowedRoles) => {
//     return (req, res, next) => {
//         if (!allowedRoles.includes(req.user.role)) {
//             return res.status(403).json({ message: "Forbidden: Access denied" });
//         }
//         next();
//     };
// };

// export const authorizeAdmin = (req, res, next) => {
//     if (req.user.role !== 'admin') {
//         return res.status(403).json({ message: "Forbidden: Only admin can perform this action" });
//     }
//     next();
// };

// export const authorizeCashier = (allowedTypes) => {
//     return (req, res, next) => {
//         if (req.user.role !== 'cashier') {
//             return res.status(403).json({ message: "Forbidden: Only cashiers allowed" });
//         }
//         if (!allowedTypes.includes(req.user.cashierType)) {
//             return res.status(403).json({ message: "Forbidden: Cashier type not authorized" });
//         }
//         next();
//     };
// };

