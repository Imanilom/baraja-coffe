import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { 
      type: String, 
    },
    parentCategory: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Category",
      default: null // Jika null → main category
    },
    lastUpdated: { type: Date, default: Date.now },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const Category = mongoose.model("Category", CategorySchema);

export default Category;