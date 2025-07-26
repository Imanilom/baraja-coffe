// models/Recipe.js
import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  productSku: String,
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  baseIngredients: [ingredientSchema], // Bahan utama menu
  toppingOptions: [
    {
      toppingName: String, // Nama topping (match dengan field di MenuItem)
      ingredients: [ingredientSchema] // Bahan yang dikurangi saat pilih topping ini
    }
  ],
  addonOptions: [
    {
      addonName: String, // Nama addon (misal: "Ukuran")
      optionLabel: String, // Label option (misal: "Jumbo")
      ingredients: [ingredientSchema] // Bahan tambahan jika pilih addon ini
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Recipe = mongoose.model('Recipe', recipeSchema);
export default Recipe;