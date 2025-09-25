import { MenuItem } from '../models/MenuItem.model.js';
import Category from '../models/Category.model.js';
import { Outlet } from '../models/Outlet.model.js';
import mongoose from 'mongoose';
import { MenuRating } from '../models/MenuRating.model.js';
import IORedis from 'ioredis';

// Create a new menu item
export const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      mainCat,
      category,
      subCategory,
      toppings,
      addons,
      availableAt,
      workstation
    } = req.body;

    const imageURL = req.file
      ? `http://localhost:3000/images/${req.file.filename}`
      : req.body.imageURL || null;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, category, and imageURL are required fields.',
      });
    }

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
    let topping = req.body.toppings;
    if (typeof topping === "string") {
      try {
        topping = JSON.parse(topping);
      } catch (e) {
        return res.status(400).json({ success: false, message: "Toppings JSON is invalid." });
      }
    }

    if (topping && !Array.isArray(topping)) {
      return res.status(400).json({ success: false, message: "Toppings must be an array." });
    }

    // Validate addons
    let addon = req.body.addons;
    if (typeof addon === "string") {
      try {
        addon = JSON.parse(addon);
      } catch (e) {
        return res.status(400).json({ success: false, message: "Toppings JSON is invalid." });
      }
    }
    if (addon && !Array.isArray(addon)) {
      return res.status(400).json({ success: false, message: 'Addons must be an array.' });
    }

    // Validate outlets
    let availableA = req.body.availableAt;

    if (typeof availableA === "string") {
      try {
        availableA = JSON.parse(availableA); // now it's an array of IDs
      } catch (err) {
        return res.status(400).json({ message: "Invalid JSON for availableAt" });
      }
    }

    // if (availableAt && Array.isArray(availableAt)) {
    //   const outletsExist = await Outlet.find({ _id: { $in: availableAt } });
    //   if (outletsExist.length !== availableAt.length) {
    //     return res.status(400).json({ success: false, message: 'Some outlet IDs are invalid.' });
    //   }
    // }

    const menuItem = new MenuItem({
      name,
      price,
      description: description || '',
      mainCategory: mainCat,
      category,
      subCategory,
      imageURL,
      toppings: topping || [],
      addons: addon || [],
      availableAt: availableA || [],
      workstation: workstation || 'bar',
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

// GET /api/menu?limit=10&offset=0
// export const getMenuItems = async (req, res) => {
//   try {
//     // const { limit = 10, offset = 0 } = req.query;

//     // // Validasi input
//     // const parsedLimit = parseInt(limit);
//     // const parsedOffset = parseInt(offset);

//     // if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: 'Limit and offset must be valid numbers.'
//     //   });
//     // }

//     // Ambil semua menu items dengan pagination
//     const menuItems = await MenuItem.find()
//       .populate([
//         { path: 'toppings' },
//         { path: 'availableAt' },
//         {
//           path: 'addons',
//           populate: { path: 'options' }
//         },
//         {
//           path: 'category',
//           select: 'name'
//         },
//         {
//           path: 'subCategory',
//           select: 'name'
//         }
//       ])
//       // .skip(parsedOffset)
//       // .limit(parsedLimit)
//       // ururt berdasarkan nama
//       .sort({ name: 1 });

//     // Hitung total dokumen untuk metadata
//     const totalItems = await MenuItem.countDocuments();

//     // Ambil semua rating untuk menghitung rata-rata
//     const ratings = await MenuRating.find({ isActive: true });

//     const ratingMap = {};
//     ratings.forEach(rating => {
//       const menuId = rating.menuItemId.toString();
//       if (!ratingMap[menuId]) ratingMap[menuId] = [];
//       ratingMap[menuId].push(rating.rating);
//     });

//     const formattedMenuItems = menuItems.map(item => {
//       const itemId = item._id.toString();
//       const itemRatings = ratingMap[itemId] || [];

//       const averageRating = itemRatings.length > 0
//         ? Math.round((itemRatings.reduce((sum, r) => sum + r, 0) / itemRatings.length) * 10) / 10
//         : null;

//       const reviewCount = itemRatings.length;

//       return {
//         id: item._id,
//         name: item.name,
//         mainCategory: item.mainCategory,
//         category: item.category ? { id: item.category._id, name: item.category.name } : null,
//         subCategory: item.subCategory ? { id: item.subCategory._id, name: item.subCategory.name } : null,
//         imageUrl: item.imageURL,
//         originalPrice: item.price,
//         discountedPrice: item.discountedPrice || item.price,
//         description: item.description,
//         discountPercentage: item.discount ? `${item.discount}%` : null,
//         averageRating,
//         reviewCount,
//         toppings: item.toppings.map(topping => ({
//           id: topping._id,
//           name: topping.name,
//           price: topping.price
//         })),
//         addons: item.addons.map(addon => ({
//           id: addon._id,
//           name: addon.name,
//           options: addon.options.map(opt => ({
//             id: opt._id,
//             label: opt.label,
//             price: opt.price,
//             isDefault: opt.isDefault
//           }))
//         })),
//         availableAt: item.availableAt,
//         workstation: item.workstation,
//         isActive: item.isActive
//       };
//     });

//     // Metadata pagination
//     // const meta = {
//     //   totalItems,
//     //   itemCount: formattedMenuItems.length,
//     //   itemsPerPage: parsedLimit,
//     //   totalPages: Math.ceil(totalItems / parsedLimit),
//     //   currentPage: Math.floor(parsedOffset / parsedLimit) + 1
//     // };

//     res.status(200).json({
//       success: true,
//       data: formattedMenuItems,
//       // meta
//     });

//   } catch (error) {
//     console.error('Error fetching menu items:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch menu items.',
//       error: error.message
//     });
//   }
// };

const redis = new IORedis({
  host: "127.0.0.1",
  port: 6379,
});

export const getMenuItems = async (req, res) => {
  const cacheKey = "menu_items_full";

  try {
    // cek cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (cacheErr) {
      console.warn("⚠️ Redis read error, lanjut DB:", cacheErr.message);
    }

    // Ambil semua menu items
    const menuItems = await MenuItem.find()
      .populate([
        { path: "toppings" },
        { path: "availableAt" },
        {
          path: "addons",
          populate: { path: "options" },
        },
        {
          path: "category",
          select: "name",
        },
        {
          path: "subCategory",
          select: "name",
        },
      ])
      .sort({ name: 1 });

    // Hitung total dokumen untuk metadata (optional)
    const totalItems = await MenuItem.countDocuments();

    // Ambil semua rating aktif
    const ratings = await MenuRating.find({ isActive: true });

    const ratingMap = {};
    ratings.forEach((rating) => {
      const menuId = rating.menuItemId.toString();
      if (!ratingMap[menuId]) ratingMap[menuId] = [];
      ratingMap[menuId].push(rating.rating);
    });

    const formattedMenuItems = menuItems.map((item) => {
      const itemId = item._id.toString();
      const itemRatings = ratingMap[itemId] || [];

      const averageRating =
        itemRatings.length > 0
          ? Math.round(
            (itemRatings.reduce((sum, r) => sum + r, 0) / itemRatings.length) *
            10
          ) / 10
          : null;

      const reviewCount = itemRatings.length;

      return {
        id: item._id,
        name: item.name,
        mainCategory: item.mainCategory,
        category: item.category
          ? { id: item.category._id, name: item.category.name }
          : null,
        subCategory: item.subCategory
          ? { id: item.subCategory._id, name: item.subCategory.name }
          : null,
        imageUrl: item.imageURL,
        originalPrice: item.price,
        discountedPrice: item.discountedPrice || item.price,
        description: item.description,
        discountPercentage: item.discount ? `${item.discount}%` : null,
        averageRating,
        reviewCount,
        toppings: item.toppings.map((topping) => ({
          id: topping._id,
          name: topping.name,
          price: topping.price,
        })),
        addons: item.addons.map((addon) => ({
          id: addon._id,
          name: addon.name,
          options: addon.options.map((opt) => ({
            id: opt._id,
            label: opt.label,
            price: opt.price,
            isDefault: opt.isDefault,
          })),
        })),
        availableAt: item.availableAt,
        workstation: item.workstation,
        isActive: item.isActive,
      };
    });

    const responsePayload = {
      success: true,
      data: formattedMenuItems,
      // meta bisa ditambahkan kalau perlu
    };

    // Simpan hasil ke Redis dengan TTL (5 menit = 300 detik)
    try {
      await redis.set(cacheKey, JSON.stringify(responsePayload), "EX", 300);
    } catch (cacheErr) {
      console.warn("⚠️ Redis write error:", cacheErr.message);
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("❌ Error fetching menu items:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu items.",
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
      mainCategory: menuItem.mainCategory,
      category: menuItem.category ? { id: menuItem.category._id, name: menuItem.category.name } : null,
      subCategory: menuItem.subCategory ? { id: menuItem.subCategory._id, name: menuItem.subCategory.name } : null,
      imageURL: menuItem.imageURL,
      averageRating,
      reviewCount,
      toppings: menuItem.toppings,
      addons: menuItem.addons,
      availableAt: menuItem.availableAt.map(outlet => outlet.toObject()),
      workstation: menuItem.workstation
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
      availableAt,
      workstation
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
        availableAt,
        workstation: workstation || 'bar' // Default to 'kitchen' if not provided
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

//Update menu active
export const updateMenuActivated = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      isActive
    } = req.body;

    const updatedItem = await MenuItem.findByIdAndUpdate(
      id,
      {
        isActive
      },
      { new: true }
    )

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

// 🔹 GET /menu/by-outlet/:outletId
// Menampilkan menu yang tersedia di outlet tertentu
export const getMenuByOutlet = async (req, res) => {
  try {
    const { outletId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      return res.status(400).json({ success: false, message: 'Invalid outlet ID' });
    }

    const menuItems = await MenuItem.find({
      availableAt: outletId
    })
      .populate([
        { path: 'toppings' },
        { path: 'availableAt' },
        { path: 'addons', populate: { path: 'options' } }
      ]);

    // Ambil semua rating untuk menghitung rata-rata
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
        category: item.category,
        subCategory: item.subCategory,
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

    res.status(200).json({ success: true, data: formattedMenuItems });
  } catch (error) {
    console.error('Error fetching menu by outlet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu by outlet',
      error: error.message,
    });
  }
};

// 🔹 GET /menu/by-rating?minRating=4
// Menampilkan menu dengan rata-rata rating ≥ minRating
export const getMenuByRating = async (req, res) => {
  try {
    const { minRating } = req.query;
    const minimumRating = parseFloat(minRating);

    if (isNaN(minimumRating) || minimumRating < 0 || minimumRating > 5) {
      return res.status(400).json({ success: false, message: 'Invalid minRating value.' });
    }

    const menuItems = await MenuItem.find()
      .populate([
        { path: 'toppings' },
        { path: 'availableAt' },
        { path: 'addons', populate: { path: 'options' } }
      ]);

    const ratings = await MenuRating.find({ isActive: true });

    const ratingMap = {};
    ratings.forEach(rating => {
      const menuId = rating.menuItemId.toString();
      if (!ratingMap[menuId]) ratingMap[menuId] = [];
      ratingMap[menuId].push(rating.rating);
    });

    const filteredMenuItems = menuItems.filter(item => {
      const itemId = item._id.toString();
      const itemRatings = ratingMap[itemId] || [];
      const avgRating = itemRatings.length > 0
        ? itemRatings.reduce((sum, r) => sum + r, 0) / itemRatings.length
        : 0;

      return avgRating >= minimumRating;
    });

    res.status(200).json({ success: true, data: filteredMenuItems });
  } catch (error) {
    console.error('Error fetching menu by rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu by rating',
      error: error.message,
    });
  }
};

// 🔹 GET /menu/available
// Menampilkan hanya menu yang tersedia (berdasarkan stok raw materials)
export const getAvailableMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find()
      .populate([
        { path: 'toppings' },
        { path: 'availableAt' },
        { path: 'addons', populate: { path: 'options' } }
      ]);

    const availableMenus = [];

    for (const item of menuItems) {
      let isAvailable = true;

      if (isAvailable) {
        availableMenus.push(item);
      }
    }

    res.status(200).json({ success: true, data: availableMenus });
  } catch (error) {
    console.error('Error fetching available menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available menu items',
      error: error.message,
    });
  }
};

// 🔹 GET /menu/filter?category=686498b65eb0a4b4b90e6a8e&minRating=4&available=true
// Filter kombinasi: kategori, rating minimum, dan ketersediaan
export const filterMenuItems = async (req, res) => {
  try {
    const { category, minRating, available } = req.query;

    let query = {};

    // Filter berdasarkan kategori utama atau sub-kategori
    if (category) {
      query.$or = [
        { category },
        { subCategory: category }
      ];
    }

    const menuItems = await MenuItem.find(query)
      .populate([
        { path: 'toppings' },
        { path: 'availableAt' },
        { path: 'addons', populate: { path: 'options' } }
      ]);

    const ratings = await MenuRating.find({ isActive: true });

    const ratingMap = {};
    ratings.forEach(rating => {
      const menuId = rating.menuItemId.toString();
      if (!ratingMap[menuId]) ratingMap[menuId] = [];
      ratingMap[menuId].push(rating.rating);
    });

    let filtered = menuItems;

    // Filter berdasarkan rating
    if (minRating) {
      const minRate = parseFloat(minRating);
      filtered = filtered.filter(item => {
        const avgRating = ratingMap[item._id.toString()]?.reduce((a, b) => a + b, 0) /
          (ratingMap[item._id.toString()]?.length || 1);
        return avgRating >= minRate;
      });
    }



    res.status(200).json({ success: true, data: filtered });
  } catch (error) {
    console.error('Error filtering menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter menu items',
      error: error.message,
    });
  }
};
