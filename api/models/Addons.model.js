import mongoose from 'mongoose';

const addOnSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true }, // Tidak lagi terbatas pada enum untuk fleksibilitas
  options: [
    {
      label: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      metadata: { type: mongoose.Schema.Types.Mixed } // Untuk menyimpan data tambahan jika diperlukan
    }
  ],
  rawMaterials: [
    {
      materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
      quantityRequired: { type: Number, required: true }
    }
  ],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Indeks untuk pencarian lebih cepat
addOnSchema.index({ name: 1, type: 1 });

const AddOn = mongoose.model('AddOn', addOnSchema);

export default AddOn;
