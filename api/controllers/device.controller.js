import { Device } from '../models/Device.model.js';
import { DeviceQuota } from '../models/DeviceQuota.model.js';
import { Outlet } from '../models/Outlet.model.js';

// ================== DEVICE CONTROLLERS ==================

/**
 * Membuat device baru
 */
export const createDevice = async (req, res) => {
  try {
    const { outlet, deviceId, role, location, deviceName } = req.body;

    // Validasi: Cek apakah outlet ada
    const outletExists = await Outlet.findById(outlet);
    if (!outletExists) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Validasi: Cek kuota untuk role ini
    const quotaDoc = await DeviceQuota.findOne({ outlet });
    if (!quotaDoc) {
      return res.status(400).json({
        success: false,
        message: 'Device quotas not configured for this outlet'
      });
    }

    const roleQuota = quotaDoc.quotas.find(q => q.role === role);
    if (!roleQuota) {
      return res.status(400).json({
        success: false,
        message: `No quota defined for role: ${role}`
      });
    }

    // Hitung jumlah device aktif dengan role yang sama
    const activeDeviceCount = await Device.countDocuments({
      outlet,
      role,
      isActive: true
    });

    if (activeDeviceCount >= roleQuota.maxDevices) {
      return res.status(400).json({
        success: false,
        message: `Quota exceeded for role "${role}". Maximum allowed: ${roleQuota.maxDevices}`
      });
    }

    // Cek apakah deviceId sudah digunakan di outlet yang sama
    const existingDevice = await Device.findOne({ outlet, deviceId });
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: 'Device ID already registered in this outlet'
      });
    }

    // Buat device baru
    const newDevice = new Device({
      outlet,
      deviceId,
      role,
      location,
      deviceName,
      isActive: true
    });

    const savedDevice = await newDevice.save();

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: savedDevice
    });
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Mendapatkan semua device di outlet tertentu
 */
export const getDevicesByOutlet = async (req, res) => {
  try {
    const { outletId } = req.query;

    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'outletId is required'
      });
    }

    const devices = await Device.find({ outlet: outletId, isActive: true })
      .populate('outlet', 'name address')
      .sort({ role: 1, deviceName: 1 });

    // Ambil kuota untuk info tambahan
    const quotaDoc = await DeviceQuota.findOne({ outlet: outletId });

    const quotaMap = {};
    if (quotaDoc) {
      quotaDoc.quotas.forEach(q => {
        quotaMap[q.role] = {
          max: q.maxDevices,
          current: 0 // akan diisi nanti
        };
      });
    }

    // Hitung jumlah device per role
    devices.forEach(device => {
      if (quotaMap[device.role]) {
        quotaMap[device.role].current += 1;
      }
    });

    res.json({
      success: true,
      data: devices,
      quotaStatus: quotaMap
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update device (termasuk aktivasi/non-aktivasi)
 */
export const updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId, role, location, deviceName, isActive } = req.body;

    const device = await Device.findById(id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Jika role diubah atau device diaktifkan kembali
    if ((role && role !== device.role) || (isActive === true && device.isActive === false)) {
      const newRole = role || device.role;

      // Cek kuota
      const quotaDoc = await DeviceQuota.findOne({ outlet: device.outlet });
      if (!quotaDoc) {
        return res.status(400).json({
          success: false,
          message: 'Device quotas not configured for this outlet'
        });
      }

      const roleQuota = quotaDoc.quotas.find(q => q.role === newRole);
      if (!roleQuota) {
        return res.status(400).json({
          success: false,
          message: `No quota defined for role: ${newRole}`
        });
      }

      const activeCount = await Device.countDocuments({
        outlet: device.outlet,
        role: newRole,
        isActive: true,
        _id: { $ne: id } // kecuali dirinya sendiri
      });

      if (activeCount >= roleQuota.maxDevices) {
        return res.status(400).json({
          success: false,
          message: `Cannot update: quota for role "${newRole}" is full (max: ${roleQuota.maxDevices})`
        });
      }
    }

    // Update field
    Object.assign(device, {
      deviceId: deviceId || device.deviceId,
      role: role || device.role,
      location: location || device.location,
      deviceName: deviceName || device.deviceName,
      isActive: isActive !== undefined ? isActive : device.isActive
    });

    if (isActive === true) {
      device.lastLogin = new Date();
    }

    const updatedDevice = await device.save();

    res.json({
      success: true,
      message: 'Device updated successfully',
      data: updatedDevice
    });
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Hapus (non-aktifkan) device
 */
export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      message: 'Device deactivated successfully',
      data: device
    });
  } catch (error) {
    console.error('Error deactivating device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ================== DEVICE QUOTA CONTROLLERS ==================

/**
 * Set atau update kuota device per outlet
 */
export const setDeviceQuotas = async (req, res) => {
  try {
    const { outlet, quotas } = req.body;

    // Validasi outlet
    const outletExists = await Outlet.findById(outlet);
    if (!outletExists) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Validasi format kuota
    if (!Array.isArray(quotas) || quotas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quotas must be a non-empty array'
      });
    }

    const validRoles = ['cashier senior', 'cashier junior', 'inventory', 'kitchen', 'drive-thru', 'waiter'];
    const seenRoles = new Set();

    for (const q of quotas) {
      if (!q.role || !q.maxDevices) {
        return res.status(400).json({
          success: false,
          message: 'Each quota must have role and maxDevices'
        });
      }

      if (!validRoles.includes(q.role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role: ${q.role}`
        });
      }

      if (seenRoles.has(q.role)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate role not allowed: ${q.role}`
        });
      }
      seenRoles.add(q.role);
    }

    // Update atau buat baru
    let quotaDoc = await DeviceQuota.findOne({ outlet });
    if (quotaDoc) {
      quotaDoc.quotas = quotas;
      await quotaDoc.save();
    } else {
      quotaDoc = await DeviceQuota.create({ outlet, quotas });
    }

    res.json({
      success: true,
      message: 'Device quotas updated successfully',
      data: quotaDoc
    });
  } catch (error) {
    console.error('Error setting device quotas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Dapatkan kuota device untuk outlet tertentu
 */
export const getDeviceQuotas = async (req, res) => {
  try {
    const { outletId } = req.query;

    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'outletId is required'
      });
    }

    const quotaDoc = await DeviceQuota.findOne({ outlet: outletId }).populate('outlet', 'name');

    if (!quotaDoc) {
      return res.status(404).json({
        success: false,
        message: 'No device quotas found for this outlet'
      });
    }

    // Hitung penggunaan saat ini
    const usagePromises = quotaDoc.quotas.map(async (q) => {
      const count = await Device.countDocuments({
        outlet: outletId,
        role: q.role,
        isActive: true
      });
      return {
        role: q.role,
        maxDevices: q.maxDevices,
        currentDevices: count,
        available: q.maxDevices - count
      };
    });

    const usage = await Promise.all(usagePromises);

    res.json({
      success: true,
      data: {
        outlet: quotaDoc.outlet,
        quotas: usage,
        totalUsed: usage.reduce((sum, u) => sum + u.currentDevices, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching device quotas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ================== VALIDASI LOGIN DEVICE (Untuk Auth Middleware) ==================

/**
 * Middleware: Cek apakah device diperbolehkan login berdasarkan kuota dan status
 * Digunakan di auth middleware sebelum login
 */
export const validateDeviceForLogin = async (req, res, next) => {
  const { deviceId, outlet, role } = req.body;

  if (!deviceId || !outlet || !role) {
    return res.status(400).json({
      success: false,
      message: 'deviceId, outlet, and role are required for login'
    });
  }

  try {
    const device = await Device.findOne({
      outlet,
      deviceId,
      role,
      isActive: true
    });

    if (!device) {
      return res.status(403).json({
        success: false,
        message: 'Device not registered, inactive, or role mismatch'
      });
    }

    // Cek kuota aktif untuk role ini
    const quotaDoc = await DeviceQuota.findOne({ outlet });
    if (!quotaDoc) {
      return res.status(403).json({
        success: false,
        message: 'Device quota not configured for this outlet'
      });
    }

    const roleQuota = quotaDoc.quotas.find(q => q.role === role);
    if (!roleQuota) {
      return res.status(403).json({
        success: false,
        message: `No quota assigned for role: ${role}`
      });
    }

    const activeCount = await Device.countDocuments({
      outlet,
      role,
      isActive: true
    });

    if (activeCount > roleQuota.maxDevices) {
      // Ini kondisi darurat: data tidak sinkron
      console.warn(`Quota violation detected for role ${role} in outlet ${outlet}`);
      // Tetap izinkan login, tapi log peringatan
    }

    // Update lastLogin
    device.lastLogin = new Date();
    await device.save();

    req.device = device; // Simpan ke request untuk digunakan di controller
    next();
  } catch (error) {
    console.error('Error validating device login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during device validation'
    });
  }
};