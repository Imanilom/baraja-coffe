import { MenuItem } from '../models/MenuItem.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import Category from '../models/Category.model.js';
import { Outlet } from '../models/Outlet.model.js';
import mongoose from 'mongoose';
import { MenuRating } from '../models/MenuRating.model.js';
import IORedis from "ioredis";
import Recipe from '../models/modul_menu/Recipe.model.js';


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

export const getMenuItemsBackOffice = async (req, res) => {
  try {
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
    };

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

    // Gunakan aggregation untuk join dengan MenuStock
    const menuItems = await MenuItem.aggregate([
      {
        $lookup: {
          from: "menustocks",
          localField: "_id",
          foreignField: "menuItemId",
          as: "stockInfo"
        }
      },
      {
        $lookup: {
          from: "menuratings",
          let: { menuItemId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$menuItemId", "$$menuItemId"] },
                isActive: true
              }
            }
          ],
          as: "ratings"
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "subCategory",
          foreignField: "_id",
          as: "subCategoryInfo"
        }
      },
      {
        $lookup: {
          from: "toppings",
          localField: "toppings",
          foreignField: "_id",
          as: "toppingsInfo"
        }
      },
      {
        $lookup: {
          from: "addons",
          localField: "addons",
          foreignField: "_id",
          as: "addonsInfo"
        }
      },
      {
        $lookup: {
          from: "outlets",
          localField: "availableAt",
          foreignField: "_id",
          as: "availableAt"
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    const formattedMenuItems = menuItems.map((item) => {
      const stockInfo = item.stockInfo && item.stockInfo[0] ? item.stockInfo[0] : {};
      const effectiveStock = stockInfo.manualStock !== null && stockInfo.manualStock !== undefined
        ? stockInfo.manualStock
        : (stockInfo.calculatedStock || 0);

      // Hitung average rating
      const ratings = item.ratings || [];
      const averageRating = ratings.length > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10
        : null;

      return {
        id: item._id,
        name: item.name.toString(),
        mainCategory: item.mainCategory,
        category: item.categoryInfo && item.categoryInfo[0]
          ? { id: item.categoryInfo[0]._id, name: item.categoryInfo[0].name }
          : null,
        subCategory: item.subCategoryInfo && item.subCategoryInfo[0]
          ? { id: item.subCategoryInfo[0]._id, name: item.subCategoryInfo[0].name }
          : null,
        imageUrl: item.imageURL,
        originalPrice: item.price,
        discountedPrice: item.discountedPrice || item.price,
        description: item.description,
        discountPercentage: item.discount ? `${item.discount}%` : null,
        averageRating,
        reviewCount: ratings.length,
        stock: {
          calculatedStock: stockInfo.calculatedStock || 0,
          manualStock: stockInfo.manualStock,
          effectiveStock,
          currentStock: stockInfo.currentStock || 0,
          isAvailable: effectiveStock > 0
        },
        toppings: (item.toppingsInfo || []).map((topping) => ({
          id: topping._id,
          name: topping.name,
          price: topping.price,
        })),
        addons: (item.addonsInfo || []).map((addon) => ({
          id: addon._id,
          name: addon.name,
          // Anda mungkin perlu populate options untuk addons di sini
          options: addon.options || [],
        })),
        availableAt: item.availableAt,
        workstation: item.workstation,
        isActive: item.isActive,
      };
    });

    const responsePayload = {
      success: true,
      data: formattedMenuItems,
    };

    // Simpan ke cache
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

export const getMenuItemsWithRecipes = async (req, res) => {
  const cacheKey = "menu_items_with_recipes_and_manual_stock";

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

    // Gunakan aggregation pipeline untuk efisiensi
    const menuItems = await MenuItem.aggregate([
      {
        $match: {
          isActive: true
        }
      },
      {
        $lookup: {
          from: "recipes",
          localField: "_id",
          foreignField: "menuItemId",
          as: "recipe"
        }
      },
      {
        $match: {
          "recipe.0": { $exists: true } // Hanya yang memiliki resep
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "subCategory",
          foreignField: "_id",
          as: "subCategory"
        }
      },
      {
        $lookup: {
          from: "outlets",
          localField: "availableAt",
          foreignField: "_id",
          as: "availableAt"
        }
      },
      {
        $lookup: {
          from: "menustocks",
          localField: "_id",
          foreignField: "menuItemId",
          as: "stockInfo"
        }
      },
      {
        // FILTER BARU: Hanya yang memiliki manual stock
        $match: {
          "stockInfo.0": { $exists: true }, // Pastikan ada stockInfo
          $or: [
            { "stockInfo.manualStock": { $gt: 0 } }, // Manual stock lebih dari 0
            { "stockInfo.manualStock": { $ne: null } } // Atau manual stock tidak null
          ]
        }
      },
      {
        $lookup: {
          from: "menuratings",
          let: { menuItemId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$menuItemId", "$$menuItemId"] },
                isActive: true
              }
            }
          ],
          as: "ratings"
        }
      },
      {
        $project: {
          name: 1,
          mainCategory: 1,
          imageURL: 1,
          price: 1,
          discountedPrice: 1,
          description: 1,
          discount: 1,
          toppings: 1,
          addons: 1,
          availableAt: 1,
          workstation: 1,
          isActive: 1,
          category: { $arrayElemAt: ["$category", 0] },
          subCategory: { $arrayElemAt: ["$subCategory", 0] },
          recipe: 1,
          stockData: {
            $cond: {
              if: { $gt: [{ $size: "$stockInfo" }, 0] },
              then: { $arrayElemAt: ["$stockInfo", 0] },
              else: {
                calculatedStock: 0,
                manualStock: 0,
                currentStock: 0,
                effectiveStock: 0
              }
            }
          },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$ratings" }, 0] },
              then: {
                $round: [
                  { $divide: [{ $sum: "$ratings.rating" }, { $size: "$ratings" }] },
                  1
                ]
              },
              else: null
            }
          },
          reviewCount: { $size: "$ratings" }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // Populate addons options jika diperlukan
    const populatedMenuItems = await MenuItem.populate(menuItems, [
      {
        path: "addons",
        populate: { path: "options" }
      },
      {
        path: "toppings"
      }
    ]);

    const formattedMenuItems = populatedMenuItems.map((item) => {
      // ✅ HANDLE NULL/UNDEFINED STOCK - SEMUA JADI 0
      const safeCalculatedStock = item.stockData?.calculatedStock ?? 0;
      const safeManualStock = item.stockData?.manualStock ?? 0;

      // ✅ LOGIC PRIORITAS: manualStock dulu, baru calculatedStock
      const effectiveStock = (safeManualStock !== null && safeManualStock !== undefined && safeManualStock !== 0)
        ? safeManualStock
        : safeCalculatedStock;

      // ✅ CurrentStock harus sama dengan effectiveStock (sesuai prioritas)
      const safeCurrentStock = effectiveStock;

      // ✅ Handle null untuk dates
      const lastCalculatedAt = item.stockData?.lastCalculatedAt || null;
      const lastAdjustedAt = item.stockData?.lastAdjustedAt || null;

      // ✅ Tentukan stock source untuk informasi
      const stockSource = (safeManualStock !== null && safeManualStock !== undefined && safeManualStock !== 0)
        ? 'manual'
        : 'calculated';

      return {
        id: item._id,
        name: item.name,
        mainCategory: item.mainCategory,
        category: item.category ? { id: item.category._id, name: item.category.name } : null,
        subCategory: item.subCategory ? { id: item.subCategory._id, name: item.subCategory.name } : null,
        imageUrl: item.imageURL,
        originalPrice: item.price,
        discountedPrice: item.discountedPrice || item.price,
        description: item.description,
        discountPercentage: item.discount ? `${item.discount}%` : null,
        averageRating: item.averageRating,
        reviewCount: item.reviewCount,
        stock: {
          calculatedStock: safeCalculatedStock,
          manualStock: safeManualStock,
          effectiveStock: effectiveStock,
          currentStock: safeCurrentStock, // ✅ Sama dengan effectiveStock
          isAvailable: effectiveStock > 0,
          stockSource: stockSource, // ✅ Tambahan info sumber stok
          lastCalculatedAt: lastCalculatedAt,
          lastAdjustedAt: lastAdjustedAt
        },
        toppings: item.toppings ? item.toppings.map((topping) => ({
          id: topping._id,
          name: topping.name,
          price: topping.price || 0,
        })) : [],
        addons: item.addons ? item.addons.map((addon) => ({
          id: addon._id,
          name: addon.name,
          options: addon.options ? addon.options.map((opt) => ({
            id: opt._id,
            label: opt.label,
            price: opt.price || 0,
            isDefault: opt.isDefault || false,
          })) : [],
        })) : [],
        availableAt: item.availableAt || [],
        workstation: item.workstation,
        isActive: item.isActive,
        hasRecipe: true,
        recipeCount: item.recipe ? item.recipe.length : 0,
        hasManualStock: safeManualStock > 0 || safeManualStock !== null // ✅ Flag tambahan
      };
    });

    const responsePayload = {
      success: true,
      data: formattedMenuItems,
      meta: {
        total: formattedMenuItems.length,
        hasRecipes: true,
        withStockInfo: true,
        withManualStock: true, // ✅ Flag baru
        message: formattedMenuItems.length > 0
          ? `Showing ${formattedMenuItems.length} menu items with recipes AND manual stock`
          : "No menu items with recipes and manual stock found"
      }
    };

    // Simpan hasil ke Redis
    try {
      await redis.set(cacheKey, JSON.stringify(responsePayload), "EX", 300);
    } catch (cacheErr) {
      console.warn("⚠️ Redis write error:", cacheErr.message);
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("❌ Error fetching menu items with recipes and manual stock:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu items with recipes and manual stock.",
      error: error.message,
    });
  }
};

export const getMenuItemsByOutletWithRecipes = async (req, res) => {
  const { outletId } = req.params;
  const cacheKey = `menu_items_with_recipes_outlet_${outletId}`;

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

    // Ambil menu items yang memiliki resep dan tersedia di outlet tertentu
    const menuItems = await MenuItem.find({
      _id: {
        $in: await Recipe.distinct('menuItemId')
      },
      $or: [
        { availableAt: { $in: [outletId] } },
        { availableAt: { $size: 0 } } // Juga include yang available di semua outlet
      ],
      isActive: true
    })
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

    // ... (sisa code formatting sama seperti sebelumnya)

    const responsePayload = {
      success: true,
      data: formattedMenuItems,
      meta: {
        total: formattedMenuItems.length,
        outletId: outletId,
        hasRecipes: true,
        message: `Showing ${formattedMenuItems.length} menu items with recipes available at this outlet`
      }
    };

    // Simpan ke cache
    try {
      await redis.set(cacheKey, JSON.stringify(responsePayload), "EX", 300);
    } catch (cacheErr) {
      console.warn("⚠️ Redis write error:", cacheErr.message);
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("❌ Error fetching menu items for outlet:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu items for outlet.",
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

// Get menu items by category (only those with recipes)
export const getMenuItemsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  const cacheKey = `menu_items_category_${categoryId}_with_recipes`;

  try {
    // Validasi categoryId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Cek cache terlebih dahulu
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (cacheErr) {
      console.warn("⚠️ Redis read error, lanjut DB:", cacheErr.message);
    }

    // Gunakan aggregation pipeline untuk efisiensi
    const menuItems = await MenuItem.aggregate([
      {
        $match: {
          isActive: true,
          $or: [
            { category: new mongoose.Types.ObjectId(categoryId) },
            { subCategory: new mongoose.Types.ObjectId(categoryId) }
          ]
        }
      },
      {
        $lookup: {
          from: "recipes",
          localField: "_id",
          foreignField: "menuItemId",
          as: "recipe"
        }
      },
      {
        $match: {
          "recipe.0": { $exists: true } // Hanya yang memiliki resep
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "subCategory",
          foreignField: "_id",
          as: "subCategory"
        }
      },
      {
        $lookup: {
          from: "outlets",
          localField: "availableAt",
          foreignField: "_id",
          as: "availableAt"
        }
      },
      {
        $lookup: {
          from: "menustocks",
          localField: "_id",
          foreignField: "menuItemId",
          as: "stockInfo"
        }
      },
      {
        $lookup: {
          from: "menuratings",
          let: { menuItemId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$menuItemId", "$$menuItemId"] },
                isActive: true
              }
            }
          ],
          as: "ratings"
        }
      },
      {
        $project: {
          name: 1,
          mainCategory: 1,
          imageURL: 1,
          price: 1,
          discountedPrice: 1,
          description: 1,
          discount: 1,
          toppings: 1,
          addons: 1,
          availableAt: 1,
          workstation: 1,
          isActive: 1,
          category: { $arrayElemAt: ["$category", 0] },
          subCategory: { $arrayElemAt: ["$subCategory", 0] },
          recipe: 1,
          stockData: {
            $cond: {
              if: { $gt: [{ $size: "$stockInfo" }, 0] },
              then: { $arrayElemAt: ["$stockInfo", 0] },
              else: {
                calculatedStock: 0,
                manualStock: 0,
                currentStock: 0,
                effectiveStock: 0
              }
            }
          },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$ratings" }, 0] },
              then: {
                $round: [
                  { $divide: [{ $sum: "$ratings.rating" }, { $size: "$ratings" }] },
                  1
                ]
              },
              else: null
            }
          },
          reviewCount: { $size: "$ratings" }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // Populate addons options dan toppings
    const populatedMenuItems = await MenuItem.populate(menuItems, [
      {
        path: "addons",
        populate: { path: "options" }
      },
      {
        path: "toppings"
      }
    ]);

    const formattedMenuItems = populatedMenuItems.map((item) => {
      // ✅ HANDLE NULL/UNDEFINED STOCK - SEMUA JADI 0
      const safeCalculatedStock = item.stockData?.calculatedStock ?? 0;
      const safeManualStock = item.stockData?.manualStock ?? 0;

      // ✅ LOGIC PRIORITAS: manualStock dulu, baru calculatedStock
      const effectiveStock = (safeManualStock !== null && safeManualStock !== undefined && safeManualStock !== 0)
        ? safeManualStock
        : safeCalculatedStock;

      // ✅ CurrentStock harus sama dengan effectiveStock (sesuai prioritas)
      const safeCurrentStock = effectiveStock;

      // ✅ Handle null untuk dates
      const lastCalculatedAt = item.stockData?.lastCalculatedAt || null;
      const lastAdjustedAt = item.stockData?.lastAdjustedAt || null;

      // ✅ Tentukan stock source untuk informasi
      const stockSource = (safeManualStock !== null && safeManualStock !== undefined && safeManualStock !== 0)
        ? 'manual'
        : 'calculated';

      return {
        id: item._id,
        name: item.name,
        mainCategory: item.mainCategory,
        category: item.category ? { id: item.category._id, name: item.category.name } : null,
        subCategory: item.subCategory ? { id: item.subCategory._id, name: item.subCategory.name } : null,
        imageUrl: item.imageURL,
        originalPrice: item.price,
        discountedPrice: item.discountedPrice || item.price,
        description: item.description,
        discountPercentage: item.discount ? `${item.discount}%` : null,
        averageRating: item.averageRating,
        reviewCount: item.reviewCount,
        stock: {
          calculatedStock: safeCalculatedStock,
          manualStock: safeManualStock,
          effectiveStock: effectiveStock,
          currentStock: safeCurrentStock, // ✅ Sama dengan effectiveStock
          isAvailable: effectiveStock > 0,
          stockSource: stockSource, // ✅ Tambahan info sumber stok
          lastCalculatedAt: lastCalculatedAt,
          lastAdjustedAt: lastAdjustedAt
        },
        toppings: item.toppings ? item.toppings.map((topping) => ({
          id: topping._id,
          name: topping.name,
          price: topping.price || 0,
        })) : [],
        addons: item.addons ? item.addons.map((addon) => ({
          id: addon._id,
          name: addon.name,
          options: addon.options ? addon.options.map((opt) => ({
            id: opt._id,
            label: opt.label,
            price: opt.price || 0,
            isDefault: opt.isDefault || false,
          })) : [],
        })) : [],
        availableAt: item.availableAt || [],
        workstation: item.workstation,
        isActive: item.isActive,
        hasRecipe: true,
        recipeCount: item.recipe ? item.recipe.length : 0
      };
    });

    const responsePayload = {
      success: true,
      data: formattedMenuItems,
      meta: {
        total: formattedMenuItems.length,
        categoryId: categoryId,
        hasRecipes: true,
        withStockInfo: true,
        message: formattedMenuItems.length > 0
          ? `Found ${formattedMenuItems.length} menu items with recipes in this category`
          : "No menu items with recipes found for this category"
      }
    };

    // Simpan hasil ke Redis
    try {
      await redis.set(cacheKey, JSON.stringify(responsePayload), "EX", 300);
    } catch (cacheErr) {
      console.warn("⚠️ Redis write error:", cacheErr.message);
    }

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error('❌ Error fetching menu by category with recipes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items by category with recipes',
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
