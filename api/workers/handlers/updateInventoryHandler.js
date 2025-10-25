import mongoose from 'mongoose';
import ProductStock from '../../models/modul_menu/ProductStock.model.js';
import Recipe from '../../models/modul_menu/Recipe.model.js';
import Warehouse from '../../models/modul_market/Warehouse.model.js';
import MenuStock from '../../models/modul_menu/MenuStock.model.js';
import { MenuItem } from '../../models/MenuItem.model.js';
import Product from '../../models/modul_market/Product.model.js';

/**
 * Update inventory based on order items with multi-category & multi-warehouse support
 * @param {Object} data - payload from BullMQ job
 * @param {string} data.orderId - order ID
 * @param {Array} data.items - order items with menuItem references
 * @returns {Object} result including success status
 */
export async function updateInventoryHandler({ orderId, items, handledBy }) {
  console.log(`🔄 [ORDER: ${orderId}] Memulai update inventory untuk ${items.length} item`);

  const session = await mongoose.startSession();
  let failedItems = [];
  let successItems = [];

  try {
    await session.startTransaction();

    // Cari ID gudang pusat
    const centralWarehouse = await Warehouse.findOne({ code: 'gudang-pusat' }).session(session);
    const centralWarehouseId = centralWarehouse?._id;

    if (!centralWarehouseId) {
      throw new Error('❌ Gudang pusat tidak ditemukan');
    }

    const menuItemIds = items.map(item => new mongoose.Types.ObjectId(item.menuItem));

    // Ambil data dengan populate yang benar
    const [recipes, menuStocks, menuItems, allProducts] = await Promise.all([
      Recipe.find({ menuItemId: { $in: menuItemIds } })
        .populate('baseIngredients.productId', 'name sku')
        .populate('toppingOptions.ingredients.productId', 'name sku')
        .populate('addonOptions.ingredients.productId', 'name sku')
        .session(session),

      MenuStock.find({ menuItemId: { $in: menuItemIds } }).session(session),

      // Ambil nama menu items
      MenuItem.find({ _id: { $in: menuItemIds } })
        .select('name _id')
        .session(session),

      // Ambil semua product untuk mapping nama
      Product.find({})
        .select('name _id sku')
        .session(session)
    ]);

    // Buat mapping untuk nama - PASTIKAN menggunakan toString()
    const menuItemMap = new Map();
    menuItems.forEach(item => {
      menuItemMap.set(item._id.toString(), item.name);
    });

    const productMap = new Map();
    allProducts.forEach(product => {
      productMap.set(product._id.toString(), {
        name: product.name,
        sku: product.sku
      });
    });

    console.log(`📋 Mapping Menu Items:`, Array.from(menuItemMap.entries()));
    console.log(`📦 Mapping Products:`, Array.from(productMap.entries()).slice(0, 3)); // Log first 3 products

    const bulkProductOps = [];
    const bulkMenuStockOps = [];

    // Function untuk memproses pengurangan stok
    const processIngredientStockReduction = async (ingredient, requiredQty, orderId, noteSuffix, menuItemId) => {
      const productId = ingredient.productId;
      const productIdStr = productId._id ? productId._id.toString() : productId.toString();
      const productInfo = productMap.get(productIdStr);
      const productName = productInfo ? productInfo.name : `Unknown Product (${productIdStr})`;

      const totalRequired = ingredient.quantity * requiredQty;

      console.log(`📦 Processing bahan: ${productName}, dibutuhkan: ${totalRequired}`);

      // Cari semua stok produk ini di warehouse selain gudang pusat
      const productStocks = await ProductStock.find({
        productId: productId,
        warehouse: { $ne: centralWarehouseId }
      })
        .populate('warehouse', 'name code')
        .sort({ currentStock: -1 })
        .session(session);

      if (productStocks.length === 0) {
        throw new Error(`🚫 Stok ${productName} tidak tersedia di gudang manapun`);
      }

      let remainingRequired = totalRequired;
      const warehouseAllocations = [];

      // Alokasi stok dari berbagai warehouse
      for (const stock of productStocks) {
        if (remainingRequired <= 0) break;

        const availableStock = stock.currentStock || 0;
        const allocatedQty = Math.min(availableStock, remainingRequired);

        if (allocatedQty > 0) {
          warehouseAllocations.push({
            warehouseId: stock.warehouse,
            warehouseName: stock.warehouse?.name || 'Unknown Warehouse',
            allocatedQty: allocatedQty,
            currentStock: availableStock
          });
          remainingRequired -= allocatedQty;
        }
      }

      // Cek jika stok tidak cukup
      if (remainingRequired > 0) {
        const totalAvailable = warehouseAllocations.reduce((sum, alloc) => sum + alloc.allocatedQty, 0);
        const warehouseInfo = warehouseAllocations.map(alloc =>
          `${alloc.warehouseName}: ${alloc.allocatedQty}`
        ).join(', ');

        throw new Error(`❌ Stok ${productName} tidak mencukupi. Butuh: ${totalRequired}, Tersedia: ${totalAvailable} (${warehouseInfo})`);
      }

      // Buat bulk operations untuk setiap alokasi warehouse
      for (const allocation of warehouseAllocations) {
        bulkProductOps.push({
          updateOne: {
            filter: {
              productId: productId,
              warehouse: allocation.warehouseId
            },
            update: {
              $inc: { currentStock: -allocation.allocatedQty },
              $push: {
                movements: {
                  quantity: allocation.allocatedQty,
                  category: ingredient.category,
                  type: 'out',
                  referenceId: orderId,
                  notes: `${noteSuffix} | warehouse: ${allocation.warehouseName}`,
                  handledBy: handledBy || 'system',
                  date: new Date(),
                  sourceWarehouse: allocation.warehouseId,
                  menuItemId: menuItemId
                }
              }
            }
          }
        });
      }

      return true;
    };

    // Loop semua item order
    for (const item of items) {
      const menuItemObjectId = new mongoose.Types.ObjectId(item.menuItem);
      const menuItemIdStr = item.menuItem.toString();
      const menuItemName = menuItemMap.get(menuItemIdStr) || `Unknown Menu (${menuItemIdStr})`;

      console.log(`\n📋 Processing item: ${menuItemName} (Qty: ${item.quantity})`);

      try {
        const recipe = recipes.find(r => r.menuItemId.toString() === menuItemIdStr);

        if (!recipe) {
          const errorMsg = `Resep tidak ditemukan untuk menu item: ${menuItemName}`;
          console.warn(`⚠️ ${errorMsg}`);
          failedItems.push({
            menuItem: menuItemName,
            menuItemId: item.menuItem,
            quantity: item.quantity,
            reason: errorMsg,
            type: 'RESEP_TIDAK_DITEMUKAN'
          });
          continue;
        }

        // Cek stok menu item terlebih dahulu
        const menuStock = menuStocks.find(ms => ms.menuItemId.toString() === menuItemIdStr);

        // Jika menggunakan stok manual, cek ketersediaan
        if (menuStock && menuStock.manualStock !== null) {
          if (menuStock.manualStock < item.quantity) {
            const errorMsg = `Stok manual tidak mencukupi. Butuh: ${item.quantity}, Tersedia: ${menuStock.manualStock}`;
            console.warn(`⚠️ ${errorMsg}`);
            failedItems.push({
              menuItem: menuItemName,
              menuItemId: item.menuItem,
              quantity: item.quantity,
              available: menuStock.manualStock,
              reason: errorMsg,
              type: 'STOK_MENU_TIDAK_CUKUP'
            });
            continue;
          }
        } else {
          // Jika menggunakan calculated stock, cek ketersediaan
          const effectiveStock = menuStock ? menuStock.effectiveStock : 0;
          if (effectiveStock < item.quantity) {
            const errorMsg = `Stok kalkulasi tidak mencukupi. Butuh: ${item.quantity}, Tersedia: ${effectiveStock}`;
            console.warn(`⚠️ ${errorMsg}`);
            failedItems.push({
              menuItem: menuItemName,
              menuItemId: item.menuItem,
              quantity: item.quantity,
              available: effectiveStock,
              reason: errorMsg,
              type: 'STOK_MENU_TIDAK_CUKUP'
            });
            continue;
          }
        }

        // Process base ingredients
        console.log(`   🧩 Processing ${recipe.baseIngredients?.length || 0} bahan dasar`);
        for (const ing of recipe.baseIngredients || []) {
          await processIngredientStockReduction(
            ing,
            item.quantity,
            orderId,
            `Order ${orderId} - bahan dasar ${menuItemName}`,
            menuItemObjectId
          );
        }

        // Process toppings
        if (item.toppings?.length > 0) {
          console.log(`   🍯 Processing ${item.toppings.length} topping`);
          for (const topping of item.toppings) {
            const toppingRecipe = (recipe.toppingOptions || []).find(t => t.toppingName === topping.name);
            if (!toppingRecipe) {
              console.warn(`   ⚠️ Resep topping tidak ditemukan: ${topping.name}`);
              continue;
            }

            for (const ing of toppingRecipe.ingredients || []) {
              await processIngredientStockReduction(
                ing,
                item.quantity,
                orderId,
                `Order ${orderId} - topping ${topping.name} untuk ${menuItemName}`,
                menuItemObjectId
              );
            }
          }
        }

        // Process addons
        if (item.addons?.length > 0) {
          console.log(`   🥗 Processing ${item.addons.length} addon`);
          for (const addon of item.addons) {
            const addonRecipe = (recipe.addonOptions || []).find(a =>
              a.addonName === addon.name && a.optionLabel === addon.option
            );
            if (!addonRecipe) {
              console.warn(`   ⚠️ Resep addon tidak ditemukan: ${addon.name} - ${addon.option}`);
              continue;
            }

            for (const ing of addonRecipe.ingredients || []) {
              await processIngredientStockReduction(
                ing,
                item.quantity,
                orderId,
                `Order ${orderId} - addon ${addon.name}:${addon.option} untuk ${menuItemName}`,
                menuItemObjectId
              );
            }
          }
        }

        // Update stok menu item (hanya jika semua bahan tersedia)
        if (menuStock && menuStock.manualStock !== null) {
          bulkMenuStockOps.push({
            updateOne: {
              filter: { menuItemId: menuItemObjectId },
              update: {
                $inc: { manualStock: -item.quantity },
                $set: { lastUpdatedAt: new Date() }
              }
            }
          });
        } else {
          bulkMenuStockOps.push({
            updateOne: {
              filter: { menuItemId: menuItemObjectId },
              update: {
                $inc: { calculatedStock: -item.quantity },
                $set: { lastCalculatedAt: new Date() }
              }
            }
          });
        }

        console.log(`✅ BERHASIL: ${menuItemName} (Qty: ${item.quantity})`);
        successItems.push({
          menuItem: menuItemName,
          menuItemId: item.menuItem,
          quantity: item.quantity,
          type: 'SUCCESS'
        });

      } catch (error) {
        console.error(`❌ GAGAL: ${menuItemName} - ${error.message}`);
        failedItems.push({
          menuItem: menuItemName,
          menuItemId: item.menuItem,
          quantity: item.quantity,
          reason: error.message,
          type: 'BAHAN_TIDAK_CUKUP'
        });
      }
    }

    // Jika ada failed items, rollback seluruh transaction
    if (failedItems.length > 0) {
      const failedMenuItems = failedItems.map(f => f.menuItem).join(', ');
      const failedReasons = failedItems.map(f => `\n   - ${f.menuItem}: ${f.reason}`).join('');

      throw new Error(`🛑 Gagal memproses ${failedItems.length} item:${failedReasons}`);
    }

    // Eksekusi bulk operations hanya jika tidak ada failed items
    let productUpdateResult = null;
    let menuStockUpdateResult = null;

    if (bulkProductOps.length > 0) {
      productUpdateResult = await ProductStock.bulkWrite(bulkProductOps, { session });
      console.log(`📊 Update inventory produk: ${productUpdateResult.modifiedCount || 0} dokumen diupdate`);
    }

    if (bulkMenuStockOps.length > 0) {
      menuStockUpdateResult = await MenuStock.bulkWrite(bulkMenuStockOps, { session });
      console.log(`🍽️ Update stok menu: ${menuStockUpdateResult.modifiedCount || 0} dokumen diupdate`);
    }

    await session.commitTransaction();

    // SUMMARY REPORT
    console.log(`\n🎉 ====== LAPORAN AKHIR UPDATE INVENTORY ======`);
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`✅ BERHASIL: ${successItems.length} item`);
    successItems.forEach(item => {
      console.log(`   ✓ ${item.menuItem} (Qty: ${item.quantity})`);
    });
    console.log(`📊 Total update: ${productUpdateResult?.modifiedCount || 0} produk, ${menuStockUpdateResult?.modifiedCount || 0} menu`);
    console.log(`⏰ Timestamp: ${new Date().toLocaleString('id-ID')}`);
    console.log(`=============================================\n`);

    return {
      success: true,
      orderId,
      productUpdates: productUpdateResult?.modifiedCount || 0,
      menuStockUpdates: menuStockUpdateResult?.modifiedCount || 0,
      successItems: successItems,
      failedItems: [],
      summary: {
        totalItems: items.length,
        success: successItems.length,
        failed: 0,
        timestamp: new Date()
      }
    };

  } catch (error) {
    await session.abortTransaction();

    // DETAILED ERROR REPORT
    console.log(`\n💥 ====== LAPORAN KEGAGALAN UPDATE INVENTORY ======`);
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`❌ GAGAL: ${failedItems.length} item`);
    failedItems.forEach(item => {
      console.log(`   ✗ ${item.menuItem} (Qty: ${item.quantity})`);
      console.log(`     Alasan: ${item.reason}`);
    });
    if (successItems.length > 0) {
      console.log(`✅ BERHASIL: ${successItems.length} item`);
      successItems.forEach(item => {
        console.log(`   ✓ ${item.menuItem} (Qty: ${item.quantity})`);
      });
    }
    console.log(`📝 Error: ${error.message}`);
    console.log(`⏰ Timestamp: ${new Date().toLocaleString('id-ID')}`);
    console.log(`================================================\n`);

    return {
      success: false,
      orderId,
      error: error.message,
      successItems: successItems,
      failedItems: failedItems,
      summary: {
        totalItems: items.length,
        success: successItems.length,
        failed: failedItems.length,
        timestamp: new Date()
      }
    };
  } finally {
    await session.endSession();
  }
}