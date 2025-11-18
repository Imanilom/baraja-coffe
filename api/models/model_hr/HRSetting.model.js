import mongoose from 'mongoose';

const HRSettingsSchema = new mongoose.Schema({
  company: {
    name: String,
    address: String,
    phone: String
  },
  
  // Pengaturan presensi
  attendance: {
    toleranceLate: { type: Number, default: 15 }, // dalam menit
    workHoursPerDay: { type: Number, default: 8 },
    workDaysPerWeek: { type: Number, default: 6 },
    requiredTappingPerDay: { type: Number, default: 1 } // Minimal tapping per hari
  },
  
  // Pengaturan perhitungan gaji
  salaryCalculation: {
    prorataFormula: { type: String, default: 'basicSalary / totalWorkingDays' },
    overtime1Rate: { type: Number, default: 1.5 }, // Multiplier untuk lembur normal
    overtime2Rate: { type: Number, default: 2.0 }, // Multiplier untuk lembur holiday
    maxOvertimeHours: { type: Number, default: 4 } // Maksimal jam lembur per hari
  },
  
  // Pengaturan BPJS
  bpjs: {
    kesehatanRateEmployee: { type: Number, default: 0.01 }, // 1% dari gaji
    kesehatanRateEmployer: { type: Number, default: 0.04 }, // 4% dari gaji (perusahaan)
    ketenagakerjaanRateEmployee: { type: Number, default: 0.02 }, // 2% dari gaji
    ketenagakerjaanRateEmployer: { type: Number, default: 0.037 }, // 3.7% dari gaji (perusahaan)
    maxSalaryBpjs: { type: Number, default: 12000000 } // batas maksimal perhitungan BPJS
  },
  
  // Pengaturan potongan
  deductions: {
    humanErrorDeduction: { type: Number, default: 0 }, // Potongan human error
    absenceDeductionRate: { type: Number, default: 1 } // Rate potongan absen
  }

}, { timestamps: true });

const HRSettings = mongoose.model('HRSettings', HRSettingsSchema);
export default HRSettings;