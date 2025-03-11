import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  imageURL: { type: String, trim: true, default: 'https://placehold.co/1920x1080/png' },
  toppings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topping' }],
  addOns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' }],
  rawMaterials: [
    {
      materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
      quantityRequired: { type: Number, required: true, min: 0 }
    }
  ],
  availableAt: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true }
  ], // Menyimpan daftar outlet tempat menu tersedia
}, { timestamps: true });

// Middleware: Validasi apakah bahan baku cukup sebelum menyimpan menu baru
MenuItemSchema.pre('save', async function (next) {
  try {
    for (const item of this.rawMaterials) {
      const material = await mongoose.model('RawMaterial').findById(item.materialId);
      if (!material || material.quantity < item.quantityRequired) {
        throw new Error(`Insufficient stock for raw material: ${material?.name || 'Unknown'}`);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

export const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
