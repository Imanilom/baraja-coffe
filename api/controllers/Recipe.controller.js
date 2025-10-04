import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import Product from '../models/modul_market/Product.model.js';
import mongoose from 'mongoose';
import { calculateMaxPortions } from '../utils/stockCalculator.js';
/**
 * Hitung porsi maksimal berdasarkan bahan tersedia
 */


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
    const menuItems = await MenuItem.find().populate("category", "name").session(session);

    for (const menuItem of menuItems) {
      const recipe = await Recipe.findOne({ menuItemId: menuItem._id }).session(session);

      if (!recipe || !recipe.baseIngredients.length) {
        // Update MenuStock dengan calculatedStock = 0
        await MenuStock.findOneAndUpdate(
          { menuItemId: menuItem._id },
          { 
            calculatedStock: 0,
            lastCalculatedAt: new Date()
          },
          { upsert: true, session }
        );
        
        menuItem.availableStock = 0;
        await menuItem.save({ session });
        continue;
      }

      // 🔑 Filter hanya baseIngredients yang isDefault = true
      const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);

      let calculatedStock = 0;
      if (defaultIngredients.length) {
        calculatedStock = await calculateMaxPortions(defaultIngredients);
      }

      // Update atau buat MenuStock
      const menuStock = await MenuStock.findOneAndUpdate(
        { menuItemId: menuItem._id },
        { 
          calculatedStock,
          lastCalculatedAt: new Date()
        },
        { 
          upsert: true, 
          new: true,
          session 
        }
      );

      // Jika manualStock null, gunakan calculatedStock untuk availableStock
      menuItem.availableStock = menuStock.effectiveStock;
      await menuItem.save({ session });
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: 'Stok menu berhasil diperbarui',
      data: menuItems.map(m => ({
        _id: m._id,
        name: m.name,
        category: m.category?.name,
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

// Ambil data stok menu dari MenuStock (dengan join ke MenuItem & category)
export const getMenuStocks = async (req, res) => {
  try {
    const stocks = await MenuStock.find()
      .populate({
        path: "menuItemId",
        select: "name category availableStock",
        populate: { path: "category", select: "name" }
      })
      .lean();

    res.status(200).json({
      success: true,
      message: "Data stok menu berhasil diambil",
      data: stocks.map(s => ({
        _id: s._id,
        menuItemId: s.menuItemId?._id,
        name: s.menuItemId?.name,
        category: s.menuItemId?.category?.name || "-",
        calculatedStock: s.calculatedStock,
        manualStock: s.manualStock,
        effectiveStock: s.manualStock !== null ? s.manualStock : s.calculatedStock, // Manual override logic
        adjustmentNote: s.adjustmentNote,
        adjustedBy: s.adjustedBy,
        lastCalculatedAt: s.lastCalculatedAt,
        lastAdjustedAt: s.lastAdjustedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching menu stocks:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data stok menu"
    });
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
    let calculatedStock = 0;

    if (recipe?.baseIngredients?.length) {
      const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
      if (defaultIngredients.length) {
        calculatedStock = await calculateMaxPortions(defaultIngredients);
      }
    }

    // Simpan ke MenuStock
    let menuStockDoc = await MenuStock.findOne({ menuItemId }).session(session);
    if (!menuStockDoc) {
      menuStockDoc = new MenuStock({
        menuItemId,
        calculatedStock,
        lastCalculatedAt: new Date(),
      });
    } else {
      // Hanya update calculatedStock jika manualStock null
      // Jika manualStock ada, biarkan manualStock tetap
      if (menuStockDoc.manualStock === null) {
        menuStockDoc.calculatedStock = calculatedStock;
      }
      menuStockDoc.lastCalculatedAt = new Date();
    }
    await menuStockDoc.save({ session });

    // Update MenuItem.availableStock dengan effectiveStock
    menuItem.availableStock = menuStockDoc.effectiveStock;
    await menuItem.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: {
        menuItem: menuItem,
        stockDetail: {
          ...menuStockDoc.toJSON(),
          effectiveStock: menuStockDoc.effectiveStock
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating single menu stock:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate stok menu' });
  } finally {
    session.endSession();
  }
};

// PATCH /api/menu-stocks/:menuItemId/adjust
export const adjustMenuStock = async (req, res) => {
  const { menuItemId } = req.params;
  const { manualStock, adjustmentNote, adjustedBy } = req.body;

  if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
    return res.status(400).json({ success: false, message: 'ID Menu tidak valid' });
  }

  // Jika manualStock kosong atau null, reset ke calculated
  if (manualStock === '' || manualStock === null) {
    try {
      const menuStock = await MenuStock.findOne({ menuItemId });
      if (!menuStock) {
        return res.status(404).json({ success: false, message: 'Stok menu tidak ditemukan' });
      }

      // Reset manualStock ke null, sehingga menggunakan calculatedStock
      menuStock.manualStock = null;
      menuStock.adjustmentNote = 'Reset ke stok terhitung sistem';
      menuStock.adjustedBy = adjustedBy || null;
      menuStock.lastAdjustedAt = new Date();

      await menuStock.save();

      // Update MenuItem.availableStock
      await MenuItem.findByIdAndUpdate(menuItemId, {
        availableStock: menuStock.effectiveStock
      });

      return res.status(200).json({
        success: true,
        message: 'Stok manual berhasil direset ke stok sistem',
        data: menuStock
      });

    } catch (error) {
      console.error('Error resetting manual stock:', error);
      return res.status(500).json({ success: false, message: 'Gagal mereset stok manual' });
    }
  }

  // Validasi untuk input manual stock
  if (manualStock < 0) {
    return res.status(400).json({ success: false, message: 'Stok manual harus angka ≥ 0' });
  }

  try {
    let stockDoc = await MenuStock.findOne({ menuItemId });
    if (!stockDoc) {
      // Jika belum ada, hitung calculatedStock terlebih dahulu
      const recipe = await Recipe.findOne({ menuItemId });
      let calculatedStock = 0;
      
      if (recipe?.baseIngredients?.length) {
        const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
        if (defaultIngredients.length) {
          calculatedStock = await calculateMaxPortions(defaultIngredients);
        }
      }

      stockDoc = new MenuStock({ 
        menuItemId,
        calculatedStock,
        manualStock: manualStock,
        adjustmentNote,
        adjustedBy: adjustedBy || null,
        lastAdjustedAt: new Date(),
        lastCalculatedAt: new Date()
      });
    } else {
      stockDoc.manualStock = manualStock;
      stockDoc.adjustmentNote = adjustmentNote || null;
      stockDoc.adjustedBy = adjustedBy || null;
      stockDoc.lastAdjustedAt = new Date();
    }

    await stockDoc.save();

    // Update MenuItem.availableStock
    await MenuItem.findByIdAndUpdate(menuItemId, {
      availableStock: stockDoc.effectiveStock
    });

    res.status(200).json({
      success: true,
      message: 'Stok menu berhasil disesuaikan',
      data: stockDoc
    });

  } catch (error) {
    console.error('Error adjusting menu stock:', error);
    res.status(500).json({ success: false, message: 'Gagal menyesuaikan stok' });
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
    const menuStock = await MenuStock.findOne({ menuItemId });

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    const details = {
      menuItem: {
        _id: menuItem._id,
        name: menuItem.name,
        availableStock: menuItem.availableStock
      },
      stockInfo: {
        calculatedStock: menuStock?.calculatedStock || 0,
        manualStock: menuStock?.manualStock,
        effectiveStock: menuStock?.effectiveStock || 0,
        lastCalculatedAt: menuStock?.lastCalculatedAt,
        lastAdjustedAt: menuStock?.lastAdjustedAt
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