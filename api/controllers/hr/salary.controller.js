import Salary from '../../models/model_hr/Salary.model.js';
import Employee from '../../models/model_hr/Employee.model.js';
import Attendance from '../../models/model_hr/Attendance.model.js';
import HRSettings from '../../models/model_hr/HRSetting.model.js';
import Company from '../../models/model_hr/Company.model.js';

export const SalaryController = {
  // Calculate salary for period - UPDATED for multi-company
  calculateSalary: async (req, res) => {
    try {
      const { employeeId, month, year } = req.body;

      // Validasi input
      if (!employeeId || !month || !year) {
        return res.status(400).json({ 
          success: false,
          message: 'Employee ID, month, and year are required' 
        });
      }

      if (month < 1 || month > 12) {
        return res.status(400).json({ 
          success: false,
          message: 'Month must be between 1 and 12' 
        });
      }

      const employee = await Employee.findById(employeeId)
        .populate('company');
      
      if (!employee) {
        return res.status(404).json({ 
          success: false,
          message: 'Employee not found' 
        });
      }

      // Check if employee is active
      if (!employee.isActive) {
        return res.status(400).json({ 
          success: false,
          message: 'Employee is not active' 
        });
      }

      // Check if salary already calculated for this period
      const existingSalary = await Salary.findOne({
        employee: employeeId,
        'period.month': month,
        'period.year': year
      });

      if (existingSalary) {
        return res.status(400).json({ 
          success: false,
          message: 'Salary already calculated for this period' 
        });
      }

      // Get HR settings for this company
      const hrSettings = await HRSettings.findOne({ company: employee.company._id });
      
      let settingsToUse;
      if (hrSettings) {
        settingsToUse = hrSettings;
      } else {
        // Use company default settings
        const company = await Company.findById(employee.company._id).select('settings');
        if (!company) {
          return res.status(404).json({ 
            success: false,
            message: 'Company not found' 
          });
        }
        settingsToUse = {
          attendance: company.settings.attendance,
          salaryCalculation: company.settings.salaryCalculation,
          bpjs: company.settings.bpjs,
          deductions: company.settings.deductions
        };
      }

      // Validate HR settings structure
      if (!settingsToUse.salaryCalculation || !settingsToUse.bpjs) {
        return res.status(400).json({ 
          success: false,
          message: 'HR Settings are not properly configured' 
        });
      }

      // Get attendance data for the period
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const attendanceRecords = await Attendance.find({
        employee: employeeId,
        date: { $gte: startDate, $lte: endDate }
      });

      // Calculate total working days in month
      const totalWorkingDays = SalaryController.getTotalWorkingDays(year, month);

      // Calculate attendance summary
      const attendanceSummary = {
        totalTappingDays: attendanceRecords.length,
        fingerprintTappingDays: attendanceRecords.filter(record => 
          record.fingerprintTapping === true
        ).length,
        sickDays: attendanceRecords.filter(record => 
          record.status === 'sick' || record.status === 'SICK'
        ).length,
        permissionDays: attendanceRecords.filter(record => 
          record.status === 'permission' || record.status === 'PERMISSION'
        ).length,
        leaveDays: attendanceRecords.filter(record => 
          record.status === 'leave' || record.status === 'LEAVE'
        ).length,
        businessTripDays: attendanceRecords.filter(record => 
          record.status === 'business_trip' || record.status === 'BUSINESS_TRIP'
        ).length,
        absentDays: attendanceRecords.filter(record => 
          record.status === 'absent' || record.status === 'ABSENT'
        ).length,
        totalWorkingDays: totalWorkingDays
      };

      // Calculate effective working days
      const effectiveWorkingDays = attendanceSummary.fingerprintTappingDays + 
                                  attendanceSummary.leaveDays + 
                                  attendanceSummary.sickDays + 
                                  attendanceSummary.permissionDays + 
                                  attendanceSummary.businessTripDays;

      // Calculate rates using company settings
      const prorataPerSession = employee.basicSalary / attendanceSummary.totalWorkingDays;
      const overtimeRate = prorataPerSession / 8 * 
                         (settingsToUse.salaryCalculation.overtime1Rate || 1.5);

      // Calculate prorata salary based on effective working days
      const prorataSalary = prorataPerSession * effectiveWorkingDays;

      // Calculate overtime
      const totalOvertime1Hours = attendanceRecords.reduce((sum, record) => 
        sum + (parseFloat(record.overtime1Hours) || 0), 0);
      
      const totalOvertime2Hours = attendanceRecords.reduce((sum, record) => 
        sum + (parseFloat(record.overtime2Hours) || 0), 0);
      
      const overtime1 = totalOvertime1Hours * overtimeRate;
      const overtime2 = totalOvertime2Hours * overtimeRate * 
                       (settingsToUse.salaryCalculation.overtime2Rate || 2.0);

      // Calculate allowances
      const allowances = employee.allowances || {};
      const totalEarnings = {
        basicSalary: employee.basicSalary || 0,
        prorataSalary: prorataSalary,
        overtime1: overtime1,
        overtime2: overtime2,
        departmentalAllowance: allowances.departmental || 0,
        childcareAllowance: allowances.childcare || 0,
        transportAllowance: allowances.transport || 0,
        mealAllowance: allowances.meal || 0,
        otherAllowances: allowances.other || 0,
        totalEarnings: 0
      };

      // Calculate BPJS deductions using company settings
      const bpjsKesehatan = SalaryController.calculateBPJSKesehatan(
        employee.basicSalary, 
        settingsToUse.bpjs.kesehatanRateEmployee || 0.01, 
        settingsToUse.bpjs.maxSalaryBpjs || 12000000
      );

      const bpjsKetenagakerjaan = SalaryController.calculateBPJSKetenagakerjaan(
        employee.basicSalary, 
        settingsToUse.bpjs.ketenagakerjaanRateEmployee || 0.02, 
        settingsToUse.bpjs.maxSalaryBpjs || 12000000
      );

      // Calculate absence deduction
      const absenceDeduction = SalaryController.calculateAbsenceDeduction(
        employee.basicSalary, 
        attendanceSummary
      );

      // Calculate deductions
      const deductions = {
        bpjsKesehatan: bpjsKesehatan,
        bpjsKetenagakerjaan: bpjsKetenagakerjaan,
        humanError: settingsToUse.deductions?.humanErrorDeduction || 0,
        absence: absenceDeduction,
        loan: employee.loanDeduction || 0,
        otherDeductions: employee.otherDeductions || 0,
        totalDeductions: 0
      };

      const salary = new Salary({
        employee: employeeId,
        company: employee.company._id, // Store company reference
        period: { month, year },
        attendanceSummary,
        earnings: totalEarnings,
        deductions,
        calculationRates: {
          prorataPerSession: prorataPerSession,
          overtimeRate: overtimeRate,
          overtime1Rate: settingsToUse.salaryCalculation.overtime1Rate || 1.5,
          overtime2Rate: settingsToUse.salaryCalculation.overtime2Rate || 2.0
        },
        status: 'calculated',
        calculatedAt: new Date(),
        calculatedBy: req.user?.id || 'system'
      });

      // Calculate totals
      salary.earnings.totalEarnings = 
        salary.earnings.prorataSalary +
        salary.earnings.overtime1 +
        salary.earnings.overtime2 +
        salary.earnings.departmentalAllowance +
        salary.earnings.childcareAllowance +
        salary.earnings.transportAllowance +
        salary.earnings.mealAllowance +
        salary.earnings.otherAllowances;

      salary.deductions.totalDeductions = 
        salary.deductions.bpjsKesehatan +
        salary.deductions.bpjsKetenagakerjaan +
        salary.deductions.humanError +
        salary.deductions.absence +
        salary.deductions.loan +
        salary.deductions.otherDeductions;

      salary.grossSalary = salary.earnings.totalEarnings;
      salary.netSalary = salary.grossSalary - salary.deductions.totalDeductions;

      await salary.save();
      await salary.populate('employee company');

      res.status(201).json({
        success: true,
        message: 'Salary calculated successfully',
        data: salary
      });
    } catch (error) {
      console.error('Error calculating salary:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error calculating salary', 
        error: error.message 
      });
    }
  },

  // Calculate salary for all employees in period for a specific company
  calculateSalaryForAll: async (req, res) => {
    try {
      const { companyId, month, year } = req.body;

      if (!companyId || !month || !year) {
        return res.status(400).json({ 
          success: false,
          message: 'Company ID, month, and year are required' 
        });
      }

      // Get HR settings for this company
      const hrSettings = await HRSettings.findOne({ company: companyId });
      
      let settingsToUse;
      if (hrSettings) {
        settingsToUse = hrSettings;
      } else {
        // Use company default settings
        const company = await Company.findById(companyId).select('settings');
        if (!company) {
          return res.status(404).json({ 
            success: false,
            message: 'Company not found' 
          });
        }
        settingsToUse = {
          attendance: company.settings.attendance,
          salaryCalculation: company.settings.salaryCalculation,
          bpjs: company.settings.bpjs,
          deductions: company.settings.deductions
        };
      }

      if (!settingsToUse.salaryCalculation || !settingsToUse.bpjs) {
        return res.status(400).json({ 
          success: false,
          message: 'HR Settings are not properly configured for this company' 
        });
      }

      const employees = await Employee.find({ 
        company: companyId,
        isActive: true 
      });
      
      const results = {
        success: [],
        failed: [],
        skipped: []
      };

      // Process employees in batches
      const batchSize = 10;
      for (let i = 0; i < employees.length; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (employee) => {
          try {
            // Check if salary already exists
            const existingSalary = await Salary.findOne({
              employee: employee._id,
              'period.month': month,
              'period.year': year
            });

            if (existingSalary) {
              results.skipped.push({
                employeeId: employee.employeeId,
                name: employee.user?.name || 'Unknown',
                reason: 'Salary already calculated for this period'
              });
              return;
            }

            // Calculate salary using helper function
            const salary = await SalaryController.calculateEmployeeSalary(
              employee, 
              month, 
              year,
              settingsToUse
            );
            
            results.success.push({
              employeeId: employee.employeeId,
              name: employee.user?.name || 'Unknown',
              salaryId: salary._id,
              netSalary: salary.netSalary
            });
          } catch (error) {
            console.error(`Error calculating salary for ${employee.employeeId}:`, error);
            results.failed.push({
              employeeId: employee.employeeId,
              name: employee.user?.name || 'Unknown',
              reason: error.message
            });
          }
        }));
      }

      res.json({
        success: true,
        message: 'Salary calculation completed',
        summary: {
          totalEmployees: employees.length,
          successful: results.success.length,
          failed: results.failed.length,
          skipped: results.skipped.length
        },
        results
      });
    } catch (error) {
      console.error('Error in calculateSalaryForAll:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error calculating salaries', 
        error: error.message 
      });
    }
  },

  // Helper function to calculate individual employee salary
  calculateEmployeeSalary: async (employee, month, year, settingsToUse) => {
    try {
      // Get attendance data for the period
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const attendanceRecords = await Attendance.find({
        employee: employee._id,
        date: { $gte: startDate, $lte: endDate }
      });

      // Calculate total working days
      const totalWorkingDays = SalaryController.getTotalWorkingDays(year, month);

      // Calculate attendance summary
      const attendanceSummary = {
        totalTappingDays: attendanceRecords.length,
        fingerprintTappingDays: attendanceRecords.filter(record => 
          record.fingerprintTapping === true
        ).length,
        sickDays: attendanceRecords.filter(record => 
          record.status === 'sick' || record.status === 'SICK'
        ).length,
        permissionDays: attendanceRecords.filter(record => 
          record.status === 'permission' || record.status === 'PERMISSION'
        ).length,
        leaveDays: attendanceRecords.filter(record => 
          record.status === 'leave' || record.status === 'LEAVE'
        ).length,
        businessTripDays: attendanceRecords.filter(record => 
          record.status === 'business_trip' || record.status === 'BUSINESS_TRIP'
        ).length,
        absentDays: attendanceRecords.filter(record => 
          record.status === 'absent' || record.status === 'ABSENT'
        ).length,
        totalWorkingDays: totalWorkingDays
      };

      // Calculate effective working days
      const effectiveWorkingDays = attendanceSummary.fingerprintTappingDays + 
                                  attendanceSummary.leaveDays + 
                                  attendanceSummary.sickDays + 
                                  attendanceSummary.permissionDays + 
                                  attendanceSummary.businessTripDays;

      // Calculate rates
      const prorataPerSession = (employee.basicSalary || 0) / attendanceSummary.totalWorkingDays;
      const overtimeRate = prorataPerSession / 8 * 
                         (settingsToUse.salaryCalculation.overtime1Rate || 1.5);

      // Calculate prorata salary
      const prorataSalary = prorataPerSession * effectiveWorkingDays;

      // Calculate overtime
      const totalOvertime1Hours = attendanceRecords.reduce((sum, record) => 
        sum + (parseFloat(record.overtime1Hours) || 0), 0);
      
      const totalOvertime2Hours = attendanceRecords.reduce((sum, record) => 
        sum + (parseFloat(record.overtime2Hours) || 0), 0);
      
      const overtime1 = totalOvertime1Hours * overtimeRate;
      const overtime2 = totalOvertime2Hours * overtimeRate * 
                       (settingsToUse.salaryCalculation.overtime2Rate || 2.0);

      // Calculate earnings
      const allowances = employee.allowances || {};
      const earnings = {
        basicSalary: employee.basicSalary || 0,
        prorataSalary: prorataSalary,
        overtime1: overtime1,
        overtime2: overtime2,
        departmentalAllowance: allowances.departmental || 0,
        childcareAllowance: allowances.childcare || 0,
        transportAllowance: allowances.transport || 0,
        mealAllowance: allowances.meal || 0,
        otherAllowances: allowances.other || 0,
        totalEarnings: 0
      };

      // Calculate BPJS deductions
      const bpjsKesehatan = SalaryController.calculateBPJSKesehatan(
        employee.basicSalary || 0, 
        settingsToUse.bpjs.kesehatanRateEmployee || 0.01, 
        settingsToUse.bpjs.maxSalaryBpjs || 12000000
      );

      const bpjsKetenagakerjaan = SalaryController.calculateBPJSKetenagakerjaan(
        employee.basicSalary || 0, 
        settingsToUse.bpjs.ketenagakerjaanRateEmployee || 0.02, 
        settingsToUse.bpjs.maxSalaryBpjs || 12000000
      );

      // Calculate absence deduction
      const absenceDeduction = SalaryController.calculateAbsenceDeduction(
        employee.basicSalary || 0, 
        attendanceSummary
      );

      // Calculate deductions
      const deductions = {
        bpjsKesehatan: bpjsKesehatan,
        bpjsKetenagakerjaan: bpjsKetenagakerjaan,
        humanError: settingsToUse.deductions?.humanErrorDeduction || 0,
        absence: absenceDeduction,
        loan: employee.loanDeduction || 0,
        otherDeductions: employee.otherDeductions || 0,
        totalDeductions: 0
      };

      const salary = new Salary({
        employee: employee._id,
        company: employee.company, // Use employee's company
        period: { month, year },
        attendanceSummary,
        earnings,
        deductions,
        calculationRates: {
          prorataPerSession: prorataPerSession,
          overtimeRate: overtimeRate,
          overtime1Rate: settingsToUse.salaryCalculation.overtime1Rate || 1.5,
          overtime2Rate: settingsToUse.salaryCalculation.overtime2Rate || 2.0
        },
        status: 'calculated',
        calculatedAt: new Date()
      });

      // Calculate totals
      salary.earnings.totalEarnings = 
        salary.earnings.prorataSalary +
        salary.earnings.overtime1 +
        salary.earnings.overtime2 +
        salary.earnings.departmentalAllowance +
        salary.earnings.childcareAllowance +
        salary.earnings.transportAllowance +
        salary.earnings.mealAllowance +
        salary.earnings.otherAllowances;

      salary.deductions.totalDeductions = 
        salary.deductions.bpjsKesehatan +
        salary.deductions.bpjsKetenagakerjaan +
        salary.deductions.humanError +
        salary.deductions.absence +
        salary.deductions.loan +
        salary.deductions.otherDeductions;

      salary.grossSalary = salary.earnings.totalEarnings;
      salary.netSalary = salary.grossSalary - salary.deductions.totalDeductions;

      await salary.save();
      return salary;
    } catch (error) {
      console.error(`Error in calculateEmployeeSalary for ${employee.employeeId}:`, error);
      throw error;
    }
  },

  // Get salary by period for a specific company - UPDATED
  getSalaryByPeriod: async (req, res) => {
    try {
      const { companyId, month, year, status, department } = req.query;

      if (!companyId || !month || !year) {
        return res.status(400).json({ 
          success: false,
          message: 'Company ID, month, and year are required' 
        });
      }

      const filter = {
        company: companyId,
        'period.month': parseInt(month),
        'period.year': parseInt(year)
      };

      if (status) {
        filter.status = status;
      }

      // Build population options
      const populateOptions = {
        path: 'employee',
        select: 'employeeId position department user',
        populate: {
          path: 'user',
          select: 'name username'
        }
      };

      if (department) {
        populateOptions.match = { department: department };
      }

      const salaries = await Salary.find(filter)
        .populate(populateOptions)
        .populate('company', 'name code')
        .sort({ 'employee.department': 1, 'employee.position': 1 });

      res.json({
        success: true,
        period: { month, year },
        data: salaries,
        total: salaries.length,
        summary: {
          totalNetSalary: salaries.reduce((sum, salary) => sum + (salary.netSalary || 0), 0),
          totalGrossSalary: salaries.reduce((sum, salary) => sum + (salary.grossSalary || 0), 0),
          totalEmployees: salaries.length
        }
      });
    } catch (error) {
      console.error('Error getting salary by period:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching salary data', 
        error: error.message 
      });
    }
  },

  // Get salary summary for period for a specific company - UPDATED
  getSalarySummary: async (req, res) => {
    try {
      const { companyId, month, year } = req.query;

      if (!companyId || !month || !year) {
        return res.status(400).json({ 
          success: false,
          message: 'Company ID, month, and year are required' 
        });
      }

      const salaries = await Salary.find({
        company: companyId,
        'period.month': parseInt(month),
        'period.year': parseInt(year)
      })
      .populate('employee', 'employeeId department position user')
      .populate({
        path: 'employee.user',
        select: 'name'
      });

      const summary = {
        period: { month, year },
        totalEmployees: salaries.length,
        totalGrossSalary: salaries.reduce((sum, salary) => sum + (salary.grossSalary || 0), 0),
        totalNetSalary: salaries.reduce((sum, salary) => sum + (salary.netSalary || 0), 0),
        totalDeductions: salaries.reduce((sum, salary) => sum + (salary.deductions?.totalDeductions || 0), 0),
        totalOvertime: salaries.reduce((sum, salary) => 
          sum + (salary.earnings?.overtime1 || 0) + (salary.earnings?.overtime2 || 0), 0),
        totalAllowances: salaries.reduce((sum, salary) =>
          sum + (salary.earnings?.departmentalAllowance || 0) +
          (salary.earnings?.childcareAllowance || 0) +
          (salary.earnings?.transportAllowance || 0) +
          (salary.earnings?.mealAllowance || 0) +
          (salary.earnings?.otherAllowances || 0), 0),
        byDepartment: {},
        byStatus: {
          calculated: 0,
          approved: 0,
          paid: 0
        }
      };

      // Group by department and status
      salaries.forEach(salary => {
        const dept = salary.employee?.department || 'Unknown';
        const status = salary.status || 'calculated';
        
        // Department summary
        if (!summary.byDepartment[dept]) {
          summary.byDepartment[dept] = {
            count: 0,
            totalNetSalary: 0,
            totalGrossSalary: 0,
            employees: []
          };
        }
        summary.byDepartment[dept].count++;
        summary.byDepartment[dept].totalNetSalary += salary.netSalary || 0;
        summary.byDepartment[dept].totalGrossSalary += salary.grossSalary || 0;
        summary.byDepartment[dept].employees.push({
          employeeId: salary.employee?.employeeId,
          name: salary.employee?.user?.name || 'Unknown',
          netSalary: salary.netSalary,
          status: salary.status
        });

        // Status count
        if (summary.byStatus[status] !== undefined) {
          summary.byStatus[status]++;
        }
      });

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting salary summary:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching salary summary', 
        error: error.message 
      });
    }
  },

    // Update salary manually
  updateSalary: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const salary = await Salary.findById(id)
        .populate('employee', 'employeeId position department user')
        .populate('company', 'name code');
      
      if (!salary) {
        return res.status(404).json({ 
          success: false,
          message: 'Salary record not found' 
        });
      }

      // Prevent updating if already paid
      if (salary.status === 'paid') {
        return res.status(400).json({ 
          success: false,
          message: 'Cannot update paid salary' 
        });
      }

      // Check if user has permission to update this salary (same company)
      if (req.companyId && salary.company._id.toString() !== req.companyId) {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized to update salary from different company' 
        });
      }

      // Update earnings if provided
      if (updateData.earnings) {
        Object.keys(updateData.earnings).forEach(key => {
          if (salary.earnings[key] !== undefined) {
            salary.earnings[key] = updateData.earnings[key];
          }
        });
      }

      // Update deductions if provided
      if (updateData.deductions) {
        Object.keys(updateData.deductions).forEach(key => {
          if (salary.deductions[key] !== undefined) {
            salary.deductions[key] = updateData.deductions[key];
          }
        });
      }

      // Update attendance summary if provided
      if (updateData.attendanceSummary) {
        Object.keys(updateData.attendanceSummary).forEach(key => {
          if (salary.attendanceSummary[key] !== undefined) {
            salary.attendanceSummary[key] = updateData.attendanceSummary[key];
          }
        });
      }

      // Update calculation rates if provided
      if (updateData.calculationRates) {
        Object.keys(updateData.calculationRates).forEach(key => {
          if (salary.calculationRates[key] !== undefined) {
            salary.calculationRates[key] = updateData.calculationRates[key];
          }
        });
      }

      // Update other fields
      if (updateData.status) {
        // Validate status transition
        const validTransitions = {
          'draft': ['calculated'],
          'calculated': ['approved', 'cancelled'],
          'approved': ['paid', 'cancelled'],
          'paid': [], // Cannot change from paid
          'cancelled': [] // Cannot change from cancelled
        };

        const currentStatus = salary.status;
        const newStatus = updateData.status;

        if (!validTransitions[currentStatus]?.includes(newStatus)) {
          return res.status(400).json({ 
            success: false,
            message: `Invalid status transition from ${currentStatus} to ${newStatus}` 
          });
        }

        // Set timestamp based on status
        if (newStatus === 'approved' && currentStatus !== 'approved') {
          salary.approvedAt = new Date();
          salary.approvedBy = req.user?.id;
        } else if (newStatus === 'paid' && currentStatus !== 'paid') {
          salary.paidAt = new Date();
          salary.paidBy = req.user?.id;
        } else if (newStatus === 'cancelled' && currentStatus !== 'cancelled') {
          salary.cancelledAt = new Date();
          salary.cancelledBy = req.user?.id;
        }

        salary.status = newStatus;
      }
      
      if (updateData.notes !== undefined) {
        salary.notes = updateData.notes;
      }

      if (updateData.paymentMethod) {
        salary.paymentMethod = updateData.paymentMethod;
      }

      if (updateData.paymentReference) {
        salary.paymentReference = updateData.paymentReference;
      }

      // Recalculate totals if earnings or deductions were updated
      if (updateData.earnings || updateData.deductions) {
        // Calculate total earnings
        salary.earnings.totalEarnings = 
          salary.earnings.prorataSalary +
          salary.earnings.overtime1 +
          salary.earnings.overtime2 +
          salary.earnings.departmentalAllowance +
          salary.earnings.childcareAllowance +
          salary.earnings.transportAllowance +
          salary.earnings.mealAllowance +
          salary.earnings.otherAllowances;

        // Calculate total deductions
        salary.deductions.totalDeductions = 
          salary.deductions.bpjsKesehatan +
          salary.deductions.bpjsKetenagakerjaan +
          salary.deductions.humanError +
          salary.deductions.absence +
          salary.deductions.loan +
          salary.deductions.otherDeductions;

        // Calculate net salary
        salary.grossSalary = salary.earnings.totalEarnings;
        salary.netSalary = salary.grossSalary - salary.deductions.totalDeductions;
      }

      salary.updatedAt = new Date();
      salary.updatedBy = req.user?.id || 'manual';

      // Save the updated salary
      await salary.save();

      // Repopulate the updated salary
      const updatedSalary = await Salary.findById(id)
        .populate('employee', 'employeeId position department user')
        .populate({
          path: 'employee.user',
          select: 'name username'
        })
        .populate('company', 'name code')
        .populate('approvedBy', 'name username')
        .populate('paidBy', 'name username')
        .populate('cancelledBy', 'name username');

      res.json({
        success: true,
        message: 'Salary updated successfully',
        data: updatedSalary,
        changes: {
          earningsUpdated: !!updateData.earnings,
          deductionsUpdated: !!updateData.deductions,
          statusChanged: !!updateData.status
        }
      });
    } catch (error) {
      console.error('Error updating salary:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          success: false,
          message: 'Validation error',
          errors 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Error updating salary', 
        error: error.message 
      });
    }
  },

  // Delete salary calculation
  deleteSalary: async (req, res) => {
    try {
      const { id } = req.params;

      const salary = await Salary.findById(id)
        .populate('company', 'name code');
      
      if (!salary) {
        return res.status(404).json({ 
          success: false,
          message: 'Salary record not found' 
        });
      }

      // Check if user has permission to delete this salary (same company)
      if (req.companyId && salary.company._id.toString() !== req.companyId) {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized to delete salary from different company' 
        });
      }

      // Prevent deleting paid or approved salary without admin override
      if (salary.status === 'paid' || salary.status === 'approved') {
        // Check for admin override flag
        const { forceDelete } = req.query;
        
        if (!forceDelete || forceDelete !== 'true') {
          return res.status(400).json({ 
            success: false,
            message: `Cannot delete ${salary.status} salary. Use forceDelete=true to override.`,
            warning: 'This action cannot be undone and may affect financial records.'
          });
        }
        
        // Log the forced deletion
        console.warn(`FORCE DELETION: Salary ${id} (status: ${salary.status}) deleted by user ${req.user?.id}`);
      }

      // Get salary info before deletion for audit trail
      const salaryInfo = {
        _id: salary._id,
        employee: salary.employee?.toString(),
        company: salary.company?._id?.toString(),
        period: salary.period,
        status: salary.status,
        netSalary: salary.netSalary,
        deletedBy: req.user?.id,
        deletedAt: new Date()
      };

      // Delete the salary record
      await Salary.findByIdAndDelete(id);

      // Log the deletion (you might want to save this to an audit log)
      console.log(`Salary deleted:`, salaryInfo);

      res.json({
        success: true,
        message: 'Salary calculation deleted successfully',
        data: {
          deletedId: id,
          period: salary.period,
          employeeId: salary.employee?._id,
          status: salary.status,
          deletedAt: new Date()
        },
        audit: {
          deletedBy: req.user?.id,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error deleting salary:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error deleting salary', 
        error: error.message 
      });
    }
  },

  // Additional helper method: Cancel salary (alternative to delete)
  cancelSalary: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const salary = await Salary.findById(id);
      
      if (!salary) {
        return res.status(404).json({ 
          success: false,
          message: 'Salary record not found' 
        });
      }

      // Check if user has permission (same company)
      if (req.companyId && salary.company.toString() !== req.companyId) {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized to cancel salary from different company' 
        });
      }

      // Only allow cancellation for calculated or approved salaries
      if (!['calculated', 'approved'].includes(salary.status)) {
        return res.status(400).json({ 
          success: false,
          message: `Cannot cancel salary with status: ${salary.status}. Only calculated or approved salaries can be cancelled.` 
        });
      }

      // Update salary status to cancelled
      salary.status = 'cancelled';
      salary.cancelledAt = new Date();
      salary.cancelledBy = req.user?.id;
      salary.notes = reason || salary.notes || 'Salary cancelled by user';
      salary.updatedAt = new Date();
      salary.updatedBy = req.user?.id;

      await salary.save();

      const updatedSalary = await Salary.findById(id)
        .populate('employee', 'employeeId position department user')
        .populate({
          path: 'employee.user',
          select: 'name username'
        })
        .populate('company', 'name code')
        .populate('cancelledBy', 'name username');

      res.json({
        success: true,
        message: 'Salary cancelled successfully',
        data: updatedSalary
      });
    } catch (error) {
      console.error('Error cancelling salary:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error cancelling salary', 
        error: error.message 
      });
    }
  },

  // Get salary details by ID
  getSalaryById: async (req, res) => {
    try {
      const { id } = req.params;

      const salary = await Salary.findById(id)
        .populate('employee', 'employeeId position department user')
        .populate({
          path: 'employee.user',
          select: 'name username email'
        })
        .populate('company', 'name code address')
        .populate('approvedBy', 'name username')
        .populate('paidBy', 'name username')
        .populate('cancelledBy', 'name username');

      if (!salary) {
        return res.status(404).json({ 
          success: false,
          message: 'Salary record not found' 
        });
      }

      // Check if user has permission to view this salary (same company)
      if (req.companyId && salary.company._id.toString() !== req.companyId) {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized to view salary from different company' 
        });
      }

      // Add breakdown summary
      const breakdown = {
        earnings: {
          basicComponents: salary.earnings.basicSalary + salary.earnings.prorataSalary,
          overtime: salary.earnings.overtime1 + salary.earnings.overtime2,
          allowances: salary.earnings.departmentalAllowance + 
                     salary.earnings.childcareAllowance + 
                     salary.earnings.transportAllowance + 
                     salary.earnings.mealAllowance + 
                     salary.earnings.otherAllowances
        },
        deductions: {
          bpjs: salary.deductions.bpjsKesehatan + salary.deductions.bpjsKetenagakerjaan,
          other: salary.deductions.humanError + 
                salary.deductions.absence + 
                salary.deductions.loan + 
                salary.deductions.otherDeductions
        }
      };

      res.json({
        success: true,
        data: salary,
        breakdown,
        calculations: {
          dailyRate: salary.calculationRates?.prorataPerSession || 0,
          hourlyRate: salary.calculationRates?.overtimeRate || 0
        }
      });
    } catch (error) {
      console.error('Error getting salary details:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error retrieving salary details', 
        error: error.message 
      });
    }
  },


  // Approve salary - UPDATED
  approveSalary: async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy, notes } = req.body;

      if (!approvedBy) {
        return res.status(400).json({ 
          success: false,
          message: 'Approver ID is required' 
        });
      }

      const salary = await Salary.findById(id);
      if (!salary) {
        return res.status(404).json({ 
          success: false,
          message: 'Salary record not found' 
        });
      }

      // Validasi status sebelum approve
      if (salary.status !== 'calculated') {
        return res.status(400).json({ 
          success: false,
          message: `Salary cannot be approved. Current status: ${salary.status}` 
        });
      }

      salary.status = 'approved';
      salary.approvedBy = approvedBy;
      salary.approvedAt = new Date();
      salary.notes = notes || salary.notes;

      await salary.save();
      await salary.populate('employee approvedBy company');

      res.json({
        success: true,
        message: 'Salary approved successfully',
        data: salary
      });
    } catch (error) {
      console.error('Error approving salary:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error approving salary', 
        error: error.message 
      });
    }
  },

  // Mark salary as paid - UPDATED
  markAsPaid: async (req, res) => {
    try {
      const { id } = req.params;
      const { paidBy, paymentMethod = 'transfer', paymentReference } = req.body;

      if (!paidBy) {
        return res.status(400).json({ 
          success: false,
          message: 'Payer ID is required' 
        });
      }

      const salary = await Salary.findById(id);
      if (!salary) {
        return res.status(404).json({ 
          success: false,
          message: 'Salary record not found' 
        });
      }

      // Validasi status sebelum paid
      if (salary.status !== 'approved') {
        return res.status(400).json({ 
          success: false,
          message: `Salary cannot be marked as paid. Current status: ${salary.status}` 
        });
      }

      salary.status = 'paid';
      salary.paidBy = paidBy;
      salary.paidAt = new Date();
      salary.paymentMethod = paymentMethod;
      salary.paymentReference = paymentReference || salary.paymentReference;

      await salary.save();
      await salary.populate('employee paidBy approvedBy company');

      res.json({
        success: true,
        message: 'Salary marked as paid successfully',
        data: salary
      });
    } catch (error) {
      console.error('Error marking salary as paid:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error marking salary as paid', 
        error: error.message 
      });
    }
  },

  // Get salary by employee - UPDATED
  getSalaryByEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { page = 1, limit = 12, year, status } = req.query;

      const filter = { employee: employeeId };
      
      if (year) {
        filter['period.year'] = parseInt(year);
      }
      
      if (status) {
        filter.status = status;
      }

      const options = {
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        sort: { 'period.year': -1, 'period.month': -1 }
      };

      const salaries = await Salary.find(filter)
        .populate({
          path: 'employee',
          select: 'employeeId position department user',
          populate: {
            path: 'user',
            select: 'name username'
          }
        })
        .populate('company', 'name code')
        .populate('paidBy', 'name')
        .populate('approvedBy', 'name')
        .limit(options.limit)
        .skip(options.skip)
        .sort(options.sort);

      const total = await Salary.countDocuments(filter);

      res.json({
        success: true,
        data: salaries,
        pagination: {
          total,
          totalPages: Math.ceil(total / options.limit),
          currentPage: parseInt(page),
          limit: options.limit
        }
      });
    } catch (error) {
      console.error('Error getting salary by employee:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching salary data', 
        error: error.message 
      });
    }
  },

  // Helper function to calculate total working days (excluding weekends)
  getTotalWorkingDays: (year, month) => {
    const totalDays = new Date(year, month, 0).getDate();
    let workingDays = 0;
    
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      // Exclude Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }
    
    return workingDays;
  },

  // Helper function to calculate BPJS Kesehatan
  calculateBPJSKesehatan: (basicSalary, rate, maxSalary) => {
    if (!basicSalary || !rate) return 0;
    const baseSalary = Math.min(basicSalary, maxSalary);
    return Math.round(baseSalary * rate);
  },

  // Helper function to calculate BPJS Ketenagakerjaan
  calculateBPJSKetenagakerjaan: (basicSalary, rate, maxSalary) => {
    if (!basicSalary || !rate) return 0;
    const baseSalary = Math.min(basicSalary, maxSalary);
    return Math.round(baseSalary * rate);
  },

  // Helper function to calculate absence deduction
  calculateAbsenceDeduction: (basicSalary, attendanceSummary) => {
    if (!basicSalary || !attendanceSummary?.totalWorkingDays) return 0;
    
    const absentDays = attendanceSummary.totalWorkingDays - 
                      attendanceSummary.totalTappingDays -
                      attendanceSummary.leaveDays -
                      attendanceSummary.sickDays -
                      attendanceSummary.permissionDays -
                      attendanceSummary.businessTripDays;

    // Only deduct for unauthorized absences
    const unauthorizedAbsentDays = Math.max(0, absentDays);
    const dailyRate = basicSalary / attendanceSummary.totalWorkingDays;
    
    return Math.round(unauthorizedAbsentDays * dailyRate);
  }
};