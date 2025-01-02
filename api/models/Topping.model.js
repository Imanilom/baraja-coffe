import mongoose from 'mongoose';

const ToppingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    rawMaterials: [
      {
        materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
        quantityRequired: { type: Number, required: true }
      }
    ]
  }, { timestamps: true });
  
  export const Topping = mongoose.model('Topping', ToppingSchema);
  