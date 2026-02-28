import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },


  // Data spesifik karyawan
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nik: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  npwp: {
    type: String,
    default: ''
  },
  bpjsKesehatan: {
    type: String,
    default: ''
  },
  bpjsKetenagakerjaan: {
    type: String,
    default: ''
  },

  // Data pekerjaan
  position: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
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
    required: true,
    min: 0
  },
  
  // Tunjangan tetap
  allowances: {
    departmental: { type: Number, default: 0, min: 0 },
    childcare: { type: Number, default: 0, min: 0 },
    transport: { type: Number, default: 0, min: 0 },
    meal: { type: Number, default: 0, min: 0 },
    health: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 }
  },
  
  // Deductions
  deductions: {
    bpjsKesehatanEmployee: { type: Number, default: 0, min: 0 },
    bpjsKesehatanEmployer: { type: Number, default: 0, min: 0 },
    bpjsKetenagakerjaanEmployee: { type: Number, default: 0, min: 0 },
    bpjsKetenagakerjaanEmployer: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 }
  },
  
  // Data rekening
  bankAccount: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountHolder: { type: String, default: '' }
  },
  
  // Atasan langsung
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  resignationDate: {
    type: Date,
    default: null
  },
  resignationReason: {
    type: String,
    default: ''
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index untuk performa query
EmployeeSchema.index({ employeeId: 1 });
EmployeeSchema.index({ nik: 1 });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ isActive: 1 });

const Employee = mongoose.model('Employee', EmployeeSchema);
export default Employee;