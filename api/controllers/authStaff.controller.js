import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Staff } from '../models/Staff.model.js';


export const registerAdmin = async (req, res) => {
    try {
        const { name, username, password, phone, email } = req.body;

        // Cek apakah username atau email sudah digunakan
        const existingUser = await Staff.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: "Username atau email sudah digunakan" });
        }

        // Hash password sebelum menyimpan
        const hashedPassword = await bcrypt.hash(password, 10);

        // Buat admin baru
        const newAdmin = new Staff({
            name,
            username,
            password: hashedPassword,
            position: "Manager",
            role: "admin",
            phone,
            email
        });

        await newAdmin.save();
        res.status(201).json({ message: "Admin berhasil dibuat" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createStaff = async (req, res) => {
    try {
        const { name, username, password, position, role, cashierType, phone, email } = req.body;

        // Pastikan hanya admin yang bisa menambah staff (sudah dicek di middleware)

        // Validasi: Jika role adalah 'cashier', maka harus ada `cashierType`
        if (role === 'cashier' && !cashierType) {
            return res.status(400).json({ message: "Cashier must have a cashierType" });
        }

        // Hash password sebelum disimpan
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan data staff baru
        const newStaff = new Staff({
            name,
            username,
            password: hashedPassword,
            position,
            role,
            cashierType: role === 'cashier' ? cashierType : null, // hanya isi jika cashier
            phone,
            email,
        });

        await newStaff.save();
        res.status(201).json({ message: "Staff created successfully", staff: newStaff });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Cari user berdasarkan username
        const user = await Staff.findOne({ username });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Cek apakah role user adalah 'staff'
        if (user.role === 'staff') {
            return res.status(403).json({ message: "Access denied" });
        }

        // Verifikasi password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Buat token JWT
        const token = jwt.sign(
            { id: user._id, role: user.role, cashierType: user.cashierType },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
