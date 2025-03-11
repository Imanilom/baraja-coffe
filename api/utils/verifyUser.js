import jwt from "jsonwebtoken";
import { errorHandler } from './error.js';
import User from "../models/user.model.js";

export const verifyToken = (roles) => {
    return async (req, res, next) => {
        const token = req.cookies.access_token;
        if (!token) return next(errorHandler(401, 'You are not authenticated!'));

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

