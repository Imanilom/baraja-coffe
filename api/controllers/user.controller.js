import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

export const test = (req, res) => {
  res.json({ message: 'API is working!', user: req.user });
};

// Get all staff with filters
export const listStaff = async (req, res, next) => {
  try {
    const { role, outletId } = req.query;
    const query = {};

    if (role) query.role = role;
    if (outletId) query['outlet.outletId'] = mongoose.Types.ObjectId(outletId);

    const staff = await User.find(query)
      .select('-password')
      .populate('outlet.outletId', 'name address'); // Populasi outlet

    res.status(200).json(staff);
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Update user (User bisa mengupdate akun sendiri, Admin bisa mengupdate semua)
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found'));

    // Otorisasi: Hanya pemilik akun atau admin yang bisa mengupdate
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return next(errorHandler(401, 'Unauthorized'));
    }

    // Validasi password (jika ada)
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    // Persiapan data yang boleh diupdate
    const updateFields = {};

    // Field yang bisa diubah oleh semua pengguna (termasuk customer)
    if (req.body.username) updateFields.username = req.body.username;
    if (req.body.email) updateFields.email = req.body.email;
    if (req.body.phone) updateFields.phone = req.body.phone;
    if (req.body.profilePicture) updateFields.profilePicture = req.body.profilePicture;
    if (req.body.password) updateFields.password = req.body.password;

    // Hanya Admin yang bisa mengubah field berikut:
    if (req.user.role === 'admin') {
      if (req.body.role) updateFields.role = req.body.role;
      if (req.body.cashierType) updateFields.cashierType = req.body.cashierType;

      // Format outlet untuk admin
      if (req.body.outlet) {
        const formattedOutlets = req.body.outlet.map(id => ({
          outletId: mongoose.Types.ObjectId(id)
        }));
        updateFields.outlet = formattedOutlets;
      }
    }

    // Lakukan update
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    // Hapus password dari respons
    const { password, ...rest } = updatedUser.toObject();
    res.status(200).json(rest);
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Delete User (User bisa menghapus akun sendiri, Admin bisa menghapus semua)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found'));

    // Otorisasi: Hanya pemilik akun atau admin yang bisa menghapus
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return next(errorHandler(401, 'Unauthorized'));
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(errorHandler(500, error.message));
  }

};

// Assign Outlets to User (Admin Only)
export const assignOutlets = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found'));

    if (req.user.role !== 'admin') {
      return next(errorHandler(401, 'Unauthorized'));
    }

    // Format outlet IDs
    const formattedOutlets = req.body.outlet.map(id => ({
      outletId: mongoose.Types.ObjectId(id)
    }));

    // Update outlet field
    await User.findByIdAndUpdate(
      req.params.id,
      { $set: { outlet: formattedOutlets } },
      { new: true }
    );

    res.status(200).json({ message: 'Outlets assigned successfully' });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

export const getUSerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { password, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


export const getUserProfile = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password'); // Hindari return password

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.status(200).json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid' });
  }
};


// 1. Membuat Karyawan Baru (Staff/Cashier)
export const createEmployee = async (req, res, next) => {
  try {
    const {
      name,
      username,
      email,
      phone,
      password,
      role,
      cashierType,
      outlets = []
    } = req.body;

    // Validasi wajib
    if (!name || !username || !email || !role) {
      return next(errorHandler(400, 'Name, username, email dan role wajib diisi'));
    }

    // Jika role cashier, cashierType harus ada
    if (role === 'cashier' && !cashierType) {
      return next(errorHandler(400, 'Cashier type wajib diisi untuk role cashier'));
    }

    // Hash password jika ada
    const hashedPassword = password ? await bcrypt.hash(password, 10) : '-';

    // Format outlet
    const formattedOutlets = outlets.map(id => ({
      outletId: new mongoose.Types.ObjectId(id)
    }));

    // Buat user baru
    const newUser = new User({
      name,
      username,
      email,
      phone,
      password: hashedPassword,
      role,
      cashierType: role === 'cashier' ? cashierType : null,
      outlet: formattedOutlets
    });

    await newUser.save();

    res.status(201).json({
      message: 'Karyawan berhasil dibuat',
      employee: {
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        cashierType: newUser.cashierType,
        outlet: newUser.outlet
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// 2. Assign/Mutasi Outlet ke Karyawan
export const assignOutletsToEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { outlets } = req.body;

    if (!outlets || !Array.isArray(outlets)) {
      return next(errorHandler(400, 'Outlet harus dalam bentuk array'));
    }

    const formattedOutlets = outlets.map(id => ({
      outletId: new mongoose.Types.ObjectId(id)
    }));

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { outlet: formattedOutlets } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return next(errorHandler(404, 'Karyawan tidak ditemukan'));
    }

    res.status(200).json({
      message: 'Outlet berhasil diassign',
      employee: updatedUser
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// 3. Update Role Karyawan
export const updateEmployeeRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, cashierType } = req.body;

    if (!role) {
      return next(errorHandler(400, 'Role harus diisi'));
    }

    if (role === 'cashier' && !cashierType) {
      return next(errorHandler(400, 'Cashier type wajib diisi untuk role cashier'));
    }

    const updateData = { role };
    if (role === 'cashier') updateData.cashierType = cashierType;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return next(errorHandler(404, 'Karyawan tidak ditemukan'));
    }

    res.status(200).json({
      message: 'Role karyawan berhasil diupdate',
      employee: updatedUser
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// 4. Hapus Karyawan
export const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return next(errorHandler(404, 'Karyawan tidak ditemukan'));
    }

    res.status(200).json({ message: 'Karyawan berhasil dihapus' });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// 5. Lihat Semua Karyawan
export const getAllEmployees = async (req, res, next) => {
  try {
    const employees = await User.find()
      .where('role')
      .in(['staff', 'cashier junior', 'cashier senior'])
      .select('-password')
      .populate('outlet.outletId', 'name address');

    res.status(200).json(employees);
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};