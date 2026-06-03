// models/model_hr/Company.model.js
import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  taxId: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    // Default settings untuk perusahaan ini
    attendance: {
      toleranceLate: { type: Number, default: 15 },
      workHoursPerDay: { type: Number, default: 8 },
      workDaysPerWeek: { type: Number, default: 6 },
      requiredTappingPerDay: { type: Number, default: 1 }
    },
    salaryCalculation: {
      prorataFormula: { type: String, default: 'basicSalary / totalWorkingDays' },
      overtime1Rate: { type: Number, default: 1.5 },
      overtime2Rate: { type: Number, default: 2.0 },
      maxOvertimeHours: { type: Number, default: 4 }
    },
    bpjs: {
      kesehatanRateEmployee: { type: Number, default: 0.01 },
      kesehatanRateEmployer: { type: Number, default: 0.04 },
      ketenagakerjaanRateEmployee: { type: Number, default: 0.02 },
      ketenagakerjaanRateEmployer: { type: Number, default: 0.037 },
      maxSalaryBpjs: { type: Number, default: 12000000 }
    },
    deductions: {
      humanErrorDeduction: { type: Number, default: 0 },
      absenceDeductionRate: { type: Number, default: 1 }
    }
  }
}, { timestamps: true });

const Company = mongoose.model('Company', CompanySchema);
export default Company;