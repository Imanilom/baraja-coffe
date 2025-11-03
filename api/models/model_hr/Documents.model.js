import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  type: {
    type: String,
    enum: [
      'sick_letter', 
      'permission_letter', 
      'business_trip', 
      'leave_request',
      'warning_letter',
      'appreciation_letter',
      'berita_acara',
      'other'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  
  // Untuk surat sakit
  sickLetter: {
    startDate: Date,
    endDate: Date,
    diagnosis: String,
    doctorName: String,
    hospital: String
  },
  
  // Untuk cuti
  leaveRequest: {
    startDate: Date,
    endDate: Date,
    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other']
    },
    totalDays: Number
  },
  
  // File upload
  files: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status approval
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'processed'],
    default: 'draft'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedAt: Date,
  rejectionReason: String,

}, { timestamps: true });

const Document = mongoose.model('Document', DocumentSchema);
export default Document;