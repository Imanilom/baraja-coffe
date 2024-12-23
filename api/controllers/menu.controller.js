import { MenuItem } from '../models/MenuItem.model.js';
import { Topping } from '../models/Topping.model.js';
import Promotion from '../models/promotion.model.js';
import AddOn from '../models/Addons.model.js';

// Create a new menu item
export const createMenuItem = async (req, res) => {
  try {
    const { name, price, description, category, stock, imageURL, toppings } = req.body;

    const menuItem = new MenuItem({
      name,
      price,
      description,
      category,
      stock,
      imageURL,
      toppings,
    });

    const savedMenuItem = await menuItem.save();
    res.status(201).json({ success: true, data: savedMenuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create menu item', error: error.message });
  }
};


// Get all menu items
export const getMenuItems = async (req, res) => {
  try {
    // Fetch all menu items
    const menuItems = await MenuItem.find().populate('toppings');

    // Fetch active promotions
    const currentDate = new Date();
    const activePromotions = await Promotion.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    }).populate('applicableItems');

    // Adjust prices for items in promotions
    const updatedMenuItems = menuItems.map((item) => {
      const promotion = activePromotions.find((promo) =>
        promo.applicableItems.some((applicableItem) => applicableItem._id.toString() === item._id.toString())
      );

      if (promotion) {
        const discount = (item.price * promotion.discountPercentage) / 100;
        return {
          ...item.toObject(),
          originalPrice: item.price,
          discountedPrice: parseFloat((item.price - discount).toFixed(2)),
          promotion: promotion.title,
        };
      }

      return { ...item.toObject(), discountedPrice: item.price };
    });

    res.status(200).json({ success: true, data: updatedMenuItems });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch menu items', error: error.message });
  }
};

// Get a single menu item by ID
export const getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('toppings');
    if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found' });

    // Fetch active promotions
    const currentDate = new Date();
    const activePromotions = await Promotion.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    }).populate('applicableItems');

    // Check if the item is part of a promotion
    const promotion = activePromotions.find((promo) =>
      promo.applicableItems.some((applicableItem) => applicableItem._id.toString() === menuItem._id.toString())
    );

    const response = {
      ...menuItem.toObject(),
      discountedPrice: menuItem.price,
    };

    if (promotion) {
      const discount = (menuItem.price * promotion.discountPercentage) / 100;
      response.originalPrice = menuItem.price;
      response.discountedPrice = parseFloat((menuItem.price - discount).toFixed(2));
      response.promotion = promotion.title;
    }

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch menu item', error: error.message });
  }
};


// Update a menu item
export const updateMenuItem = async (req, res) => {
  try {
    const { name, price, description, category, stock, imageURL, toppings } = req.body;

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, price, description, category, stock, imageURL, toppings },
      { new: true }
    );

    if (!updatedMenuItem) return res.status(404).json({ success: false, message: 'Menu item not found' });

    res.status(200).json({ success: true, data: updatedMenuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update menu item', error: error.message });
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


// Create a new topping
export const createTopping = async (req, res) => {
  try {
    const { name, price } = req.body;

    const topping = new Topping({
      name,
      price,
    });

    const savedTopping = await topping.save();
    res.status(201).json({ success: true, data: savedTopping });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create topping', error: error.message });
  }
};

// Get all toppings
export const getToppings = async (req, res) => {
  try {
    const toppings = await Topping.find();
    res.status(200).json({ success: true, data: toppings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch toppings', error: error.message });
  }
};

// Get a single topping by ID
export const getToppingById = async (req, res) => {
  try {
    const topping = await Topping.findById(req.params.id);
    if (!topping) return res.status(404).json({ success: false, message: 'Topping not found' });

    res.status(200).json({ success: true, data: topping });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch topping', error: error.message });
  }
};

// Update a topping
export const updateTopping = async (req, res) => {
  try {
    const { name, price } = req.body;

    const updatedTopping = await Topping.findByIdAndUpdate(
      req.params.id,
      { name, price },
      { new: true }
    );

    if (!updatedTopping) return res.status(404).json({ success: false, message: 'Topping not found' });

    res.status(200).json({ success: true, data: updatedTopping });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update topping', error: error.message });
  }
};

// Delete a topping
export const deleteTopping = async (req, res) => {
  try {
    const deletedTopping = await Topping.findByIdAndDelete(req.params.id);
    if (!deletedTopping) return res.status(404).json({ success: false, message: 'Topping not found' });

    res.status(200).json({ success: true, message: 'Topping deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete topping', error: error.message });
  }
};




// Create a new add-on
export const createAddOn = async (req, res) => {
  try {
    const { menuItemId, name, type, options } = req.body;

    // Periksa apakah menu item ada
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    // Buat add-on baru
    const addOn = new AddOn({
      name,
      type,
      options,
    });

    // Simpan add-on ke database
    const savedAddOn = await addOn.save();

    // Tambahkan add-on ke menu item (jika ada relasi seperti `menuItem.addOns`)
    if (!menuItem.addOns) menuItem.addOns = [];
    menuItem.addOns.push(savedAddOn._id);
    await menuItem.save();

    res.status(201).json({ success: true, data: savedAddOn });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create add-on', error: error.message });
  }
};

// Get a single addon by ID
export const getAddOnById = async (req, res) => {
  try {
    const addOn = await AddOn.findById(req.params.id);
    if (!addOn) {
      return res.status(404).json({ success: false, message: 'Addon not found' });
    }
    res.status(200).json({ success: true, data: addOn });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch addon', error: error.message });
  }
};

// Get all addons
export const getAllAddOns = async (req, res) => {
  try {
    const addOns = await AddOn.find();
    res.status(200).json({ success: true, data: addOns });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch addons', error: error.message });
  }
};


// Update an addon
export const updateAddOn = async (req, res) => {
  try {
    const { name, type, options } = req.body;
    const updatedAddOn = await AddOn.findByIdAndUpdate(
      req.params.id,
      { name, type, options },
      { new: true } // This option returns the updated document
    );
    
    if (!updatedAddOn) {
      return res.status(404).json({ success: false, message: 'Addon not found' });
    }

    res.status(200).json({ success: true, data: updatedAddOn });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update addon', error: error.message });
  }
};

// Delete an addon
export const deleteAddOn = async (req, res) => {
  try {
    const deletedAddOn = await AddOn.findByIdAndDelete(req.params.id);
    if (!deletedAddOn) {
      return res.status(404).json({ success: false, message: 'Addon not found' });
    }
    
    res.status(200).json({ success: true, message: 'Addon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete addon', error: error.message });
  }
};




