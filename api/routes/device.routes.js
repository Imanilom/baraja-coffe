// routes/deviceRoutes.js
import express from 'express';
import { Device } from '../models/Device.model.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();
const adminAccess = verifyToken(['admin', 'superadmin']);

// ✅ GET ALL DEVICES
router.get('/', verifyToken, async (req, res) => {
  try {
    const { outlet, role, isActive } = req.query;

    let filter = {};
    if (outlet) filter.outlet = outlet;
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const devices = await Device.find(filter)
      .populate('outlet', 'name code')
      .populate('adjustedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: devices,
      total: devices.length
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

// ✅ GET DEVICE BY ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('outlet', 'name code address')
      .populate('adjustedBy', 'name email');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

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

// ✅ CREATE NEW DEVICE
router.post('/', adminAccess, async (req, res) => {
  try {
    const {
      deviceId,
      outlet,
      location,
      deviceName,
      assignedAreas,
      assignedTables,
      orderTypes
    } = req.body;

    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId, outlet });
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: 'Device with this ID already exists in this outlet'
      });
    }

    const device = new Device({
      deviceId,
      outlet,
      location,
      deviceName,
      assignedAreas: assignedAreas || [],
      assignedTables: assignedTables || [],
      orderTypes: orderTypes || ['both'],
      isActive: true
    });

    await device.save();
    await device.populate('outlet', 'name code');

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: device
    });

  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create device',
      error: error.message
    });
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
        role,
        location,
        deviceName,
        assignedAreas,
        assignedTables,
        orderTypes,
        isActive,
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
        assignedAreas,
        assignedTables,
        orderTypes,
        adjustmentNote,
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

// ✅ GET CONNECTED DEVICES STATUS
router.get('/status/connected', verifyToken, async (req, res) => {
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

// ✅ GET DEVICE STATISTICS
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const { outlet } = req.query;

    let matchStage = {};
    if (outlet) matchStage.outlet = outlet;

    const stats = await Device.aggregate([
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
    ]);

    const totalStats = await Device.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          activeDevices: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          connectedDevices: { $sum: { $cond: [{ $ne: ['$socketId', null] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byRole: stats,
        summary: totalStats[0] || {
          totalDevices: 0,
          activeDevices: 0,
          connectedDevices: 0
        }
      }
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

export default router;