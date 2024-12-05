const OutletSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String },
    contactNumber: { type: String },
  }, { timestamps: true });
  
  export const Outlet = mongoose.model('Outlet', OutletSchema);
  