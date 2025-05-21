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


  // Controller untuk membuat kategori baru
export const createCategory = async (req, res) => {
    try {
        const categories = req.body;

        if (!Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid input, must be an array of categories' });
        } 

        const newCategories = await Category.insertMany(categories);

        res.status(201).json({ success: true, data: newCategories });
    } catch (error) {
        console.error('Error creating categories:', error);
        res.status(500).json({ success: false, message: 'Failed to create categories', error: error.message });
    }
};


  // controller untuk menghapus kategori
  export const deleteCategory = async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!id) {
        return res.status(400).json({ success: false, message: 'Category ID is required' });
      }
  
      const deletedCategory = await Category.findByIdAndDelete(id);
  
      if (!deletedCategory) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
  
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
    }
  }

  // Controller untuk mengupdate kategori
export const updateCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, type } = req.body;
  
      if (!id) {
        return res.status(400).json({ success: false, message: 'Category ID is required' });
      }
  
      const category = await Category.findById(id);
  
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
  
      if (name) category.name = name;
      if (description) category.description = description;
      if (type) category.type = type;
  
      await category.save();
  
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
    }
  };

  // Controller untuk mengambil daftar kategori sesuai tipe
export const getCategoriesByType = async (req, res) => {
    try {
      const { type } = req.params;
  
      if (!type) {
        return res.status(400).json({ success: false, message: 'Type is required' });
      }
  
      const categories = await Category.find({ type });
  
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      console.error('Error fetching categories by type:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch categories by type', error: error.message });
    }
  }
