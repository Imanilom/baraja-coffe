import { MenuItem } from '../models/MenuItem.model.js';
import Category from '../models/Category.model.js';
import { Outlet } from '../models/Outlet.model.js';
import mongoose from 'mongoose';
import { MenuRating } from '../models/MenuRating.model.js';

// Create a new menu item
export const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      subCategory,
      imageURL,
      toppings,
      addons,
      availableAt
    } = req.body;

    if (!name || !price || !category || !imageURL) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, category, and imageURL are required fields.',
      });
    }

    // Validate main category exists
    const mainCat = await Category.findById(category);
    if (!mainCat) {
      return res.status(400).json({ error: 'Kategori utama tidak ditemukan.' });
    }

    // Validate subCategory jika disertakan
    if (subCategory) {
      const subCat = await Category.findById(subCategory);
      if (!subCat) {
        return res.status(400).json({ error: 'Sub-kategori tidak ditemukan.' });
      }

      if (subCat.parentCategory?.toString() !== category.toString()) {
        return res.status(400).json({ error: 'Sub-kategori tidak sesuai dengan kategori utama.' });
      }
    }

    // Validate toppings
    if (toppings && !Array.isArray(toppings)) {
      return res.status(400).json({ success: false, message: 'Toppings must be an array.' });
    }

    // Validate addons
    if (addons && !Array.isArray(addons)) {
      return res.status(400).json({ success: false, message: 'Addons must be an array.' });
    }

    // Validate outlets
    if (availableAt && Array.isArray(availableAt)) {
      const outletsExist = await Outlet.find({ _id: { $in: availableAt } });
      if (outletsExist.length !== availableAt.length) {
        return res.status(400).json({ success: false, message: 'Some outlet IDs are invalid.' });
      }
    }

    const menuItem = new MenuItem({
      name,
      price,
      description: description || '',
      category,
      subCategory,
      imageURL,
      toppings: toppings || [],
      addons: addons || [],
      availableAt: availableAt || []
    });

    const savedMenuItem = await menuItem.save();

    // Populate for better response
    const populatedItem = await MenuItem.findById(savedMenuItem._id)
      .populate('category', 'name')
      .populate('subCategory', 'name');

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      data: populatedItem
    });
  } catch (error) {
    console.error('Error in creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create menu item.',
      error: error.message,
    });
  }
};

// Get all menu items with rating info
export const getMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find()
      .populate([
        { path: 'toppings' },
        { path: 'availableAt' },
        {
          path: 'addons',
          populate: { path: 'options' },
        },
        {
          path: 'category',
          select: 'name'
        },
        {
          path: 'subCategory',
          select: 'name'
        }
      ]);

    const ratings = await MenuRating.find({ isActive: true });

    const ratingMap = {};
    ratings.forEach(rating => {
      const menuId = rating.menuItemId.toString();
      if (!ratingMap[menuId]) ratingMap[menuId] = [];
      ratingMap[menuId].push(rating.rating);
    });

    const formattedMenuItems = menuItems.map(item => {
      const itemId = item._id.toString();
      const itemRatings = ratingMap[itemId] || [];

      const averageRating = itemRatings.length > 0
        ? Math.round((itemRatings.reduce((sum, r) => sum + r, 0) / itemRatings.length) * 10) / 10
        : null;

      const reviewCount = itemRatings.length;

      return {
        id: item._id,
        name: item.name,
        category: item.category ? { id: item.category._id, name: item.category.name } : null,
        subCategory: item.subCategory ? { id: item.subCategory._id, name: item.subCategory.name } : null,
        imageUrl: item.imageURL,
        originalPrice: item.price,
        discountedPrice: item.discountedPrice || item.price,
        description: item.description,
        discountPercentage: item.discount ? `${item.discount}%` : null,
        averageRating,
        reviewCount,
        toppings: item.toppings.map(topping => ({
          id: topping._id,
          name: topping.name,
          price: topping.price
        })),
        addons: item.addons.map(addon => ({
          id: addon._id,
          name: addon.name,
          options: addon.options.map(opt => ({
            id: opt._id,
            label: opt.label,
            price: opt.price,
            isDefault: opt.isDefault
          }))
        }))
      };
    });

    res.status(200).json({
      success: true,
      data: formattedMenuItems
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items',
      error: error.message,
    });
  }
};

// Get menu item by ID
export const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid menu item ID' });
    }

    const menuItem = await MenuItem.findById(id)
      .populate([
        { path: 'category', select: 'name' },
        { path: 'subCategory', select: 'name' },
        { path: 'availableAt' },
        { path: 'toppings' },
        {
          path: 'addons',
          populate: { path: 'options' }
        }
      ]);

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    // Fetch active ratings
    const ratings = await MenuRating.find({ menuItemId: id, isActive: true });
    const ratingsList = ratings.map(r => r.rating);

    const averageRating = ratingsList.length > 0
      ? Math.round((ratingsList.reduce((sum, r) => sum + r, 0) / ratingsList.length) * 10) / 10
      : null;

    const reviewCount = ratingsList.length;

    const response = {
      id: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      description: menuItem.description,
      category: menuItem.category ? { id: menuItem.category._id, name: menuItem.category.name } : null,
      subCategory: menuItem.subCategory ? { id: menuItem.subCategory._id, name: menuItem.subCategory.name } : null,
      imageURL: menuItem.imageURL,
      averageRating,
      reviewCount,
      toppings: menuItem.toppings,
      addons: menuItem.addons,
      availableAt: menuItem.availableAt.map(outlet => outlet.toObject())
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item',
      error: error.message,
    });
  }
};

// Get menu items by category
export const getMenuItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const menuItems = await MenuItem.find({
      $or: [
        { category: categoryId },
        { subCategory: categoryId }
      ]
    })
      .populate([
        { path: 'category', select: 'name' },
        { path: 'subCategory', select: 'name' },
        { path: 'availableAt' },
        { path: 'toppings' },
        {
          path: 'addons',
          populate: { path: 'options' }
        }
      ]);

    if (!menuItems || menuItems.length === 0) {
      return res.status(404).json({ success: false, message: 'No menu items found for this category' });
    }

    const menuItemIds = menuItems.map(mi => mi._id.toString());
    const ratings = await MenuRating.find({
      menuItemId: { $in: menuItemIds },
      isActive: true
    });

    const ratingMap = {};
    ratings.forEach(r => {
      const id = r.menuItemId.toString();
      if (!ratingMap[id]) ratingMap[id] = [];
      ratingMap[id].push(r.rating);
    });

    const formattedData = menuItems.map(item => {
      const itemId = item._id.toString();
      const itemRatings = ratingMap[itemId] || [];

      const averageRating = itemRatings.length > 0
        ? Math.round((itemRatings.reduce((sum, r) => sum + r, 0) / itemRatings.length) * 10) / 10
        : null;

      const reviewCount = itemRatings.length;

      return {
        id: item._id,
        name: item.name,
        price: item.price,
        description: item.description,
        category: item.category ? { id: item.category._id, name: item.category.name } : null,
        subCategory: item.subCategory ? { id: item.subCategory._id, name: item.subCategory.name } : null,
        imageURL: item.imageURL,
        averageRating,
        reviewCount,
        toppings: item.toppings,
        addons: item.addons,
        availableAt: item.availableAt.map(outlet => outlet.toObject())
      };
    });

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching menu by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu by category',
      error: error.message,
    });
  }
};

// Update menu item
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      description,
      category,
      subCategory,
      imageURL,
      toppings,
      addons,
      availableAt
    } = req.body;

    if (!category) {
      return res.status(400).json({ success: false, message: 'Main category is required.' });
    }

    const mainCat = await Category.findById(category);
    if (!mainCat) {
      return res.status(400).json({ error: 'Kategori utama tidak ditemukan.' });
    }

    if (subCategory) {
      const subCat = await Category.findById(subCategory);
      if (!subCat || subCat.parentCategory?.toString() !== category.toString()) {
        return res.status(400).json({ error: 'Sub-kategori tidak sesuai dengan kategori utama.' });
      }
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
      id,
      {
        name,
        price,
        description,
        category,
        subCategory,
        imageURL,
        toppings,
        addons,
        availableAt
      },
      { new: true }
    )
      .populate('category', 'name')
      .populate('subCategory', 'name');

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedItem
    });

  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item',
      error: error.message
    });
  }
};

// Delete menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.status(200).json({ success: true, message: 'Menu item deleted successfully' });

  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
      error: error.message
    });
  }
};