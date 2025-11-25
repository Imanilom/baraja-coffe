import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs/dist/bcrypt.js';

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
      .populate('outlet.outletId', 'name address')
      .populate('role', 'name');

    res.status(200).json(staff);
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Update user
// export const updateUser = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) return next(errorHandler(404, 'User not found'));

//     // Otorisasi
//     if (req.user.id !== req.params.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
//       return next(errorHandler(401, 'Unauthorized'));
//     }

//     // Validasi password
//     if (req.body.password) {
//       req.body.password = bcryptjs.hashSync(req.body.password, 10);
//     }

//     const updateFields = {};

//     // Field untuk semua user
//     if (req.body.username) updateFields.username = req.body.username;
//     if (req.body.email) updateFields.email = req.body.email;
//     if (req.body.phone) updateFields.phone = req.body.phone;
//     if (req.body.profilePicture) updateFields.profilePicture = req.body.profilePicture;
//     if (req.body.password) updateFields.password = req.body.password;
//     if ("isActive" in req.body) updateFields.isActive = req.body.isActive;

//     // Hanya Admin yang bisa mengubah role dan outlet
//     if (req.user.role === 'admin' || req.user.role === 'superadmin') {
//       if (req.body.role) updateFields.role = req.body.role;
//       if (req.body.cashierType) updateFields.cashierType = req.body.cashierType;

//       // Format outlet untuk admin (jika ada)
//       if (req.body.outlet) {
//         const formattedOutlets = req.body.outlet.map(id => ({
//           outletId: mongoose.Types.ObjectId(id)
//         }));
//         updateFields.outlet = formattedOutlets;
//       }
//     }

//     // Update user
//     const updatedUser = await User.findByIdAndUpdate(
//       req.params.id,
//       { $set: updateFields },
//       { new: true }
//     )
//       .select('-password')
//       .populate('role', 'name permissions')
//       .populate('outlet.outletId', 'name address city contactNumber openTime closeTime');

//     // ✅ PERBAIKAN: Handle user tanpa outlet
//     const formattedUser = {
//       ...updatedUser._doc,
//       // Hanya format outlet jika user memiliki outlet
//       outlet: updatedUser.outlet && updatedUser.outlet.length > 0
//         ? updatedUser.outlet.map(outletItem => ({
//           _id: outletItem.outletId?._id,
//           name: outletItem.outletId?.name,
//           address: outletItem.outletId?.address,
//           city: outletItem.outletId?.city,
//           contactNumber: outletItem.outletId?.contactNumber,
//           openTime: outletItem.outletId?.openTime,
//           closeTime: outletItem.outletId?.closeTime
//         }))
//         : [] // Return empty array jika tidak ada outlet
//     };

//     console.log("🔍 DEBUG updateUser - Formatted user:", {
//       hasOutlet: formattedUser.outlet.length > 0,
//       outletCount: formattedUser.outlet.length,
//       userRole: formattedUser.role?.name
//     });

//     res.status(200).json(formattedUser);
//   } catch (error) {
//     next(errorHandler(500, error.message));
//   }
// };

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found'));

    // Otorisasi
    if (req.user.id !== req.params.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(errorHandler(401, 'Unauthorized'));
    }

    // Validasi password
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    const updateFields = {};

    // Field untuk semua user
    if (req.body.username) updateFields.username = req.body.username;
    if (req.body.email) updateFields.email = req.body.email;
    if (req.body.phone) updateFields.phone = req.body.phone;
    if (req.body.profilePicture) updateFields.profilePicture = req.body.profilePicture;
    if (req.body.password) updateFields.password = req.body.password;
    if ("isActive" in req.body) updateFields.isActive = req.body.isActive;

    // Handle address - pastikan selalu array
    if (req.body.address !== undefined) {
      if (Array.isArray(req.body.address)) {
        // Jika sudah array, filter yang kosong
        updateFields.address = req.body.address.filter(addr =>
          addr && typeof addr === 'string' && addr.trim() !== ''
        );
      } else if (typeof req.body.address === 'string' && req.body.address.trim()) {
        // Jika string, convert ke array
        updateFields.address = [req.body.address.trim()];
      } else {
        // Jika null/undefined/empty, set empty array
        updateFields.address = [];
      }

      console.log("🔍 Address will be updated:", updateFields.address);
    }

    // Handle field lainnya untuk customer/user
    if (req.body.kode) updateFields.kode = req.body.kode;
    if (req.body.notes) updateFields.notes = req.body.notes;
    if (req.body.catatan) updateFields.catatan = req.body.catatan;
    if (req.body.sex) updateFields.sex = req.body.sex;
    if (req.body.consumerType) updateFields.consumerType = req.body.consumerType;

    // Hanya Admin yang bisa mengubah role dan outlet
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      if (req.body.role) updateFields.role = req.body.role;
      if (req.body.cashierType) updateFields.cashierType = req.body.cashierType;

      // Format outlet untuk admin (jika ada)
      if (req.body.outlet) {
        const formattedOutlets = req.body.outlet.map(id => ({
          outletId: mongoose.Types.ObjectId(id)
        }));
        updateFields.outlet = formattedOutlets;
      }
    }

    console.log("🔍 DEBUG updateUser - Update fields:", {
      hasAddress: !!updateFields.address,
      addressCount: updateFields.address?.length || 0,
      addressData: updateFields.address
    });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    )
      .select('-password')
      .populate('role', 'name permissions')
      .populate('outlet.outletId', 'name address city contactNumber openTime closeTime');

    // ✅ PERBAIKAN: Handle user tanpa outlet
    const formattedUser = {
      ...updatedUser._doc,
      // Hanya format outlet jika user memiliki outlet
      outlet: updatedUser.outlet && updatedUser.outlet.length > 0
        ? updatedUser.outlet.map(outletItem => ({
          _id: outletItem.outletId?._id,
          name: outletItem.outletId?.name,
          address: outletItem.outletId?.address,
          city: outletItem.outletId?.city,
          contactNumber: outletItem.outletId?.contactNumber,
          openTime: outletItem.outletId?.openTime,
          closeTime: outletItem.outletId?.closeTime
        }))
        : [] // Return empty array jika tidak ada outlet
    };

    console.log("🔍 DEBUG updateUser - Formatted user:", {
      hasOutlet: formattedUser.outlet.length > 0,
      outletCount: formattedUser.outlet.length,
      userRole: formattedUser.role?.name,
      hasAddress: !!formattedUser.address,
      addressCount: formattedUser.address?.length || 0
    });

    res.status(200).json(formattedUser);
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Update user status (isActive)
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validasi input
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive harus berupa boolean (true/false)'
      });
    }

    // Cari dan update user
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: isActive },
      {
        new: true, // Return dokumen yang sudah diupdate
        runValidators: true // Jalankan validasi schema
      }
    ).select('-password'); // Jangan return password

    // Jika user tidak ditemukan
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Sukses
    res.status(200).json({
      success: true,
      message: `User berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      data: user
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengupdate status user',
      error: error.message
    });
  }
};

// Delete User
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found'));

    if (req.user.id !== req.params.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
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

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { outlet: formattedOutlets } },
      { new: true }
    )
      .select('-password')
      .populate('outlet.outletId', 'name address city contactNumber openTime closeTime');

    // ✅ PERBAIKAN: Handle jika user tidak memiliki outlet setelah update
    const formattedResponse = {
      ...updatedUser._doc,
      outlet: updatedUser.outlet && updatedUser.outlet.length > 0
        ? updatedUser.outlet.map(outletItem => ({
          _id: outletItem.outletId?._id,
          name: outletItem.outletId?.name,
          address: outletItem.outletId?.address,
          city: outletItem.outletId?.city,
          contactNumber: outletItem.outletId?.contactNumber,
          openTime: outletItem.outletId?.openTime,
          closeTime: outletItem.outletId?.closeTime
        }))
        : []
    };

    res.status(200).json({
      message: 'Outlets assigned successfully',
      user: formattedResponse
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

export const getUSerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('role', 'name permissions')
      .populate('outlet.outletId', 'name address city contactNumber openTime closeTime');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ PERBAIKAN: Handle user tanpa outlet
    const formattedUser = {
      ...user._doc,
      outlet: user.outlet && user.outlet.length > 0
        ? user.outlet.map(outletItem => ({
          _id: outletItem.outletId?._id,
          name: outletItem.outletId?.name,
          address: outletItem.outletId?.address,
          city: outletItem.outletId?.city,
          contactNumber: outletItem.outletId?.contactNumber,
          openTime: outletItem.outletId?.openTime,
          closeTime: outletItem.outletId?.closeTime
        }))
        : []
    };

    res.status(200).json(formattedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ PERBAIKAN UTAMA: getUserProfile dengan handle user tanpa outlet
export const getUserProfile = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('role', 'name permissions')
      .populate('outlet.outletId', 'name address city contactNumber openTime closeTime location');

    console.log("🔍 DEBUG getUserProfile - Raw user data:", {
      userId: user?._id,
      username: user?.username,
      role: user?.role?.name,
      hasOutlet: user?.outlet?.length > 0,
      outletCount: user?.outlet?.length
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // ✅ PERBAIKAN PENTING: Handle semua tipe user (dengan dan tanpa outlet)
    const formattedUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
      role: user.role,
      authType: user.authType,
      isActive: user.isActive,
      // ✅ Outlet hanya untuk karyawan, customer dapat array kosong
      outlet: user.outlet && user.outlet.length > 0
        ? user.outlet.map(outletItem => ({
          _id: outletItem.outletId?._id,
          name: outletItem.outletId?.name,
          address: outletItem.outletId?.address,
          city: outletItem.outletId?.city,
          location: outletItem.outletId?.location,
          contactNumber: outletItem.outletId?.contactNumber,
          openTime: outletItem.outletId?.openTime,
          closeTime: outletItem.outletId?.closeTime,
          isActive: outletItem.outletId?.isActive
        }))
        : [] // ✅ Customer dan user tanpa outlet dapat array kosong
    };

    console.log("🔍 DEBUG getUserProfile - Formatted user:", {
      username: formattedUser.username,
      role: formattedUser.role?.name,
      hasOutlet: formattedUser.outlet.length > 0,
      outletCount: formattedUser.outlet.length
    });

    res.status(200).json({
      user: formattedUser
    });
  } catch (err) {
    console.error("❌ ERROR getUserProfile:", err);
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak valid',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { username, email, phone } = req.body;

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return next(errorHandler(404, 'User tidak ditemukan'));
    }

    const updateData = { username };

    if (currentUser.password !== '-' && email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan oleh pengguna lain'
        });
      }

      updateData.email = email;
    }

    if (phone !== undefined) {
      updateData.phone = phone || '';
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
      .select('-password')
      .populate('role', 'name permissions')
      .populate('outlet.outletId', 'name address city contactNumber openTime closeTime');

    // ✅ PERBAIKAN: Handle user tanpa outlet
    const formattedUser = {
      ...updatedUser._doc,
      outlet: updatedUser.outlet && updatedUser.outlet.length > 0
        ? updatedUser.outlet.map(outletItem => ({
          _id: outletItem.outletId?._id,
          name: outletItem.outletId?.name,
          address: outletItem.outletId?.address,
          city: outletItem.outletId?.city,
          contactNumber: outletItem.outletId?.contactNumber,
          openTime: outletItem.outletId?.openTime,
          closeTime: outletItem.outletId?.closeTime
        }))
        : []
    };

    res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: formattedUser
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan'
      });
    }
    next(errorHandler(500, error.message));
  }
};

// Change password
export const changeUserPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak valid',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, 'User tidak ditemukan'));
    }

    if (user.password === '-' || !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Password tidak dapat diubah untuk akun Google'
      });
    }

    const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password lama tidak sesuai'
      });
    }

    const isSamePassword = await bcryptjs.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'Password baru harus berbeda dengan password lama'
      });
    }

    const hashedNewPassword = bcryptjs.hashSync(newPassword, 10);

    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword
    });

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Get user authentication type
export const getUserAuthType = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: userId tidak ditemukan" });
    }

    const user = await User.findById(userId)
      .select("authType email username")
      .populate('outlet.outletId', 'name address city contactNumber');

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // ✅ PERBAIKAN: Handle user tanpa outlet
    const formattedOutlets = user.outlet && user.outlet.length > 0
      ? user.outlet.map(outletItem => ({
        _id: outletItem.outletId?._id,
        name: outletItem.outletId?.name,
        address: outletItem.outletId?.address,
        city: outletItem.outletId?.city,
        contactNumber: outletItem.outletId?.contactNumber
      }))
      : [];

    return res.json({
      success: true,
      authType: user.authType,
      email: user.email,
      username: user.username,
      outlets: formattedOutlets
    });

  } catch (error) {
    console.error("❌ Error getUserAuthType:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
// End account setting for user (self)

// 1. Membuat Karyawan Baru (Staff/Cashier)
export const createEmployee = async (req, res, next) => {
  try {
    const {
      username,
      email,
      phone,
      address,
      password,
      role,
      cashierType,
      outlets = []
    } = req.body;

    // Validasi wajib
    if (!username || !email || !role) {
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
      username,
      email,
      phone,
      address,
      password: hashedPassword,
      role,
      cashierType: role === 'cashier' ? cashierType : null,
      outlet: formattedOutlets
    });

    await newUser.save();

    // Populasi data setelah save
    const populatedUser = await User.findById(newUser._id)
      .select('-password')
      .populate('outlet.outletId', 'name address city contactNumber');

    // Format response
    const formattedResponse = {
      _id: populatedUser._id,
      name: populatedUser.name,
      username: populatedUser.username,
      email: populatedUser.email,
      address: populatedUser.address,
      role: populatedUser.role,
      cashierType: populatedUser.cashierType,
      outlet: populatedUser.outlet?.map(outletItem => ({
        _id: outletItem.outletId?._id,
        name: outletItem.outletId?.name,
        address: outletItem.outletId?.address,
        city: outletItem.outletId?.city,
        contactNumber: outletItem.outletId?.contactNumber
      })) || []
    };

    res.status(201).json({
      message: 'Karyawan berhasil dibuat',
      employee: formattedResponse
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
    )
      .select('-password')
      .populate('outlet.outletId', 'name address city contactNumber openTime closeTime'); // ✅ TAMBAHKAN POPULASI

    if (!updatedUser) {
      return next(errorHandler(404, 'Karyawan tidak ditemukan'));
    }

    // ✅ FORMAT ULANG DATA OUTLET
    const formattedEmployee = {
      ...updatedUser._doc,
      outlet: updatedUser.outlet?.map(outletItem => ({
        _id: outletItem.outletId?._id,
        name: outletItem.outletId?.name,
        address: outletItem.outletId?.address,
        city: outletItem.outletId?.city,
        contactNumber: outletItem.outletId?.contactNumber,
        openTime: outletItem.outletId?.openTime,
        closeTime: outletItem.outletId?.closeTime
      })) || []
    };

    res.status(200).json({
      message: 'Outlet berhasil diassign',
      employee: formattedEmployee
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
    )
      .select('-password')
      .populate('outlet.outletId', 'name address city contactNumber'); // ✅ TAMBAHKAN POPULASI

    if (!updatedUser) {
      return next(errorHandler(404, 'Karyawan tidak ditemukan'));
    }

    // ✅ FORMAT ULANG DATA OUTLET
    const formattedEmployee = {
      ...updatedUser._doc,
      outlet: updatedUser.outlet?.map(outletItem => ({
        _id: outletItem.outletId?._id,
        name: outletItem.outletId?.name,
        address: outletItem.outletId?.address,
        city: outletItem.outletId?.city,
        contactNumber: outletItem.outletId?.contactNumber
      })) || []
    };

    res.status(200).json({
      message: 'Role karyawan berhasil diupdate',
      employee: formattedEmployee
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
      .in(['staff', 'cashier junior', 'cashier senior', 'gro', 'operational']) // ✅ TAMBAHKAN ROLE LAIN
      .select('-password')
      .populate('outlet.outletId', 'name address city contactNumber openTime closeTime'); // ✅ POPULASI LENGKAP

    // ✅ FORMAT ULANG DATA OUTLET UNTUK SEMUA EMPLOYEE
    const formattedEmployees = employees.map(employee => ({
      ...employee._doc,
      outlet: employee.outlet?.map(outletItem => ({
        _id: outletItem.outletId?._id,
        name: outletItem.outletId?.name,
        address: outletItem.outletId?.address,
        city: outletItem.outletId?.city,
        contactNumber: outletItem.outletId?.contactNumber,
        openTime: outletItem.outletId?.openTime,
        closeTime: outletItem.outletId?.closeTime
      })) || []
    }));

    res.status(200).json(formattedEmployees);
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};