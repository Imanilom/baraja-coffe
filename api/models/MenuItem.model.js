import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: String, required: true },
  imageURL: { type: String },
  toppings: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Topping' }
  ],
  addOns: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' }
  ],
  rawMaterials: [
    {
      materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
      quantityRequired: { type: Number, required: true } // Jumlah bahan baku per unit menu
    }
  ]
}, { timestamps: true });

export const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
