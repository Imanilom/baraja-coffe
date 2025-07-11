import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import Product from '../models/modul_market/Product.model.js';
import mongoose from 'mongoose';

/**
 * Hitung porsi maksimal berdasarkan bahan tersedia
 */
const calculateMaxPortions = async (ingredients) => {
  let maxPortion = Infinity;

  for (const ing of ingredients) {
    const stockDoc = await ProductStock.findOne({ productId: ing.productId });

    if (!stockDoc) {
      // Tidak ada stok → tidak bisa buat sama sekali
      return 0;
    }

    const availableQty = stockDoc.currentStock;
    const requiredPerPortion = ing.quantity;

    if (requiredPerPortion <= 0) continue;

    const possiblePortion = Math.floor(availableQty / requiredPerPortion);
    maxPortion = Math.min(maxPortion, possiblePortion);
  }

  return isNaN(maxPortion) || maxPortion < 0 ? 0 : maxPortion;
};

export const calculateCostPrice = async (menuItemId, recipeOverride = null) => {
  let recipe;

  if (recipeOverride) {
    // Gunakan resep yang baru dibuat
    recipe = recipeOverride;
  } else {
    // Cari di DB jika tidak ada override
    recipe = await Recipe.findOne({ menuItemId });
  }

  if (!recipe) return 0;

  let total = 0;

  const getPrice = (product) => {
    if (!product?.suppliers?.length) return 0;

    // Urutkan supplier berdasarkan lastPurchaseDate terbaru
    const sorted = [...product.suppliers].sort((a, b) =>
      new Date(b.lastPurchaseDate) - new Date(a.lastPurchaseDate)
    );
    return sorted[0]?.price || 0;
  };

  const sumIngredients = async (ingredients) => {
    for (const ing of ingredients) {
      const product = await Product.findById(ing.productId);
      if (!product) continue;
      const price = getPrice(product);
      total += price * ing.quantity;
    }
  };

  // Hitung bahan utama
  await sumIngredients(recipe.baseIngredients);

  // Hitung addonOptions
  for (const addon of recipe.addonOptions) {
    await sumIngredients(addon.ingredients);
  }

  return total;
};

/**
 * Update semua menuItem dengan hitungan availableStock berdasarkan recipe
 */
export const updateMenuAvailableStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const menuItems = await MenuItem.find().session(session);

    for (const menuItem of menuItems) {
      const recipe = await Recipe.findOne({ menuItemId: menuItem._id }).session(session);

      if (!recipe || !recipe.baseIngredients.length) {
        menuItem.availableStock = 0;
        await menuItem.save({ session });
        continue;
      }

      const totalPortion = await calculateMaxPortions(recipe.baseIngredients);
      menuItem.availableStock = totalPortion;

      await menuItem.save({ session });
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: 'Stok menu berhasil diperbarui',
      data: menuItems.map(m => ({
        _id: m._id,
        name: m.name,
        availableStock: m.availableStock
      }))
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating menu available stock:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate stok menu' });
  } finally {
    session.endSession();
  }
};

/**
 * Update stok hanya untuk satu menuItem
 */
export const updateSingleMenuStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { menuItemId } = req.params;

    if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ success: false, message: 'ID Menu tidak valid' });
    }

    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    }

    const recipe = await Recipe.findOne({ menuItemId: menuItem._id }).session(session);

    if (!recipe || !recipe.baseIngredients.length) {
      menuItem.availableStock = 0;
      await menuItem.save({ session });
      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        data: menuItem
      });
    }

    const totalPortion = await calculateMaxPortions(recipe.baseIngredients);
    menuItem.availableStock = totalPortion;

    await menuItem.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: menuItem
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating single menu stock:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate stok menu' });
  } finally {
    session.endSession();
  }
};

/**
 * Lihat detail stok menu beserta komponen bahan
 */
export const getMenuStockDetails = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ success: false, message: 'ID Menu tidak valid' });
    }

    const menuItem = await MenuItem.findById(menuItemId).populate('toppings.name', 'name');
    const recipe = await Recipe.findOne({ menuItemId }).populate('baseIngredients.productId');

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    const details = {
      menuItem: {
        _id: menuItem._id,
        name: menuItem.name,
        availableStock: menuItem.availableStock
      },
      baseIngredients: recipe.baseIngredients.map(ing => ({
        productId: ing.productId._id,
        productName: ing.productName,
        productSku: ing.productSku,
        quantityRequired: ing.quantity,
        unit: ing.unit,
        currentStock: 0,
        portionFromThisItem: 0
      })),
      toppingOptions: recipe.toppingOptions.map(t => ({
        toppingName: t.toppingName,
        ingredients: t.ingredients.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantityRequired: i.quantity,
          unit: i.unit
        }))
      })),
      addonOptions: recipe.addonOptions.map(a => ({
        addonName: a.addonName,
        optionLabel: a.optionLabel,
        ingredients: a.ingredients.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantityRequired: i.quantity,
          unit: i.unit
        }))
      }))
    };

    // Isi stok aktual & hitung portion dari tiap bahan
    for (const ing of details.baseIngredients) {
      const stockDoc = await ProductStock.findOne({ productId: ing.productId });
      ing.currentStock = stockDoc?.currentStock ?? 0;
      if (ing.quantityRequired > 0) {
        ing.portionFromThisItem = Math.floor(ing.currentStock / ing.quantityRequired);
      }
    }

    res.status(200).json({ success: true, data: details });

  } catch (error) {
    console.error('Error fetching menu stock details:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail stok menu' });
  }
};


// 🔹 Membuat resep baru
export const createRecipe = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { menuItemId, baseIngredients, toppingOptions, addonOptions } = req.body;

    // Validasi bahwa menu ada DAN memiliki mainCategory
    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    }


    // Validasi minimal baseIngredients
    if (!Array.isArray(baseIngredients) || baseIngredients.length === 0) {
      return res.status(400).json({ success: false, message: 'Harus ada bahan utama' });
    }

    // Cek apakah resep sudah ada untuk menu ini
    const existingRecipe = await Recipe.findOne({ menuItemId }).session(session);
    if (existingRecipe) {
      return res.status(400).json({
        success: false,
        message: 'Resep untuk menu ini sudah ada, gunakan update endpoint'
      });
    }

    // Buat resep baru
    const newRecipe = new Recipe({
      menuItemId,
      baseIngredients,
      toppingOptions: toppingOptions || [],
      addonOptions: addonOptions || []
    });

    await newRecipe.save({ session });

    // Update status menu jika belum aktif
    if (!menuItem.isActive) {
      menuItem.isActive = true;
      await menuItem.save({ session });
    }

    // Hitung HPP
    const newCostPrice = await calculateCostPrice(menuItemId, newRecipe);
    menuItem.costPrice = newCostPrice;
    await menuItem.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: newRecipe
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating recipe:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat resep',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// 🔹 Lihat semua resep
export const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('menuItemId', 'name price category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes
    });

  } catch (error) {
    console.error('Error fetching recipes:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar resep'
    });
  }
};

// 🔹 Lihat detail resep
export const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID Resep tidak valid' });
    }

    const recipe = await Recipe.findById(id)
      .populate('menuItemId', 'name price category');

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      data: recipe
    });

  } catch (error) {
    console.error('Error fetching recipe by ID:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail resep'
    });
  }
};

// 🔹 Edit resep
export const updateRecipe = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { baseIngredients, toppingOptions, addonOptions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID Resep tidak valid' });
    }

    const recipe = await Recipe.findById(id).session(session);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    // Update field
    if (baseIngredients) recipe.baseIngredients = baseIngredients;
    if (toppingOptions !== undefined) recipe.toppingOptions = toppingOptions;
    if (addonOptions !== undefined) recipe.addonOptions = addonOptions;

    await recipe.save({ session });

    // Hitung ulang HPP setelah update bahan
    const newCostPrice = await calculateCostPrice(recipe.menuItemId);
    await MenuItem.findByIdAndUpdate(recipe.menuItemId, { costPrice: newCostPrice }, { session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Resep berhasil diupdate dan HPP diperbarui',
      data: recipe
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating recipe:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate resep'
    });
  } finally {
    session.endSession();
  }
};


// 🔹 Hapus resep
export const deleteRecipe = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID Resep tidak valid' });
    }

    const recipe = await Recipe.findByIdAndDelete(id).session(session);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Resep berhasil dihapus'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting recipe:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus resep'
    });
  } finally {
    session.endSession();
  }
};

// 🔹 Cari resep berdasarkan ID menu
export const getRecipeByMenuId = async (req, res) => {
  try {
    const { menuId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(menuId)) {
      return res.status(400).json({ success: false, message: 'ID Menu tidak valid' });
    }

    const recipe = await Recipe.findOne({ menuItemId: menuId })
      .populate('menuItemId', 'name price category');

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      data: recipe
    });

  } catch (error) {
    console.error('Error fetching recipe by menu ID:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil resep'
    });
  }
};