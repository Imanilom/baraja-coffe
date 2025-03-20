import mongoose from 'mongoose';

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const ShiftSchema = new mongoose.Schema({
  cashierType: {
    type: String,
    required: true,
    enum: ['bar-1-amphi', 'bar-2-amphi', 'bar-3-amphi', 'bar-tp', 'bar-dp', 'drive-thru'],
  },
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: daysOfWeek,
  },
  startTime: {
    type: String, // Format "HH:mm" (contoh: "08:00")
    required: true,
  },
  endTime: {
    type: String, // Format "HH:mm" (contoh: "16:00")
    required: true,
  },
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true,
  },
}, { timestamps: true });

const Shift = mongoose.model('Shift', ShiftSchema);

export default Shift;