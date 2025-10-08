  // models/MenuStock.model.js
  import mongoose from 'mongoose';

  const MenuStockSchema = new mongoose.Schema({
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
      unique: true, // Satu stok per menu
    },
    type: { 
    type: String, 
    enum: ['waste', 'adjustment', 'sale', 'production'], 
    required: true 
    },
    quantity: { 
      type: Number, 
      required: true 
    },
    reason: { 
      type: String,
      enum: ['busuk', 'tidak_bagus', 'kedaluwarsa', 'rusak', 'hilang', 'lainnya', 'manual_adjustment']
    },
    previousStock: { 
      type: Number, 
      required: true 
    },
    // Stok otomatis dari kalkulasi sistem
    calculatedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Stok manual yang bisa di-override oleh admin/staff
    manualStock: {
      type: Number,
      default: null, // null = tidak ada override
      min: 0,
    },
    // Catatan alasan perubahan manual (opsional)
    adjustmentNote: {
      type: String,
      trim: true,
    },
    // Siapa yang melakukan penyesuaian (opsional)
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Sesuaikan dengan model user Anda
      default: null,
    },
    // Timestamp terakhir kali stok dihitung ulang
    lastCalculatedAt: {
      type: Date,
      default: null,
    },
    // Timestamp terakhir kali stok di-adjust manual
    lastAdjustedAt: {
      type: Date,
      default: null,
    },
  currentStock: { 
      type: Number, 
      required: true 
    },
    handledBy: { 
      type: String, 
      required: true 
    },
    notes: { 
      type: String 
    }
  });


  // Virtual: effectiveStock → prioritas manualStock jika ada, else calculatedStock
  MenuStockSchema.virtual('effectiveStock').get(function () {
  return this.manualStock !== null ? this.manualStock : this.calculatedStock;
  });

  // Pastikan virtual muncul saat toJSON / toObject
  MenuStockSchema.set('toJSON', { virtuals: true });
  MenuStockSchema.set('toObject', { virtuals: true });

  const MenuStock = mongoose.model('MenuStock', MenuStockSchema);

  export default MenuStock;
