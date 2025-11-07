import Recipe from '../models/modul_menu/Recipe.model.js';
import { MenuItem } from '../models/MenuItem.model.js';
import ProductStock from '../models/modul_menu/ProductStock.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';
import Product from '../models/modul_market/Product.model.js';
import mongoose from 'mongoose';
import { calculateMaxPortions } from '../utils/stockCalculator.js';
import { calibrateSingleMenuStock } from '../jobs/stockCalibration.job.js';

/**
 * Hitung porsi maksimal berdasarkan bahan tersedia
 */

export const calculateCostPrice = async (menuItemId, recipeOverride = null) => {
  let recipe;

  if (recipeOverride) {
    // Gunakan resep yang baru dibuat
    recipe = recipeOverride;
  } else {
    // Cari di DB jika tidak ada override
    recipe = await Recipe.findOne({ menuItemId });
  }

  if (!recipe) return 0;

  let total = 0;

  const getPrice = (product) => {
    if (!product?.suppliers?.length) return 0;

    // Urutkan supplier berdasarkan lastPurchaseDate terbaru
    const sorted = [...product.suppliers].sort((a, b) =>
      new Date(b.lastPurchaseDate) - new Date(a.lastPurchaseDate)
    );
    return sorted[0]?.price || 0;
  };

  const sumIngredients = async (ingredients) => {
    for (const ing of ingredients) {
      const product = await Product.findById(ing.productId);
      if (!product) continue;
      const price = getPrice(product);
      total += price * ing.quantity;
    }
  };

  // Hitung bahan utama
  await sumIngredients(recipe.baseIngredients);

  // Hitung addonOptions
  for (const addon of recipe.addonOptions) {
    await sumIngredients(addon.ingredients);
  }

  return total;
};

/**
 * Update semua menuItem dengan hitungan availableStock berdasarkan recipe
 */
export const updateMenuAvailableStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const menuItems = await MenuItem.find().populate("category", "name").session(session);

    for (const menuItem of menuItems) {
      const recipe = await Recipe.findOne({ menuItemId: menuItem._id }).session(session);

      if (!recipe || !recipe.baseIngredients.length) {
        // Update MenuStock dengan calculatedStock = 0
        await MenuStock.findOneAndUpdate(
          { menuItemId: menuItem._id },
          {
            calculatedStock: 0,
            lastCalculatedAt: new Date()
          },
          { upsert: true, session }
        );

        menuItem.availableStock = 0;
        await menuItem.save({ session });
        continue;
      }

      // 🔑 Filter hanya baseIngredients yang isDefault = true
      const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);

      let calculatedStock = 0;
      if (defaultIngredients.length) {
        calculatedStock = await calculateMaxPortions(defaultIngredients);
      }

      // Update atau buat MenuStock
      const menuStock = await MenuStock.findOneAndUpdate(
        { menuItemId: menuItem._id },
        {
          calculatedStock,
          lastCalculatedAt: new Date()
        },
        {
          upsert: true,
          new: true,
          session
        }
      );

      // Jika manualStock null, gunakan calculatedStock untuk availableStock
      menuItem.availableStock = menuStock.effectiveStock;
      await menuItem.save({ session });
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: 'Stok menu berhasil diperbarui',
      data: menuItems.map(m => ({
        _id: m._id,
        name: m.name,
        category: m.category?.name,
        availableStock: m.availableStock
      }))
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating menu available stock:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate stok menu' });
  } finally {
    session.endSession();
  }
};

// Ambil data stok menu dari MenuStock (dengan join ke MenuItem & category)
export const getMenuStocks = async (req, res) => {
  try {
    const stocks = await MenuStock.find()
      .populate({
        path: "menuItemId",
        select: "name category availableStock",
        populate: { path: "category", select: "name" }
      })
      .lean();

    res.status(200).json({
      success: true,
      message: "Data stok menu berhasil diambil",
      data: stocks.map(s => ({
        _id: s._id,
        menuItemId: s.menuItemId?._id,
        name: s.menuItemId?.name,
        category: s.menuItemId?.category?.name || "-",
        calculatedStock: s.calculatedStock,
        manualStock: s.manualStock,
        effectiveStock: s.manualStock !== null ? s.manualStock : s.calculatedStock, // Manual override logic
        adjustmentNote: s.adjustmentNote,
        adjustedBy: s.adjustedBy,
        lastCalculatedAt: s.lastCalculatedAt,
        lastAdjustedAt: s.lastAdjustedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching menu stocks:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data stok menu"
    });
  }
};

/**
 * Update stok hanya untuk satu menuItem
 */
export const updateSingleMenuStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { menuItemId } = req.params;
    if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ success: false, message: 'ID Menu tidak valid' });
    }

    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    }

    const recipe = await Recipe.findOne({ menuItemId: menuItem._id }).session(session);
    let calculatedStock = 0;

    if (recipe?.baseIngredients?.length) {
      const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
      if (defaultIngredients.length) {
        calculatedStock = await calculateMaxPortions(defaultIngredients);
      }
    }

    // Simpan ke MenuStock
    let menuStockDoc = await MenuStock.findOne({ menuItemId }).session(session);
    if (!menuStockDoc) {
      menuStockDoc = new MenuStock({
        menuItemId,
        calculatedStock,
        lastCalculatedAt: new Date(),
      });
    } else {
      // Hanya update calculatedStock jika manualStock null
      // Jika manualStock ada, biarkan manualStock tetap
      if (menuStockDoc.manualStock === null) {
        menuStockDoc.calculatedStock = calculatedStock;
      }
      menuStockDoc.lastCalculatedAt = new Date();
    }
    await menuStockDoc.save({ session });

    // Update MenuItem.availableStock dengan effectiveStock
    menuItem.availableStock = menuStockDoc.effectiveStock;
    await menuItem.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: {
        menuItem: menuItem,
        stockDetail: {
          ...menuStockDoc.toJSON(),
          effectiveStock: menuStockDoc.effectiveStock
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating single menu stock:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate stok menu' });
  } finally {
    session.endSession();
  }
};

// PATCH /api/menu-stocks/:menuItemId/adjust
export const adjustMenuStock = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const { menuItemId } = req.params;
      const { manualStock, adjustmentNote, adjustedBy, reason, wasteQuantity, autoCalibrate = true } = req.body;

      if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
        throw new Error('ID Menu tidak valid');
      }

      // Dapatkan nama menu untuk logging
      const menuItem = await MenuItem.findById(menuItemId).session(session);
      if (!menuItem) {
        throw new Error('Menu item tidak ditemukan');
      }
      const menuName = menuItem.name;
      const previousStatus = menuItem.isActive;

      // console.log(`🔍 DEBUG adjustMenuStock START:`);
      // console.log(`🔍 DEBUG - Menu: ${menuName}`);
      // console.log(`🔍 DEBUG - Manual Stock Input: ${manualStock}`);
      // console.log(`🔍 DEBUG - Previous Status: ${previousStatus}`);
      // console.log(`🔍 DEBUG - Auto Calibrate: ${autoCalibrate}`);

      // Validasi untuk waste/pengurangan stok
      if (reason && wasteQuantity) {
        if (wasteQuantity <= 0) {
          throw new Error('Quantity waste harus lebih dari 0');
        }

        const validReasons = ['busuk', 'tidak_bagus', 'kedaluwarsa', 'rusak', 'hilang', 'lainnya'];
        if (!validReasons.includes(reason)) {
          throw new Error('Reason tidak valid. Pilihan: busuk, tidak_bagus, kedaluwarsa, rusak, hilang, lainnya');
        }
      }

      // Jika manualStock kosong atau null, reset ke calculated
      if (manualStock === '' || manualStock === null) {
        // console.log(`🔍 DEBUG: Resetting manual stock to calculated`);

        const menuStock = await MenuStock.findOne({ menuItemId }).session(session);
        if (!menuStock) {
          throw new Error('Stok menu tidak ditemukan');
        }

        // Reset manualStock ke null, sehingga menggunakan calculatedStock
        menuStock.manualStock = null;
        menuStock.adjustmentNote = adjustmentNote || 'Reset ke stok terhitung sistem';
        menuStock.adjustedBy = adjustedBy || null;
        menuStock.lastAdjustedAt = new Date();

        await menuStock.save({ session });

        // Update MenuItem.availableStock
        await MenuItem.findByIdAndUpdate(menuItemId, {
          availableStock: menuStock.effectiveStock
        }, { session });

        // console.log(`🔍 DEBUG: After reset - Effective Stock: ${menuStock.effectiveStock}`);

        // ✅ KALIBRASI DENGAN SESSION YANG SAMA (NO DOUBLE TRANSACTION)
        if (autoCalibrate) {
          // console.log(`🔍 DEBUG: Starting calibration after reset`);
          await calibrateSingleMenuStock(menuItemId, session);
          console.log(`✅ Kalibrasi otomatis setelah reset manual stock untuk ${menuName}`);
        }

        // Dapatkan status terbaru setelah kalibrasi
        const updatedMenuItem = await MenuItem.findById(menuItemId).session(session);
        const newStatus = updatedMenuItem.isActive;

        // console.log(`🔄 Stok manual berhasil direset ke stok sistem untuk ${menuName}`);
        // console.log(`🔍 DEBUG: Final Status after reset: ${newStatus}`);

        // Emit socket event
        io.to('join_cashier_room').emit('update_stock', {
          message: 'Stock Reset to System Calculation',
          data: {
            ...menuStock.toObject(),
            menuName: menuName,
            newStatus: newStatus
          }
        });

        // Emit status change event jika ada perubahan
        if (previousStatus !== newStatus) {
          io.to('join_cashier_room').emit('menu_status_changed', {
            menuItemId: menuItemId,
            menuName: menuName,
            previousStatus: previousStatus,
            newStatus: newStatus,
            reason: 'manual_stock_reset'
          });
        }

        res.status(200).json({
          success: true,
          message: 'Stok manual berhasil direset ke stok sistem',
          data: {
            ...menuStock.toObject(),
            statusChanged: previousStatus !== newStatus,
            previousStatus,
            newStatus,
            effectiveStock: menuStock.effectiveStock
          }
        });
        return;
      }

      // Validasi untuk input manual stock
      if (manualStock < 0) {
        throw new Error('Stok manual harus angka ≥ 0');
      }

      let stockDoc = await MenuStock.findOne({ menuItemId }).session(session);
      const previousStock = stockDoc ? stockDoc.effectiveStock : 0;

      // console.log(`🔍 DEBUG: Previous effective stock: ${previousStock}`);
      // console.log(`🔍 DEBUG: Found existing MenuStock: ${!!stockDoc}`);

      if (!stockDoc) {
        // console.log(`🔍 DEBUG: Creating new MenuStock document`);
        // Jika belum ada, hitung calculatedStock terlebih dahulu
        const recipe = await Recipe.findOne({ menuItemId }).session(session);
        let calculatedStock = 0;

        if (recipe?.baseIngredients?.length) {
          const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
          if (defaultIngredients.length) {
            calculatedStock = await calculateMaxPortions(defaultIngredients);
          }
        }

        // console.log(`🔍 DEBUG: New calculated stock: ${calculatedStock}`);

        stockDoc = new MenuStock({
          menuItemId,
          calculatedStock,
          manualStock: manualStock,
          adjustmentNote,
          adjustedBy: adjustedBy || null,
          lastAdjustedAt: new Date(),
          lastCalculatedAt: new Date()
        });
      } else {
        // console.log(`🔍 DEBUG: Updating existing MenuStock`);
        // console.log(`🔍 DEBUG: Previous manual stock: ${stockDoc.manualStock}`);
        // console.log(`🔍 DEBUG: Previous calculated stock: ${stockDoc.calculatedStock}`);

        stockDoc.manualStock = manualStock;
        stockDoc.adjustmentNote = adjustmentNote || null;
        stockDoc.adjustedBy = adjustedBy || null;
        stockDoc.lastAdjustedAt = new Date();
      }

      await stockDoc.save({ session });

      console.log(`🔍 DEBUG: Saved MenuStock - Manual: ${stockDoc.manualStock}, Calculated: ${stockDoc.calculatedStock}`);
      // console.log(`🔍 DEBUG: Effective stock will be: ${stockDoc.effectiveStock}`);

      // ✅ FORCE STATUS UPDATE BERDASARKAN MANUAL STOCK
      let newStatus = previousStatus;
      let statusChangeReason = '';

      if (manualStock < 1) {
        newStatus = false;
        statusChangeReason = `manual stock set to ${manualStock}`;
        console.log(`🔴 Force deactivate ${menuName} - ${statusChangeReason}`);
      } else {
        newStatus = true;
        statusChangeReason = `manual stock set to ${manualStock}`;
        console.log(`🟢 Force activate ${menuName} - ${statusChangeReason}`);
      }

      // Update MenuItem.availableStock dan status
      await MenuItem.findByIdAndUpdate(menuItemId, {
        availableStock: stockDoc.effectiveStock,
        isActive: newStatus
      }, { session });

      console.log(`🔍 DEBUG: Updated ${menuName} status from ${previousStatus} to ${newStatus}`);

      // Handle waste/pengurangan stok dengan ProductStock Movement
      if (reason && wasteQuantity) {
        console.log(`🔍 DEBUG: Processing waste movement - Quantity: ${wasteQuantity}, Reason: ${reason}`);
        await handleWasteStockMovement(
          menuItemId,
          wasteQuantity,
          reason,
          adjustedBy,
          adjustmentNote,
          previousStock,
          stockDoc.effectiveStock,
          session
        );
      }

      // ✅ KALIBRASI DENGAN SESSION YANG SAMA
      if (autoCalibrate && (manualStock !== '' && manualStock !== null)) {
        // console.log(`🔍 DEBUG: Starting calibration after manual adjustment`);
        await calibrateSingleMenuStock(menuItemId, session);
        console.log(`✅ Kalibrasi otomatis setelah adjustment manual stock untuk ${menuName}`);

        // Dapatkan status terbaru setelah kalibrasi (mungkin berubah lagi)
        const finalMenuItem = await MenuItem.findById(menuItemId).session(session);
        const finalStatus = finalMenuItem.isActive;
        newStatus = finalStatus; // Update dengan status terakhir dari kalibrasi

        // console.log(`🔍 DEBUG: Final status after calibration: ${finalStatus}`);
      }

      // console.log(`✅ Stok menu ${menuName} berhasil disesuaikan dan dikalibrasi`);
      // console.log(`🔍 DEBUG: Final effective stock: ${stockDoc.effectiveStock}`);
      // console.log(`🔍 DEBUG: Final menu status: ${newStatus}`);

      // Emit socket event untuk update real-time
      io.to('join_cashier_room').emit('update_stock', {
        message: 'Stock Updated and Calibrated',
        data: {
          ...stockDoc.toObject(),
          menuName: menuName,
          newStatus: newStatus,
          effectiveStock: stockDoc.effectiveStock
        }
      });

      // Emit status change event jika ada perubahan
      const statusChanged = previousStatus !== newStatus;
      if (statusChanged) {
        // console.log(`🔔 Status changed: ${menuName} from ${previousStatus} to ${newStatus}`);
        io.to('join_cashier_room').emit('menu_status_changed', {
          menuItemId: menuItemId,
          menuName: menuName,
          previousStatus: previousStatus,
          newStatus: newStatus,
          reason: statusChangeReason || 'manual_stock_adjustment',
          effectiveStock: stockDoc.effectiveStock
        });
      }

      res.status(200).json({
        success: true,
        message: 'Stok menu berhasil disesuaikan dan dikalibrasi',
        data: {
          ...stockDoc.toObject(),
          statusChanged: statusChanged,
          previousStatus,
          newStatus,
          effectiveStock: stockDoc.effectiveStock,
          calibrationPerformed: autoCalibrate,
          debug: {
            manualStockInput: manualStock,
            previousEffectiveStock: previousStock,
            finalEffectiveStock: stockDoc.effectiveStock
          }
        }
      });
    });

  } catch (error) {
    console.error('❌ Error adjusting menu stock:', error);

    // Rollback transaction sudah dihandle oleh withTransaction()

    res.status(500).json({
      success: false,
      message: 'Gagal menyesuaikan stok',
      error: error.message,
      debug: {
        menuItemId: req.params.menuItemId,
        manualStock: req.body.manualStock
      }
    });
  } finally {
    session.endSession();
    console.log(`🔍 DEBUG adjustMenuStock END: Session closed`);
  }
};
/**
 * Bulk adjust menu stocks dengan kalibrasi otomatis
 */
export const bulkAdjustMenuStocks = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { adjustments, autoCalibrate = true } = req.body;

    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Adjustments harus berupa array yang tidak kosong'
      });
    }

    const results = [];
    const adjustedIds = [];

    for (const adjustment of adjustments) {
      const { menuItemId, manualStock, adjustmentNote, adjustedBy } = adjustment;

      if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
        console.warn(`⚠️ ID Menu tidak valid: ${menuItemId}`);
        continue;
      }

      try {
        let stockDoc = await MenuStock.findOne({ menuItemId }).session(session);

        if (!stockDoc) {
          // Jika belum ada, buat baru
          const recipe = await Recipe.findOne({ menuItemId }).session(session);
          let calculatedStock = 0;

          if (recipe?.baseIngredients?.length) {
            const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
            if (defaultIngredients.length) {
              calculatedStock = await calculateMaxPortions(defaultIngredients);
            }
          }

          stockDoc = new MenuStock({
            menuItemId,
            calculatedStock,
            manualStock: manualStock,
            adjustmentNote,
            adjustedBy: adjustedBy || null,
            lastAdjustedAt: new Date(),
            lastCalculatedAt: new Date()
          });
        } else {
          stockDoc.manualStock = manualStock;
          stockDoc.adjustmentNote = adjustmentNote || null;
          stockDoc.adjustedBy = adjustedBy || null;
          stockDoc.lastAdjustedAt = new Date();
        }

        await stockDoc.save({ session });

        // Update MenuItem.availableStock
        await MenuItem.findByIdAndUpdate(menuItemId, {
          availableStock: stockDoc.effectiveStock
        }, { session });

        adjustedIds.push(menuItemId);
        results.push({
          menuItemId,
          success: true,
          effectiveStock: stockDoc.effectiveStock
        });

      } catch (error) {
        console.error(`❌ Gagal adjust menu item ${menuItemId}:`, error.message);
        results.push({
          menuItemId,
          success: false,
          error: error.message
        });
      }
    }

    // ✅ KALIBRASI BATCH SETELAH SEMUA ADJUSTMENT
    if (autoCalibrate && adjustedIds.length > 0) {
      try {
        const calibrationResults = await calibrateSelectedMenuStocks(adjustedIds);
        console.log(`✅ Kalibrasi batch selesai: ${calibrationResults.successCount} berhasil`);
      } catch (calibrationError) {
        console.error('❌ Kalibrasi batch gagal:', calibrationError);
        // Jangan gagalkan seluruh proses jika kalibrasi gagal
      }
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Bulk adjustment selesai: ${results.filter(r => r.success).length} berhasil, ${results.filter(r => !r.success).length} gagal`,
      data: results
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error in bulk adjust menu stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal melakukan bulk adjustment',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * Fungsi untuk menangani waste/pengurangan stok dan mencatat di ProductStock Movement
 */
const handleWasteStockMovement = async (
  menuItemId,
  wasteQuantity,
  reason,
  handledBy,
  notes,
  previousStock,
  currentStock,
  session
) => {
  try {
    // Dapatkan informasi menu item
    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (!menuItem) {
      throw new Error('Menu item tidak ditemukan');
    }

    // Dapatkan resep untuk mendapatkan bahan-bahan yang digunakan
    const recipe = await Recipe.findOne({ menuItemId }).session(session);
    if (!recipe || !recipe.baseIngredients || recipe.baseIngredients.length === 0) {
      throw new Error('Resep tidak ditemukan untuk menu item ini');
    }

    // Hitung pengurangan bahan berdasarkan waste quantity
    const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);

    for (const ingredient of defaultIngredients) {
      const productId = ingredient.productId;
      const quantityPerPortion = ingredient.quantity;
      const totalWasteQuantity = quantityPerPortion * wasteQuantity;

      // Cari atau buat ProductStock untuk product ini
      let productStock = await ProductStock.findOne({
        productId: productId
      }).session(session);

      if (!productStock) {
        // Jika belum ada, buat baru dengan stok 0
        productStock = new ProductStock({
          productId: productId,
          currentStock: 0,
          minStock: 0,
          warehouse: '68bfb3643cf2055fbfad6a00'
        });
        await productStock.save({ session });
      }

      // Buat movement record untuk waste
      const wasteMovement = {
        quantity: totalWasteQuantity,
        type: 'out',
        referenceId: menuItemId,
        notes: `Waste: ${reason} - ${notes || 'Pengurangan stok karena barang tidak layak'}. Menu: ${menuItem.name}, Qty: ${wasteQuantity}`,
        sourceWarehouse: productStock.warehouse,
        handledBy: handledBy || 'system',
        date: new Date()
      };

      // Update current stock dan tambahkan movement
      productStock.currentStock = Math.max(0, productStock.currentStock - totalWasteQuantity);
      productStock.movements.push(wasteMovement);

      await productStock.save({ session });

      console.log(`Waste recorded for product ${productId}: ${totalWasteQuantity} ${reason}`);
    }

    // Juga catat di MenuStock Movement jika diperlukan
    await recordMenuStockMovement(
      menuItemId,
      'waste',
      wasteQuantity,
      reason,
      handledBy,
      notes,
      previousStock,
      currentStock,
      session
    );

  } catch (error) {
    console.error('Error handling waste stock movement:', error);
    throw error;
  }
};

/**
 * Fungsi untuk mencatat movement di MenuStock
 */
const recordMenuStockMovement = async (
  menuItemId,
  type,
  quantity,
  reason,
  handledBy,
  notes,
  previousStock,
  currentStock,
  session
) => {
  try {
    // Jika Anda memiliki schema untuk MenuStockMovement, tambahkan di sini
    // Contoh implementasi:
    const MenuStockMovement = mongoose.model('MenuStockMovement');

    const movement = new MenuStockMovement({
      menuItemId: menuItemId,
      type: type,
      quantity: quantity,
      reason: reason,
      previousStock: previousStock,
      currentStock: currentStock,
      handledBy: handledBy || 'system',
      notes: notes,
      date: new Date()
    });

    await movement.save({ session });

  } catch (error) {
    console.error('Error recording menu stock movement:', error);
    // Jangan throw error di sini agar tidak mengganggu proses utama
  }
};

// Endpoint khusus untuk waste/pengurangan stok
export const recordWasteStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { menuItemId } = req.params;
    const { wasteQuantity, reason, notes, handledBy, autoCalibrate = true } = req.body;

    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'ID Menu tidak valid' });
    }

    // Validasi input
    if (!wasteQuantity || wasteQuantity <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Quantity waste harus lebih dari 0' });
    }

    if (!reason) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Reason wajib diisi' });
    }

    const validReasons = ['busuk', 'tidak_bagus', 'kedaluwarsa', 'rusak', 'hilang', 'lainnya'];
    if (!validReasons.includes(reason)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Reason tidak valid. Pilihan: busuk, tidak_bagus, kedaluwarsa, rusak, hilang, lainnya'
      });
    }

    // Dapatkan current stock
    const menuStock = await MenuStock.findOne({ menuItemId }).session(session);
    if (!menuStock) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Stok menu tidak ditemukan' });
    }

    const previousStock = menuStock.effectiveStock;

    // Kurangi manual stock
    const newManualStock = Math.max(0, (menuStock.manualStock || menuStock.calculatedStock) - wasteQuantity);
    menuStock.manualStock = newManualStock;
    menuStock.lastAdjustedAt = new Date();

    await menuStock.save({ session });

    // Update MenuItem
    await MenuItem.findByIdAndUpdate(menuItemId, {
      availableStock: menuStock.effectiveStock
    }, { session });

    // Catat di ProductStock Movement
    await handleWasteStockMovement(
      menuItemId,
      wasteQuantity,
      reason,
      handledBy,
      notes,
      previousStock,
      menuStock.effectiveStock,
      session
    );

    // ✅ KALIBRASI SETELAH WASTE RECORDING
    if (autoCalibrate) {
      await calibrateSingleMenuStock(menuItemId);
      console.log(`✅ Kalibrasi otomatis setelah waste recording untuk ${menuItemId}`);
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Waste stok berhasil dicatat: ${wasteQuantity} porsi (${reason})`,
      data: {
        previousStock,
        currentStock: menuStock.effectiveStock,
        wasteQuantity,
        reason
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error recording waste stock:', error);
    res.status(500).json({ success: false, message: 'Gagal mencatat waste stok' });
  } finally {
    session.endSession();
  }
};

/**
 * Lihat detail stok menu beserta komponen bahan
 */
export const getMenuStockDetails = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ success: false, message: 'ID Menu tidak valid' });
    }

    const menuItem = await MenuItem.findById(menuItemId).populate('toppings.name', 'name');
    const recipe = await Recipe.findOne({ menuItemId }).populate('baseIngredients.productId');
    const menuStock = await MenuStock.findOne({ menuItemId });

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    const details = {
      menuItem: {
        _id: menuItem._id,
        name: menuItem.name,
        availableStock: menuItem.availableStock
      },
      stockInfo: {
        calculatedStock: menuStock?.calculatedStock || 0,
        manualStock: menuStock?.manualStock,
        effectiveStock: menuStock?.effectiveStock || 0,
        lastCalculatedAt: menuStock?.lastCalculatedAt,
        lastAdjustedAt: menuStock?.lastAdjustedAt
      },
      baseIngredients: recipe.baseIngredients.map(ing => ({
        productId: ing.productId._id,
        productName: ing.productName,
        productSku: ing.productSku,
        quantityRequired: ing.quantity,
        unit: ing.unit,
        currentStock: 0,
        portionFromThisItem: 0
      })),
      toppingOptions: recipe.toppingOptions.map(t => ({
        toppingName: t.toppingName,
        ingredients: t.ingredients.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantityRequired: i.quantity,
          unit: i.unit
        }))
      })),
      addonOptions: recipe.addonOptions.map(a => ({
        addonName: a.addonName,
        optionLabel: a.optionLabel,
        ingredients: a.ingredients.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantityRequired: i.quantity,
          unit: i.unit
        }))
      }))
    };

    // Isi stok aktual & hitung portion dari tiap bahan
    for (const ing of details.baseIngredients) {
      const stockDoc = await ProductStock.findOne({ productId: ing.productId });
      ing.currentStock = stockDoc?.currentStock ?? 0;
      if (ing.quantityRequired > 0) {
        ing.portionFromThisItem = Math.floor(ing.currentStock / ing.quantityRequired);
      }
    }

    res.status(200).json({ success: true, data: details });

  } catch (error) {
    console.error('Error fetching menu stock details:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail stok menu' });
  }
};

// 🔹 Membuat resep baru
export const createRecipe = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { menuItemId, baseIngredients, toppingOptions, addonOptions } = req.body;

    // Validasi bahwa menu ada DAN memiliki mainCategory
    const menuItem = await MenuItem.findById(menuItemId).session(session);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    }

    // Validasi minimal baseIngredients
    if (!Array.isArray(baseIngredients) || baseIngredients.length === 0) {
      return res.status(400).json({ success: false, message: 'Harus ada bahan utama' });
    }

    // Cek apakah resep sudah ada untuk menu ini
    const existingRecipe = await Recipe.findOne({ menuItemId }).session(session);
    if (existingRecipe) {
      return res.status(400).json({
        success: false,
        message: 'Resep untuk menu ini sudah ada, gunakan update endpoint'
      });
    }

    // Buat resep baru
    const newRecipe = new Recipe({
      menuItemId,
      baseIngredients,
      toppingOptions: toppingOptions || [],
      addonOptions: addonOptions || []
    });

    await newRecipe.save({ session });

    // Update status menu jika belum aktif
    if (!menuItem.isActive) {
      menuItem.isActive = true;
      await menuItem.save({ session });
    }

    // Hitung HPP
    const newCostPrice = await calculateCostPrice(menuItemId, newRecipe);
    menuItem.costPrice = newCostPrice;
    await menuItem.save({ session });

    // ✅ KALIBRASI SETELAH PEMBUATAN RESEP BARU
    await calibrateSingleMenuStock(menuItemId);
    console.log(`✅ Kalibrasi otomatis setelah pembuatan resep untuk ${menuItemId}`);

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: newRecipe
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating recipe:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat resep',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// 🔹 Lihat semua resep
export const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('menuItemId', 'name price category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes
    });

  } catch (error) {
    console.error('Error fetching recipes:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar resep'
    });
  }
};

// 🔹 Lihat detail resep
export const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID Resep tidak valid' });
    }

    const recipe = await Recipe.findById(id)
      .populate('menuItemId', 'name price category');

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      data: recipe
    });

  } catch (error) {
    console.error('Error fetching recipe by ID:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail resep'
    });
  }
};

// 🔹 Edit resep
export const updateRecipe = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { baseIngredients, toppingOptions, addonOptions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID Resep tidak valid' });
    }

    const recipe = await Recipe.findById(id).session(session);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    // Update field
    if (baseIngredients) recipe.baseIngredients = baseIngredients;
    if (toppingOptions !== undefined) recipe.toppingOptions = toppingOptions;
    if (addonOptions !== undefined) recipe.addonOptions = addonOptions;

    await recipe.save({ session });

    // Hitung ulang HPP setelah update bahan
    const newCostPrice = await calculateCostPrice(recipe.menuItemId);
    await MenuItem.findByIdAndUpdate(recipe.menuItemId, { costPrice: newCostPrice }, { session });

    // ✅ KALIBRASI SETELAH UPDATE RESEP
    await calibrateSingleMenuStock(recipe.menuItemId);
    console.log(`✅ Kalibrasi otomatis setelah update resep untuk ${recipe.menuItemId}`);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Resep berhasil diupdate dan HPP diperbarui',
      data: recipe
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating recipe:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate resep'
    });
  } finally {
    session.endSession();
  }
};

// 🔹 Hapus resep
export const deleteRecipe = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID Resep tidak valid' });
    }

    const recipe = await Recipe.findByIdAndDelete(id).session(session);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    // ✅ KALIBRASI SETELAH HAPUS RESEP
    await calibrateSingleMenuStock(recipe.menuItemId);
    console.log(`✅ Kalibrasi otomatis setelah hapus resep untuk ${recipe.menuItemId}`);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Resep berhasil dihapus'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting recipe:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus resep'
    });
  } finally {
    session.endSession();
  }
};

// 🔹 Cari resep berdasarkan ID menu
export const getRecipeByMenuId = async (req, res) => {
  try {
    const { menuId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(menuId)) {
      return res.status(400).json({ success: false, message: 'ID Menu tidak valid' });
    }

    const recipe = await Recipe.findOne({ menuItemId: menuId })
      .populate('menuItemId', 'name price category');

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      data: recipe
    });

  } catch (error) {
    console.error('Error fetching recipe by menu ID:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil resep'
    });
  }
};

/**
 * Controller untuk mengambil recipe yang menggunakan produk tertentu
 * GET /api/recipes/by-product/:productId
 */
export const getRecipesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID Produk tidak valid'
      });
    }

    // Cari semua recipe yang menggunakan produk ini di baseIngredients
    const recipesWithProduct = await Recipe.find({
      $or: [
        { 'baseIngredients.productId': productId },
        { 'toppingOptions.ingredients.productId': productId },
        { 'addonOptions.ingredients.productId': productId }
      ]
    })
      .populate('menuItemId', 'name price category availableStock isActive')
      .populate('baseIngredients.productId', 'name sku unit suppliers')
      .populate('toppingOptions.ingredients.productId', 'name sku unit suppliers')
      .populate('addonOptions.ingredients.productId', 'name sku unit suppliers')
      .sort({ createdAt: -1 });

    if (!recipesWithProduct.length) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada recipe yang menggunakan produk ini',
        data: []
      });
    }

    // Format response dengan detail penggunaan produk
    const formattedRecipes = recipesWithProduct.map(recipe => {
      const recipeObj = recipe.toObject();

      // Cari di baseIngredients
      const inBaseIngredients = recipe.baseIngredients.filter(
        ing => ing.productId && ing.productId._id.toString() === productId
      );

      // Cari di toppingOptions
      const inToppingOptions = [];
      recipe.toppingOptions.forEach(topping => {
        topping.ingredients.forEach(ing => {
          if (ing.productId && ing.productId._id.toString() === productId) {
            inToppingOptions.push({
              toppingName: topping.toppingName,
              quantity: ing.quantity,
              unit: ing.unit
            });
          }
        });
      });

      // Cari di addonOptions
      const inAddonOptions = [];
      recipe.addonOptions.forEach(addon => {
        addon.ingredients.forEach(ing => {
          if (ing.productId && ing.productId._id.toString() === productId) {
            inAddonOptions.push({
              addonName: addon.addonName,
              optionLabel: addon.optionLabel,
              quantity: ing.quantity,
              unit: ing.unit
            });
          }
        });
      });

      return {
        _id: recipeObj._id,
        menuItem: recipeObj.menuItemId ? {
          _id: recipeObj.menuItemId._id,
          name: recipeObj.menuItemId.name,
          price: recipeObj.menuItemId.price,
          category: recipeObj.menuItemId.category,
          availableStock: recipeObj.menuItemId.availableStock,
          isActive: recipeObj.menuItemId.isActive
        } : null,
        productUsage: {
          inBaseIngredients: inBaseIngredients.map(ing => ({
            quantity: ing.quantity,
            unit: ing.unit,
            isDefault: ing.isDefault || false
          })),
          inToppingOptions,
          inAddonOptions
        },
        totalUsageLocations: inBaseIngredients.length + inToppingOptions.length + inAddonOptions.length,
        createdAt: recipeObj.createdAt,
        updatedAt: recipeObj.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      message: `Ditemukan ${formattedRecipes.length} recipe yang menggunakan produk ini`,
      data: formattedRecipes
    });

  } catch (error) {
    console.error('Error fetching recipes by product:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data recipe berdasarkan produk'
    });
  }
};

/**
 * Controller untuk mengambil recipe dengan detail stok bahan
 * GET /api/recipes/by-product/:productId/with-stock
 */
export const getRecipesByProductWithStock = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID Produk tidak valid'
      });
    }

    // Cari produk terlebih dahulu untuk mendapatkan informasi stok
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    // Cari stok produk
    const productStock = await ProductStock.findOne({ productId });

    // Cari semua recipe yang menggunakan produk ini
    const recipesWithProduct = await Recipe.find({
      $or: [
        { 'baseIngredients.productId': productId },
        { 'toppingOptions.ingredients.productId': productId },
        { 'addonOptions.ingredients.productId': productId }
      ]
    })
      .populate('menuItemId', 'name price category availableStock isActive')
      .populate('baseIngredients.productId', 'name sku unit suppliers')
      .populate('toppingOptions.ingredients.productId', 'name sku unit suppliers')
      .populate('addonOptions.ingredients.productId', 'name sku unit suppliers')
      .sort({ createdAt: -1 });

    if (!recipesWithProduct.length) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada recipe yang menggunakan produk ini',
        data: []
      });
    }

    // Format response dengan informasi stok
    const formattedRecipes = await Promise.all(
      recipesWithProduct.map(async (recipe) => {
        const recipeObj = recipe.toObject();

        // Hitung total penggunaan produk dalam recipe
        let totalUsage = 0;
        const usageDetails = [];

        // Base ingredients
        recipe.baseIngredients.forEach(ing => {
          if (ing.productId && ing.productId._id.toString() === productId) {
            totalUsage += ing.quantity;
            usageDetails.push({
              type: 'base',
              location: 'Bahan Utama',
              quantity: ing.quantity,
              unit: ing.unit,
              isDefault: ing.isDefault || false
            });
          }
        });

        // Topping options
        recipe.toppingOptions.forEach(topping => {
          topping.ingredients.forEach(ing => {
            if (ing.productId && ing.productId._id.toString() === productId) {
              totalUsage += ing.quantity;
              usageDetails.push({
                type: 'topping',
                location: `Topping: ${topping.toppingName}`,
                quantity: ing.quantity,
                unit: ing.unit
              });
            }
          });
        });

        // Addon options
        recipe.addonOptions.forEach(addon => {
          addon.ingredients.forEach(ing => {
            if (ing.productId && ing.productId._id.toString() === productId) {
              totalUsage += ing.quantity;
              usageDetails.push({
                type: 'addon',
                location: `Addon: ${addon.addonName} - ${addon.optionLabel}`,
                quantity: ing.quantity,
                unit: ing.unit
              });
            }
          });
        });

        // Hitung estimasi porsi yang bisa dibuat berdasarkan stok produk ini
        const estimatedPortions = productStock?.currentStock
          ? Math.floor(productStock.currentStock / totalUsage)
          : 0;

        return {
          _id: recipeObj._id,
          menuItem: recipeObj.menuItemId ? {
            _id: recipeObj.menuItemId._id,
            name: recipeObj.menuItemId.name,
            price: recipeObj.menuItemId.price,
            category: recipeObj.menuItemId.category,
            availableStock: recipeObj.menuItemId.availableStock,
            isActive: recipeObj.menuItemId.isActive
          } : null,
          productInfo: {
            productId: product._id,
            productName: product.name,
            productSku: product.sku,
            currentStock: productStock?.currentStock || 0,
            unit: product.unit
          },
          usageDetails,
          totalUsage,
          estimatedPortions,
          stockStatus: estimatedPortions > 0 ? 'available' : 'out_of_stock',
          createdAt: recipeObj.createdAt,
          updatedAt: recipeObj.updatedAt
        };
      })
    );

    res.status(200).json({
      success: true,
      message: `Ditemukan ${formattedRecipes.length} recipe yang menggunakan produk ini`,
      productInfo: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        currentStock: productStock?.currentStock || 0,
        unit: product.unit
      },
      data: formattedRecipes
    });

  } catch (error) {
    console.error('Error fetching recipes by product with stock:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data recipe berdasarkan produk dengan informasi stok'
    });
  }
};

/**
 * Controller untuk mencari recipe berdasarkan nama produk
 * GET /api/recipes/by-product-name?productName=...
 */
export const getRecipesByProductName = async (req, res) => {
  try {
    const { productName } = req.query;

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: 'Nama produk harus diisi'
      });
    }

    // Cari produk berdasarkan nama (case insensitive)
    const products = await Product.find({
      name: { $regex: productName, $options: 'i' }
    });

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: `Tidak ditemukan produk dengan nama mengandung '${productName}'`,
        data: []
      });
    }

    const productIds = products.map(p => p._id);

    // Cari recipe yang menggunakan produk-produk tersebut
    const recipesWithProducts = await Recipe.find({
      $or: [
        { 'baseIngredients.productId': { $in: productIds } },
        { 'toppingOptions.ingredients.productId': { $in: productIds } },
        { 'addonOptions.ingredients.productId': { $in: productIds } }
      ]
    })
      .populate('menuItemId', 'name price category availableStock isActive')
      .populate('baseIngredients.productId', 'name sku unit suppliers')
      .populate('toppingOptions.ingredients.productId', 'name sku unit suppliers')
      .populate('addonOptions.ingredients.productId', 'name sku unit suppliers')
      .sort({ createdAt: -1 });

    if (!recipesWithProducts.length) {
      return res.status(404).json({
        success: false,
        message: `Tidak ada recipe yang menggunakan produk dengan nama '${productName}'`,
        data: []
      });
    }

    // Format response
    const formattedRecipes = recipesWithProducts.map(recipe => {
      const recipeObj = recipe.toObject();

      // Cari semua produk yang match dalam recipe ini
      const matchedProducts = [];

      // Base ingredients
      recipe.baseIngredients.forEach(ing => {
        if (ing.productId && productIds.includes(ing.productId._id)) {
          matchedProducts.push({
            productId: ing.productId._id,
            productName: ing.productId.name,
            type: 'base',
            location: 'Bahan Utama',
            quantity: ing.quantity,
            unit: ing.unit,
            isDefault: ing.isDefault || false
          });
        }
      });

      // Topping options
      recipe.toppingOptions.forEach(topping => {
        topping.ingredients.forEach(ing => {
          if (ing.productId && productIds.includes(ing.productId._id)) {
            matchedProducts.push({
              productId: ing.productId._id,
              productName: ing.productId.name,
              type: 'topping',
              location: `Topping: ${topping.toppingName}`,
              quantity: ing.quantity,
              unit: ing.unit
            });
          }
        });
      });

      // Addon options
      recipe.addonOptions.forEach(addon => {
        addon.ingredients.forEach(ing => {
          if (ing.productId && productIds.includes(ing.productId._id)) {
            matchedProducts.push({
              productId: ing.productId._id,
              productName: ing.productId.name,
              type: 'addon',
              location: `Addon: ${addon.addonName} - ${addon.optionLabel}`,
              quantity: ing.quantity,
              unit: ing.unit
            });
          }
        });
      });

      return {
        _id: recipeObj._id,
        menuItem: recipeObj.menuItemId ? {
          _id: recipeObj.menuItemId._id,
          name: recipeObj.menuItemId.name,
          price: recipeObj.menuItemId.price,
          category: recipeObj.menuItemId.category,
          availableStock: recipeObj.menuItemId.availableStock,
          isActive: recipeObj.menuItemId.isActive
        } : null,
        matchedProducts,
        totalMatchedProducts: matchedProducts.length,
        createdAt: recipeObj.createdAt,
        updatedAt: recipeObj.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      message: `Ditemukan ${formattedRecipes.length} recipe yang menggunakan produk dengan nama '${productName}'`,
      searchQuery: productName,
      matchedProducts: products.map(p => ({
        _id: p._id,
        name: p.name,
        sku: p.sku,
        unit: p.unit
      })),
      data: formattedRecipes
    });

  } catch (error) {
    console.error('Error fetching recipes by product name:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mencari recipe berdasarkan nama produk'
    });
  }
};

/**
 * Controller untuk mendapatkan ringkasan penggunaan produk di semua recipe
 * GET /api/products/:productId/recipe-usage-summary
 */
export const getProductRecipeUsageSummary = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID Produk tidak valid'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    // Cari semua recipe yang menggunakan produk ini
    const recipes = await Recipe.find({
      $or: [
        { 'baseIngredients.productId': productId },
        { 'toppingOptions.ingredients.productId': productId },
        { 'addonOptions.ingredients.productId': productId }
      ]
    })
      .populate('menuItemId', 'name price category availableStock isActive');

    const productStock = await ProductStock.findOne({ productId });

    // Hitung statistik
    let totalRecipes = recipes.length;
    let totalUsageInBase = 0;
    let totalUsageInToppings = 0;
    let totalUsageInAddons = 0;
    let activeMenuItems = 0;

    recipes.forEach(recipe => {
      // Base ingredients
      recipe.baseIngredients.forEach(ing => {
        if (ing.productId && ing.productId.toString() === productId) {
          totalUsageInBase += ing.quantity;
        }
      });

      // Topping options
      recipe.toppingOptions.forEach(topping => {
        topping.ingredients.forEach(ing => {
          if (ing.productId && ing.productId.toString() === productId) {
            totalUsageInToppings += ing.quantity;
          }
        });
      });

      // Addon options
      recipe.addonOptions.forEach(addon => {
        addon.ingredients.forEach(ing => {
          if (ing.productId && ing.productId.toString() === productId) {
            totalUsageInAddons += ing.quantity;
          }
        });
      });

      // Hitung menu item aktif
      if (recipe.menuItemId && recipe.menuItemId.isActive) {
        activeMenuItems++;
      }
    });

    const totalUsage = totalUsageInBase + totalUsageInToppings + totalUsageInAddons;

    res.status(200).json({
      success: true,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          currentStock: productStock?.currentStock || 0
        },
        usageSummary: {
          totalRecipes,
          activeMenuItems,
          inactiveMenuItems: totalRecipes - activeMenuItems,
          totalUsage,
          usageByType: {
            baseIngredients: totalUsageInBase,
            toppings: totalUsageInToppings,
            addons: totalUsageInAddons
          },
          averageUsagePerRecipe: totalRecipes > 0 ? totalUsage / totalRecipes : 0
        },
        stockAnalysis: {
          estimatedPortions: productStock?.currentStock
            ? Math.floor(productStock.currentStock / totalUsage)
            : 0,
          stockStatus: productStock?.currentStock > 0 ? 'in_stock' : 'out_of_stock',
          requiresRestock: (productStock?.currentStock || 0) < totalUsage
        }
      }
    });

  } catch (error) {
    console.error('Error generating product usage summary:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat ringkasan penggunaan produk'
    });
  }
};

export default {
  updateMenuAvailableStock,
  getMenuStocks,
  updateSingleMenuStock,
  adjustMenuStock,
  bulkAdjustMenuStocks,
  recordWasteStock,
  getMenuStockDetails,
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  getRecipeByMenuId,
  getRecipesByProduct,
  getRecipesByProductWithStock,
  getRecipesByProductName,
  getProductRecipeUsageSummary
};