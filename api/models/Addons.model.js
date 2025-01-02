import mongoose from 'mongoose';

const addOnSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['size', 'temperature', 'spiciness', 'custom'], required: true },
  options: [
    {
      label: { type: String, required: true },
      price: { type: Number, required: true, min: 0 }
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


const AddOn = mongoose.model('AddOn', addOnSchema);

export default AddOn;
