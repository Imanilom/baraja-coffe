import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    time: Date,
    location: String,
    device: String,
    photo: String,
    type: {
      type: String,
      enum: ['fingerprint', 'mobile', 'web', 'manual'],
      default: 'fingerprint'
    }
  },
  checkOut: {
    time: Date,
    location: String,
    device: String,
    photo: String,
    type: {
      type: String,
      enum: ['fingerprint', 'mobile', 'web', 'manual'],
      default: 'fingerprint'
    }
  },
  breakStart: Date,
  breakEnd: Date,
  
  // Perhitungan waktu kerja
  workHours: {
    type: Number, // dalam jam
    default: 0
  },
  overtimeHours: {
    type: Number, // dalam jam
    default: 0
  },
  overtime1Hours: { // Lembur jam normal
    type: Number,
    default: 0
  },
  overtime2Hours: { // Lembur jam holiday
    type: Number,
    default: 0
  },
  
  // Status kehadiran berdasarkan tapping
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'halfday', 'holiday', 'leave', 'sick', 'permission'],
    default: 'present'
  },
  
  // Tapping information
  tappingCount: {
    type: Number,
    default: 0
  },
  fingerprintTapping: {
    type: Boolean,
    default: false
  },
  
  // Keterangan
  notes: String,
  
  // Approval
  overtimeApproved: {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    at: Date,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },
  leaveApproved: {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    at: Date,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }

}, { timestamps: true });

// Compound index untuk menghindari duplikasi presensi
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', AttendanceSchema);
export default Attendance;