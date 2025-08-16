import Shift from '../models/shift.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';

// Fungsi utilitas: Memeriksa apakah pengguna memiliki akses ke role tertentu
const hasAccessToRole = (currentUserRole, targetRole) => {
  if (currentUserRole === 'admin') return true; // Admin bisa mengelola semua role
  if (currentUserRole === 'operational' && ['cashier junior', 'cashier senior'].includes(targetRole)) return true; // Operational bisa mengelola cashier
  return false;
};

// 1. Membuat Pengguna Baru (Hanya Admin Bisa Melakukan Ini)
export const createUser = async (req, res) => {
  try {
    const { username, email, phone, password, address, role, cashierType, outlet } = req.body;
    const currentUserRole = req.user.role; // Role dari pengguna yang sedang login

    // Validasi input
    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Cek apakah role yang ditambahkan valid
    if (!UserSchema.path('role').enumValues.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Cek apakah pengguna memiliki izin untuk menambahkan role ini
    if (!hasAccessToRole(currentUserRole, role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to create this role' });
    }

    // Validasi unik email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Buat pengguna baru
    const newUser = new User({
      username,
      email,
      phone,
      password,
      address,
      role,
      cashierType: role.startsWith('cashier') ? cashierType : null, // Hanya cashier yang membutuhkan cashierType
      outlet: role !== 'customer' ? outlet : [], // Outlet hanya diperlukan untuk non-customer
    });

    await newUser.save();

    res.status(201).json({ success: true, message: 'User created successfully', data: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
};

// 2. Mengambil Semua Pengguna (Hanya Admin dan Operational Bisa Melakukan Ini)
export const getAllUsers = async (req, res) => {
  try {
    const currentUserRole = req.user.role;

    // Cek apakah pengguna memiliki izin
    if (['admin', 'operational'].includes(currentUserRole)) {
      const users = await User.find().populate('outlet.outletId');
      res.status(200).json({ success: true, data: users });
    } else {
      res.status(403).json({ success: false, message: 'You do not have permission to view all users' });
    }
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch all users', error: error.message });
  }
};

// 3. Mengambil Pengguna Berdasarkan ID (Semua Role Bisa Melakukan Ini)
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(userId).populate('outlet.outletId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user by ID', error: error.message });
  }
};

// 4. Memperbarui Pengguna (Hanya Admin dan Operational Bisa Mengelola Cashier)
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    const currentUserRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cek apakah pengguna memiliki izin untuk memperbarui role ini
    if (!hasAccessToRole(currentUserRole, updates.role || user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this role' });
    }

    // Lakukan pembaruan
    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).populate('outlet.outletId');

    res.status(200).json({ success: true, message: 'User updated successfully', data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

// 5. Menghapus Pengguna (Hanya Admin Bisa Melakukan Ini)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Cek apakah pengguna adalah admin
    if (currentUserRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can delete users' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
};



// Fungsi untuk membuat shift secara batch berdasarkan hari
export const createBatchShifts = async (req, res) => {
  try {
    const { shifts } = req.body; // Array of shifts
    // const currentUserRole = req.user.role;

    // Validasi input
    if (!Array.isArray(shifts) || shifts.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing or invalid shifts array' });
    }

    const createdShifts = [];

    for (const shiftData of shifts) {
      const { cashierType, cashierId, dayOfWeek, startTime, endTime, outletId } = shiftData;

      // Validasi data shift
      if (!cashierType || !cashierId || !dayOfWeek || !startTime || !endTime || !outletId) {
        return res.status(400).json({ success: false, message: 'Invalid shift data' });
      }

      // Pastikan kasir valid dan memiliki role yang sesuai
      const cashier = await User.findById(cashierId);
      if (!cashier) {
        return res.status(404).json({ success: false, message: 'Cashier not found' });
      }

      if (!['cashier junior', 'cashier senior'].includes(cashier.role)) {
        return res.status(400).json({ success: false, message: 'Selected user is not a cashier' });
      }

      // Validasi format waktu (HH:mm)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return res.status(400).json({ success: false, message: 'Invalid time format (use HH:mm)' });
      }

      // Pastikan tidak ada overlap shift pada kasir atau outlet yang sama
      const overlappingShifts = await Shift.find({
        cashierType,
        outletId,
        dayOfWeek,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } }, // Overlap dengan shift lain
        ],
      });

      if (overlappingShifts.length > 0) {
        return res.status(400).json({ success: false, message: 'One or more shifts overlap with existing shifts' });
      }

      // Buat shift baru
      const newShift = new Shift({
        cashierType,
        cashierId,
        dayOfWeek,
        startTime,
        endTime,
        outletId,
      });

      await newShift.save();
      createdShifts.push(newShift);
    }

    res.status(201).json({ success: true, message: 'Batch shifts created successfully', data: createdShifts });
  } catch (error) {
    console.error('Error creating batch shifts by day:', error);
    res.status(500).json({ success: false, message: 'Failed to create batch shifts by day', error: error.message });
  }
};