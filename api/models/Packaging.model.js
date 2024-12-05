const PackagingSchema = new mongoose.Schema({
    type: { type: String, required: true },
    size: { type: String },
    quantity: { type: Number, required: true },
    minimumStock: { type: Number, required: true },
    supplier: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  }, { timestamps: true });
  
  export const Packaging = mongoose.model('Packaging', PackagingSchema);
  