import { MenuItem } from '../models/MenuItem.model.js';
import { RawMaterial } from '../models/RawMaterial.model.js';
import { Outlet } from '../models/Outlet.model.js';
import mongoose from 'mongoose';

// Create a new menu item
export const createMenuItem = async (req, res) => {
  try {
    const { name, price, description, category, imageURL, toppings, addons, rawMaterials, availableAt } = req.body;

    if (!name || !price || !category || !imageURL || !availableAt) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, category, imageURL, and availableAt are required fields.',
      });
    }

    if (!Array.isArray(category) || category.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category must be a non-empty array of strings.',
      });
    }

    // Validate rawMaterials
    if (rawMaterials && !Array.isArray(rawMaterials)) {
      return res.status(400).json({
        success: false,
        message: 'Raw materials must be an array of objects with materialId and quantityRequired.',
      });
    }

    if (rawMaterials) {
      for (let i = 0; i < rawMaterials.length; i++) {
        const { materialId, quantityRequired } = rawMaterials[i];
        if (!materialId || quantityRequired === undefined) {
          return res.status(400).json({
            success: false,
            message: `Raw material at index ${i} is missing 'materialId' or 'quantityRequired'.`,
          });
        }
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

    // Validate availableAt (outlets)
    if (!Array.isArray(availableAt) || availableAt.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'availableAt must be a non-empty array of outlet IDs.',
      });
    }

    const outletPromises = availableAt.map(async (outletId) => {
      const outlet = await Outlet.findById(outletId);
      if (!outlet) {
        throw new Error(`Outlet with ID ${outletId} not found.`);
      }
      return outlet;
    });

    try {
      await Promise.all(outletPromises);
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }

    // Validate raw materials availability
    const rawMaterialPromises = rawMaterials.map(async ({ materialId, quantityRequired }) => {
      const rawMaterial = await RawMaterial.findById(materialId);
      if (!rawMaterial) {
        throw new Error(`Raw material with ID ${materialId} not found.`);
      }
      if (rawMaterial.stock < quantityRequired) {
        throw new Error(`Insufficient stock for raw material: ${rawMaterial.name}`);
      }
      return rawMaterial;
    });

    try {
      await Promise.all(rawMaterialPromises);
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }

    const menuItem = new MenuItem({
      name,
      price,
      description: description || '',
      category,
      imageURL,
      toppings: toppings || [],
      addons: addons || [],
      rawMaterials: rawMaterials || [],
      availableAt,
    });

    const savedMenuItem = await menuItem.save();

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      data: savedMenuItem,
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


export const getSimpleMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find().select('name price category imageURL rawMaterials discount');

    // Cek stok bahan baku untuk setiap menu
    const updatedMenuItems = await Promise.all(menuItems.map(async (menu) => {
      let isAvailable = true;

      for (const item of menu.rawMaterials) {
        const material = await RawMaterial.findOne({ _id: item.materialId });
        if (!material || material.quantity < item.quantityRequired) {
          isAvailable = false;
          break;
        }
      }

      // Hitung harga setelah diskon jika ada
      let originalPrice = menu.price;
      let discountPercentage = menu.discount || 0;
      let discountedPrice = originalPrice;

      if (discountPercentage > 0) {
        discountedPrice = originalPrice - (originalPrice * (discountPercentage / 100));
      }

      return {
        id: menu._id,
        name: menu.name,
        price: originalPrice,
        category: menu.category,
        imageURL: menu.imageURL,
        isAvailable,
        originalPrice,
        discountedPrice,
        discountPercentage
      };
    }));

    res.status(200).json({ success: true, data: updatedMenuItems });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch menu items', error: error.message });
  }
};


// Get all menu items
export const getMenuItems = async (req, res) => {
  try {
    const { outletId } = req.query; // Ambil ID outlet dari query parameter

    // Buat query filter jika outletId diberikan
    const filter = outletId ? { availableAt: outletId } : {};

    // Ambil menu berdasarkan outlet (jika diberikan)
    const menuItems = await MenuItem.find()
      .populate([
        { path: 'rawMaterials.materialId' },
        { path: 'availableAt' }
      ]);

    // Konversi ke objek JavaScript
    const updatedMenuItems = menuItems.map(item => item.toObject());

    res.status(200).json({ success: true, data: updatedMenuItems });
    console.log('Menu items fetched successfully');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items',
      error: error.message,
    });
  }
};


export const getMenuItemById = async (req, res) => {
  try {
    // Validasi parameter ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid menu item ID' });
    }

    // Fetch the menu item and populate related fields
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('rawMaterials.materialId')
      .populate('availableAt');

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    // Function to check stock availability
    const checkStockAvailability = async (rawMaterials) => {
      if (!rawMaterials || rawMaterials.length === 0) return true;

      // Filter hanya ObjectId yang valid
      const materialIds = rawMaterials
        .filter(item => mongoose.Types.ObjectId.isValid(item.materialId))
        .map(item => new mongoose.Types.ObjectId(item.materialId));

      if (materialIds.length === 0) return true;

      // Fetch semua material sekaligus
      const materials = await RawMaterial.find({ _id: { $in: materialIds } });

      // Cek apakah stok cukup
      return rawMaterials.every(item => {
        const material = materials.find(m => m._id.equals(item.materialId));
        return material && material.quantity >= item.quantityRequired;
      });
    };

    // Cek ketersediaan bahan baku utama
    const isMainAvailable = await checkStockAvailability(menuItem.rawMaterials);

    // Struktur data response dengan isAvailable
    const response = {
      id: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      category: menuItem.category,
      imageURL: menuItem.imageURL,
      isAvailable: isMainAvailable, // Menentukan apakah menu utama tersedia
      toppings: menuItem.toppings,
      addons: menuItem.addons,
      availableAt: menuItem.availableAt.map(outlet => outlet.toObject()),
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch menu item', error: error.message });
  }
};


export const getMenuItemsByCategory = async (req, res) => {
  try {
    // Ambil parameter category dari request
    const category = req.params.category;

    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    // Fetch semua menu items dengan category yang sesuai
    const menuItems = await MenuItem.find({ category })
      .populate('rawMaterials.materialId')
      .populate('availableAt');

    if (!menuItems || menuItems.length === 0) {
      return res.status(404).json({ success: false, message: 'No menu items found for this category' });
    }

    // Function to check stock availability
    const checkStockAvailability = async (rawMaterials) => {
      if (!rawMaterials || rawMaterials.length === 0) return true;

      // Filter hanya ObjectId yang valid
      const materialIds = rawMaterials
        .filter(item => mongoose.Types.ObjectId.isValid(item.materialId))
        .map(item => new mongoose.Types.ObjectId(item.materialId));

      if (materialIds.length === 0) return true;

      // Fetch semua material sekaligus
      const materials = await RawMaterial.find({ _id: { $in: materialIds } });

      // Cek apakah stok cukup
      return rawMaterials.every(item => {
        const material = materials.find(m => m._id.equals(item.materialId));
        return material && material.quantity >= item.quantityRequired;
      });
    };

    // Proses setiap menu item untuk menambahkan informasi isAvailable
    const response = await Promise.all(
      menuItems.map(async (menuItem) => {
        const isMainAvailable = await checkStockAvailability(menuItem.rawMaterials);

        return {
          id: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          category: menuItem.category,
          imageURL: menuItem.imageURL,
          isAvailable: isMainAvailable, // Menentukan apakah menu utama tersedia
          toppings: menuItem.toppings,
          addons: menuItem.addons,
          availableAt: menuItem.availableAt.map(outlet => outlet.toObject()),
        };
      })
    );

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching menu by category:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch menu by category', error: error.message });
  }
};



// Update a menu item
export const updateMenuItem = async (req, res) => {
  try {
    const { name, price, description, category, stock, imageURL, toppings, addOns, rawMaterials } = req.body;
    const { id } = req.params;

    // Validate rawMaterials
    if (rawMaterials && !Array.isArray(rawMaterials)) {
      return res.status(400).json({
        success: false,
        message: 'Raw materials must be an array of objects with material ID and quantity.',
      });
    }

    if (rawMaterials) {
      // Ensure each raw material has `materialId` and `quantityRequired`
      for (let i = 0; i < rawMaterials.length; i++) {
        const { materialId, quantityRequired } = rawMaterials[i];
        if (!materialId || quantityRequired === undefined) {
          return res.status(400).json({
            success: false,
            message: `Raw material at index ${i} is missing 'materialId' or 'quantityRequired'.`,
          });
        }
      }
    }

    // Check raw material stock availability
    const rawMaterialPromises = rawMaterials.map(async ({ materialId, quantityRequired }) => {
      const rawMaterial = await RawMaterial.findById(materialId);
      if (!rawMaterial) {
        throw new Error(`Raw material with ID ${materialId} not found.`);
      }
      if (rawMaterial.stock < quantityRequired) {
        throw new Error(`Insufficient stock for raw material: ${rawMaterial.name}`);
      }
      return rawMaterial;
    });

    try {
      await Promise.all(rawMaterialPromises);
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }


    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      id,
      {
        name,
        price,
        description: description || '',
        category,
        stock: stock || 0,
        imageURL: imageURL || '',
        toppings: toppings || [],
        addOns: addOns || [],
        rawMaterials: rawMaterials || [],
      },
      { new: true }
    );

    if (!updatedMenuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    res.status(200).json({ success: true, data: updatedMenuItem });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item.',
      error: error.message,
    });
  }
};


// Delete a menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const deletedMenuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deletedMenuItem) return res.status(404).json({ success: false, message: 'Menu item not found' });

    res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete menu item', error: error.message });
  }
};
