// routes/deviceRoutes.js
import express from 'express';
import { Device } from '../models/Device.model.js';
import { authMiddleware, verifyToken } from '../utils/verifyUser.js';

const router = express.Router();
const adminAccess = verifyToken(['admin', 'superadmin']);


// ✅ OPTIMISED: GET ALL DEVICES dengan pagination dan filtering
router.get('/', async (req, res) => {
  try {
    const {
      outlet,
      role,
      isActive,
      page = 1,
      limit = 50,
      search
    } = req.query;

    let filter = {};
    if (outlet) filter.outlet = outlet;
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Tambahkan search functionality
    if (search) {
      filter.$or = [
        { deviceId: { $regex: search, $options: 'i' } },
        { deviceName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Gunakan Promise.all untuk parallel execution
    const [devices, total] = await Promise.all([
      Device.find(filter)
        .populate('outlet', 'name code')
        // .populate('adjustedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(), // Gunakan lean() untuk performance
      Device.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: devices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch devices',
      error: error.message
    });
  }
});

// ✅ OPTIMISED: GET DEVICE BY ID dengan caching
const deviceCache = new Map();
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const deviceId = req.params.id;

    // Check cache first
    if (deviceCache.has(deviceId)) {
      const cached = deviceCache.get(deviceId);
      if (Date.now() - cached.timestamp < 30000) { // 30 second cache
        return res.json({
          success: true,
          data: cached.data,
          cached: true
        });
      }
    }

    const device = await Device.findById(deviceId)
      .populate('outlet', 'name code address')
      .populate('adjustedBy', 'name email')
      .lean();

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Cache the result
    deviceCache.set(deviceId, {
      data: device,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: device
    });

  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device',
      error: error.message
    });
  }
});

// ✅ CREATE NEW DEVICE dengan validation
router.post('/', adminAccess, async (req, res) => {
  const session = await Device.startSession();
  session.startTransaction();

  try {
    const {
      deviceId,
      outlet,
      location,
      deviceName,
      assignedAreas = [],
      assignedTables = [],
      orderTypes = ['both']
    } = req.body;

    // Validation
    if (!deviceId || !outlet || !location) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: deviceId, outlet, location'
      });
    }

    // Check if device already exists
    const existingDevice = await Device.findOne({
      deviceId,
      outlet
    }).session(session);

    if (existingDevice) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Device with this ID already exists in this outlet'
      });
    }

    const device = new Device({
      deviceId,
      outlet,
      location,
      deviceName: deviceName || `Device-${deviceId}`,
      assignedAreas,
      assignedTables,
      orderTypes,
      isActive: true
    });

    await device.save({ session });
    await device.populate('outlet', 'name code');

    await session.commitTransaction();

    // Clear cache
    deviceCache.clear();

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: device
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Create device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create device',
      error: error.message
    });
  } finally {
    session.endSession();
  }
});

// ✅ BULK UPDATE DEVICES untuk efficiency
router.put('/bulk-update', adminAccess, async (req, res) => {
  const session = await Device.startSession();
  session.startTransaction();

  try {
    const { updates } = req.body; // Array of { deviceId, updates }

    if (!Array.isArray(updates) || updates.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const bulkOperations = updates.map(update => ({
      updateOne: {
        filter: { _id: update.deviceId },
        update: {
          ...update.updates,
          lastAdjustedAt: new Date(),
          adjustedBy: req.user.id
        }
      }
    }));

    const result = await Device.bulkWrite(bulkOperations, { session });

    await session.commitTransaction();

    // Clear cache
    deviceCache.clear();

    res.json({
      success: true,
      message: `${result.modifiedCount} devices updated successfully`,
      data: result
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk update devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update devices',
      error: error.message
    });
  } finally {
    session.endSession();
  }
});

// ✅ UPDATE DEVICE
router.put('/:id', adminAccess, async (req, res) => {
  try {
    const {
      role,
      location,
      deviceName,
      assignedAreas,
      assignedTables,
      orderTypes,
      isActive
    } = req.body;

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        ...(role && { role }),
        ...(location && { location }),
        ...(deviceName && { deviceName }),
        ...(assignedAreas && { assignedAreas }),
        ...(assignedTables && { assignedTables }),
        ...(orderTypes && { orderTypes }),
        ...(isActive !== undefined && { isActive }),
        lastAdjustedAt: new Date(),
        adjustedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('outlet', 'name code')
      .populate('adjustedBy', 'name email');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Clear cache
    deviceCache.delete(req.params.id);

    res.json({
      success: true,
      message: 'Device updated successfully',
      data: device
    });

  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device',
      error: error.message
    });
  }
});

// ✅ UPDATE DEVICE ASSIGNMENT (Area & Tables)
router.patch('/:id/assignment', adminAccess, async (req, res) => {
  try {
    const { assignedAreas, assignedTables, orderTypes, adjustmentNote } = req.body;

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        ...(assignedAreas && { assignedAreas }),
        ...(assignedTables && { assignedTables }),
        ...(orderTypes && { orderTypes }),
        ...(adjustmentNote && { adjustmentNote }),
        lastAdjustedAt: new Date(),
        adjustedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('outlet', 'name code')
      .populate('adjustedBy', 'name email');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Clear cache
    deviceCache.delete(req.params.id);

    // Emit socket event untuk update real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('device_assignment_updated', {
        deviceId: device.deviceId,
        assignedAreas: device.assignedAreas,
        assignedTables: device.assignedTables,
        orderTypes: device.orderTypes,
        updatedBy: req.user.name,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Device assignment updated successfully',
      data: device
    });

  } catch (error) {
    console.error('Update device assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device assignment',
      error: error.message
    });
  }
});

// ✅ BULK DELETE DEVICES
router.post('/bulk-delete', adminAccess, async (req, res) => {
  const session = await Device.startSession();
  session.startTransaction();

  try {
    const { deviceIds } = req.body;

    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Device IDs array is required'
      });
    }

    const result = await Device.deleteMany(
      { _id: { $in: deviceIds } },
      { session }
    );

    await session.commitTransaction();

    // Clear cache
    deviceCache.clear();

    res.json({
      success: true,
      message: `${result.deletedCount} devices deleted successfully`,
      data: result
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk delete devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete devices',
      error: error.message
    });
  } finally {
    session.endSession();
  }
});

// ✅ DELETE DEVICE
router.delete('/:id', adminAccess, async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Clear cache
    deviceCache.delete(req.params.id);

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });

  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete device',
      error: error.message
    });
  }
});

// ✅ OPTIMISED: GET CONNECTED DEVICES STATUS
router.get('/status/connected', authMiddleware, async (req, res) => {
  try {
    const socketManagement = req.app.get('socketManagement');

    if (!socketManagement) {
      return res.status(503).json({
        success: false,
        message: 'Socket management not available'
      });
    }

    const connectedStatus = socketManagement.getConnectedDevicesStatus();

    res.json({
      success: true,
      data: connectedStatus,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Get connected devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connected devices status',
      error: error.message
    });
  }
});

// ✅ OPTIMISED: GET DEVICE STATISTICS dengan caching
const statsCache = new Map();
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const { outlet } = req.query;
    const cacheKey = `stats_${outlet || 'all'}`;

    // Check cache (5 minute cache)
    if (statsCache.has(cacheKey)) {
      const cached = statsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true
        });
      }
    }

    let matchStage = {};
    if (outlet) matchStage.outlet = outlet;

    const [stats, totalStats, recentActivity] = await Promise.all([
      // Stats by role
      Device.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$role',
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            connected: {
              $sum: { $cond: [{ $ne: ['$socketId', null] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            role: '$_id',
            total: 1,
            active: 1,
            connected: 1,
            _id: 0
          }
        }
      ]),

      // Total stats
      Device.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalDevices: { $sum: 1 },
            activeDevices: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
            connectedDevices: { $sum: { $cond: [{ $ne: ['$socketId', null] }, 1, 0] } },
            offlineDevices: { $sum: { $cond: [{ $eq: ['$socketId', null] }, 1, 0] } }
          }
        }
      ]),

      // Recent activity
      Device.find(matchStage)
        .sort({ lastLogin: -1 })
        .limit(10)
        .select('deviceName role location lastLogin isOnline')
        .lean()
    ]);

    const result = {
      byRole: stats,
      summary: totalStats[0] || {
        totalDevices: 0,
        activeDevices: 0,
        connectedDevices: 0,
        offlineDevices: 0
      },
      recentActivity
    };

    // Cache the result
    statsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get device stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device statistics',
      error: error.message
    });
  }
});

// ✅ HEALTH CHECK endpoint
router.get('/health/status', authMiddleware, async (req, res) => {
  try {
    const [totalDevices, connectedDevices, recentErrors] = await Promise.all([
      Device.countDocuments(),
      Device.countDocuments({ socketId: { $ne: null } }),
      Device.countDocuments({
        lastAdjustedAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      })
    ]);

    const socketManagement = req.app.get('socketManagement');
    const connectedStatus = socketManagement ? socketManagement.getConnectedDevicesStatus() : {};

    res.json({
      success: true,
      data: {
        totalDevices,
        connectedDevices,
        offlineDevices: totalDevices - connectedDevices,
        connectionRate: totalDevices > 0 ? (connectedDevices / totalDevices * 100).toFixed(2) : 0,
        recentActivity: recentErrors,
        socketStatus: socketManagement ? 'connected' : 'disconnected',
        connectedDevicesByRole: connectedStatus
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ✅ CLEAR CACHE endpoint (for development)
router.post('/cache/clear', adminAccess, async (req, res) => {
  try {
    const deviceCount = deviceCache.size;
    const statsCount = statsCache.size;

    deviceCache.clear();
    statsCache.clear();

    res.json({
      success: true,
      message: 'Cache cleared successfully',
      data: {
        clearedDeviceCache: deviceCount,
        clearedStatsCache: statsCount
      }
    });

  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

export default router;