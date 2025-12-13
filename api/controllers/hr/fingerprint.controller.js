import Fingerprint from '../../models/model_hr/finger.model.js';
import Employee from '../../models/model_hr/Employee.model.js';
import RawFingerprint from '../../models/model_hr/RawFingerprint.model.js';

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
        .populate({
          path: 'employee',
          populate: {
            path: 'user',
            select: 'username email' // Pastikan user di-populate
          }
        })
        .select('_id deviceUserId fingerprintIndex employee deviceId lastSynced isActive')
        .sort({ deviceUserId: 1 });

      const deviceUsers = fingerprints.map(fp => ({
        _id: fp._id,
        deviceUserId: fp.deviceUserId,
        fingerprintIndex: fp.fingerprintIndex,
        employeeId: fp.employee?.employeeId,
        employeeName: fp.employee?.user?.username, // Ambil dari user.username
        position: fp.employee?.position,
        department: fp.employee?.department,
        deviceId: fp.deviceId,
        lastSynced: fp.lastSynced,
        isActive: fp.isActive,
        // Include full employee object untuk fallback
        employee: fp.employee
      }));

      res.json({
        total: deviceUsers.length,
        data: deviceUsers
      });
    } catch (error) {
      console.error('Error getting device users:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getAllFingerprintsWithEmployee: async (req, res) => {
  try {
    const fingerprints = await Fingerprint.find({ isActive: true })
      .populate({
        path: 'employee',
        populate: {
          path: 'user',
          select: 'username email firstName lastName'
        }
      })
      .sort({ deviceUserId: 1 });

    const formattedData = fingerprints.map(fp => {
      const employee = fp.employee;
      const user = employee?.user;
      
      return {
        _id: fp._id,
        deviceId: fp.deviceId,
        deviceUserId: fp.deviceUserId,
        fingerprintIndex: fp.fingerprintIndex,
        isActive: fp.isActive,
        lastSynced: fp.lastSynced,
        // Employee data
        employeeId: employee?.employeeId,
        employeeName: user?.username || user?.firstName || 'N/A',
        position: employee?.position,
        department: employee?.department,
        // Full objects untuk fallback
        employee: employee,
        user: user
      };
    });

    res.json({
      total: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    console.error('Error getting fingerprints with employee:', error);
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


  // Map raw fingerprint ke employee
  mapRawFingerprint: async (req, res) => {
    try {
      const { rawFingerprintId, employeeId } = req.body;

      // Cek raw fingerprint
      const rawFingerprint = await RawFingerprint.findById(rawFingerprintId);
      if (!rawFingerprint) {
        return res.status(404).json({ message: 'Raw fingerprint data not found' });
      }

      if (rawFingerprint.isMapped) {
        return res.status(400).json({ message: 'Fingerprint already mapped to an employee' });
      }

      // Cek employee
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      // Check if deviceUserId already exists in Fingerprint collection
      const existingFingerprint = await Fingerprint.findOne({ 
        deviceUserId: rawFingerprint.deviceUserId 
      });
      if (existingFingerprint) {
        return res.status(400).json({ 
          message: 'Device User ID already registered for another employee' 
        });
      }

      // Update raw fingerprint status
      rawFingerprint.isMapped = true;
      rawFingerprint.mappedToEmployee = employeeId;
      rawFingerprint.username = `Employee_${employee.employeeId}`;
      await rawFingerprint.save();

      // Buat fingerprint record di collection Fingerprint
      const fingerprint = new Fingerprint({
        employee: employeeId,
        fingerprintData: rawFingerprint.fingerprintData,
        fingerprintIndex: rawFingerprint.fingerprintIndex,
        deviceId: rawFingerprint.deviceId,
        deviceUserId: rawFingerprint.deviceUserId
      });

      await fingerprint.save();
      await fingerprint.populate('employee');

      res.json({
        message: 'Fingerprint successfully mapped to employee',
        data: {
          rawFingerprint,
          fingerprint,
          employee: {
            id: employee._id,
            employeeId: employee.employeeId,
            name: employee.user?.username
          }
        }
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get unmapped raw fingerprints dengan activity
  getUnmappedFingerprintsWithActivity: async (req, res) => {
    try {
      const { minActivityCount = 1, deviceId } = req.query;

      const filter = {
        isMapped: false,
        activityCount: { $gte: parseInt(minActivityCount) }
      };

      if (deviceId) {
        filter.deviceId = deviceId;
      }

      const fingerprints = await RawFingerprint.find(filter)
        .sort({ lastActivity: -1, activityCount: -1 });

      res.json({
        total: fingerprints.length,
        data: fingerprints
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // NEW: Auto map raw fingerprint berdasarkan employeeId pattern
  autoMapFingerprint: async (req, res) => {
    try {
      const { rawFingerprintId } = req.body;

      const rawFingerprint = await RawFingerprint.findById(rawFingerprintId);
      if (!rawFingerprint) {
        return res.status(404).json({ message: 'Raw fingerprint data not found' });
      }

      if (rawFingerprint.isMapped) {
        return res.status(400).json({ message: 'Fingerprint already mapped' });
      }

      // Extract employee ID dari deviceUserId (contoh: USER_2 -> employeeId = "2" atau "002")
      const deviceUserId = rawFingerprint.deviceUserId;
      let employeeIdFromDevice;
      
      if (deviceUserId.startsWith('USER_')) {
        employeeIdFromDevice = deviceUserId.replace('USER_', '');
        // Format sesuai kebutuhan, misalnya "2" menjadi "EMP002"
        employeeIdFromDevice = `EMP${employeeIdFromDevice.padStart(3, '0')}`;
      }

      // Cari employee berdasarkan pattern
      let employee;
      if (employeeIdFromDevice) {
        employee = await Employee.findOne({ 
          employeeId: employeeIdFromDevice 
        });
      }

      if (!employee) {
        return res.status(404).json({ 
          message: 'No matching employee found for auto-mapping',
          suggestedEmployeeId: employeeIdFromDevice
        });
      }

      // Check if deviceUserId already exists
      const existingFingerprint = await Fingerprint.findOne({ 
        deviceUserId: rawFingerprint.deviceUserId 
      });
      if (existingFingerprint) {
        return res.status(400).json({ 
          message: 'Device User ID already registered' 
        });
      }

      // Update raw fingerprint
      rawFingerprint.isMapped = true;
      rawFingerprint.mappedToEmployee = employee._id;
      rawFingerprint.username = `Employee_${employee.employeeId}`;
      await rawFingerprint.save();

      // Create fingerprint record
      const fingerprint = new Fingerprint({
        employee: employee._id,
        fingerprintData: rawFingerprint.fingerprintData,
        fingerprintIndex: rawFingerprint.fingerprintIndex,
        deviceId: rawFingerprint.deviceId,
        deviceUserId: rawFingerprint.deviceUserId
      });

      await fingerprint.save();
      await fingerprint.populate('employee');

      res.json({
        message: 'Fingerprint auto-mapped successfully',
        data: {
          rawFingerprint,
          fingerprint,
          employee: {
            id: employee._id,
            employeeId: employee.employeeId,
            name: employee.user?.username
          }
        }
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // NEW: Bulk auto map berdasarkan device pattern
  bulkAutoMapFingerprints: async (req, res) => {
    try {
      const { deviceId } = req.body;

      const filter = {
        isMapped: false,
        deviceId: deviceId || { $exists: true }
      };

      const unmappedFingerprints = await RawFingerprint.find(filter);
      const results = {
        success: 0,
        failed: 0,
        details: []
      };

      for (const rawFp of unmappedFingerprints) {
        try {
          const deviceUserId = rawFp.deviceUserId;
          let employeeIdFromDevice;
          
          if (deviceUserId.startsWith('USER_')) {
            employeeIdFromDevice = deviceUserId.replace('USER_', '');
            employeeIdFromDevice = `EMP${employeeIdFromDevice.padStart(3, '0')}`;
          }

          const employee = await Employee.findOne({ 
            employeeId: employeeIdFromDevice 
          });

          if (!employee) {
            results.failed++;
            results.details.push({
              rawFingerprintId: rawFp._id,
              deviceUserId: rawFp.deviceUserId,
              status: 'failed',
              reason: 'No matching employee found'
            });
            continue;
          }

          // Check existing fingerprint
          const existingFingerprint = await Fingerprint.findOne({ 
            deviceUserId: rawFp.deviceUserId 
          });

          if (existingFingerprint) {
            results.failed++;
            results.details.push({
              rawFingerprintId: rawFp._id,
              deviceUserId: rawFp.deviceUserId,
              status: 'failed',
              reason: 'Device User ID already registered'
            });
            continue;
          }

          // Update raw fingerprint
          rawFp.isMapped = true;
          rawFp.mappedToEmployee = employee._id;
          rawFp.username = `Employee_${employee.employeeId}`;
          await rawFp.save();

          // Create fingerprint record
          const fingerprint = new Fingerprint({
            employee: employee._id,
            fingerprintData: rawFp.fingerprintData,
            fingerprintIndex: rawFp.fingerprintIndex,
            deviceId: rawFp.deviceId,
            deviceUserId: rawFp.deviceUserId
          });

          await fingerprint.save();

          results.success++;
          results.details.push({
            rawFingerprintId: rawFp._id,
            deviceUserId: rawFp.deviceUserId,
            employeeId: employee.employeeId,
            status: 'success'
          });

        } catch (error) {
          results.failed++;
          results.details.push({
            rawFingerprintId: rawFp._id,
            deviceUserId: rawFp.deviceUserId,
            status: 'failed',
            reason: error.message
          });
        }
      }

      res.json({
        message: `Bulk auto-mapping completed: ${results.success} success, ${results.failed} failed`,
        data: results
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  // controllers/hr/fingerprint.controller.js

  // Reactivate fingerprint
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
  },

  // Reactivate fingerprint - PERBAIKAN: Hapus duplikasi dan pastikan struktur benar
  reactivateFingerprint: async (req, res) => {
    try {
      const fingerprint = await Fingerprint.findByIdAndUpdate(
        req.params.id,
        { isActive: true },
        { new: true }
      ).populate('employee');

      if (!fingerprint) {
        return res.status(404).json({ message: 'Fingerprint record not found' });
      }

      res.json({
        message: 'Fingerprint reactivated successfully',
        data: fingerprint
      });
    } catch (error) {
      console.error('Error reactivating fingerprint:', error);
      res.status(500).json({ 
        message: 'Error reactivating fingerprint',
        error: error.message 
      });
    }
  },

  deactivateFingerprintByDeviceUser: async (req, res) => {
    try {
      const { deviceUserId } = req.params;
      
      const fingerprint = await Fingerprint.findOneAndUpdate(
        { deviceUserId },
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
      console.error('Error deactivating fingerprint:', error);
      res.status(500).json({ 
        message: 'Error deactivating fingerprint',
        error: error.message 
      });
    }
  },

  // Reactivate fingerprint by deviceUserId
  reactivateFingerprintByDeviceUser: async (req, res) => {
    try {
      const { deviceUserId } = req.params;
      
      const fingerprint = await Fingerprint.findOneAndUpdate(
        { deviceUserId },
        { isActive: true },
        { new: true }
      ).populate('employee');

      if (!fingerprint) {
        return res.status(404).json({ message: 'Fingerprint record not found' });
      }

      res.json({
        message: 'Fingerprint reactivated successfully',
        data: fingerprint
      });
    } catch (error) {
      console.error('Error reactivating fingerprint:', error);
      res.status(500).json({ 
        message: 'Error reactivating fingerprint',
        error: error.message 
      });
    }
  },




};