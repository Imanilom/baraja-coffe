import mongoose from 'mongoose';

const SalarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  period: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    }
  },
  
  // Data tapping dan kehadiran
  attendanceSummary: {
    totalTappingDays: { type: Number, default: 0 },
    fingerprintTappingDays: { type: Number, default: 0 },
    sickDays: { type: Number, default: 0 },
    permissionDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    businessTripDays: { type: Number, default: 0 },
    totalWorkingDays: { type: Number, default: 0 }
  },
  
  // Komponen pendapatan
  earnings: {
    basicSalary: { type: Number, default: 0 },
    prorataSalary: { type: Number, default: 0 }, // Gaji sesi berdasarkan tapping
    overtime1: { type: Number, default: 0 },     // Lembur normal
    overtime2: { type: Number, default: 0 },     // Lembur holiday
    departmentalAllowance: { type: Number, default: 0 }, // Tunjangan jabatan
    childcareAllowance: { type: Number, default: 0 },    // Tunjangan anak
    transportAllowance: { type: Number, default: 0 },
    mealAllowance: { type: Number, default: 0 },
    otherAllowances: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  
  // Komponen potongan
  deductions: {
    bpjsKesehatan: { type: Number, default: 0 },
    bpjsKetenagakerjaan: { type: Number, default: 0 },
    humanError: { type: Number, default: 0 }, // Potongan human error
    absence: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 }
  },
  
  // Total akhir
  grossSalary: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  
  // Rate perhitungan
  calculationRates: {
    prorataPerSession: { type: Number, default: 0 }, // Rate prorata per sesi
    overtimeRate: { type: Number, default: 0 }       // Rate lembur per jam
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'calculated', 'approved', 'paid', 'cancelled'],
    default: 'draft'
  },
  
  // Informasi pembayaran
  paidAt: Date,
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  paymentMethod: {
    type: String,
    enum: ['transfer', 'cash', 'other'],
    default: 'transfer'
  },
  
  // Catatan
  notes: String

}, { timestamps: true });

// Compound index untuk menghindari duplikasi gaji periode yang sama
SalarySchema.index({ employee: 1, 'period.month': 1, 'period.year': 1 }, { unique: true });

// Middleware untuk menghitung total
SalarySchema.pre('save', function(next) {
  // Hitung total earnings
  this.earnings.totalEarnings = 
    this.earnings.prorataSalary +
    this.earnings.overtime1 +
    this.earnings.overtime2 +
    this.earnings.departmentalAllowance +
    this.earnings.childcareAllowance +
    this.earnings.transportAllowance +
    this.earnings.mealAllowance +
    this.earnings.otherAllowances;
  
  // Hitung total deductions
  this.deductions.totalDeductions =
    this.deductions.bpjsKesehatan +
    this.deductions.bpjsKetenagakerjaan +
    this.deductions.humanError +
    this.deductions.absence +
    this.deductions.loan +
    this.deductions.otherDeductions;
  
  // Hitung net salary
  this.grossSalary = this.earnings.totalEarnings;
  this.netSalary = this.grossSalary - this.deductions.totalDeductions;
  
  next();
});

const Salary = mongoose.model('Salary', SalarySchema);
export default Salary;