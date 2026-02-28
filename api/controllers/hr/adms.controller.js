// controllers/hr/adms.controller.js
import Attendance from '../../models/model_hr/Attendance.model.js';
import Employee from '../../models/model_hr/Employee.model.js';
import RawFingerprint from '../../models/model_hr/RawFingerprint.model.js';

// Track device buffer status dan processed records
const deviceBufferStatus = new Map();
const processedRecords = new Map();
const employeeCache = new Map(); // Cache employee lookup
const fingerprintMappingCache = new Map(); // Cache fingerprint mapping

// Rate limiting per device
const deviceRateLimiter = new Map();

// Setup periodic cleanup (setiap 5 menit)
let cleanupInterval;
if (!cleanupInterval) {
  cleanupInterval = setInterval(() => {
    try {
      cleanupDeviceStatus();
      cleanupProcessedRecords();
      cleanupCaches();
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  }, 5 * 60 * 1000); // 5 menit
}

export const handleADMSUpload = async (req, res) => {
  const startTime = Date.now();
  let deviceIp;
  
  try {
    const raw = req.body;
    deviceIp = req.ip || req.connection.remoteAddress;
    
    // Rate limiting check
    if (isRateLimited(deviceIp)) {
      console.log(`⚠️ Device ${deviceIp} rate limited`);
      return res.status(200).send('OK');
    }

    // Quick validation
    if (!raw || !raw.trim()) {
      return res.status(200).send('OK');
    }

    if (raw.startsWith('OPLOG')) {
      return res.status(200).send('OK');
    }

    const deviceKey = `device_${deviceIp}`;
    const currentTime = Date.now();
    
    // Initialize or update device status
    const deviceStatus = getOrCreateDeviceStatus(deviceKey, currentTime);

    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Limit processing untuk mencegah overload
    const maxLines = 100;
    const linesToProcess = lines.slice(0, maxLines);
    
    if (lines.length > maxLines) {
      console.log(`⚠️ Device ${deviceIp} sent ${lines.length} lines, processing only ${maxLines}`);
    }

    let processedCount = 0;
    let skippedCount = 0;
    let duplicateCount = 0;
    let hasHistoricalData = false;

    // Process records dengan Promise.all untuk parallel processing
    const processingPromises = linesToProcess.map(async (line) => {
      try {
        const parsed = parseADMSData(line);
        if (!parsed) return { type: 'skipped' };

        const recordId = `${parsed.pin}_${parsed.timestamp}`;
        
        // Check duplicate
        if (processedRecords.has(recordId)) {
          const recordTime = processedRecords.get(recordId);
          if (currentTime - recordTime < 300000) {
            deviceStatus.duplicateCount++;
            return { type: 'duplicate', data: parsed };
          }
        }

        // Check historical
        const recordDate = new Date(parsed.timestamp);
        const daysDiff = Math.floor((Date.now() - recordDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 30) {
          deviceStatus.historicalCount++;
          return { type: 'historical', data: parsed, daysOld: daysDiff };
        }

        // Mark as processed
        processedRecords.set(recordId, currentTime);

        // Process in background (non-blocking)
        setImmediate(async () => {
          try {
            await processFingerprintRecord(parsed);
          } catch (error) {
            console.error(`Background processing error for PIN ${parsed.pin}:`, error.message);
          }
        });

        return { type: 'processed', data: parsed };
      } catch (error) {
        return { type: 'error', error: error.message };
      }
    });

    // Wait for all parsing (but not DB operations)
    const results = await Promise.all(processingPromises);

    // Count results
    results.forEach(result => {
      switch (result.type) {
        case 'processed':
          processedCount++;
          break;
        case 'historical':
          hasHistoricalData = true;
          skippedCount++;
          break;
        case 'duplicate':
          duplicateCount++;
          skippedCount++;
          break;
        case 'skipped':
        case 'error':
          skippedCount++;
          break;
      }
    });

    // Determine response
    let responseMessage = 'OK';
    const timeWindow = currentTime - deviceStatus.firstSeen;
    
    const isStuckInLoop = (
      deviceStatus.duplicateCount > 10 || 
      (deviceStatus.historicalCount > 15 && timeWindow < 120000) ||
      (deviceStatus.requestCount > 20 && processedCount === 0 && skippedCount > 0)
    );

    if (isStuckInLoop) {
      console.log(`🚨 Device ${deviceIp} STUCK! Sending CLEAR (req:${deviceStatus.requestCount}, dup:${deviceStatus.duplicateCount}, hist:${deviceStatus.historicalCount})`);
      responseMessage = 'C';
      deviceStatus.clearSent = true;
      deviceStatus.lastClearTime = currentTime;
      deviceStatus.historicalCount = 0;
      deviceStatus.duplicateCount = 0;
      
    } else if (hasHistoricalData && deviceStatus.historicalCount > 8) {
      console.log(`⚠️ Device ${deviceIp} sending historical data (count: ${deviceStatus.historicalCount})`);
      responseMessage = 'C';
      deviceStatus.clearSent = true;
      deviceStatus.lastClearTime = currentTime;
      
    } else if (duplicateCount > 3 && deviceStatus.duplicateCount > 5) {
      console.log(`🔄 Device ${deviceIp} sending duplicates (count: ${deviceStatus.duplicateCount})`);
      responseMessage = 'C';
      deviceStatus.clearSent = true;
      deviceStatus.lastClearTime = currentTime;
    }

    // Log summary only for important events
    const processingTime = Date.now() - startTime;
    if (processingTime > 100 || responseMessage === 'C') {
      console.log(`📊 ${deviceIp}: ${processedCount}✓ ${skippedCount}⊘ ${duplicateCount}⨯ (${processingTime}ms) → ${responseMessage}`);
    }

    res.set({
      'Content-Type': 'text/plain',
      'Connection': 'close',
      'Cache-Control': 'no-cache'
    });
    
    return res.send(responseMessage);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Error handling ${deviceIp} (${processingTime}ms):`, error.message);
    
    res.set('Content-Type', 'text/plain');
    return res.send('OK');
  }
};

// Helper: Get or create device status
const getOrCreateDeviceStatus = (deviceKey, currentTime) => {
  if (!deviceBufferStatus.has(deviceKey)) {
    deviceBufferStatus.set(deviceKey, {
      firstSeen: currentTime,
      requestCount: 0,
      historicalCount: 0,
      duplicateCount: 0,
      lastRequest: currentTime,
      clearSent: false,
      lastClearTime: null
    });
  }
  
  const status = deviceBufferStatus.get(deviceKey);
  status.requestCount++;
  status.lastRequest = currentTime;
  
  return status;
};

// Helper: Rate limiting
const isRateLimited = (deviceIp) => {
  const now = Date.now();
  const limit = 50; // max 50 requests per minute
  const window = 60000; // 1 minute
  
  if (!deviceRateLimiter.has(deviceIp)) {
    deviceRateLimiter.set(deviceIp, []);
  }
  
  const requests = deviceRateLimiter.get(deviceIp);
  
  // Remove old requests
  const validRequests = requests.filter(time => now - time < window);
  deviceRateLimiter.set(deviceIp, validRequests);
  
  if (validRequests.length >= limit) {
    return true;
  }
  
  validRequests.push(now);
  return false;
};

// Clean up device status cache
const cleanupDeviceStatus = () => {
  const currentTime = Date.now();
  const tenMinutesAgo = currentTime - (10 * 60 * 1000);
  let cleaned = 0;
  
  for (const [key, status] of deviceBufferStatus.entries()) {
    if (status.lastRequest < tenMinutesAgo) {
      deviceBufferStatus.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} device status entries`);
  }
};

// Clean up processed records cache
const cleanupProcessedRecords = () => {
  const currentTime = Date.now();
  const fiveMinutesAgo = currentTime - (5 * 60 * 1000);
  let cleaned = 0;
  
  for (const [recordId, timestamp] of processedRecords.entries()) {
    if (timestamp < fiveMinutesAgo) {
      processedRecords.delete(recordId);
      cleaned++;
    }
  }
  
  // Limit cache size
  if (processedRecords.size > 1000) {
    const sortedRecords = Array.from(processedRecords.entries())
      .sort((a, b) => a[1] - b[1]);
    
    const toDelete = sortedRecords.slice(0, sortedRecords.length - 500);
    toDelete.forEach(([recordId]) => processedRecords.delete(recordId));
    cleaned += toDelete.length;
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} processed records`);
  }
};

// Clean up caches
const cleanupCaches = () => {
  const now = Date.now();
  let cleaned = 0;
  
  // Clear employee cache older than 10 minutes
  if (employeeCache.size > 100) {
    employeeCache.clear();
    cleaned += employeeCache.size;
  }
  
  // Clear fingerprint mapping cache older than 10 minutes
  if (fingerprintMappingCache.size > 100) {
    fingerprintMappingCache.clear();
    cleaned += fingerprintMappingCache.size;
  }
  
  // Clear rate limiter
  const oneHourAgo = now - (60 * 60 * 1000);
  for (const [ip, requests] of deviceRateLimiter.entries()) {
    const validRequests = requests.filter(time => now - time < 60000);
    if (validRequests.length === 0) {
      deviceRateLimiter.delete(ip);
      cleaned++;
    } else {
      deviceRateLimiter.set(ip, validRequests);
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} cache entries`);
  }
};

// Manual force clear
export const forceClearDeviceBuffer = async (req, res) => {
  try {
    const { deviceIp } = req.body;
    
    if (deviceIp) {
      const deviceKey = `device_${deviceIp}`;
      deviceBufferStatus.delete(deviceKey);
      deviceRateLimiter.delete(deviceIp);
      console.log(`🛠️ Cleared buffer for device: ${deviceIp}`);
    } else {
      deviceBufferStatus.clear();
      processedRecords.clear();
      employeeCache.clear();
      fingerprintMappingCache.clear();
      deviceRateLimiter.clear();
      console.log("🧹 Cleared all caches and buffers");
    }
    
    res.json({
      success: true,
      message: 'Device buffer cleared',
      clearedDevices: deviceIp ? [deviceIp] : 'all'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get device buffer status
export const getDeviceBufferStatus = async (req, res) => {
  try {
    const devices = [];
    
    for (const [key, status] of deviceBufferStatus.entries()) {
      const deviceIp = key.replace('device_', '');
      const timeWindow = Date.now() - status.firstSeen;
      const isStuck = (
        status.duplicateCount > 10 || 
        (status.historicalCount > 15 && timeWindow < 120000) ||
        (status.requestCount > 20 && status.historicalCount > 0)
      );
      
      devices.push({
        deviceIp,
        requestCount: status.requestCount,
        historicalCount: status.historicalCount,
        duplicateCount: status.duplicateCount,
        firstSeen: new Date(status.firstSeen).toISOString(),
        lastRequest: new Date(status.lastRequest).toISOString(),
        clearSent: status.clearSent,
        lastClearTime: status.lastClearTime ? new Date(status.lastClearTime).toISOString() : null,
        isStuckInLoop: isStuck,
        uptime: Math.floor(timeWindow / 1000) + 's'
      });
    }
    
    res.json({
      success: true,
      totalDevices: devices.length,
      cacheStats: {
        processedRecords: processedRecords.size,
        employeeCache: employeeCache.size,
        fingerprintCache: fingerprintMappingCache.size,
        rateLimiter: deviceRateLimiter.size
      },
      devices
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Parse function
export const parseADMSData = (line) => {
  const format1 = /^(\d+)\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;
  
  const match = line.match(format1);
  if (!match) return null;

  const pin = match[1];
  const timestamp = match[2];
  const statusCode = parseInt(match[3]);
  
  return {
    pin,
    timestamp,
    status: (statusCode === 1 || statusCode === 4) ? 'checkOut' : 'checkIn',
    statusCode,
    verifyMethod: match[4],
    workCode: match[5]
  };
};

export const processFingerprintRecord = async (parsedData) => {
  try {
    const { pin, timestamp, status } = parsedData;

    // Check historical
    const recordDate = new Date(timestamp);
    const daysDiff = Math.floor((Date.now() - recordDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) {
      return { pin, status: 'historical_ignored', daysOld: daysDiff };
    }

    // Check employee cache first
    let employee = employeeCache.get(pin);
    
    if (!employee) {
      employee = await Employee.findOne({ employeeId: pin }).lean();
      if (employee) {
        employeeCache.set(pin, employee);
      }
    }
    
    if (!employee) {
      return await saveRawFingerprintRecord(pin, timestamp, status);
    }

    // Check fingerprint mapping cache
    const cacheKey = `fp_${pin}`;
    let isMapped = fingerprintMappingCache.get(cacheKey);
    
    if (isMapped === undefined) {
      isMapped = await checkFingerprintMapping(pin);
      fingerprintMappingCache.set(cacheKey, isMapped);
    }
    
    if (!isMapped) {
      return await saveRawFingerprintRecord(pin, timestamp, status);
    }

    return await saveAttendanceRecord(employee, timestamp, status);

  } catch (error) {
    console.error(`Error processing PIN ${parsedData.pin}:`, error.message);
    return { pin: parsedData.pin, error: error.message };
  }
};

export const saveRawFingerprintRecord = async (pin, timestamp, status) => {
  try {
    const deviceUserId = `USER_${pin}`;
    const recordDate = new Date(timestamp);
    
    const existingRaw = await RawFingerprint.findOne({ 
      deviceUserId,
      isMapped: false 
    }).lean();

    if (existingRaw) {
      if (recordDate > new Date(existingRaw.lastActivity)) {
        await RawFingerprint.updateOne(
          { _id: existingRaw._id },
          { 
            lastActivity: recordDate,
            lastStatus: status 
          }
        );
        return { pin, status: 'raw_updated', mapped: false };
      }
      return { pin, status: 'raw_duplicate', mapped: false };
    }

    await RawFingerprint.create({
      deviceId: 'X105',
      deviceUserId,
      username: `Employee_${pin}`,
      fingerprintData: `FP_${pin}_${Date.now()}`,
      fingerprintIndex: 0,
      lastActivity: recordDate,
      lastStatus: status,
      isMapped: false
    });

    return { pin, status: 'raw_saved', mapped: false };

  } catch (error) {
    console.error(`Error saving raw FP for PIN ${pin}:`, error.message);
    return { pin, error: 'Failed to save raw fingerprint' };
  }
};

export const saveAttendanceRecord = async (employee, timestamp, status) => {
  try {
    const recordDate = new Date(timestamp);
    const dateOnly = new Date(recordDate);
    dateOnly.setHours(0, 0, 0, 0);

    const updateField = status === 'checkIn' ? 'checkIn' : 'checkOut';

    const existing = await Attendance.findOne({ 
      employee: employee._id, 
      date: dateOnly 
    }).lean();

    // Check duplicate
    if (existing?.[updateField]?.time) {
      const existingTime = new Date(existing[updateField].time);
      const timeDiff = Math.abs(recordDate - existingTime) / (1000 * 60);
      
      if (timeDiff < 2) {
        return { pin: employee.employeeId, status: 'duplicate_ignored', mapped: true };
      }
    }

    if (existing) {
      await Attendance.updateOne(
        { _id: existing._id },
        { 
          [updateField]: {
            time: recordDate,
            device: 'X105',
            type: 'fingerprint'
          }
        }
      );
      return { pin: employee.employeeId, status: 'attendance_updated', mapped: true };
    }

    await Attendance.create({
      employee: employee._id,
      date: dateOnly,
      [updateField]: {
        time: recordDate,
        device: 'X105',
        type: 'fingerprint'
      }
    });

    return { pin: employee.employeeId, status: 'attendance_created', mapped: true };

  } catch (error) {
    console.error(`Error saving attendance for ${employee.employeeId}:`, error.message);
    return { pin: employee.employeeId, error: 'Failed to save attendance' };
  }
};

export const checkFingerprintMapping = async (pin) => {
  try {
    const deviceUserId = `USER_${pin}`;
    const count = await RawFingerprint.countDocuments({ 
      deviceUserId,
      isMapped: true 
    });
    return count > 0;
  } catch (error) {
    return false;
  }
};

export const cleanupHistoricalData = async (req, res) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    
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

export const getFingerprintActivityLog = async (req, res) => {
  try {
    const { startDate, endDate, showMapped, limit = 100 } = req.query;
    
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
      .populate('mappedToEmployee', 'employeeId user')
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit))
      .lean();

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

export const clearDeviceBuffer = async (req, res) => {
  try {
    const { deviceId } = req.body;
    console.log(`Sending clear command to device: ${deviceId}`);
    
    res.set('Content-Type', 'text/plain');
    res.send('C');
    
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
    
    res.json({
      success: true,
      deviceId: deviceId || 'X105',
      status: 'connected',
      lastCommunication: new Date(),
      bufferSize: 0,
      cacheSize: {
        devices: deviceBufferStatus.size,
        records: processedRecords.size,
        employees: employeeCache.size,
        fingerprints: fingerprintMappingCache.size
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};