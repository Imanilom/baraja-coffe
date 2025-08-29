import mongoose from 'mongoose';
import { MenuItem } from './MenuItem.model.js';

const WasteLogSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, trim: true }, // contoh: "busuk", "tumpah", "kadaluarsa"
  date: { type: Date, default: Date.now },
  image: { type: String, trim: true }, // URL atau path ke gambar waste
  notedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const RawMaterialSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true },
  barcode: { type: String, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

  quantity: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function (value) {
        return this.maximumStock ? value <= this.maximumStock : true;
      },
      message: 'Quantity cannot exceed maximum stock limit'
    }
  },

  waste: { type: Number, default: 0, min: 0 }, // busuk/dibuang (dalam unit utama)

  unit: { type: String, required: true, trim: true }, // kg, liter, pcs

  minimumStock: { type: Number, required: true, min: 0 },
  maximumStock: { type: Number, required: true, min: 1 },
  costPerUnit: { type: Number, required: true, min: 0 },

  supplier: { type: String },
  datein: { type: Date, default: Date.now },
  notes: { type: String },
  expiryDate: { type: Date },

  conversionRate: { type: Number, min: 0 }, // misal 1kg = 5 potong
  conversionUnit: { type: String },         // potong, lembar, etc.

  wasteLogs: [WasteLogSchema], // log riwayat buangan

  lastUpdated: { type: Date, default: Date.now },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  availableAt: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', index: true },

  status: {
    type: String,
    enum: ['Available', 'Low Stock', 'Out of Stock', 'Overstocked', 'Expired'],
    default: 'Available'
  }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ✅ Virtual: Bersih usable (kg, liter, dll)
RawMaterialSchema.virtual('netQuantity').get(function () {
  return Math.max(0, this.quantity - this.waste);
});

// ✅ Virtual: Konversi ke potong/lembar
RawMaterialSchema.virtual('convertedQuantity').get(function () {
  if (this.conversionRate && this.quantity != null) {
    const usable = Math.max(0, this.quantity - this.waste);
    return usable * this.conversionRate;
  }
  return null;
});

// ✅ Method: Konsumsi dalam satuan potong/lembar
RawMaterialSchema.methods.consumeConverted = async function (convertedAmount) {
  if (!this.conversionRate || this.conversionRate <= 0) {
    throw new Error(`No valid conversionRate defined for ${this.name}`);
  }

  const baseUsage = convertedAmount / this.conversionRate; // dalam kg misalnya
  const netAvailable = this.quantity - this.waste;

  if (netAvailable < baseUsage) {
    throw new Error(`Insufficient usable ${this.unit} of ${this.name}. Required: ${baseUsage} ${this.unit}, Available: ${netAvailable} ${this.unit}`);
  }

  this.quantity -= baseUsage;
  await this.save();
};

// ✅ Method: Tambahkan waste baru (otomatis kurangi net usable)
RawMaterialSchema.methods.addWaste = async function (amount, reason = 'unknown', userId = null) {
  this.waste += amount;
  this.wasteLogs.push({
    amount,
    reason,
    notedBy: userId
  });

  await this.save();
};

// ✅ Middleware: update status otomatis
RawMaterialSchema.pre('save', function (next) {
  this.lastUpdated = new Date();

  if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'Expired';
  } else if (this.netQuantity <= 0) {
    this.status = 'Out of Stock';
  } else if (this.netQuantity < this.minimumStock) {
    this.status = 'Low Stock';
  } else if (this.maximumStock && this.quantity > this.maximumStock) {
    this.status = 'Overstocked';
  } else {
    this.status = 'Available';
  }

  next();
});

// ✅ Disable menu jika bahan baku terlalu rendah
RawMaterialSchema.post('save', async function (doc) {
  if (doc.netQuantity < doc.minimumStock) {
    await MenuItem.updateMany(
      { 'rawMaterials.materialId': doc._id },
      { $set: { isActive: false } }
    );
  } else {
    await MenuItem.updateMany(
      { 'rawMaterials.materialId': doc._id, isActive: false },
      { $set: { isActive: true } }
    );
  }
});

export const RawMaterial = mongoose.model('RawMaterial', RawMaterialSchema);
