import Salary from '../../models/model_hr/Salary.model.js';
import Employee from '../../models/model_hr/Employee.model.js';
import Attendance from '../../models/model_hr/Attendance.model.js';
import HRSettings from '../../models/model_hr/HRSetting.model.js';

export const SalaryController = {
  // Calculate salary for period
  calculateSalary: async (req, res) => {
    try {
      const { employeeId, month, year } = req.body;

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      // Check if salary already calculated for this period
      const existingSalary = await Salary.findOne({
        employee: employeeId,
        'period.month': month,
        'period.year': year
      });

      if (existingSalary) {
        return res.status(400).json({ message: 'Salary already calculated for this period' });
      }

      // Get HR settings
      const hrSettings = await HRSettings.findOne();
      if (!hrSettings) {
        return res.status(404).json({ message: 'HR Settings not found' });
      }

      // Get attendance data for the period
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const attendanceRecords = await Attendance.find({
        employee: employeeId,
        date: { $gte: startDate, $lte: endDate }
      });

      // Calculate attendance summary
      const attendanceSummary = {
        totalTappingDays: attendanceRecords.length,
        fingerprintTappingDays: attendanceRecords.filter(record => record.fingerprintTapping).length,
        sickDays: attendanceRecords.filter(record => record.status === 'sick').length,
        permissionDays: attendanceRecords.filter(record => record.status === 'permission').length,
        leaveDays: attendanceRecords.filter(record => record.status === 'leave').length,
        businessTripDays: attendanceRecords.filter(record => record.status === 'business_trip').length,
        totalWorkingDays: new Date(year, month, 0).getDate() // Total days in month
      };

      // Calculate rates
      const prorataPerSession = employee.basicSalary / attendanceSummary.totalWorkingDays;
      const overtimeRate = prorataPerSession / 8 * hrSettings.salaryCalculation.overtime1Rate;

      // Calculate earnings based on tapping system
      const prorataSalary = prorataPerSession * attendanceSummary.fingerprintTappingDays;

      // Calculate overtime
      const totalOvertime1Hours = attendanceRecords.reduce((sum, record) => sum + (record.overtime1Hours || 0), 0);
      const totalOvertime2Hours = attendanceRecords.reduce((sum, record) => sum + (record.overtime2Hours || 0), 0);
      
      const overtime1 = totalOvertime1Hours * overtimeRate;
      const overtime2 = totalOvertime2Hours * overtimeRate * hrSettings.salaryCalculation.overtime2Rate;

      // Calculate allowances
      const totalEarnings = {
        basicSalary: employee.basicSalary,
        prorataSalary: prorataSalary,
        overtime1: overtime1,
        overtime2: overtime2,
        departmentalAllowance: employee.allowances.departmental || 0,
        childcareAllowance: employee.allowances.childcare || 0,
        transportAllowance: employee.allowances.transport || 0,
        mealAllowance: employee.allowances.meal || 0,
        otherAllowances: employee.allowances.other || 0,
        totalEarnings: 0 // Will be calculated in pre-save middleware
      };

      // Calculate BPJS deductions
      const bpjsKesehatan = SalaryController.calculateBPJSKesehatan(
        employee.basicSalary, 
        hrSettings.bpjs.kesehatanRateEmployee, 
        hrSettings.bpjs.maxSalaryBpjs
      );

      const bpjsKetenagakerjaan = SalaryController.calculateBPJSKetenagakerjaan(
        employee.basicSalary, 
        hrSettings.bpjs.ketenagakerjaanRateEmployee, 
        hrSettings.bpjs.maxSalaryBpjs
      );

      // Calculate deductions
      const deductions = {
        bpjsKesehatan: bpjsKesehatan,
        bpjsKetenagakerjaan: bpjsKetenagakerjaan,
        humanError: hrSettings.deductions.humanErrorDeduction || 0,
        absence: SalaryController.calculateAbsenceDeduction(employee.basicSalary, attendanceSummary),
        loan: 0, // You can implement loan calculation
        otherDeductions: 0,
        totalDeductions: 0 // Will be calculated in pre-save middleware
      };

      const salary = new Salary({
        employee: employeeId,
        period: { month, year },
        attendanceSummary,
        earnings: totalEarnings,
        deductions,
        calculationRates: {
          prorataPerSession: prorataPerSession,
          overtimeRate: overtimeRate
        },
        status: 'calculated'
      });

      await salary.save();
      await salary.populate('employee');

      res.status(201).json({
        message: 'Salary calculated successfully',
        data: salary
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Calculate salary for all employees in period
  calculateSalaryForAll: async (req, res) => {
    try {
      const { month, year } = req.body;

      const employees = await Employee.find({ isActive: true });
      const results = {
        success: [],
        failed: []
      };

      for (const employee of employees) {
        try {
          // Check if salary already exists
          const existingSalary = await Salary.findOne({
            employee: employee._id,
            'period.month': month,
            'period.year': year
          });

          if (existingSalary) {
            results.failed.push({
              employee: employee.employeeId,
              name: employee.user?.name,
              reason: 'Salary already calculated'
            });
            continue;
          }

          // Calculate salary using the same logic as calculateSalary
          const salary = await SalaryController.calculateEmployeeSalary(employee, month, year);
          results.success.push({
            employee: employee.employeeId,
            name: employee.user?.name,
            salaryId: salary._id
          });
        } catch (error) {
          results.failed.push({
            employee: employee.employeeId,
            name: employee.user?.name,
            reason: error.message
          });
        }
      }

      res.json({
        message: 'Salary calculation completed',
        results
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Helper function to calculate individual employee salary
  calculateEmployeeSalary: async (employee, month, year) => {
    const hrSettings = await HRSettings.findOne();
    
    // Get attendance data for the period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await Attendance.find({
      employee: employee._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate attendance summary
    const attendanceSummary = {
      totalTappingDays: attendanceRecords.length,
      fingerprintTappingDays: attendanceRecords.filter(record => record.fingerprintTapping).length,
      sickDays: attendanceRecords.filter(record => record.status === 'sick').length,
      permissionDays: attendanceRecords.filter(record => record.status === 'permission').length,
      leaveDays: attendanceRecords.filter(record => record.status === 'leave').length,
      businessTripDays: attendanceRecords.filter(record => record.status === 'business_trip').length,
      totalWorkingDays: new Date(year, month, 0).getDate()
    };

    // Calculate rates
    const prorataPerSession = employee.basicSalary / attendanceSummary.totalWorkingDays;
    const overtimeRate = prorataPerSession / 8 * hrSettings.salaryCalculation.overtime1Rate;

    // Calculate earnings
    const prorataSalary = prorataPerSession * attendanceSummary.fingerprintTappingDays;

    // Calculate overtime
    const totalOvertime1Hours = attendanceRecords.reduce((sum, record) => sum + (record.overtime1Hours || 0), 0);
    const totalOvertime2Hours = attendanceRecords.reduce((sum, record) => sum + (record.overtime2Hours || 0), 0);
    
    const overtime1 = totalOvertime1Hours * overtimeRate;
    const overtime2 = totalOvertime2Hours * overtimeRate * hrSettings.salaryCalculation.overtime2Rate;

    // Calculate earnings
    const earnings = {
      basicSalary: employee.basicSalary,
      prorataSalary: prorataSalary,
      overtime1: overtime1,
      overtime2: overtime2,
      departmentalAllowance: employee.allowances.departmental || 0,
      childcareAllowance: employee.allowances.childcare || 0,
      transportAllowance: employee.allowances.transport || 0,
      mealAllowance: employee.allowances.meal || 0,
      otherAllowances: employee.allowances.other || 0,
      totalEarnings: 0
    };

    // Calculate deductions
    const bpjsKesehatan = SalaryController.calculateBPJSKesehatan(
      employee.basicSalary, 
      hrSettings.bpjs.kesehatanRateEmployee, 
      hrSettings.bpjs.maxSalaryBpjs
    );

    const bpjsKetenagakerjaan = SalaryController.calculateBPJSKetenagakerjaan(
      employee.basicSalary, 
      hrSettings.bpjs.ketenagakerjaanRateEmployee, 
      hrSettings.bpjs.maxSalaryBpjs
    );

    const deductions = {
      bpjsKesehatan: bpjsKesehatan,
      bpjsKetenagakerjaan: bpjsKetenagakerjaan,
      humanError: hrSettings.deductions.humanErrorDeduction || 0,
      absence: SalaryController.calculateAbsenceDeduction(employee.basicSalary, attendanceSummary),
      loan: 0,
      otherDeductions: 0,
      totalDeductions: 0
    };

    const salary = new Salary({
      employee: employee._id,
      period: { month, year },
      attendanceSummary,
      earnings,
      deductions,
      calculationRates: {
        prorataPerSession: prorataPerSession,
        overtimeRate: overtimeRate
      },
      status: 'calculated'
    });

    await salary.save();
    return salary;
  },

  // Approve salary
  approveSalary: async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;

      const salary = await Salary.findByIdAndUpdate(
        id,
        {
          status: 'approved',
          approvedBy
        },
        { new: true }
      ).populate('employee approvedBy');

      if (!salary) {
        return res.status(404).json({ message: 'Salary record not found' });
      }

      res.json({
        message: 'Salary approved successfully',
        data: salary
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Mark salary as paid
  markAsPaid: async (req, res) => {
    try {
      const { id } = req.params;
      const { paidBy, paymentMethod = 'transfer' } = req.body;

      const salary = await Salary.findByIdAndUpdate(
        id,
        {
          status: 'paid',
          paidAt: new Date(),
          paidBy,
          paymentMethod
        },
        { new: true }
      ).populate('employee paidBy');

      if (!salary) {
        return res.status(404).json({ message: 'Salary record not found' });
      }

      res.json({
        message: 'Salary marked as paid',
        data: salary
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get salary by employee
  getSalaryByEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { page = 1, limit = 12, year } = req.query;

      const filter = { employee: employeeId };
      if (year) {
        filter['period.year'] = parseInt(year);
      }

      const salaries = await Salary.find(filter)
        .populate('employee paidBy approvedBy')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ 'period.year': -1, 'period.month': -1 });

      const total = await Salary.countDocuments(filter);

      res.json({
        data: salaries,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get salary by period
  getSalaryByPeriod: async (req, res) => {
    try {
      const { month, year } = req.query;

      const salaries = await Salary.find({
        'period.month': parseInt(month),
        'period.year': parseInt(year)
      })
        .populate('employee')
        .sort({ 'employee.department': 1, 'employee.position': 1 });

      res.json({
        data: salaries,
        total: salaries.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get salary summary for period
  getSalarySummary: async (req, res) => {
    try {
      const { month, year } = req.query;

      const salaries = await Salary.find({
        'period.month': parseInt(month),
        'period.year': parseInt(year)
      }).populate('employee');

      const summary = {
        totalEmployees: salaries.length,
        totalGrossSalary: salaries.reduce((sum, salary) => sum + salary.grossSalary, 0),
        totalNetSalary: salaries.reduce((sum, salary) => sum + salary.netSalary, 0),
        totalDeductions: salaries.reduce((sum, salary) => sum + salary.deductions.totalDeductions, 0),
        totalOvertime: salaries.reduce((sum, salary) => sum + salary.earnings.overtime1 + salary.earnings.overtime2, 0),
        byDepartment: {}
      };

      // Group by department
      salaries.forEach(salary => {
        const dept = salary.employee.department;
        if (!summary.byDepartment[dept]) {
          summary.byDepartment[dept] = {
            count: 0,
            totalNetSalary: 0,
            totalGrossSalary: 0
          };
        }
        summary.byDepartment[dept].count++;
        summary.byDepartment[dept].totalNetSalary += salary.netSalary;
        summary.byDepartment[dept].totalGrossSalary += salary.grossSalary;
      });

      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update salary manually
  updateSalary: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const salary = await Salary.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('employee');

      if (!salary) {
        return res.status(404).json({ message: 'Salary record not found' });
      }

      res.json({
        message: 'Salary updated successfully',
        data: salary
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete salary calculation
  deleteSalary: async (req, res) => {
    try {
      const { id } = req.params;

      const salary = await Salary.findByIdAndDelete(id);

      if (!salary) {
        return res.status(404).json({ message: 'Salary record not found' });
      }

      res.json({
        message: 'Salary calculation deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Helper function to calculate BPJS Kesehatan
  calculateBPJSKesehatan: (basicSalary, rate, maxSalary) => {
    const baseSalary = Math.min(basicSalary, maxSalary);
    return baseSalary * rate;
  },

  // Helper function to calculate BPJS Ketenagakerjaan
  calculateBPJSKetenagakerjaan: (basicSalary, rate, maxSalary) => {
    const baseSalary = Math.min(basicSalary, maxSalary);
    return baseSalary * rate;
  },

  // Helper function to calculate absence deduction
  calculateAbsenceDeduction: (basicSalary, attendanceSummary) => {
    const absentDays = attendanceSummary.totalWorkingDays - attendanceSummary.totalTappingDays;
    const dailyRate = basicSalary / attendanceSummary.totalWorkingDays;
    return absentDays * dailyRate;
  }
};