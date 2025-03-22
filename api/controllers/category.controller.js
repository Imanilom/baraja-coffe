import { MenuItem } from '../models/MenuItem.model.js';
import Category from '../models/Category.model.js';


// Controller untuk menambahkan menu item ke dalam kategori
export const assignMenuItemsToCategory = async (req, res) => {
    try {
      // Validasi input
      const { category, menuItems } = req.body;
  
      if (!category || !Array.isArray(menuItems) || menuItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid input data' });
      }
  
      // Pastikan semua ID menu valid
      const invalidIds = menuItems.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ success: false, message: 'Some menu item IDs are invalid' });
      }
  
      // Ambil semua menu item berdasarkan ID
      const existingMenuItems = await MenuItem.find({ _id: { $in: menuItems } });
  
      if (existingMenuItems.length !== menuItems.length) {
        return res.status(400).json({ success: false, message: 'Some menu items not found' });
      }
  
      // Perbarui setiap menu item dengan menambahkan/menggabungkan kategori
      await Promise.all(existingMenuItems.map(async (menuItem) => {
        if (!menuItem.category.includes(category)) {
          menuItem.category.push(category);
          await menuItem.save();
        }
      }));
  
      res.status(200).json({ success: true, message: 'Menu items assigned to category successfully' });
    } catch (error) {
      console.error('Error assigning menu items to category:', error);
      res.status(500).json({ success: false, message: 'Failed to assign menu items to category', error: error.message });
    }
  };


  // Controller untuk mengambil daftar kategori
export const getCategories = async (req, res) => {
    try {
      // Ambil semua kategori unik dari koleksi MenuItem
      const categories = await MenuItem.distinct('category').exec();
  
      // Pastikan hasilnya adalah array flat (jika ada kategori yang merupakan array)
      const flattenedCategories = Array.from(new Set(categories.flat()));
  
      res.status(200).json({ success: true, data: flattenedCategories });
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
