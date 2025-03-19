import mongoose from 'mongoose';

const RawMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true }, // Kategori bahan baku
  quantity: { 
    type: Number, 
    required: true, 
    min: 0,
    validate: {
      validator: function(value) {
        return this.maximumStock ? value <= this.maximumStock : true;
      },
      message: 'Quantity cannot exceed maximum stock limit'
    }
  }, // Jumlah stok tersedia
  unit: { type: String, required: true, trim: true }, // Satuan (kg, liter, pcs, dll.)
  minimumStock: { type: Number, required: true, min: 0 }, // Stok minimum sebelum perlu restock
  maximumStock: { type: Number, required: true, min: 1 }, // Stok maksimum untuk mencegah overstock
  costPerUnit: { type: Number, required: true, min: 0 }, // Harga per satuan bahan baku
  supplier: { type: String }, // Referensi ke pemasok
  expiryDate: { type: Date }, // Tanggal kadaluwarsa (jika ada)
  lastUpdated: { type: Date, default: Date.now }, // Terakhir diperbarui
  availableAt: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', index: true }], // Outlet tempat bahan baku tersedia
  status: { 
    type: String, 
    enum: ['Available', 'Low Stock', 'Out of Stock', 'Overstocked', 'Expired'], 
    default: 'Available' 
  } // Status bahan baku
}, { timestamps: true });

// Middleware: Update `lastUpdated` dan `status` sebelum menyimpan
RawMaterialSchema.pre('save', function (next) {
  this.lastUpdated = new Date();

  if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'Expired';
  } else if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity < this.minimumStock) {
    this.status = 'Low Stock';
  } else if (this.maximumStock && this.quantity > this.maximumStock) {
    this.status = 'Overstocked';
  } else {
    this.status = 'Available';
  }

  next();
});

export const RawMaterial = mongoose.model('RawMaterial', RawMaterialSchema);
