import Salary from '../../models/model_hr/Salary.model.js';
import Employee from '../../models/model_hr/Employee.model.js';
import Attendance from '../.../models/model_hr/Attendance.model.js';

export const salaryController = {
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

      // Get attendance data for the period
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const attendanceRecords = await Attendance.find({
        employee: employeeId,
        date: { $gte: startDate, $lte: endDate }
      });

      // Calculate totals
      const totalWorkHours = attendanceRecords.reduce((sum, record) => sum + (record.workHours || 0), 0);
      const totalOvertime = attendanceRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);

      // Calculate earnings (you can customize this logic)
      const dailyRate = employee.basicSalary / 30; // Assuming 30 days per month
      const hourlyRate = dailyRate / 8; // Assuming 8 hours per day
      const overtimeRate = hourlyRate * 1.5; // 1.5x for overtime

      const earnings = {
        basicSalary: employee.basicSalary,
        attendanceAllowance: totalWorkHours * 10000, // Example allowance
        overtime: totalOvertime * overtimeRate,
        // Add other allowances as needed
      };

      const totalEarnings = Object.values(earnings).reduce((sum, amount) => sum + amount, 0);

      // Calculate deductions (you can customize this logic)
      const deductions = {
        bpjsKesehatan: employee.basicSalary * 0.04, // 4%
        bpjsKetenagakerjaan: employee.basicSalary * 0.03, // 3%
        tax: this.calculateTax(employee.basicSalary), // Implement tax calculation
        // Add other deductions as needed
      };

      const totalDeductions = Object.values(deductions).reduce((sum, amount) => sum + amount, 0);
      const netSalary = totalEarnings - totalDeductions;

      const salary = new Salary({
        employee: employeeId,
        period: { month, year },
        earnings,
        deductions,
        totalEarnings,
        totalDeductions,
        netSalary,
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
      ).populate('employee');

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
        .populate('employee paidBy')
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
        .sort({ createdAt: -1 });

      res.json(salaries);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update salary manually
  updateSalary: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Recalculate totals if earnings or deductions are updated
      if (updateData.earnings || updateData.deductions) {
        const salary = await Salary.findById(id);
        const currentEarnings = { ...salary.earnings.toObject(), ...updateData.earnings };
        const currentDeductions = { ...salary.deductions.toObject(), ...updateData.deductions };

        updateData.totalEarnings = Object.values(currentEarnings).reduce((sum, amount) => sum + amount, 0);
        updateData.totalDeductions = Object.values(currentDeductions).reduce((sum, amount) => sum + amount, 0);
        updateData.netSalary = updateData.totalEarnings - updateData.totalDeductions;
      }

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

  // Helper function to calculate tax (simplified)
  calculateTax: (basicSalary) => {
    // Simplified tax calculation - adjust according to your country's tax rules
    const annualSalary = basicSalary * 12;
    let tax = 0;

    if (annualSalary > 50000000) {
      tax = annualSalary * 0.15; // 15% for high income
    } else if (annualSalary > 25000000) {
      tax = annualSalary * 0.10; // 10% for medium income
    } else {
      tax = annualSalary * 0.05; // 5% for low income
    }

    return tax / 12; // Monthly tax
  }
};