import mongoose from "mongoose";

const vendorCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  icon: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const VendorCategory = mongoose.model("VendorCategory", vendorCategorySchema);

export default VendorCategory;