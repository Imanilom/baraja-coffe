// routes/authRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { Device } from '../models/Device.model.js';
import { DeviceSession } from '../models/DeviceSession.model.js';
import User from "../models/user.model.js";
import { Outlet } from '../models/Outlet.model.js';
import { authMiddleware, getUseroutlet } from '../utils/verifyUser.js';
import Role from '../models/Role.model.js';

const router = express.Router();

// ✅ Constants untuk konsistensi
const ALLOWED_ROLES = ['cashier senior', 'cashier junior', 'bar depan', 'bar belakang', 'kasir', 'pelayan'];

// ✅ Helper function untuk mendapatkan outlet ID
const getOutletId = async (userId) => {
  try {
    return await getUseroutlet(userId);
  } catch (error) {
    console.error('Error getting outlet:', error);
    throw new Error('Failed to get outlet information');
  }
};

// ✅ STEP 1: LOGIN ADMIN OUTLET (Tetap sama)
router.post('/login-outlet', async (req, res) => {
  try {
    const { email, password, outletCode } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const outlet = await Outlet.findOne({ code: outletCode });
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet tidak ditemukan'
      });
    }

    // Cek akses user ke outlet - sesuaikan dengan struktur model Anda
    const hasAccess = user.outlets?.includes(outlet._id) || 
                     user.outlet?.some(o => o.outletId.equals(outlet._id)) || 
                     user.role === 'admin';
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke outlet ini'
      });
    }

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
          name: user.name || user.username,
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

// ✅ STEP 2: GET AVAILABLE DEVICES FOR OUTLET (Diperbaiki)
router.get('/devices-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi'
      });
    }

    const outletId = await getOutletId(userId);
    console.log("Outlet ID:", outletId);

    const devices = await Device.find({
      outlet: outletId,
      isActive: true
    })
    .select('deviceId outlet deviceName deviceType location assignedAreas assignedTables orderTypes isOnline lastActivity')
    .sort({ deviceName: 1 })
    .lean();

    console.log('Devices found:', devices.length);

    // Get active sessions untuk semua device sekaligus (lebih efisien)
    const deviceIds = devices.map(device => device._id);
    const activeSessions = await DeviceSession.find({
      device: { $in: deviceIds },
      isActive: true
    })
    .populate('user', 'name username email')
    .populate('role', 'name')
    .lean();

    // Create session map untuk lookup yang cepat
    const sessionMap = new Map();
    activeSessions.forEach(session => {
      sessionMap.set(session.device.toString(), session);
    });

    const devicesWithStatus = devices.map(device => {
      const activeSession = sessionMap.get(device._id.toString());
      
      let currentUser = null;
      if (activeSession && activeSession.user) {
        currentUser = {
          id: activeSession.user._id,
          name: activeSession.user.name || activeSession.user.username,
          email: activeSession.user.email,
          role: activeSession.role?.name,
          loginTime: activeSession.loginTime
        };
      }

      return {
        ...device,
        currentUser,
        isAvailable: !activeSession,
        sessionId: activeSession?._id
      };
    });

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

// ✅ STEP 3: GET AVAILABLE CASHIERS FOR DEVICE (Diperbaiki)
router.get('/devices/:deviceId/cashiers', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi'
      });
    }

    const outletId = await getOutletId(userId);

    // Validasi device
    const device = await Device.findOne({ 
      _id: deviceId, 
      outlet: outletId 
    }).select('deviceName location assignedAreas assignedTables orderTypes');
    
    if (!device) {
      return res.status(404).json({ 
        success: false, 
        message: 'Device tidak ditemukan' 
      });
    }

    // Dapatkan roles yang diizinkan
    const allowedRoles = await Role.find({ 
      name: { $in: ALLOWED_ROLES } 
    }).select('_id name');
    
    const roleIds = allowedRoles.map(role => role._id);
    
    if (roleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          device: {
            id: device._id,
            deviceName: device.deviceName,
            location: device.location,
            assignedAreas: device.assignedAreas,
            assignedTables: device.assignedTables
          },
          cashiers: []
        }
      });
    }

    // Cari cashiers - sesuaikan dengan struktur model User Anda
    const cashiers = await User.find({
      $or: [
        { outlets: outletId },
        { 'outlet.outletId': outletId }
      ],
      role: { $in: roleIds },
      isActive: true
    })
    .select('name username email phone role profilePicture cashierType')
    .populate('role', 'name')
    .sort({ name: 1 })
    .lean();

    // Dapatkan session aktif untuk semua cashiers sekaligus
    const cashierIds = cashiers.map(cashier => cashier._id);
    const activeSessions = await DeviceSession.find({
      user: { $in: cashierIds },
      isActive: true
    })
    .populate('device', 'deviceName location')
    .lean();

    const sessionMap = new Map();
    activeSessions.forEach(session => {
      sessionMap.set(session.user.toString(), session);
    });

    const cashiersWithStatus = cashiers.map(cashier => {
      const activeSession = sessionMap.get(cashier._id.toString());
      
      return {
        ...cashier,
        roleName: cashier.role?.name,
        isLoggedIn: !!activeSession,
        currentDevice: activeSession ? {
          deviceId: activeSession.device?._id,
          deviceName: activeSession.device?.deviceName,
          location: activeSession.device?.location,
          loginTime: activeSession.loginTime,
        } : null
      };
    });

    return res.json({
      success: true,
      data: {
        device: {
          id: device._id,
          deviceName: device.deviceName,
          location: device.location,
          assignedAreas: device.assignedAreas,
          assignedTables: device.assignedTables
        },
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

// ✅ STEP 4: LOGIN CASHIER TO DEVICE (Diperbaiki)
router.post('/devices/:deviceId/login-cashier', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { cashierId } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId || !cashierId) {
      return res.status(400).json({
        success: false,
        message: 'Data yang diperlukan tidak lengkap'
      });
    }

    const outletId = await getOutletId(userId);

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
      $or: [
        { outlets: outletId },
        { 'outlet.outletId': outletId }
      ],
      isActive: true
    }).populate('role', 'name');

    if (!cashier) {
      return res.status(404).json({
        success: false,
        message: 'Kasir tidak ditemukan atau tidak memiliki akses'
      });
    }

    // Cek apakah device sedang digunakan
    const existingDeviceSession = await DeviceSession.findOne({
      device: deviceId,
      isActive: true
    });

    if (existingDeviceSession) {
      const currentUser = await User.findById(existingDeviceSession.user).select('name username');
      return res.status(400).json({
        success: false,
        message: `Device sedang digunakan oleh ${currentUser?.name || currentUser?.username || 'Unknown User'}`
      });
    }

    // Cek apakah cashier sudah login di device lain (opsional - bisa dihapus jika ingin multi-device)
    const cashierActiveSession = await DeviceSession.findOne({
      user: cashierId,
      isActive: true
    });

    if (cashierActiveSession) {
      const currentDevice = await Device.findById(cashierActiveSession.device).select('deviceName');
      return res.status(400).json({
        success: false,
        message: `Kasir sudah login di device ${currentDevice?.deviceName || 'lain'}`
      });
    }

    // Buat session baru
    const deviceSession = new DeviceSession({
      device: deviceId,
      user: cashierId,
      outlet: outletId,
      role: cashier.role,
      socketId: '',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      loginTime: new Date(),
      isActive: true
    });

    await deviceSession.save();

    // Update device status
    device.isOnline = true;
    device.lastActivity = new Date();
    await device.save();

    // Populate data untuk response
    await deviceSession.populate([
      { path: 'user', select: 'name username email' },
      { path: 'device', select: 'deviceName location' },
      { path: 'role', select: 'name' }
    ]);

    res.json({
      success: true,
      message: `Kasir ${cashier.name || cashier.username} berhasil login ke ${device.deviceName}`,
      data: {
        session: {
          id: deviceSession._id,
          loginTime: deviceSession.loginTime,
          device: deviceSession.device,
          user: deviceSession.user,
          role: deviceSession.role
        },
        device: {
          id: device._id,
          deviceName: device.deviceName,
          location: device.location
        },
        cashier: {
          id: cashier._id,
          name: cashier.name || cashier.username,
          email: cashier.email,
          role: cashier.role?.name
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

// ✅ STEP 5: LOGOUT CASHIER FROM DEVICE (Diperbaiki)
router.post('/devices/:deviceId/logout', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { sessionId, force = false } = req.body; // Tambahkan force logout option
    const userId = req.user?.id || req.user?._id;

    const outletId = await getOutletId(userId);

    // Cari session aktif
    const sessionFilter = {
      device: deviceId,
      outlet: outletId,
      isActive: true
    };

    // Jika sessionId diberikan, logout session spesifik
    if (sessionId) {
      sessionFilter._id = sessionId;
    }

    const activeSession = await DeviceSession.findOne(sessionFilter)
      .populate('user', 'name username')
      .populate('device', 'deviceName');

    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada session aktif pada device ini'
      });
    }

    // Update session
    activeSession.isActive = false;
    activeSession.logoutTime = new Date();
    activeSession.logoutReason = force ? 'forced_by_admin' : 'manual_logout';
    await activeSession.save();

    // Update device status - hanya set offline jika tidak ada session aktif lainnya
    const otherActiveSessions = await DeviceSession.countDocuments({
      device: deviceId,
      isActive: true
    });

    if (otherActiveSessions === 0) {
      await Device.findByIdAndUpdate(deviceId, {
        isOnline: false,
        socketId: null
      });
    }

    // Emit logout event via socket
    const io = req.app.get('io');
    if (io && activeSession.socketId) {
      io.to(activeSession.socketId).emit('force_logout', {
        reason: force ? 'Logged out by admin' : 'Session ended',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: `Logout berhasil untuk ${activeSession.user?.name || activeSession.user?.username}`,
      data: {
        sessionId: activeSession._id,
        deviceId: deviceId,
        deviceName: activeSession.device?.deviceName,
        userName: activeSession.user?.name || activeSession.user?.username,
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

// ✅ GET ACTIVE SESSIONS (Diperbaiki)
router.get('/sessions/active', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const outletId = await getOutletId(userId);

    const activeSessions = await DeviceSession.find({
      outlet: outletId,
      isActive: true
    })
    .populate('device', 'deviceName location deviceType')
    .populate('user', 'name username email')
    .populate('role', 'name')
    .sort({ loginTime: -1 })
    .lean();

    // Format response
    const formattedSessions = activeSessions.map(session => ({
      id: session._id,
      loginTime: session.loginTime,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      device: session.device,
      user: session.user,
      role: session.role?.name,
      duration: Math.floor((new Date() - new Date(session.loginTime)) / 1000 / 60) // dalam menit
    }));

    res.json({
      success: true,
      data: formattedSessions,
      total: formattedSessions.length
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

// ✅ FORCE LOGOUT USER FROM ALL DEVICES
router.post('/sessions/force-logout/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id || req.user?._id;
    const outletId = await getOutletId(adminId);

    // Cari semua session aktif user
    const activeSessions = await DeviceSession.find({
      user: userId,
      outlet: outletId,
      isActive: true
    }).populate('device', 'deviceName');

    if (activeSessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada session aktif untuk user ini'
      });
    }

    // Logout semua session
    const sessionIds = activeSessions.map(session => session._id);
    await DeviceSession.updateMany(
      { _id: { $in: sessionIds } },
      { 
        isActive: false, 
        logoutTime: new Date(),
        logoutReason: 'forced_by_admin' 
      }
    );

    // Update device status
    const deviceIds = activeSessions.map(session => session.device._id);
    for (const deviceId of deviceIds) {
      const otherSessions = await DeviceSession.countDocuments({
        device: deviceId,
        isActive: true
      });
      
      if (otherSessions === 0) {
        await Device.findByIdAndUpdate(deviceId, {
          isOnline: false,
          socketId: null
        });
      }
    }

    // Emit socket events
    const io = req.app.get('io');
    activeSessions.forEach(session => {
      if (io && session.socketId) {
        io.to(session.socketId).emit('force_logout', {
          reason: 'Logged out by admin',
          timestamp: new Date()
        });
      }
    });

    res.json({
      success: true,
      message: `Berhasil logout ${activeSessions.length} session`,
      data: {
        loggedOutSessions: activeSessions.length,
        devices: activeSessions.map(session => session.device.deviceName)
      }
    });

  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal force logout',
      error: error.message
    });
  }
});

export default router;