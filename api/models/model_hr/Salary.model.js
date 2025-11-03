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
  
  // Komponen pendapatan
  earnings: {
    basicSalary: { type: Number, default: 0 },
    attendanceAllowance: { type: Number, default: 0 },
    transportationAllowance: { type: Number, default: 0 },
    mealAllowance: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    incentive: { type: Number, default: 0 },
    otherAllowances: { type: Number, default: 0 }
  },
  
  // Komponen potongan
  deductions: {
    bpjsKesehatan: { type: Number, default: 0 },
    bpjsKetenagakerjaan: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    absence: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 }
  },
  
  // Total
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
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

const Salary = mongoose.model('Salary', SalarySchema);
export default Salary;