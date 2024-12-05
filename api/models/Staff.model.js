const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    position: { type: String, required: true },
    phone: { type: String },
    email: { type: String, unique: true },
  }, { timestamps: true });
  
  export const Staff = mongoose.model('Staff', StaffSchema);
  