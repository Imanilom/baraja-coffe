import { MenuItem } from '../models/MenuItem.model.js';
import { Topping } from '../models/Topping.model.js';
import Promotion from '../models/promotion.model.js';
import { RawMaterial } from '../models/RawMaterial.model.js';
import AddOn from '../models/Addons.model.js';

// Create a new menu item
export const createMenuItem = async (req, res) => {
  try {
    const { name, price, description, category, stock, imageURL, toppings, addons, rawMaterials } = req.body;

    if (!name || !price || !category || !imageURL) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, category, and imageURL are required fields.',
      });
    }

    // Validate rawMaterials
    if (rawMaterials && !Array.isArray(rawMaterials)) {
      return res.status(400).json({
        success: false,
        message: 'Raw materials must be an array of objects with material ID and quantity.',
      });
    }

    if (rawMaterials) {
      // Ensure each raw material has `quantityRequired`
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


// Get all menu items
export const getMenuItems = async (req, res) => {
  try {
    // Fetch all menu items
    const menuItems = await MenuItem.find().populate('toppings').populate('addOns');

    console.log('menuItems:', menuItems);
    // Fetch active promotions
    const currentDate = new Date();
    const activePromotions = await Promotion.find().populate('applicableItems');

    // Adjust prices for items based on promotions
    const updatedMenuItems = menuItems.map((item) => {
      const promotion = activePromotions.find((promo) =>
        promo.applicableItems.some((applicableItem) => applicableItem._id.toString() === item._id.toString())
      );

      if (promotion) {
        const discount = (item.price * promotion.discountPercentage) / 100;
        return {
          ...item.toObject(),
          discount: promotion.discountPercentage,
          discountedPrice: parseFloat((item.price - discount).toFixed(2)),
          promotionTitle: promotion.title, // Ensure the title is passed

        };
      }

      // If no promotion, remove discountedPrice
      const { discountedPrice, promotionTitle, ...itemWithoutDiscountedPrice } = item.toObject();
      return itemWithoutDiscountedPrice;
    });

    res.status(200).json({ success: true, data: updatedMenuItems });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items',
      error: error.message,
    });
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


// Create a new topping
export const createTopping = async (req, res) => {
  try {
    const { name, price, rawMaterials } = req.body;

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

    // Create the topping
    const topping = new Topping({
      name,
      price,
      rawMaterials: rawMaterials || [], // Save raw materials associated with the topping
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
    const { name, price, rawMaterials } = req.body;

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


    const updatedTopping = await Topping.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price,
        rawMaterials: rawMaterials || [],
      },
      { new: true }
    );

    if (!updatedTopping) {
      return res.status(404).json({ success: false, message: 'Topping not found' });
    }

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




export const createAddOn = async (req, res) => {
  try {
    const { name, type, options, rawMaterials } = req.body;

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

    // Create the add-on
    const addOn = new AddOn({
      name,
      type,
      options: options || [],
      rawMaterials: rawMaterials || [], // Save raw materials associated with the add-on
    });

    const savedAddOn = await addOn.save();
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
    const { name, type, options, rawMaterials } = req.body;

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


    const updatedAddOn = await AddOn.findByIdAndUpdate(
      req.params.id,
      {
        name,
        type,
        options,
        rawMaterials: rawMaterials || [],
      },
      { new: true }
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




