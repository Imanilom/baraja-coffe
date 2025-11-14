// controllers/hr/adms.controller.js
import Attendance from '../../models/model_hr/Attendance.model.js';
import Employee from '../../models/model_hr/Employee.model.js';
import RawFingerprint from '../../models/model_hr/RawFingerprint.model.js';

// Cache untuk mencegah processing data yang sama berulang
const processedCache = new Map();
const CACHE_TTL = 60000; // 1 menit

export const handleADMSUpload = async (req, res) => {
  try {
    const raw = req.body;
    console.log("Raw body received, length:", raw.length);
    
    // Handle empty data (heartbeat)
    if (!raw || !raw.trim()) {
      return res.status(200).send('OK');
    }

    // Handle OPLOG messages (device operation log)
    if (raw.startsWith('OPLOG')) {
      console.log("OPLOG message received and ignored");
      return res.status(200).send('OK');
    }

    // Check cache untuk mencegah processing data yang sama
    const cacheKey = raw.substring(0, 100); // Ambil bagian awal sebagai key
    if (processedCache.has(cacheKey)) {
      console.log("Skipping duplicate request (cached)");
      return res.status(200).json({ message: 'Duplicate request ignored' });
    }

    // Set cache
    processedCache.set(cacheKey, true);
    setTimeout(() => processedCache.delete(cacheKey), CACHE_TTL);

    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const results = [];

    console.log(`Processing ${lines.length} lines from device`);

    let processedCount = 0;
    let skippedCount = 0;

    for (const line of lines) {
      const parsed = parseADMSData(line);
      if (!parsed) {
        skippedCount++;
        continue;
      }

      const result = await processFingerprintRecord(parsed);
      results.push(result);
      
      if (result.status === 'historical_ignored') {
        skippedCount++;
      } else {
        processedCount++;
      }
    }

    console.log(`Processing completed: ${processedCount} processed, ${skippedCount} skipped`);

    // Jika semua data di-skip (historical), kirim response khusus ke device
    if (processedCount === 0 && skippedCount > 0) {
      console.log("All data is historical, sending clear signal to device");
      return res.status(200).send('OK: CLEAR'); // Signal untuk device clear buffer
    }

    return res.status(200).json({ 
      message: 'Logs processed', 
      processed: processedCount,
      skipped: skippedCount,
      results 
    });

  } catch (error) {
    console.error("Error in handleADMSUpload:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const parseADMSData = (line) => {
  // Format: "4    2022-08-26 12:53:54     0       1               0       0"
  const format1 = /^(\d+)\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;
  
  const match = line.match(format1);
  if (!match) {
    return null;
  }

  const pin = match[1];
  const timestamp = match[2];
  const statusCode = parseInt(match[3]);
  
  // Convert status code to checkIn/checkOut
  let status = 'checkIn';
  if (statusCode === 1 || statusCode === 4) {
    status = 'checkOut';
  }
  
  return {
    pin,
    timestamp,
    status,
    statusCode,
    verifyMethod: match[4],
    workCode: match[5]
  };
};

export const processFingerprintRecord = async (parsedData) => {
  try {
    const { pin, timestamp, status } = parsedData;

    // Filter data historis yang terlalu lama (lebih dari 30 hari)
    const recordDate = new Date(timestamp);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) {
      return { 
        pin, 
        status: 'historical_ignored', 
        message: `Historical data ignored (${daysDiff} days old)`,
        timestamp,
        daysOld: daysDiff
      };
    }

    // Cari employee berdasarkan PIN (employeeId)
    const employee = await Employee.findOne({ employeeId: pin });
    
    if (!employee) {
      console.log(`Employee not found for PIN: ${pin}, saving as raw data`);
      return await saveRawFingerprintRecord(pin, timestamp, status);
    }

    // Jika employee ditemukan, cek apakah fingerprint sudah dipetakan
    const isFingerprintMapped = await checkFingerprintMapping(pin);
    
    if (!isFingerprintMapped) {
      console.log(`Fingerprint not mapped for PIN: ${pin}, saving as raw data`);
      return await saveRawFingerprintRecord(pin, timestamp, status);
    }

    console.log(`Fingerprint mapped for PIN: ${pin}, saving to attendance`);
    return await saveAttendanceRecord(employee, timestamp, status);

  } catch (error) {
    console.error('Error processing fingerprint record:', error);
    return { 
      pin: parsedData.pin, 
      error: error.message,
      timestamp: parsedData.timestamp 
    };
  }
};


export const saveRawFingerprintRecord = async (pin, timestamp, status) => {
  try {
    const deviceUserId = `USER_${pin}`;
    const username = `Employee_${pin}`;
    
    // Cek apakah raw data sudah ada untuk PIN ini
    const existingRaw = await RawFingerprint.findOne({ 
      deviceUserId,
      isMapped: false 
    });

    const now = new Date();
    const recordDate = new Date(timestamp);

    if (existingRaw) {
      // Update hanya jika data lebih baru
      if (recordDate > existingRaw.lastActivity) {
        existingRaw.lastActivity = recordDate;
        existingRaw.lastStatus = status;
        await existingRaw.save();
        
        console.log(`Updated raw fingerprint for PIN: ${pin}`);
        
        return { 
          pin, 
          status: 'raw_updated', 
          message: 'Raw fingerprint data updated',
          mapped: false,
          timestamp 
        };
      } else {
        console.log(`Duplicate raw data for PIN: ${pin}, ignoring`);
        return { 
          pin, 
          status: 'raw_duplicate', 
          message: 'Duplicate raw data ignored',
          mapped: false,
          timestamp 
        };
      }
    }

    // Simpan data fingerprint baru sebagai raw data
    const rawFingerprint = new RawFingerprint({
      deviceId: 'X105',
      deviceUserId,
      username,
      fingerprintData: `FP_${pin}_${Date.now()}`,
      fingerprintIndex: 0,
      lastActivity: recordDate,
      lastStatus: status,
      isMapped: false
    });

    await rawFingerprint.save();

    console.log(`Saved new raw fingerprint for PIN: ${pin}`);

    return { 
      pin, 
      status: 'raw_saved', 
      message: 'Fingerprint saved as raw data (not mapped to employee)',
      mapped: false,
      rawFingerprintId: rawFingerprint._id,
      timestamp 
    };

  } catch (error) {
    console.error('Error saving raw fingerprint:', error);
    return { 
      pin, 
      error: 'Failed to save raw fingerprint data',
      timestamp 
    };
  }
};

export const saveAttendanceRecord = async (employee, timestamp, status) => {
  try {
    const recordDate = new Date(timestamp);
    const dateOnly = new Date(recordDate);
    dateOnly.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({ 
      employee: employee._id, 
      date: dateOnly 
    });

    const updateField = status === 'checkIn' ? 'checkIn' : 'checkOut';

    // Cek duplikasi dengan toleransi 2 menit
    if (existing?.[updateField]?.time) {
      const existingTime = new Date(existing[updateField].time);
      const newTime = recordDate;
      const timeDiff = Math.abs(newTime - existingTime) / (1000 * 60); // difference in minutes
      
      if (timeDiff < 2) {
        console.log(`Duplicate ${status} for employee ${employee.employeeId}, ignoring`);
        return { 
          pin: employee.employeeId, 
          status: 'duplicate_ignored',
          mapped: true,
          timestamp 
        };
      }
    }

    if (existing) {
      // Update existing record
      await Attendance.findByIdAndUpdate(existing._id, {
        [updateField]: {
          time: recordDate,
          device: 'X105',
          type: 'fingerprint'
        }
      });
      
      console.log(`Updated ${status} for employee ${employee.employeeId}`);
      
      return { 
        pin: employee.employeeId, 
        status: 'attendance_updated',
        mapped: true,
        employee: employee.user?.username,
        timestamp 
      };
    }

    // Create new record
    await Attendance.create({
      employee: employee._id,
      date: dateOnly,
      [updateField]: {
        time: recordDate,
        device: 'X105',
        type: 'fingerprint'
      }
    });

    console.log(`Created new ${status} for employee ${employee.employeeId}`);

    return { 
      pin: employee.employeeId, 
      status: 'attendance_created',
      mapped: true,
      employee: employee.user?.username,
      timestamp 
    };

  } catch (error) {
    console.error('Error saving attendance record:', error);
    return { 
      pin: employee.employeeId, 
      error: 'Failed to save attendance record',
      mapped: true,
      timestamp 
    };
  }
};

export const checkFingerprintMapping = async (pin) => {
  try {
    const deviceUserId = `USER_${pin}`;
    
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

// Fungsi untuk membersihkan data test/historical
export const cleanupHistoricalData = async (req, res) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); // 1 tahun yang lalu
    
    const result = await RawFingerprint.deleteMany({
      lastActivity: { $lt: cutoffDate },
      isMapped: false
    });
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} historical records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
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

// controllers/hr/device.controller.js
export const clearDeviceBuffer = async (req, res) => {
  try {
    const { deviceId } = req.body;
    
    // Simulasi perintah clear buffer ke device
    // Dalam implementasi nyata, ini akan mengirim command ke device
    console.log(`Sending clear buffer command to device: ${deviceId}`);
    
    // Return response yang membuat device clear buffer-nya
    res.set('Content-Type', 'text/plain');
    res.send(`OK: CLEAR BUFFER\nDevice: ${deviceId}\nTime: ${new Date().toISOString()}`);
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getDeviceStatus = async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    // Return status device
    res.json({
      success: true,
      deviceId: deviceId || 'X105',
      status: 'connected',
      lastCommunication: new Date(),
      bufferSize: 0, // Asumsi buffer sudah clear
      recommendation: 'Device is sending historical data repeatedly. Consider resetting device or clearing buffer.'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};