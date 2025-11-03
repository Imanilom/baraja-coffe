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