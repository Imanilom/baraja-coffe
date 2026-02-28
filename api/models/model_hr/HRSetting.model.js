// models/model_hr/HRSetting.model.js
import mongoose from 'mongoose';

const HRSettingsSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    unique: true // Satu perusahaan hanya punya satu setting
  },
  
  // Settings spesifik
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
  },

  // Hapus field company yang lama (name, address, phone)
  // Karena sudah ada di model Company

}, { timestamps: true });

// Index
HRSettingsSchema.index({ company: 1 }, { unique: true });

const HRSettings = mongoose.model('HRSettings', HRSettingsSchema);
export default HRSettings;