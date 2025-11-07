import Attendance from '../../models/model_hr/Attendance.model.js'
import Employee from '../../models/model_hr/Employee.model.js';


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

      const saved = await saveFingerprintRecord(parsed);
      results.push(saved);
    }

    return res.status(200).json({ message: 'Logs processed', results });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const parseADMSLine = (line) => {
  // Example: "PIN=1234    2025-11-04 08:02:31    0"
  const regex = /PIN=(\S+)\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(\d)/;
  const match = line.match(regex);

  if (!match) return null;

  return {
    pin: match[1],
    timestamp: match[2],
    status: match[3] === '0' ? 'checkIn' : 'checkOut'
  };
};

export const saveFingerprintRecord = async ({ pin, timestamp, status }) => {
  const employee = await Employee.findOne({ employeeId: pin });
  if (!employee) return { pin, error: 'Employee not found' };

  const dateOnly = new Date(timestamp);
  dateOnly.setHours(0, 0, 0, 0);

  const existing = await Attendance.findOne({ employee: employee._id, date: dateOnly });

  const updateField = status === 'checkIn' ? 'checkIn' : 'checkOut';

  // Cegah duplikasi (kalau mesin mengirim ulang)
  if (existing?.[updateField]?.time) {
    return { pin, status: 'duplicate ignored' };
  }

  if (existing) {
    await Attendance.findByIdAndUpdate(existing._id, {
      [updateField]: {
        time: new Date(timestamp),
        device: 'X105',
        type: 'fingerprint'
      }
    });
    return { pin, status: 'updated' };
  }

  // Create new record (usually check-in case)
  await Attendance.create({
    employee: employee._id,
    date: dateOnly,
    [updateField]: {
      time: new Date(timestamp),
      device: 'X105',
      type: 'fingerprint'
    }
  });

  return { pin, status: 'created' };
};

