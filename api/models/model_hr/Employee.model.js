import { childSend } from 'bullmq';
import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  // Referensi ke User yang sudah ada
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Data spesifik karyawan
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  nik: {
    type: String,
    required: true,
    unique: true
  },
  npwp: {
    type: String
  },
  bpjsKesehatan: {
    type: String
  },
  bpjsKetenagakerjaan: {
    type: String
  },

  // Potongan (deductions) untuk BPJS dan lain-lain (nominal per bulan)
  deductions: {
    bpjsKesehatanEmployee: { type: Number, default: 0 },       // potongan BPJS Kesehatan dari karyawan
    bpjsKesehatanEmployer: { type: Number, default: 0 },       // iuran perusahaan untuk BPJS Kesehatan
    bpjsKetenagakerjaanEmployee: { type: Number, default: 0 }, // potongan BPJS Ketenagakerjaan dari karyawan
    bpjsKetenagakerjaanEmployer: { type: Number, default: 0 }, // iuran perusahaan untuk BPJS Ketenagakerjaan
    tax: { type: Number, default: 0 },                         // potongan pajak (PPh21)
    other: { type: Number, default: 0 }                        // potongan lain-lain
  },

  // Tunjangan yang diberikan oleh perusahaan (nominal per bulan)
  allowances: {
    childcare: { type: Number, default: 0 },  // tunjangan anak
    departmental: { type: Number, default: 0 }, // tunjangan jabatan
    housing: { type: Number, default: 0 },    // tunjangan rumah
    transport: { type: Number, default: 0 },  // tunjangan transport
    meal: { type: Number, default: 0 },       // tunjangan makan
    health: { type: Number, default: 0 },     // tunjangan kesehatan / asuransi tambahan
    other: { type: Number, default: 0 }       // tunjangan lain-lain
  },
  // Data pekerjaan
  position: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  joinDate: {
    type: Date,
    required: true
  },
  employmentStatus: {
    type: String,
    enum: ['probation', 'permanent', 'contract', 'intern'],
    default: 'probation'
  },
  employmentType: {
    type: String,
    enum: ['fulltime', 'parttime', 'freelance'],
    default: 'fulltime'
  },
  
  // Data gaji
  basicSalary: {
    type: Number,
    required: true
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountHolder: String
  },
  
  // Atasan langsung
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  resignationDate: {
    type: Date
  },
  resignationReason: {
    type: String
  }

}, { timestamps: true });

const Employee = mongoose.model('Employee', EmployeeSchema);
export default Employee;