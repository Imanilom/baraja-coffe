import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // contoh: Kursi, Panci
    code: { type: String, unique: true },
    category: { type: String, enum: ['furniture', 'tool', 'equipment', 'other'], default: 'other' },
    description: { type: String },

    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: 'pcs' },

    price: { type: Number, default: 0, min: 0 }, // harga per unit
    currency: { type: String, default: 'IDR' }, // default rupiah

    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },

    isActive: { type: Boolean, default: true },
    barcode: { type: String }, // lokasi image barcode
  },
  { timestamps: true }
);

// Virtual field untuk total value
AssetSchema.virtual('totalValue').get(function () {
  return this.quantity * this.price;
});

// Agar virtual ikut saat JSON response
AssetSchema.set('toJSON', { virtuals: true });
AssetSchema.set('toObject', { virtuals: true });

export default mongoose.model('Asset', AssetSchema);
