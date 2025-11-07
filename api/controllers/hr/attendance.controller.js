import Attendance from '../../models/model_hr/Attendance.model.js'
import Employee from '../../models/model_hr/Employee.model.js';

export const attendanceController = {
  // Check in
  checkIn: async (req, res) => {
    try {
      const { employeeId, location, device, photo, type = 'fingerprint' } = req.body;

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already checked in today
      const existingAttendance = await Attendance.findOne({
        employee: employeeId,
        date: today
      });

      if (existingAttendance && existingAttendance.checkIn.time) {
        return res.status(400).json({ message: 'Already checked in today' });
      }

      let attendance;
      if (existingAttendance) {
        // Update existing attendance
        attendance = await Attendance.findByIdAndUpdate(
          existingAttendance._id,
          {
            checkIn: {
              time: new Date(),
              location,
              device,
              photo,
              type
            }
          },
          { new: true }
        ).populate('employee');
      } else {
        // Create new attendance
        attendance = new Attendance({
          employee: employeeId,
          date: today,
          checkIn: {
            time: new Date(),
            location,
            device,
            photo,
            type
          }
        });
        await attendance.save();
        await attendance.populate('employee');
      }

      res.status(201).json({
        message: 'Check in successful',
        data: attendance
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Check out
  checkOut: async (req, res) => {
    try {
      const { employeeId, location, device, photo, type = 'fingerprint' } = req.body;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await Attendance.findOne({
        employee: employeeId,
        date: today
      });

      if (!attendance) {
        return res.status(404).json({ message: 'No check in record found for today' });
      }

      if (attendance.checkOut && attendance.checkOut.time) {
        return res.status(400).json({ message: 'Already checked out today' });
      }

      const checkOutTime = new Date();

      // Calculate work hours
      const checkInTime = new Date(attendance.checkIn.time);
      const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours

      // Calculate overtime (assuming > 8 hours is overtime)
      const regularHours = Math.min(workHours, 8);
      const overtimeHours = Math.max(workHours - 8, 0);

      attendance.checkOut = {
        time: checkOutTime,
        location,
        device,
        photo,
        type
      };
      attendance.workHours = regularHours;
      attendance.overtimeHours = overtimeHours;

      await attendance.save();
      await attendance.populate('employee');

      res.json({
        message: 'Check out successful',
        data: attendance
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get attendance by employee and date range
  getAttendanceByEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate, page = 1, limit = 30 } = req.query;

      const filter = { employee: employeeId };

      if (startDate && endDate) {
        filter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const attendance = await Attendance.find(filter)
        .populate('employee')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ date: -1 });

      const total = await Attendance.countDocuments(filter);

      res.json({
        data: attendance,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get attendance summary for dashboard
  getAttendanceSummary: async (req, res) => {
    try {
      const { startDate, endDate, department } = req.query;

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Build employee filter
      const employeeFilter = {};
      if (department) employeeFilter.department = department;

      const employees = await Employee.find(employeeFilter);
      const employeeIds = employees.map(emp => emp._id);

      const attendanceData = await Attendance.aggregate([
        {
          $match: {
            employee: { $in: employeeIds },
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$employee',
            totalPresent: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            },
            totalLate: {
              $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
            },
            totalAbsent: {
              $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
            },
            totalWorkHours: { $sum: '$workHours' },
            totalOvertime: { $sum: '$overtimeHours' }
          }
        },
        {
          $lookup: {
            from: 'employees',
            localField: '_id',
            foreignField: '_id',
            as: 'employee'
          }
        },
        {
          $unwind: '$employee'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'employee.user',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        }
      ]);

      res.json(attendanceData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Manual attendance correction
  updateAttendance: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const attendance = await Attendance.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('employee');

      if (!attendance) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }

      res.json({
        message: 'Attendance updated successfully',
        data: attendance
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};