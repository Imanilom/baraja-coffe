// controllers/hr/adms.controller.js
import Attendance from '../../models/model_hr/Attendance.model.js';
import Employee from '../../models/model_hr/Employee.model.js';
import RawFingerprint from '../../models/model_hr/RawFingerprint.model.js';

export const handleADMSUpload = async (req, res) => {
  try {
    const raw = req.body;
    console.log("Raw body:", req.body);
    
    // ADMS sometimes sends heartbeat with no data
    if (!raw || !raw.trim()) {
      return res.status(200).send('OK');
    }

    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const results = [];

    for (const line of lines) {
      const parsed = parseADMSLine(line);
      if (!parsed) continue;

      const saved = await processFingerprintRecord(parsed);
      results.push(saved);
    }

    return res.status(200).json({ message: 'Logs processed', results });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const parseADMSLine = (line) => {
  // Format: "PIN=1234    2025-11-04 08:02:31    0"
  const regex = /PIN=(\S+)\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(\d)/;
  const match = line.match(regex);

  if (!match) return null;

  return {
    pin: match[1],
    timestamp: match[2],
    status: match[3] === '0' ? 'checkIn' : 'checkOut'
  };
};

export const processFingerprintRecord = async ({ pin, timestamp, status }) => {
  try {
    // Cari employee berdasarkan PIN (employeeId)
    const employee = await Employee.findOne({ employeeId: pin });
    
    if (!employee) {
      // Jika employee tidak ditemukan, simpan sebagai raw data
      return await saveRawFingerprintRecord(pin, timestamp, status);
    }

    // Jika employee ditemukan, cek apakah fingerprint sudah dipetakan
    const isFingerprintMapped = await checkFingerprintMapping(pin);
    
    if (!isFingerprintMapped) {
      // Jika belum dipetakan, simpan sebagai raw data
      return await saveRawFingerprintRecord(pin, timestamp, status);
    }

    // Jika sudah dipetakan, simpan ke attendance
    return await saveAttendanceRecord(employee, timestamp, status);

  } catch (error) {
    console.error('Error processing fingerprint record:', error);
    return { pin, error: error.message };
  }
};

export const saveRawFingerprintRecord = async (pin, timestamp, status) => {
  try {
    // Generate unique deviceUserId dari PIN dan timestamp
    const deviceUserId = `USER_${pin}`;
    const username = `Employee_${pin}`;
    
    // Cek apakah raw data sudah ada untuk PIN ini
    const existingRaw = await RawFingerprint.findOne({ 
      deviceUserId,
      isMapped: false 
    });

    if (existingRaw) {
      // Update last activity timestamp
      existingRaw.lastActivity = new Date(timestamp);
      existingRaw.lastStatus = status;
      await existingRaw.save();
      
      return { 
        pin, 
        status: 'raw_updated', 
        message: 'Raw fingerprint data updated',
        mapped: false
      };
    }

    // Simpan data fingerprint baru sebagai raw data
    const rawFingerprint = new RawFingerprint({
      deviceId: 'X105', // Default device ID
      deviceUserId,
      username,
      fingerprintData: `FP_DATA_${pin}_${Date.now()}`, // Simulasi fingerprint data
      fingerprintIndex: 0, // Default finger index
      lastActivity: new Date(timestamp),
      lastStatus: status,
      isMapped: false
    });

    await rawFingerprint.save();

    return { 
      pin, 
      status: 'raw_saved', 
      message: 'Fingerprint saved as raw data (not mapped to employee)',
      mapped: false,
      rawFingerprintId: rawFingerprint._id
    };

  } catch (error) {
    console.error('Error saving raw fingerprint:', error);
    return { pin, error: 'Failed to save raw fingerprint data' };
  }
};

export const saveAttendanceRecord = async (employee, timestamp, status) => {
  try {
    const dateOnly = new Date(timestamp);
    dateOnly.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({ 
      employee: employee._id, 
      date: dateOnly 
    });

    const updateField = status === 'checkIn' ? 'checkIn' : 'checkOut';

    // Cegah duplikasi (kalau mesin mengirim ulang)
    if (existing?.[updateField]?.time) {
      return { 
        pin: employee.employeeId, 
        status: 'duplicate_ignored',
        mapped: true
      };
    }

    if (existing) {
      // Update existing attendance record
      await Attendance.findByIdAndUpdate(existing._id, {
        [updateField]: {
          time: new Date(timestamp),
          device: 'X105',
          type: 'fingerprint'
        }
      });
      
      return { 
        pin: employee.employeeId, 
        status: 'attendance_updated',
        mapped: true,
        employee: employee.user?.username
      };
    }

    // Create new attendance record
    await Attendance.create({
      employee: employee._id,
      date: dateOnly,
      [updateField]: {
        time: new Date(timestamp),
        device: 'X105',
        type: 'fingerprint'
      }
    });

    return { 
      pin: employee.employeeId, 
      status: 'attendance_created',
      mapped: true,
      employee: employee.user?.username
    };

  } catch (error) {
    console.error('Error saving attendance record:', error);
    return { 
      pin: employee.employeeId, 
      error: 'Failed to save attendance record',
      mapped: true
    };
  }
};

export const checkFingerprintMapping = async (pin) => {
  try {
    const deviceUserId = `USER_${pin}`;
    
    // Cek di RawFingerprint apakah sudah dipetakan
    const rawFingerprint = await RawFingerprint.findOne({ 
      deviceUserId,
      isMapped: true 
    });

    return !!rawFingerprint;
  } catch (error) {
    console.error('Error checking fingerprint mapping:', error);
    return false;
  }
};

// Fungsi tambahan untuk mendapatkan log aktivitas fingerprint
export const getFingerprintActivityLog = async (req, res) => {
  try {
    const { startDate, endDate, showMapped } = req.query;
    
    const filter = {};
    
    if (startDate && endDate) {
      filter.lastActivity = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (showMapped !== undefined) {
      filter.isMapped = showMapped === 'true';
    }

    const activities = await RawFingerprint.find(filter)
      .populate('mappedToEmployee')
      .sort({ lastActivity: -1 });

    res.json({
      success: true,
      data: activities,
      total: activities.length
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};