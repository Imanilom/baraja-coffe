import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true },
  category: {
    type: [String],
    default: []
  },
  imageURL: { type: String, trim: true, default: 'https://placehold.co/1920x1080/png' },
  toppings: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      rawMaterials: [
        {
          _id: false, 
          materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
          quantityRequired: { type: Number, required: true },
          unit: { type: String, required: true } // Menyimpan satuan bahan baku
        }
      ]
    }
  ],
  addons: [
    {
      name: { type: String, required: true }, // Nama addon (contoh: Size)
      options: [ // Array untuk menyimpan opsi-opsi dengan harga
        {
          label: { type: String, required: true }, // Label opsi (contoh: reg, med, large)
          price: { type: Number, required: true, min: 0 }, // Harga tambahan untuk opsi tersebut
          isdefault: { type: Boolean, default: false } // Opsi default atau tidak
        }
      ],
      rawMaterials: [
        {
          _id: false, 
          materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
          quantityRequired: { type: Number, required: true },
          unit: { type: String, required: true } // Menyimpan satuan bahan baku
        }
      ]
    }
  ], // Menyimpan daftar addons dengan harga berbeda-beda per menu
  rawMaterials: [
    {
     _id: false,   // Tambahkan ini agar tidak ada `_id` otomatis di dalam subdokumen
      materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
      quantityRequired: { type: Number, required: true, min: 0 },
      unit: { type: String, required: true } // Menyimpan satuan bahan baku
    }
  ],
  availableAt: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true }
  ], // Menyimpan daftar outlet tempat menu tersedia
  isActive: { type: Boolean, default: true }, // Status aktif menu
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