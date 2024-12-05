import mongoose from 'mongoose';

const StockOpnameSchema = new mongoose.Schema({
    itemType: { type: String, enum: ['MenuItem', 'RawMaterial', 'Packaging'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: Date, default: Date.now },
    initialStock: { type: Number, required: true },
    finalStock: { type: Number, required: true },
    remarks: { type: String },
  }, { timestamps: true });
  
  export const StockOpname = mongoose.model('StockOpname', StockOpnameSchema);
  