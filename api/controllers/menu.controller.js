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
    // Fetch all menu items dengan populate yang benar
    const menuItems = await MenuItem.find()
      .populate([
        {
          path: 'addOns',
          populate: {
            path: 'rawMaterials.materialId',
            model: 'RawMaterial'
          }
        },
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

    // Filter promosi aktif berdasarkan tanggal
    const currentDate = new Date();
    const activePromotions = await Promotion.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).populate('applicableItems');

    // Adjust prices for items based on active promotions
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


// // Get a single menu item by ID
// export const getMenuItemById = async (req, res) => {
//   try {
//     // Fetch the menu item and populate related fields
//     const menuItem = await MenuItem.findById(req.params.id)
//       .populate('toppings')
//       .populate('addOns')
//       .populate('rawMaterials.materialId')
//       .populate('availableAt');

//     if (!menuItem) {
//       return res.status(404).json({ success: false, message: 'Menu item not found' });
//     }

//     // Fetch active promotions
//     const currentDate = new Date();
//     const activePromotions = await Promotion.find({
//       startDate: { $lte: currentDate },
//       endDate: { $gte: currentDate },
//     }).populate('applicableItems');

//     // Check if the item is part of a promotion
//     const promotion = activePromotions.find((promo) =>
//       promo.applicableItems.some((applicableItem) => applicableItem._id.toString() === menuItem._id.toString())
//     );

//     const response = {
//       ...menuItem.toObject(),
//       discountedPrice: menuItem.price,
//     };

//     if (promotion) {
//       const discount = (menuItem.price * promotion.discountPercentage) / 100;
//       response.originalPrice = menuItem.price;
//       response.discountedPrice = parseFloat((menuItem.price - discount).toFixed(2));
//       response.promotion = promotion.title;
//     }

//     res.status(200).json({ success: true, data: response });
//   } catch (error) {
//     console.error('Error fetching menu item:', error); // Log the error for debugging
//     res.status(500).json({ success: false, message: 'Failed to fetch menu item', error: error.message });
//   }
// };


export const getMenuItemById = async (req, res) => {
  try {
    // Fetch the menu item and populate related fields
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('toppings')
      .populate('addOns')
      .populate('rawMaterials.materialId')
      .populate('availableAt');

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    // Function to check stock availability
    const checkStockAvailability = async (rawMaterials) => {
      for (const item of rawMaterials) {
        const material = await RawMaterial.findById(item.materialId);
        if (!material || material.quantity < item.quantityRequired) {
          return false; // Stock tidak mencukupi
        }
      }
      return true; // Stock mencukupi
    };

    // Cek ketersediaan bahan baku utama
    const isMainAvailable = await checkStockAvailability(menuItem.rawMaterials);

    // Cek ketersediaan bahan baku dalam toppings
    const toppingsWithAvailability = await Promise.all(menuItem.toppings.map(async (topping) => ({
      ...topping.toObject(),
      isAvailable: await checkStockAvailability(topping.rawMaterials || [])
    })));

    // Cek ketersediaan bahan baku dalam addOns
    const addOnsWithAvailability = await Promise.all(menuItem.addOns.map(async (addOn) => ({
      ...addOn.toObject(),
      isAvailable: await checkStockAvailability(addOn.rawMaterials || [])
    })));

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

    // Struktur data response dengan isAvailable
    const response = {
      id: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      category: menuItem.category,
      imageURL: menuItem.imageURL,
      isAvailable: isMainAvailable, // Menentukan apakah menu utama tersedia
      toppings: toppingsWithAvailability,
      addOns: addOnsWithAvailability,
      discountedPrice: menuItem.price,
      availableAt: menuItem.availableAt,
    };

    if (promotion) {
      const discount = (menuItem.price * promotion.discountPercentage) / 100;
      response.originalPrice = menuItem.price;
      response.discountedPrice = parseFloat((menuItem.price - discount).toFixed(2));
      response.promotion = promotion.title;
    }

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching menu item:', error);
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

    const validTypes = ['size', 'temperature', 'spiciness', 'custom'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type value' });
    }

    if (rawMaterials && !Array.isArray(rawMaterials)) {
      return res.status(400).json({
        success: false,
        message: 'Raw materials must be an array of objects with materialId and quantityRequired.',
      });
    }

    if (rawMaterials && rawMaterials.length > 0) {
      for (let i = 0; i < rawMaterials.length; i++) {
        const { materialId, quantityRequired } = rawMaterials[i];
        if (!materialId || quantityRequired === undefined) {
          return res.status(400).json({
            success: false,
            message: `Raw material at index ${i} is missing 'materialId' or 'quantityRequired'.`,
          });
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
    }

    const addOn = new AddOn({
      name,
      type,
      options: options || [],
      rawMaterials: rawMaterials || [],
    });

    const savedAddOn = await addOn.save();
    await savedAddOn.populate('rawMaterials.materialId');

    res.status(201).json({ success: true, data: savedAddOn });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create add-on', error: error.message });
  }
};



// export const createAddOn = async (req, res) => {
//   try {
//     const { name, type, options, rawMaterials } = req.body;

//     // Validate rawMaterials
//     if (rawMaterials && !Array.isArray(rawMaterials)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Raw materials must be an array of objects with material ID and quantity.',
//       });
//     }

//     if (rawMaterials) {
//       // Ensure each raw material has `materialId` and `quantityRequired`
//       for (let i = 0; i < rawMaterials.length; i++) {
//         const { materialId, quantityRequired } = rawMaterials[i];
//         if (!materialId || quantityRequired === undefined) {
//           return res.status(400).json({
//             success: false,
//             message: `Raw material at index ${i} is missing 'materialId' or 'quantityRequired'.`,
//           });
//         }
//       }
//     }

//     // Check raw material stock availability
//     const rawMaterialPromises = rawMaterials.map(async ({ materialId, quantityRequired }) => {
//       const rawMaterial = await RawMaterial.findById(materialId);
//       if (!rawMaterial) {
//         throw new Error(`Raw material with ID ${materialId} not found.`);
//       }
//       if (rawMaterial.stock < quantityRequired) {
//         throw new Error(`Insufficient stock for raw material: ${rawMaterial.name}`);
//       }
//       return rawMaterial;
//     });

//     try {
//       await Promise.all(rawMaterialPromises);
//     } catch (error) {
//       return res.status(404).json({ success: false, message: error.message });
//     }

//     // Create the add-on
//     const addOn = new AddOn({
//       name,
//       type,
//       options: options || [],
//       rawMaterials: rawMaterials || [], // Save raw materials associated with the add-on
//     });

//     const savedAddOn = await addOn.save();
//     res.status(201).json({ success: true, data: savedAddOn });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Failed to create add-on', error: error.message });
//   }
// };




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




