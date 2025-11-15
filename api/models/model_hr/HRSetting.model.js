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
    overtimeRate: { type: Number, default: 1.5 } // multiplier dari hourly rate
  },
  
  // Pengaturan cuti
  leave: {
    annualLeaveDays: { type: Number, default: 12 },
    sickLeaveDays: { type: Number, default: 12 },
    maternityLeaveDays: { type: Number, default: 90 },
    paternityLeaveDays: { type: Number, default: 2 }
  },
  
  // Pengaturan BPJS
  bpjs: {
    kesehatanRate: { type: Number, default: 0.04 }, // 4%
    ketenagakerjaanRate: { type: Number, default: 0.03 }, // 3%
    maxSalaryBpjs: { type: Number, default: 12000000 } // batas maksimal perhitungan BPJS
  },
  
  // Pengaturan pajak
  tax: {
    ptkp: { type: Number, default: 54000000 }, // Penghasilan Tidak Kena Pajak
    taxRates: [{
      minIncome: Number,
      maxIncome: Number,
      rate: Number
    }]
  }

}, { timestamps: true });

const HRSettings = mongoose.model('HRSettings', HRSettingsSchema);
export default HRSettings;