import mongoose from 'mongoose';

const ShiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  startTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  breakDuration: { // dalam menit
    type: Number,
    default: 60
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const ScheduleSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  notes: String,
  isDayOff: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compound index
ScheduleSchema.index({ employee: 1, date: 1 }, { unique: true });

const Shift = mongoose.model('Shift', ShiftSchema);
const Schedule = mongoose.model('Schedule', ScheduleSchema);

export { Shift, Schedule };