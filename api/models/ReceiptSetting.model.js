import mongoose from 'mongoose';

const ReceiptSettingSchema = new mongoose.Schema({
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true,
    unique: true
  },
  logoUrl: { type: String }, // URL lokal atau cloud untuk logo
  showDate: { type: Boolean, default: true },
  showTime: { type: Boolean, default: true },
  outletName: { type: String },
  outletAddress: { type: String },
  outletPhone: { type: String },
  footerNote: { type: String }, // Catatan di bawah struk
  thanksMessage: { type: String, default: 'Terima kasih atas kunjungan Anda!' },
  customFields: [{
    label: String,
    value: String
  }]
}, { timestamps: true });

export const ReceiptSetting = mongoose.models.ReceiptSetting || mongoose.model('ReceiptSetting', ReceiptSettingSchema);
