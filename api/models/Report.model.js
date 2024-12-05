import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Sales', 'Expenses', 'Inventory', 'Performance'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  generatedBy: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Report = mongoose.model('Report', ReportSchema);

export default Report;
