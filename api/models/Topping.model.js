import mongoose from 'mongoose';

const ToppingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, enum: ['food', 'drink'], required: true }, 
    rawMaterials: [
      {
        materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
        quantityRequired: { type: Number, required: true }
      }
    ]
}, { timestamps: true });

const Topping = mongoose.model('Topping', ToppingSchema);

export default Topping;
