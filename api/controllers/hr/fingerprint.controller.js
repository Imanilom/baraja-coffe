import Fingerprint from '../../models/model_hr/finger.model.js';
import Employee from '../../models/model_hr/Employee.model.js';

export const fingerprintController = {
  // Register fingerprint dengan deviceUserId
  registerFingerprint: async (req, res) => {
    try {
      const { 
        employeeId, 
        fingerprintData, 
        fingerprintIndex, 
        deviceId, 
        deviceUserId 
      } = req.body;

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      // Check if deviceUserId already exists
      const existingDeviceUser = await Fingerprint.findOne({ deviceUserId });
      if (existingDeviceUser) {
        return res.status(400).json({ 
          message: 'Device User ID already registered for another employee' 
        });
      }

      // Check if fingerprint already registered for this index
      const existingFingerprint = await Fingerprint.findOne({
        employee: employeeId,
        fingerprintIndex
      });

      if (existingFingerprint) {
        return res.status(400).json({ 
          message: 'Fingerprint already registered for this finger index' 
        });
      }

      const fingerprint = new Fingerprint({
        employee: employeeId,
        fingerprintData,
        fingerprintIndex,
        deviceId,
        deviceUserId
      });

      await fingerprint.save();
      await fingerprint.populate('employee');

      res.status(201).json({
        message: 'Fingerprint registered successfully',
        data: fingerprint
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get fingerprints by employee
  getFingerprintsByEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;

      const fingerprints = await Fingerprint.find({ employee: employeeId })
        .populate('employee')
        .sort({ fingerprintIndex: 1 });

      res.json(fingerprints);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get fingerprint by deviceUserId
  getFingerprintByDeviceUserId: async (req, res) => {
    try {
      const { deviceUserId } = req.params;

      const fingerprint = await Fingerprint.findOne({ deviceUserId })
        .populate('employee');

      if (!fingerprint) {
        return res.status(404).json({ message: 'Fingerprint not found for this device user ID' });
      }

      res.json(fingerprint);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Verify fingerprint dengan deviceUserId
  verifyFingerprint: async (req, res) => {
    try {
      const { fingerprintData, deviceId, deviceUserId } = req.body;

      // Cari berdasarkan deviceUserId terlebih dahulu
      let fingerprint;
      if (deviceUserId) {
        fingerprint = await Fingerprint.findOne({
          deviceUserId,
          isActive: true
        }).populate('employee');
      }

      // Jika tidak ditemukan dengan deviceUserId, cari dengan fingerprintData
      if (!fingerprint && fingerprintData) {
        fingerprint = await Fingerprint.findOne({
          fingerprintData,
          isActive: true
        }).populate('employee');
      }

      if (!fingerprint) {
        return res.status(404).json({ 
          message: 'Fingerprint not found',
          verified: false 
        });
      }

      // Update last synced
      fingerprint.lastSynced = new Date();
      fingerprint.deviceId = deviceId || fingerprint.deviceId;
      await fingerprint.save();

      res.json({
        message: 'Fingerprint verified successfully',
        verified: true,
        employee: fingerprint.employee,
        fingerprintIndex: fingerprint.fingerprintIndex,
        deviceUserId: fingerprint.deviceUserId
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update deviceUserId untuk employee yang sudah ada
  updateDeviceUserId: async (req, res) => {
    try {
      const { id } = req.params;
      const { deviceUserId } = req.body;

      // Check if new deviceUserId already exists
      const existingDeviceUser = await Fingerprint.findOne({ 
        deviceUserId,
        _id: { $ne: id } // Exclude current record
      });

      if (existingDeviceUser) {
        return res.status(400).json({ 
          message: 'Device User ID already registered for another employee' 
        });
      }

      const fingerprint = await Fingerprint.findByIdAndUpdate(
        id,
        { deviceUserId },
        { new: true, runValidators: true }
      ).populate('employee');

      if (!fingerprint) {
        return res.status(404).json({ message: 'Fingerprint record not found' });
      }

      res.json({
        message: 'Device User ID updated successfully',
        data: fingerprint
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Sync employee data dengan device fingerprint
  syncWithDevice: async (req, res) => {
    try {
      const { deviceUserId, employeeData } = req.body;

      const fingerprint = await Fingerprint.findOne({ deviceUserId })
        .populate('employee');

      if (!fingerprint) {
        return res.status(404).json({ message: 'Fingerprint record not found' });
      }

      // Update last synced time
      fingerprint.lastSynced = new Date();
      await fingerprint.save();

      // Return employee data untuk sync dengan device
      const syncData = {
        deviceUserId: fingerprint.deviceUserId,
        employee: {
          id: fingerprint.employee._id,
          employeeId: fingerprint.employee.employeeId,
          name: fingerprint.employee.user?.username, // Asumsi ada field username di User
          position: fingerprint.employee.position,
          department: fingerprint.employee.department
        },
        fingerprintIndex: fingerprint.fingerprintIndex,
        lastSynced: fingerprint.lastSynced
      };

      res.json({
        message: 'Sync successful',
        data: syncData
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Bulk sync untuk multiple employees
  bulkSyncWithDevice: async (req, res) => {
    try {
      const { deviceUsers } = req.body; // Array of deviceUserId

      const fingerprints = await Fingerprint.find({ 
        deviceUserId: { $in: deviceUsers },
        isActive: true
      }).populate('employee');

      const syncData = fingerprints.map(fingerprint => ({
        deviceUserId: fingerprint.deviceUserId,
        employee: {
          id: fingerprint.employee._id,
          employeeId: fingerprint.employee.employeeId,
          name: fingerprint.employee.user?.username,
          position: fingerprint.employee.position,
          department: fingerprint.employee.department
        },
        fingerprintIndex: fingerprint.fingerprintIndex,
        lastSynced: new Date()
      }));

      // Update last synced untuk semua yang di-sync
      await Fingerprint.updateMany(
        { deviceUserId: { $in: deviceUsers } },
        { lastSynced: new Date() }
      );

      res.json({
        message: 'Bulk sync successful',
        data: syncData,
        totalSynced: syncData.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all device user IDs untuk inisialisasi device
  getAllDeviceUsers: async (req, res) => {
    try {
      const { deviceId } = req.query;

      const filter = { isActive: true };
      if (deviceId) {
        filter.deviceId = deviceId;
      }

      const fingerprints = await Fingerprint.find(filter)
        .populate('employee')
        .select('deviceUserId fingerprintIndex employee deviceId lastSynced')
        .sort({ deviceUserId: 1 });

      const deviceUsers = fingerprints.map(fp => ({
        deviceUserId: fp.deviceUserId,
        fingerprintIndex: fp.fingerprintIndex,
        employeeId: fp.employee.employeeId,
        employeeName: fp.employee.user?.username,
        position: fp.employee.position,
        deviceId: fp.deviceId,
        lastSynced: fp.lastSynced
      }));

      res.json({
        total: deviceUsers.length,
        data: deviceUsers
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete fingerprint
  deleteFingerprint: async (req, res) => {
    try {
      const fingerprint = await Fingerprint.findByIdAndDelete(req.params.id);

      if (!fingerprint) {
        return res.status(404).json({ message: 'Fingerprint record not found' });
      }

      res.json({ message: 'Fingerprint deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Deactivate fingerprint
  deactivateFingerprint: async (req, res) => {
    try {
      const fingerprint = await Fingerprint.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      ).populate('employee');

      if (!fingerprint) {
        return res.status(404).json({ message: 'Fingerprint record not found' });
      }

      res.json({
        message: 'Fingerprint deactivated successfully',
        data: fingerprint
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};