import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
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
  npwp: String,
  bpjsKesehatan: String,
  bpjsKetenagakerjaan: String,

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
  
  // Data gaji sesuai struktur
  basicSalary: {
    type: Number,
    required: true
  },
  
  // Tunjangan tetap
  allowances: {
    departmental: { type: Number, default: 0 }, // tunjangan jabatan
    childcare: { type: Number, default: 0 },    // tunjangan anak
    transport: { type: Number, default: 0 },    // tunjangan transport
    meal: { type: Number, default: 0 },         // tunjangan makan
    health: { type: Number, default: 0 },       // tunjangan kesehatan
    other: { type: Number, default: 0 }         // tunjangan lain-lain
  },
  
  // Data rekening
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
  resignationDate: Date,
  resignationReason: String

}, { timestamps: true });

const Employee = mongoose.model('Employee', EmployeeSchema);
export default Employee;