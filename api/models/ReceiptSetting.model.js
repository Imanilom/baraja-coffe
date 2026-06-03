import mongoose from 'mongoose';

const ReceiptSettingSchema = new mongoose.Schema({
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true,
    unique: true
  },
  logoUrl: { type: String },
  showDate: { type: Boolean, default: true },
  showTime: { type: Boolean, default: true },
  outletName: { type: String },
  outletAddress: { type: String },
  outletPhone: { type: String },
  footerNote: { type: String },
  thanksMessage: { type: String, default: 'Terima kasih atas kunjungan Anda!' },
  socialMedia: {
    instagram: { type: String },
    tiktok: { type: String },
    showInstagram: { type: Boolean, default: false },
    showTiktok: { type: Boolean, default: false }
  },
  showVoucherCode: { type: Boolean, default: true },
  showPoweredBy: { type: Boolean, default: false },
  noteImageUrl: { type: String },
  customFields: [{
    label: String,
    value: String
  }]
}, { timestamps: true });

export const ReceiptSetting = mongoose.models.ReceiptSetting || 
  mongoose.model('ReceiptSetting', ReceiptSettingSchema);