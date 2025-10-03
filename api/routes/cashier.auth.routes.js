// routes/authRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { Device } from '../models/Device.model.js';
import { DeviceSession } from '../models/DeviceSession.model.js';
import User from "../models/user.model.js";
import { Outlet } from '../models/Outlet.model.js';
import { authMiddleware, getUseroutlet } from '../utils/verifyUser.js';
import { Mongoose } from 'mongoose';
import Role from '../models/Role.model.js';

const router = express.Router();

// ✅ STEP 1: LOGIN ADMIN OUTLET
router.post('/login-outlet', async (req, res) => {
  try {
    const { email, password, outletCode } = req.body;

    // Cari user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Verify password 
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Cari outlet berdasarkan code
    const outlet = await Outlet.findOne({ code: outletCode });
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet tidak ditemukan'
      });
    }

    // Cek apakah user memiliki akses ke outlet ini
    const hasAccess = user.outlet.includes(outlet._id) || user.role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke outlet ini'
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        outletId: outlet._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        outlet: {
          id: outlet._id,
          name: outlet.name,
          code: outlet.code
        }
      }
    });

  } catch (error) {
    console.error('Login outlet error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login',
      error: error.message
    });
  }
});

// ✅ STEP 2: GET AVAILABLE DEVICES FOR OUTLET
router.get('/devices-all', authMiddleware, async (req, res) => {
  try {
    const { id } = req.user;
    //find user dengan id di decoded.id
    const outletId = await getUseroutlet(id);
    // const user = await User.findById(id);
    // if (!user) {
    //   return res.status(401).json({ message: 'User tidak ditemukan' });
    // }
    // //get outletId pertama dari user
    // const outletId = user.outlet[0].outletId;
    // console.log('user outlet id:', outletId);

    const devices = await Device.find({
      outlet: outletId,
      isActive: true
    })
      .select('deviceId outlet deviceName deviceType location assignedAreas assignedTables orderTypes isOnline')
      .sort({ deviceName: 1 });

    // Cek session aktif untuk setiap device
    const devicesWithStatus = await Promise.all(
      devices.map(async (device) => {
        const activeSession = await DeviceSession.findOne({
          device: device._id,
          isActive: true
        }).populate('user', 'name email');

        return {
          ...device.toObject(),
          currentUser: activeSession ? {
            id: activeSession.user._id,
            name: activeSession.user.name,
            loginTime: activeSession.loginTime
          } : null,
          isAvailable: !activeSession // Available jika tidak ada session aktif
        };
      })
    );

    res.json({
      success: true,
      data: devicesWithStatus,
      total: devicesWithStatus.length
    });

  } catch (error) {
    console.error('Get available devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data devices',
      error: error.message
    });
  }
});

// ✅ STEP 3: GET AVAILABLE CASHIERS FOR DEVICE
router.get('/devices/:deviceId/cashiers', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user?._id || req.user?.id; // antisipasi keduanya

    const outletId = await getUseroutlet(userId); // pastikan ini mengembalikan ObjectId / bisa di-cast
    // validasi device milik outlet
    const device = await Device.findOne({ _id: deviceId, outlet: outletId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device tidak ditemukan' });
    }

    // 1) Ambil roleId dari nama role
    const targetRoleNames = ['cashier senior', 'cashier junior', 'bar depan', 'bar belakang'];
    const roles = await Role.find({ name: { $in: targetRoleNames } }).select('_id name');
    const roleIds = roles.map(r => r._id);
    console.log(roleIds);

    // Safety: kalau roles kosong, langsung return empty
    if (roleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          device: {
            id: device._id,
            deviceName: device.deviceName,
            location: device.location,
            assignedAreas: device.assignedAreas
          },
          cashiers: []
        }
      });
    }

    // 2) Query user: outlet.outletId (bukan 'outlets'), role pakai ObjectId
    const cashiers = await User.find({
      'outlet.outletId': outletId,
      role: { $in: roleIds },
      isActive: true
    })
      .select('username email phone role profilePicture password cashierType')
      .sort({ name: 1 })
      .lean(); // pakai lean untuk performa
    console.log(cashiers);
    // 3) Tandai kasir yg sedang login di device lain
    const cashiersWithStatus = await Promise.all(
      cashiers.map(async (cashier) => {
        const activeSession = await DeviceSession.findOne({
          user: cashier._id,
          isActive: true
        })
          .populate('device', 'deviceName location')
          .lean();

        return {
          ...cashier,
          isLoggedIn: !!activeSession,
          currentDevice: activeSession
            ? {
              deviceName: activeSession.device?.deviceName,
              location: activeSession.device?.location,
              loginTime: activeSession.loginTime,
            }
            : null,
        };
      })
    );

    return res.json({
      success: true,
      data: {
        device: {
          id: device._id,
          deviceName: device.deviceName,
          location: device.location,
          assignedAreas: device.assignedAreas
        },
        // cashiers: cashiers
        cashiers: cashiersWithStatus
      }
    });
  } catch (error) {
    console.error('Get available cashiers error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kasir',
      error: error.message
    });
  }
});


// ✅ STEP 4: LOGIN CASHIER TO DEVICE
router.post('/devices/:deviceId/login-cashier', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { cashierId, role } = req.body;
    const { outletId, userId: adminId } = req.user;

    // Verifikasi device
    const device = await Device.findOne({
      _id: deviceId,
      outlet: outletId
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device tidak ditemukan'
      });
    }

    // Verifikasi cashier
    const cashier = await User.findOne({
      _id: cashierId,
      outlets: outletId,
      role: { $in: ['cashier_senior', 'cashier_junior', 'bar_depan', 'bar_belakang'] }
    });

    if (!cashier) {
      return res.status(404).json({
        success: false,
        message: 'Kasir tidak ditemukan atau tidak memiliki akses'
      });
    }

    // Cek apakah device sedang digunakan
    const existingSession = await DeviceSession.findOne({
      device: deviceId,
      isActive: true
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: `Device sedang digunakan oleh ${existingSession.user.name}`
      });
    }

    // Cek apakah cashier sudah login di device lain
    const cashierActiveSession = await DeviceSession.findOne({
      user: cashierId,
      isActive: true
    });

    if (cashierActiveSession) {
      return res.status(400).json({
        success: false,
        message: `Kasir sudah login di device lain`
      });
    }

    // Buat session baru
    const deviceSession = new DeviceSession({
      device: deviceId,
      user: cashierId,
      outlet: outletId,
      role: role || cashier.role,
      socketId: '', // Akan diupdate ketika socket connect
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      loginTime: new Date(),
      isActive: true
    });

    await deviceSession.save();

    // Update device status
    device.isOnline = true;
    await device.save();

    // Populate data untuk response
    await deviceSession.populate('user', 'name email role');
    await deviceSession.populate('device', 'deviceName location');

    res.json({
      success: true,
      message: `Kasir ${cashier.name} berhasil login ke ${device.deviceName}`,
      data: {
        session: deviceSession,
        device: {
          id: device._id,
          deviceName: device.deviceName,
          location: device.location,
          assignedAreas: device.assignedAreas
        },
        cashier: {
          id: cashier._id,
          name: cashier.name,
          email: cashier.email,
          role: cashier.role
        }
      }
    });

  } catch (error) {
    console.error('Login cashier to device error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal login kasir ke device',
      error: error.message
    });
  }
});

// ✅ STEP 5: LOGOUT CASHIER FROM DEVICE
router.post('/devices/:deviceId/logout', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { outletId } = req.user;

    // Cari session aktif
    const activeSession = await DeviceSession.findOne({
      device: deviceId,
      outlet: outletId,
      isActive: true
    });

    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada session aktif pada device ini'
      });
    }

    // Update session
    activeSession.isActive = false;
    activeSession.logoutTime = new Date();
    await activeSession.save();

    // Update device status
    await Device.findByIdAndUpdate(deviceId, {
      isOnline: false,
      socketId: null
    });

    // Emit logout event via socket
    const io = req.app.get('io');
    if (io && activeSession.socketId) {
      io.to(activeSession.socketId).emit('force_logout', {
        reason: 'Logged out by admin',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Logout berhasil',
      data: {
        sessionId: activeSession._id,
        deviceId: deviceId,
        logoutTime: activeSession.logoutTime
      }
    });

  } catch (error) {
    console.error('Logout device error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal logout dari device',
      error: error.message
    });
  }
});

// ✅ GET ACTIVE SESSIONS
router.get('/sessions/active', authMiddleware, async (req, res) => {
  try {
    const { outletId } = req.user;

    const activeSessions = await DeviceSession.find({
      outlet: outletId,
      isActive: true
    })
      .populate('device', 'deviceName location')
      .populate('user', 'name email role')
      .sort({ loginTime: -1 });

    res.json({
      success: true,
      data: activeSessions,
      total: activeSessions.length
    });

  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data session aktif',
      error: error.message
    });
  }
});

export default router;