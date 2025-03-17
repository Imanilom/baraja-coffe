import { MenuItem } from '../models/MenuItem.model.js';
import Topping from '../models/Topping.model.js';
import Promotion from '../models/promotion.model.js';
import { RawMaterial } from '../models/RawMaterial.model.js';

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

export const getSimpleMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find().select('name price category imageURL rawMaterials');

    // Cek stok bahan baku untuk setiap menu
    const updatedMenuItems = await Promise.all(menuItems.map(async (menu) => {
      let isAvailable = true;

      for (const item of menu.rawMaterials) {
        const material = await RawMaterial.find().find({ _id: item.materialId });
        if (!material || material.quantity < item.quantityRequired) {
          isAvailable = false;
          break;
        }
      }

      return {
        id: menu._id,
        name: menu.name,
        price: menu.price,
        category: menu.category,
        imageURL: menu.imageURL,
        isAvailable
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
    const menuItems = await MenuItem.find()
      .populate([
        {
          path: 'toppings'
        },
        {
          path: 'rawMaterials.materialId'
        },
        {
          path: 'availableAt'
        }
      ]);

    const currentDate = new Date();
    const activePromotions = await Promotion.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).populate('applicableItems');

    const updatedMenuItems = menuItems.map((item) => {
      const promotion = activePromotions.find((promo) =>
        promo.applicableItems.some(applicableItem =>
          applicableItem._id.toString() === item._id.toString()
        )
      );

      if (promotion) {
        const discount = (item.price * promotion.discountPercentage) / 100;
        return {
          ...item.toObject(),
          discount: promotion.discountPercentage,
          discountedPrice: parseFloat((item.price - discount).toFixed(2)),
          promotionTitle: promotion.title
        };
      }

      return item.toObject();
    });

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



// Get all toppings
export const getToppings = async (req, res) => {
  try {
    const toppings = await Topping.find();
    res.status(200).json({ success: true, data: toppings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch toppings', error: error.message });
  }
};

// Create a new topping
export const createTopping = async (req, res) => {
  try {
    const { name, category, price, rawMaterials } = req.body;

    // Validate rawMaterials
    if (rawMaterials && !Array.isArray(rawMaterials)) {
      return res.status(400).json({
        success: false,
        message: 'Raw materials must be an array of objects with material ID and quantity.',
      });
    }

    if (rawMaterials) {
      // Validate each raw material
      for (let i = 0; i < rawMaterials.length; i++) {
        const { materialId, quantityRequired } = rawMaterials[i];

        // Check existence of required fields
        if (!materialId || quantityRequired === undefined) {
          return res.status(400).json({
            success: false,
            message: `Raw material at index ${i} is missing 'materialId' or 'quantityRequired'.`,
          });
        }

        // Validate quantity type and value
        const quantity = Number(quantityRequired);
        if (isNaN(quantity)) {
          return res.status(400).json({
            success: false,
            message: `Quantity must be a number for raw material at index ${i}.`,
          });
        }

        if (quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: `Quantity must be greater than 0 for raw material at index ${i}.`,
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
      category, 
      price,
      rawMaterials: rawMaterials.map(rm => ({
        materialId: rm.materialId,
        quantityRequired: Number(rm.quantityRequired)
      })) || [],
    });

    const savedTopping = await topping.save();
    res.status(201).json({ success: true, data: savedTopping });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create topping', error: error.message });
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
    const { name,category, price, rawMaterials } = req.body;

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
        category, 
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
