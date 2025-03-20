import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';

export const test = (req, res) => {
  res.json({ message: 'API is working!', user: req.user });
};

// Create User (Staff/Cashier)
export const createUser = async (req, res, next) => {
  try {
    const {
      name,
      username,
      password,
      role,
      cashierType,
      phone,
      email,
      outlet = []
    } = req.body;

    // Validasi role dan cashierType
    if (role === 'cashier' && (!cashierType || !cashierType.length)) {
      return next(errorHandler(400, 'Cashier must have a valid cashierType'));
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Validasi outlet
    const formattedOutlets = outlet.map(id => ({
      outletId: mongoose.Types.ObjectId(id)
    }));

    // Buat user baru
    const newUser = new User({
      name,
      username,
      password: hashedPassword,
      role,
      cashierType: role === 'cashier' ? cashierType : null,
      phone,
      email,
      outlet: formattedOutlets
    });

    await newUser.save();
    res.status(201).json({
      message: 'User created successfully',
      user: newUser.toObject({ getters: true, virtuals: true })
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
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