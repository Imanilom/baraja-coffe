import { MenuItem } from '../models/MenuItem.model.js';
import Category from '../models/Category.model.js';
import mongoose from 'mongoose';

// Controller untuk menambahkan menu item ke dalam kategori
export const assignMenuItemsToCategory = async (req, res) => {
  try {
    const { categoryNames, menuItems } = req.body;

    // Validasi input
    if (!Array.isArray(categoryNames) || categoryNames.length === 0 || !Array.isArray(menuItems) || menuItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid input data' });
    }

    // Pastikan semua ID menu valid
    const invalidMenuIds = menuItems.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidMenuIds.length > 0) {
      return res.status(400).json({ success: false, message: 'Some menu item IDs are invalid', invalidMenuIds });
    }

    // Ambil semua menu item berdasarkan ID
    const existingMenuItems = await MenuItem.find({ _id: { $in: menuItems } });

    if (existingMenuItems.length !== menuItems.length) {
      const missingMenuIds = menuItems.filter(
        id => !existingMenuItems.map(item => item._id.toString()).includes(id)
      );
      return res.status(400).json({ success: false, message: 'Some menu items not found', missingMenuIds });
    }

    // Cari ID kategori berdasarkan nama kategori
    const categories = await Category.find({ name: { $in: categoryNames } });
    if (categories.length !== categoryNames.length) {
      const missingCategories = categoryNames.filter(
        name => !categories.map(cat => cat.name).includes(name)
      );
      return res.status(400).json({ success: false, message: 'Some categories not found', missingCategories });
    }

    // Dapatkan array nama kategori
    const categoryNamesToAdd = categories.map(cat => cat.name);

    // Perbarui setiap menu item dengan menambahkan/menggabungkan nama kategori
    await Promise.all(
      existingMenuItems.map(async (menuItem) => {
        // Hapus semua elemen yang bukan string dari array category
        const cleanedCategories = menuItem.category.filter(cat => typeof cat === 'string');

        // Tambahkan nama kategori baru jika belum ada
        const updatedCategories = [...cleanedCategories, ...categoryNamesToAdd].filter((v, i, a) => a.indexOf(v) === i);

        menuItem.category = updatedCategories; // Setel ulang array category
        await menuItem.save();
      })
    );

    res.status(200).json({ success: true, message: 'Menu items assigned to categories successfully' });
  } catch (error) {
    console.error('Error assigning menu items to category:', error);
    res.status(500).json({ success: false, message: 'Failed to assign menu items to category', error: error.message });
  }
};

// Controller untuk mengambil daftar kategori
export const getCategories = async (req, res) => {
  try {
    const allowedTypes = ['food', 'beverage', 'instan'];

    // Ambil kategori yang bertipe tertentu atau tidak memiliki tipe
    const categories = await Category.find({
      $or: [
        { type: { $in: allowedTypes } },
        { type: { $exists: false } }, // field tidak ada
        { type: null } // field ada tapi null
      ]
    });

    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
};



// Controller untuk memfilter menu berdasarkan kategori
export const filterMenuByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    // Cari menu item berdasarkan kategori
    const menuItems = await MenuItem.find({ category: { $in: [category] } })
      .populate('rawMaterials.materialId')
      .populate('availableAt');

    res.status(200).json({ success: true, data: menuItems });
  } catch (error) {
    console.error('Error filtering menu by category:', error);
    res.status(500).json({ success: false, message: 'Failed to filter menu by category', error: error.message });
  }
};


// ✅ POST: Tambah kategori (main atau sub)
export const createCategory = async (req, res) => {
  try {
    const { name, description, type, parentCategory } = req.body;

    // Validasi wajib
    if (!name || !type) {
      return res.status(400).json({ error: 'Nama dan tipe kategori harus diisi.' });
    }

    // Optional: Validasi parentCategory jika disertakan
    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({ error: 'Parent kategori tidak ditemukan.' });
      }
    }

    const newCategory = new Category({
      name,
      description,
      type,
      parentCategory,
      lastUpdatedBy: req.user?._id // asumsi user ada di req
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ error: 'Gagal membuat kategori.', details: err.message });
  }
};

// ✅ GET: Semua kategori (dengan populate parent & child)
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('parentCategory', 'name')
      .sort({ name: 1 });

    // Kelompokkan menjadi main + sub category
    const mainCategories = categories.filter(cat => !cat.parentCategory);
    const subCategories = categories.filter(cat => cat.parentCategory);

    res.status(200).json({
      mainCategories,
      subCategories
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data kategori.', details: err.message });
  }
};

// ✅ GET: Kategori by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name');

    if (!category) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
    }

    res.status(200).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil kategori.', details: err.message });
  }
};

// ✅ PUT: Update kategori
export const updateCategory = async (req, res) => {
  try {
    const { name, description, type, parentCategory } = req.body;

    if (parentCategory && parentCategory !== req.body.parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({ error: 'Parent kategori tidak ditemukan.' });
      }
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        type,
        parentCategory,
        lastUpdated: Date.now(),
        lastUpdatedBy: req.user?._id
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Gagal mengupdate kategori.', details: err.message });
  }
};

// ✅ DELETE: Hapus kategori
export const deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Kategori berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus kategori.', details: err.message });
  }
};