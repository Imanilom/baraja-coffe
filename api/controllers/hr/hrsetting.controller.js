import HRSettings from '../../models/model_hr/HRSetting.model.js';
import Company from '../../models/model_hr/Company.model.js';

export const HRSettingsController = {
  // Get HR settings for specific company
  getSettings: async (req, res) => {
    try {
      const { companyId } = req.query;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          message: 'Company ID is required' 
        });
      }

      // Check if company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Company not found' 
        });
      }

      const settings = await HRSettings.findOne({ company: companyId })
        .populate('company', 'name code');
      
      if (!settings) {
        // Return default settings from company.settings
        const defaultSettings = new HRSettings({
          company: companyId,
          attendance: company.settings.attendance,
          salaryCalculation: company.settings.salaryCalculation,
          bpjs: company.settings.bpjs,
          deductions: company.settings.deductions
        });
        
        return res.json({
          success: true,
          message: 'No custom settings found, returning company defaults',
          data: defaultSettings,
          isDefault: true
        });
      }

      res.json({
        success: true,
        message: 'HR settings retrieved successfully',
        data: settings
      });
    } catch (error) {
      console.error('Error getting HR settings:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error retrieving HR settings', 
        error: error.message 
      });
    }
  },

  // Create or update HR settings for specific company
  saveSettings: async (req, res) => {
    try {
      const { companyId } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          message: 'Company ID is required' 
        });
      }

      // Check if company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Company not found' 
        });
      }

      const settingsData = req.body;

      // Validate numeric fields
      const validations = [
        { field: 'attendance.toleranceLate', min: 0, max: 120, message: 'Tolerance late must be between 0-120 minutes' },
        { field: 'attendance.workHoursPerDay', min: 1, max: 24, message: 'Work hours per day must be between 1-24 hours' },
        { field: 'attendance.workDaysPerWeek', min: 1, max: 7, message: 'Work days per week must be between 1-7 days' },
        { field: 'attendance.requiredTappingPerDay', min: 1, max: 4, message: 'Required tapping per day must be between 1-4 times' },
        { field: 'salaryCalculation.overtime1Rate', min: 1, max: 5, message: 'Overtime 1 rate must be between 1-5' },
        { field: 'salaryCalculation.overtime2Rate', min: 1, max: 5, message: 'Overtime 2 rate must be between 1-5' },
        { field: 'salaryCalculation.maxOvertimeHours', min: 0, max: 12, message: 'Max overtime hours must be between 0-12 hours' },
        { field: 'bpjs.kesehatanRateEmployee', min: 0, max: 0.1, message: 'BPJS Kesehatan employee rate must be between 0-10%' },
        { field: 'bpjs.kesehatanRateEmployer', min: 0, max: 0.1, message: 'BPJS Kesehatan employer rate must be between 0-10%' },
        { field: 'bpjs.ketenagakerjaanRateEmployee', min: 0, max: 0.1, message: 'BPJS Ketenagakerjaan employee rate must be between 0-10%' },
        { field: 'bpjs.ketenagakerjaanRateEmployer', min: 0, max: 0.1, message: 'BPJS Ketenagakerjaan employer rate must be between 0-10%' },
        { field: 'bpjs.maxSalaryBpjs', min: 1000000, max: 50000000, message: 'Max salary for BPJS must be between 1,000,000 - 50,000,000' },
        { field: 'deductions.absenceDeductionRate', min: 0, max: 2, message: 'Absence deduction rate must be between 0-2' }
      ];

      for (const validation of validations) {
        const value = getNestedValue(settingsData, validation.field);
        if (value !== undefined && (value < validation.min || value > validation.max)) {
          return res.status(400).json({ 
            success: false,
            message: validation.message,
            field: validation.field,
            value,
            min: validation.min,
            max: validation.max
          });
        }
      }

      // Check if settings already exist for this company
      const existingSettings = await HRSettings.findOne({ company: companyId });
      let settings;

      if (existingSettings) {
        // Update existing settings
        settings = await HRSettings.findByIdAndUpdate(
          existingSettings._id,
          {
            ...settingsData,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        );
        
        res.json({
          success: true,
          message: 'HR settings updated successfully',
          data: settings,
          action: 'updated'
        });
      } else {
        // Create new settings
        settings = new HRSettings(settingsData);
        await settings.save();
        
        res.status(201).json({
          success: true,
          message: 'HR settings created successfully',
          data: settings,
          action: 'created'
        });
      }
    } catch (error) {
      console.error('Error saving HR settings:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Error saving HR settings', 
        error: error.message 
      });
    }
  },

  // Update specific section of HR settings
  updateSection: async (req, res) => {
    try {
      const { companyId } = req.params;
      const { section } = req.params;
      const sectionData = req.body;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }

      // Validate section name
      const validSections = ['attendance', 'salaryCalculation', 'bpjs', 'deductions'];
      if (!validSections.includes(section)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid section name',
          validSections
        });
      }

      // Check if company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Company not found' 
        });
      }

      // Get or create settings
      let settings = await HRSettings.findOne({ company: companyId });
      
      if (!settings) {
        // Create new settings with company defaults
        settings = new HRSettings({
          company: companyId,
          attendance: company.settings.attendance,
          salaryCalculation: company.settings.salaryCalculation,
          bpjs: company.settings.bpjs,
          deductions: company.settings.deductions
        });
      }

      // Update the specific section
      settings[section] = {
        ...settings[section],
        ...sectionData
      };

      settings.updatedAt = new Date();

      await settings.save();

      res.json({
        success: true,
        message: `${section} settings updated successfully`,
        data: settings[section],
        section
      });
    } catch (error) {
      console.error('Error updating HR settings section:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error updating HR settings', 
        error: error.message 
      });
    }
  },

  // Reset HR settings to company defaults
  resetSettings: async (req, res) => {
    try {
      const { companyId } = req.params;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          message: 'Company ID is required' 
        });
      }

      // Check if company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Company not found' 
        });
      }

      let settings = await HRSettings.findOne({ company: companyId });
      
      if (!settings) {
        settings = new HRSettings({
          company: companyId,
          attendance: company.settings.attendance,
          salaryCalculation: company.settings.salaryCalculation,
          bpjs: company.settings.bpjs,
          deductions: company.settings.deductions
        });
        
        await settings.save();
        
        return res.json({
          success: true,
          message: 'HR settings initialized with company defaults',
          data: settings,
          action: 'initialized'
        });
      }

      // Reset to company defaults
      settings.attendance = company.settings.attendance;
      settings.salaryCalculation = company.settings.salaryCalculation;
      settings.bpjs = company.settings.bpjs;
      settings.deductions = company.settings.deductions;
      settings.updatedAt = new Date();

      await settings.save();

      res.json({
        success: true,
        message: 'HR settings reset to company defaults',
        data: settings,
        action: 'reset'
      });
    } catch (error) {
      console.error('Error resetting HR settings:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error resetting HR settings', 
        error: error.message 
      });
    }
  },

  getOvertimePreview: async (req, res) => {
    try {
      const { 
        companyId, 
        basicSalary, 
        overtime1Hours, 
        overtime2Hours, 
        month, 
        year,
        workDaysPerWeek,
        workHoursPerDay 
      } = req.query;
      
      // Validasi input dasar
      if (!basicSalary || isNaN(basicSalary)) {
        return res.status(400).json({ 
          success: false,
          message: 'Valid basic salary is required' 
        });
      }

      const salaryAmount = parseFloat(basicSalary);
      const overtime1 = parseFloat(overtime1Hours) || 0;
      const overtime2 = parseFloat(overtime2Hours) || 0;
      
      // Set default bulan dan tahun
      const currentDate = new Date();
      const monthValue = month ? parseInt(month) : currentDate.getMonth() + 1;
      const yearValue = year ? parseInt(year) : currentDate.getFullYear();
      
      // Validasi bulan dan tahun
      if (monthValue < 1 || monthValue > 12) {
        return res.status(400).json({ 
          success: false,
          message: 'Month must be between 1 and 12' 
        });
      }

      if (yearValue < 2000 || yearValue > 2100) {
        return res.status(400).json({ 
          success: false,
          message: 'Year must be between 2000 and 2100' 
        });
      }

      let settingsToUse;
      let companyInfo = null;

      // Jika ada companyId, gunakan settings dari company tersebut
      if (companyId) {
        // Get HR settings for the company
        const hrSettings = await HRSettings.findOne({ company: companyId })
          .populate('company', 'name code');
        
        if (hrSettings) {
          settingsToUse = hrSettings;
          companyInfo = {
            id: hrSettings.company._id,
            name: hrSettings.company.name,
            code: hrSettings.company.code
          };
        } else {
          // Use company default settings
          const company = await Company.findById(companyId).select('name code settings');
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
          companyInfo = {
            id: company._id,
            name: company.name,
            code: company.code
          };
        }
      } else {
        // Jika tidak ada companyId, gunakan default settings
        const defaultSettings = new HRSettings();
        settingsToUse = defaultSettings;
      }

      // Ambil settings untuk perhitungan
      const salarySettings = settingsToUse.salaryCalculation;
      const attendanceSettings = settingsToUse.attendance;

      // Gunakan custom workDaysPerWeek dan workHoursPerDay jika disediakan
      const actualWorkDaysPerWeek = workDaysPerWeek ? parseInt(workDaysPerWeek) : attendanceSettings.workDaysPerWeek;
      const actualWorkHoursPerDay = workHoursPerDay ? parseInt(workHoursPerDay) : attendanceSettings.workHoursPerDay;

      // Validasi work settings
      if (actualWorkDaysPerWeek < 1 || actualWorkDaysPerWeek > 7) {
        return res.status(400).json({ 
          success: false,
          message: 'Work days per week must be between 1-7' 
        });
      }

      if (actualWorkHoursPerDay < 1 || actualWorkHoursPerDay > 24) {
        return res.status(400).json({ 
          success: false,
          message: 'Work hours per day must be between 1-24' 
        });
      }

      // Calculate working days in month
      const totalDays = new Date(yearValue, monthValue, 0).getDate();
      
      // Method 1: Calculate based on work days per week
      let workingDays = Math.floor(totalDays * (actualWorkDaysPerWeek / 7));
      
      // Method 2: Alternatively, exclude weekends (Saturday=6, Sunday=0)
      if (actualWorkDaysPerWeek === 5) {
        // 5-day work week (Monday-Friday)
        workingDays = 0;
        for (let day = 1; day <= totalDays; day++) {
          const date = new Date(yearValue, monthValue - 1, day);
          const dayOfWeek = date.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday and not Saturday
            workingDays++;
          }
        }
      } else if (actualWorkDaysPerWeek === 6) {
        // 6-day work week (Monday-Saturday)
        workingDays = 0;
        for (let day = 1; day <= totalDays; day++) {
          const date = new Date(yearValue, monthValue - 1, day);
          const dayOfWeek = date.getDay();
          if (dayOfWeek !== 0) { // Not Sunday
            workingDays++;
          }
        }
      }

      // Calculate rates
      const dailyRate = salaryAmount / workingDays;
      const hourlyRate = dailyRate / actualWorkHoursPerDay;
      
      const overtime1Rate = salarySettings.overtime1Rate || 1.5;
      const overtime2Rate = salarySettings.overtime2Rate || 2.0;
      const maxOvertimeHours = salarySettings.maxOvertimeHours || 4;

      // Calculate overtime pay
      const overtime1EffectiveHours = Math.min(overtime1, maxOvertimeHours);
      const overtime1Pay = overtime1EffectiveHours * hourlyRate * overtime1Rate;
      const overtime2Pay = overtime2 * hourlyRate * overtime2Rate;
      
      const totalOvertimePay = overtime1Pay + overtime2Pay;
      const totalRegularHours = workingDays * actualWorkHoursPerDay;
      const totalOvertimeHours = overtime1 + overtime2;

      // Calculate total salary including overtime
      const totalSalaryWithOvertime = salaryAmount + totalOvertimePay;

      const calculations = {
        company: companyInfo,
        salary: salaryAmount,
        period: {
          month: monthValue,
          year: yearValue,
          monthName: new Date(yearValue, monthValue - 1).toLocaleString('id-ID', { month: 'long' }),
          totalDays,
          workingDays
        },
        workSettings: {
          workDaysPerWeek: actualWorkDaysPerWeek,
          workHoursPerDay: actualWorkHoursPerDay,
          totalRegularHours
        },
        calculationRates: {
          dailyRate: Math.round(dailyRate),
          hourlyRate: Math.round(hourlyRate),
          overtimeRates: {
            overtime1Rate,
            overtime2Rate,
            maxDailyOvertimeHours: maxOvertimeHours
          }
        },
        overtimeInput: {
          overtime1Hours: overtime1,
          overtime2Hours: overtime2,
          totalOvertimeHours
        },
        overtimeCalculation: {
          overtime1: {
            effectiveHours: overtime1EffectiveHours,
            rate: overtime1Rate,
            pay: Math.round(overtime1Pay)
          },
          overtime2: {
            effectiveHours: overtime2,
            rate: overtime2Rate,
            pay: Math.round(overtime2Pay)
          },
          totalOvertimePay: Math.round(totalOvertimePay)
        },
        summary: {
          totalOvertimeHours,
          totalOvertimePay: Math.round(totalOvertimePay),
          totalSalary: Math.round(salaryAmount),
          totalSalaryWithOvertime: Math.round(totalSalaryWithOvertime),
          overtimeAsPercentageOfSalary: ((totalOvertimePay / salaryAmount) * 100).toFixed(2),
          overtimeAsPercentageOfTotal: ((totalOvertimePay / totalSalaryWithOvertime) * 100).toFixed(2),
          dailyBreakdown: {
            averageOvertimePerDay: (totalOvertimeHours / workingDays).toFixed(2),
            maxRecommendedOvertime: Math.min(maxOvertimeHours * workingDays, 60) // Max 60 hours per month
          }
        },
        limits: {
          maxOvertimePerDay: maxOvertimeHours,
          maxOvertimePerMonth: maxOvertimeHours * workingDays,
          isWithinDailyLimit: overtime1 <= maxOvertimeHours,
          isWithinMonthlyLimit: totalOvertimeHours <= (maxOvertimeHours * workingDays)
        },
        recommendations: {
          dailyLimit: `Maksimal ${maxOvertimeHours} jam lembur per hari`,
          monthlyLimit: `Maksimal ${maxOvertimeHours * workingDays} jam lembur per bulan`,
          suggestion: totalOvertimeHours > (maxOvertimeHours * workingDays) 
            ? 'Total jam lembur melebihi batas bulanan' 
            : 'Total jam lembur dalam batas wajar'
        }
      };

      // Add warning if limits exceeded
      if (overtime1 > maxOvertimeHours) {
        calculations.warnings = [
          `Lembur normal (${overtime1} jam) melebihi batas harian (${maxOvertimeHours} jam)`,
          `Hanya ${maxOvertimeHours} jam yang akan dihitung`
        ];
      }

      if (totalOvertimeHours > (maxOvertimeHours * workingDays)) {
        if (!calculations.warnings) calculations.warnings = [];
        calculations.warnings.push(
          `Total lembur (${totalOvertimeHours} jam) melebihi batas bulanan (${maxOvertimeHours * workingDays} jam)`
        );
      }

      res.json({
        success: true,
        message: 'Overtime calculation preview generated successfully',
        data: calculations
      });
    } catch (error) {
      console.error('Error calculating overtime preview:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error calculating overtime preview', 
        error: error.message 
      });
    }
  },

  // Get BPJS calculation preview - UPDATED
  getBpjsPreview: async (req, res) => {
    try {
      const { companyId, salary } = req.query;
      
      if (!companyId || !salary || isNaN(salary)) {
        return res.status(400).json({ 
          success: false,
          message: 'Company ID and valid salary amount are required' 
        });
      }

      const salaryAmount = parseFloat(salary);
      
      // Get HR settings for the company
      const settings = await HRSettings.findOne({ company: companyId })
        .populate('company', 'settings');
      
      let bpjsSettings;
      
      if (settings) {
        bpjsSettings = settings.bpjs;
      } else {
        // Use company defaults if no custom settings
        const company = await Company.findById(companyId).select('settings');
        if (!company) {
          return res.status(404).json({ 
            success: false,
            message: 'Company not found' 
          });
        }
        bpjsSettings = company.settings.bpjs;
      }

      const maxSalary = bpjsSettings.maxSalaryBpjs || 12000000;
      const baseSalary = Math.min(salaryAmount, maxSalary);

      const calculations = {
        employeeSalary: salaryAmount,
        baseSalaryForCalculation: baseSalary,
        isCapped: salaryAmount > maxSalary,
        bpjsKesehatan: {
          employeeRate: bpjsSettings.kesehatanRateEmployee || 0.01,
          employerRate: bpjsSettings.kesehatanRateEmployer || 0.04,
          employeeAmount: Math.round(baseSalary * (bpjsSettings.kesehatanRateEmployee || 0.01)),
          employerAmount: Math.round(baseSalary * (bpjsSettings.kesehatanRateEmployer || 0.04)),
          totalAmount: Math.round(baseSalary * ((bpjsSettings.kesehatanRateEmployee || 0.01) + (bpjsSettings.kesehatanRateEmployer || 0.04)))
        },
        bpjsKetenagakerjaan: {
          employeeRate: bpjsSettings.ketenagakerjaanRateEmployee || 0.02,
          employerRate: bpjsSettings.ketenagakerjaanRateEmployer || 0.037,
          employeeAmount: Math.round(baseSalary * (bpjsSettings.ketenagakerjaanRateEmployee || 0.02)),
          employerAmount: Math.round(baseSalary * (bpjsSettings.ketenagakerjaanRateEmployer || 0.037)),
          totalAmount: Math.round(baseSalary * ((bpjsSettings.ketenagakerjaanRateEmployee || 0.02) + (bpjsSettings.ketenagakerjaanRateEmployer || 0.037)))
        },
        totals: {
          totalEmployeeDeduction: 0,
          totalEmployerContribution: 0,
          totalBPJS: 0
        }
      };

      // Calculate totals
      calculations.totals.totalEmployeeDeduction = 
        calculations.bpjsKesehatan.employeeAmount + 
        calculations.bpjsKetenagakerjaan.employeeAmount;
      
      calculations.totals.totalEmployerContribution = 
        calculations.bpjsKesehatan.employerAmount + 
        calculations.bpjsKetenagakerjaan.employerAmount;
      
      calculations.totals.totalBPJS = 
        calculations.totals.totalEmployeeDeduction + 
        calculations.totals.totalEmployerContribution;

      res.json({
        success: true,
        message: 'BPJS calculation preview',
        data: calculations
      });
    } catch (error) {
      console.error('Error calculating BPJS preview:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error calculating BPJS preview', 
        error: error.message 
      });
    }
  },

  getSection: async (req, res) => {
    try {
      const { companyId } = req.query;
      const { section } = req.params;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }

      const validSections = ['attendance', 'salaryCalculation', 'bpjs', 'deductions'];
      if (!validSections.includes(section)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid section name',
          validSections
        });
      }

      const settings = await HRSettings.findOne({ company: companyId });
      
      if (!settings) {
        // Return company defaults
        const company = await Company.findById(companyId).select('settings');
        if (!company) {
          return res.status(404).json({ 
            success: false,
            message: 'Company not found' 
          });
        }
        
        return res.json({
          success: true,
          message: 'No custom settings found, returning company defaults',
          data: company.settings[section],
          section,
          isDefault: true
        });
      }

      res.json({
        success: true,
        message: `${section} settings retrieved successfully`,
        data: settings[section],
        section
      });
    } catch (error) {
      console.error('Error getting HR settings section:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error retrieving HR settings section', 
        error: error.message 
      });
    }
  },

  // Get settings history (audit log)
  getSettingsHistory: async (req, res) => {
    try {
      const { companyId } = req.query;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }

      const settings = await HRSettings.findOne({ company: companyId });
      
      if (!settings) {
        return res.json({
          success: true,
          message: 'No settings history found',
          data: []
        });
      }

      const history = {
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
        versions: [
          {
            timestamp: settings.createdAt,
            action: 'Created'
          },
          {
            timestamp: settings.updatedAt,
            action: 'Updated'
          }
        ]
      };

      res.json({
        success: true,
        message: 'Settings history retrieved',
        data: history
      });
    } catch (error) {
      console.error('Error getting settings history:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error retrieving settings history', 
        error: error.message 
      });
    }
  },


  // Validate settings before calculation
  validateSettings: async (req, res) => {
    try {
      const { companyId } = req.query;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: 'Company ID is required',
          issues: ['Company ID is required']
        });
      }

      // Check if company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          success: false,
          valid: false,
          message: 'Company not found',
          issues: ['Company not found']
        });
      }

      const settings = await HRSettings.findOne({ company: companyId });
      
      const issues = [];
      const warnings = [];

      // Check required sections
      const requiredSections = ['attendance', 'salaryCalculation', 'bpjs', 'deductions'];
      
      if (settings) {
        for (const section of requiredSections) {
          if (!settings[section]) {
            issues.push(`Missing ${section} section`);
          }
        }

        // Check attendance settings
        if (settings.attendance) {
          if (settings.attendance.workHoursPerDay <= 0) {
            issues.push('Work hours per day must be greater than 0');
          }
          if (settings.attendance.workDaysPerWeek <= 0) {
            issues.push('Work days per week must be greater than 0');
          }
          if (settings.attendance.workDaysPerWeek > 7) {
            issues.push('Work days per week cannot exceed 7');
          }
        }

        // Check salary calculation settings
        if (settings.salaryCalculation) {
          if (settings.salaryCalculation.overtime1Rate <= 0) {
            issues.push('Overtime 1 rate must be greater than 0');
          }
          if (settings.salaryCalculation.overtime2Rate <= 0) {
            issues.push('Overtime 2 rate must be greater than 0');
          }
        }

        // Check BPJS settings
        if (settings.bpjs) {
          if (settings.bpjs.maxSalaryBpjs <= 0) {
            issues.push('Max salary for BPJS must be greater than 0');
          }
          if (settings.bpjs.kesehatanRateEmployee < 0) {
            warnings.push('BPJS Kesehatan employee rate is 0 (no deduction)');
          }
          if (settings.bpjs.kesehatanRateEmployer < 0) {
            warnings.push('BPJS Kesehatan employer rate is 0 (no contribution)');
          }
        }
      } else {
        // Check company default settings
        warnings.push('Using company default settings (no custom HR settings configured)');
        
        if (company.settings) {
          if (company.settings.bpjs?.maxSalaryBpjs <= 0) {
            issues.push('Max salary for BPJS must be greater than 0');
          }
        }
      }

      res.json({
        success: true,
        valid: issues.length === 0,
        message: issues.length === 0 ? 'Settings are valid' : 'Settings validation failed',
        issues,
        warnings,
        hasCustomSettings: !!settings,
        hasCompanyDefaults: !!company.settings
      });
    } catch (error) {
      console.error('Error validating settings:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error validating settings', 
        error: error.message 
      });
    }
  }
};

// Helper function to get nested value
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}