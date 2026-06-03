import mongoose from 'mongoose';
import ProductStock from '../../models/modul_menu/ProductStock.model.js';
import Recipe from '../../models/modul_menu/Recipe.model.js';
import Warehouse from '../../models/modul_market/Warehouse.model.js';
import MenuStock from '../../models/modul_menu/MenuStock.model.js';
import { MenuItem } from '../../models/MenuItem.model.js';
import Product from '../../models/modul_market/Product.model.js';
import { LockUtil } from '../../utils/lock.util.js';

/**
 * UPDATE INVENTORY HANDLER - ENHANCED VERSION WITH ATOMIC LOCK
 */
export async function updateInventoryHandler({ orderId, items, handledBy }) {
  console.log(`🔄 [ORDER: ${orderId}] Memulai update inventory untuk ${items.length} item`);

  // ✅ IMPLEMENTASI ATOMIC LOCK UNTUK INVENTORY UPDATE
  return await LockUtil.withOrderLock(`inventory-${orderId}`, async () => {
    const session = await mongoose.startSession();

    // ✅ PERBAIKAN: Deklarasi variabel di scope yang tepat
    let failedItems = [];
    let successItems = [];
    let problematicItems = [];
    let productUpdateResult = null;
    let menuStockUpdateResult = null;

    // ✅ ENHANCED: Retry mechanism untuk handle write conflicts dan stock calibration collisions
    const MAX_RETRIES = 8; // Increased from 3 to handle stock calibration conflicts
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        // ✅ ADD JITTER: Random delay to reduce collision probability during stock calibration
        if (retryCount > 0) {
          const jitter = Math.random() * 100; // 0-100ms random jitter
          await new Promise(resolve => setTimeout(resolve, jitter));
        }

        await session.startTransaction();
        console.log(`🔄 Transaction attempt ${retryCount + 1} dengan LOCK`);

        // Cari ID gudang pusat
        const centralWarehouse = await Warehouse.findOne({ code: 'gudang-pusat' }).session(session);
        const centralWarehouseId = centralWarehouse?._id;

        if (!centralWarehouseId) {
          console.warn('⚠️ Gudang pusat tidak ditemukan, menggunakan fallback logic');
        }

        const menuItemIds = items.map(item => new mongoose.Types.ObjectId(item.menuItem));

        // Ambil data dengan populate yang benar - dengan error handling
        const [recipes, menuStocks, menuItems, allProducts] = await Promise.all([
          Recipe.find({ menuItemId: { $in: menuItemIds } })
            .populate('baseIngredients.productId', 'name sku')
            .populate('toppingOptions.ingredients.productId', 'name sku')
            .populate('addonOptions.ingredients.productId', 'name sku')
            .session(session)
            .catch(error => {
              console.warn('⚠️ Error fetching recipes:', error.message);
              return [];
            }),

          MenuStock.find({ menuItemId: { $in: menuItemIds } })
            .session(session)
            .catch(error => {
              console.warn('⚠️ Error fetching menu stocks:', error.message);
              return [];
            }),

          MenuItem.find({ _id: { $in: menuItemIds } })
            .select('name _id workstation')
            .session(session)
            .catch(error => {
              console.warn('⚠️ Error fetching menu items:', error.message);
              return [];
            }),

          Product.find({})
            .select('name _id sku')
            .session(session)
            .catch(error => {
              console.warn('⚠️ Error fetching products:', error.message);
              return [];
            })
        ]);

        // Buat mapping untuk nama dengan safe handling
        const menuItemMap = new Map();
        menuItems.forEach(item => {
          if (item && item._id) {
            menuItemMap.set(item._id.toString(), {
              name: item.name || 'Unknown Menu',
              workstation: item.workstation || 'kitchen'
            });
          }
        });

        const productMap = new Map();
        allProducts.forEach(product => {
          if (product && product._id) {
            productMap.set(product._id.toString(), {
              name: product.name || 'Unknown Product',
              sku: product.sku || 'N/A'
            });
          }
        });

        // ✅ FIXED: Buat mapping untuk menu stocks - PREFER records dengan warehouseId
        // Workstation hanya menampilkan records dengan warehouseId, jadi kita harus update yang sama
        const menuStockMap = new Map();
        const menuStockWithWarehouseMap = new Map();  // Records WITH warehouseId
        const menuStockLegacyMap = new Map();         // Records WITHOUT warehouseId (fallback)

        menuStocks.forEach(stock => {
          if (stock && stock.menuItemId) {
            const menuItemIdStr = stock.menuItemId.toString();

            if (stock.warehouseId) {
              // Prefer record dengan warehouseId
              if (!menuStockWithWarehouseMap.has(menuItemIdStr)) {
                menuStockWithWarehouseMap.set(menuItemIdStr, stock);
              }
            } else {
              // Fallback: record tanpa warehouseId (legacy)
              if (!menuStockLegacyMap.has(menuItemIdStr)) {
                menuStockLegacyMap.set(menuItemIdStr, stock);
              }
            }
          }
        });

        // Combine: prefer warehouseId records, fallback to legacy
        menuStockWithWarehouseMap.forEach((stock, menuItemIdStr) => {
          menuStockMap.set(menuItemIdStr, stock);
        });
        menuStockLegacyMap.forEach((stock, menuItemIdStr) => {
          if (!menuStockMap.has(menuItemIdStr)) {
            menuStockMap.set(menuItemIdStr, stock);
            console.log(`⚠️ [FALLBACK] Menu ${menuItemIdStr} using legacy record (no warehouseId)`);
          }
        });

        console.log(`📋 Mapping Menu Items: ${menuItemMap.size} items`);
        console.log(`📦 Mapping Products: ${productMap.size} products`);
        console.log(`🍽️ Mapping Menu Stocks: ${menuStockMap.size} stocks`);

        const bulkProductOps = [];
        const bulkMenuStockOps = [];

        // 🔄 ENHANCED PROCESSING FUNCTION - NEVER THROW ERROR
        const processIngredientStockReduction = async (ingredient, requiredQty, orderId, noteSuffix, menuItemId, menuItemName) => {
          try {
            // ✅ SAFE NULL CHECK - handle semua kemungkinan null
            if (!ingredient || !ingredient.productId) {
              console.warn(`⚠️ [SAFE MODE] Ingredient invalid:`, ingredient);
              return {
                success: true,
                allocated: 0,
                required: 0,
                note: 'INGREDIENT_INVALID'
              };
            }

            const productId = ingredient.productId;
            const productIdStr = productId._id ? productId._id.toString() : productId.toString();
            const productInfo = productMap.get(productIdStr);
            const productName = productInfo ? productInfo.name : `Unknown Product (${productIdStr})`;

            // ✅ SAFE QUANTITY CALCULATION
            const ingredientQty = Number(ingredient.quantity) || 0;
            const itemQty = Number(requiredQty) || 1;
            const totalRequired = ingredientQty * itemQty;

            if (totalRequired <= 0) {
              console.warn(`⚠️ [SAFE MODE] Total required <= 0: ${totalRequired}`);
              return {
                success: true,
                allocated: 0,
                required: totalRequired,
                note: 'NO_STOCK_NEEDED'
              };
            }

            console.log(`📦 Processing bahan: ${productName}, dibutuhkan: ${totalRequired}`);

            // ✅ CARI STOK DENGAN SAFE HANDLING
            let productStocks = [];
            try {
              productStocks = await ProductStock.find({
                productId: productId,
                warehouse: { $ne: centralWarehouseId }
              })
                .populate('warehouse', 'name code')
                .sort({ currentStock: -1 })
                .session(session);
            } catch (error) {
              console.warn(`⚠️ [SAFE MODE] Error fetching stock for ${productName}:`, error.message);
            }

            if (productStocks.length === 0) {
              console.log(`⚠️ [SAFE MODE] Stok ${productName} tidak tersedia - LANJUTKAN TANPA PENGURANGAN`);

              // ✅ TETAP BUAT MOVEMENT UNTUK TRACKING MESKIPUN STOK 0
              bulkProductOps.push({
                updateOne: {
                  filter: {
                    productId: productId,
                    warehouse: centralWarehouseId || new mongoose.Types.ObjectId()
                  },
                  update: {
                    $inc: { currentStock: 0 }, // No reduction
                    $push: {
                      movements: {
                        quantity: 0,
                        category: ingredient.category || 'general',
                        type: 'out',
                        referenceId: orderId,
                        notes: `${noteSuffix} | STOK TIDAK TERSEDIA - DIPROSES TANPA PENGURANGAN`,
                        handledBy: handledBy || 'system',
                        date: new Date(),
                        sourceWarehouse: centralWarehouseId,
                        menuItemId: menuItemId,
                        status: 'skipped_no_stock'
                      }
                    }
                  },
                  upsert: true // Create record if doesn't exist
                }
              });

              return {
                success: true,
                allocated: 0,
                required: totalRequired,
                note: 'NO_STOCK_AVAILABLE'
              };
            }

            let remainingRequired = totalRequired;
            const warehouseAllocations = [];

            // ✅ ALOKASI STOK DENGAN SAFE HANDLING
            for (const stock of productStocks) {
              if (remainingRequired <= 0) break;

              const availableStock = Number(stock.currentStock) || 0;
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

            // ✅ PROSES DENGAN STOK YANG ADA MESKIPUN TIDAK CUKUP
            const totalAllocated = warehouseAllocations.reduce((sum, alloc) => sum + alloc.allocatedQty, 0);

            if (remainingRequired > 0) {
              console.log(`⚠️ [SAFE MODE] Stok ${productName} tidak mencukupi. Butuh: ${totalRequired}, Tersedia: ${totalAllocated} - DIPROSES DENGAN STOK YANG ADA`);
            }

            // ✅ BUAT BULK OPERATIONS UNTUK SETIAP ALOKASI
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
                        category: ingredient.category || 'general',
                        type: 'out',
                        referenceId: orderId,
                        notes: `${noteSuffix} | ${allocation.warehouseName} | ${remainingRequired > 0 ? 'STOK TIDAK CUKUP: diproses sebagian' : 'STOK CUKUP'}`,
                        handledBy: handledBy || 'system',
                        date: new Date(),
                        sourceWarehouse: allocation.warehouseId,
                        menuItemId: menuItemId,
                        status: remainingRequired > 0 ? 'partial' : 'complete'
                      }
                    }
                  }
                }
              });
            }

            return {
              success: true,
              allocated: totalAllocated,
              required: totalRequired,
              remaining: remainingRequired,
              note: remainingRequired > 0 ? 'PARTIAL_STOCK' : 'FULL_STOCK'
            };

          } catch (error) {
            console.error(`❌ [SAFE MODE] Error dalam processIngredientStockReduction:`, error.message);
            return {
              success: true, // ✅ TETAP LANJUTKAN MESKIPUN ERROR
              allocated: 0,
              required: 0,
              note: `PROCESS_ERROR: ${error.message}`
            };
          }
        };

        // 🔄 ENHANCED MENU STOCK UPDATE FUNCTION
        const updateMenuStock = (menuItemObjectId, menuItemIdStr, quantity, menuItemName) => {
          try {
            const existingStock = menuStockMap.get(menuItemIdStr);
            const currentManualStock = existingStock?.manualStock ?? null;
            const currentCalculatedStock = existingStock?.calculatedStock ?? 0;

            // ✅ VALIDASI STOK TIDAK BOLEH MINUS
            let newManualStock = currentManualStock;
            let newCalculatedStock = currentCalculatedStock;
            let stockReductionType = '';

            if (currentManualStock !== null) {
              newManualStock = currentManualStock - quantity;

              stockReductionType = 'manual';

              if (newManualStock < 0) {
                console.warn(`⚠️ Stok manual ${menuItemName} akan minus, adjust ke 0 (was: ${currentManualStock}, reduce: ${quantity})`);
                newManualStock = 0;
              }
            } else {
              newCalculatedStock = currentCalculatedStock - quantity;

              stockReductionType = 'calculated';

              if (newCalculatedStock < 0) {
                console.warn(`⚠️ Stok calculated ${menuItemName} akan minus, adjust ke 0 (was: ${currentCalculatedStock}, reduce: ${quantity})`);
                newCalculatedStock = 0;
              }
            }

            // ✅ HITUNG EFFECTIVE STOCK BARU
            const newEffectiveStock = currentManualStock !== null ? newManualStock : newCalculatedStock;

            console.log(`🍽️ Update stok ${menuItemName}: ${stockReductionType} stock, from ${currentManualStock !== null ? currentManualStock : currentCalculatedStock} to ${newEffectiveStock}`);

            // ✅ PREPARE UPDATE OPERATION
            const updateFields = {
              $set: {
                lastAdjustedAt: new Date(),
                adjustedBy: handledBy || 'system',
                type: 'sale',
                reason: 'order_fulfillment'
              }
            };

            if (currentManualStock !== null) {
              updateFields.$set.manualStock = newManualStock;
              updateFields.$set.currentStock = newManualStock; // ✅ UPDATE CURRENT STOCK
            } else {
              updateFields.$set.calculatedStock = newCalculatedStock;
              updateFields.$set.currentStock = newCalculatedStock; // ✅ UPDATE CURRENT STOCK
              updateFields.$set.lastCalculatedAt = new Date();
            }

            // ✅ SETONINSERT FIELDS UNTUK DOKUMEN BARU
            const setOnInsertFields = {};
            if (!existingStock) {
              setOnInsertFields.createdAt = new Date();
              setOnInsertFields.reason = 'initial_setup';
              setOnInsertFields.handledBy = 'system';

              if (currentManualStock === null) {
                setOnInsertFields.manualStock = null;
                setOnInsertFields.calculatedStock = newCalculatedStock;
              }
            }

            // ✅ FIXED: Include warehouseId in filter to update the same record workstation uses
            // If existingStock has warehouseId, use it; otherwise fallback to menuItemId only (legacy)
            const stockFilter = { menuItemId: menuItemObjectId };
            if (existingStock?.warehouseId) {
              stockFilter.warehouseId = existingStock.warehouseId;
              console.log(`   🔗 Using warehouseId filter: ${existingStock.warehouseId}`);
            } else {
              console.log(`   ⚠️ No warehouseId found, using menuItemId-only filter (legacy)`);
            }

            bulkMenuStockOps.push({
              updateOne: {
                filter: stockFilter,
                update: {
                  ...updateFields,
                  ...(Object.keys(setOnInsertFields).length > 0 && { $setOnInsert: setOnInsertFields })
                },
                upsert: true // ✅ BUAT BARU JIKA BELUM ADA
              }
            });

            return {
              success: true,
              previousStock: currentManualStock !== null ? currentManualStock : currentCalculatedStock,
              newStock: newEffectiveStock,
              reductionType: stockReductionType,
              wasAdjusted: newEffectiveStock < (currentManualStock !== null ? currentManualStock : currentCalculatedStock)
            };

          } catch (error) {
            console.error(`❌ Error dalam updateMenuStock untuk ${menuItemName}:`, error.message);
            return {
              success: false,
              error: error.message
            };
          }
        };

        // 🔄 PROCESS INDIVIDUAL ITEM - ENHANCED ERROR HANDLING
        for (const item of items) {
          const menuItemObjectId = new mongoose.Types.ObjectId(item.menuItem);
          const menuItemIdStr = item.menuItem.toString();
          const menuItemInfo = menuItemMap.get(menuItemIdStr) || {
            name: `Unknown Menu (${menuItemIdStr})`,
            workstation: 'kitchen'
          };
          const menuItemName = menuItemInfo.name;
          const workstation = menuItemInfo.workstation;

          console.log(`📋 Processing item: ${menuItemName} (Qty: ${item.quantity}, Workstation: ${workstation})`);

          try {
            const recipe = recipes.find(r => r && r.menuItemId && r.menuItemId.toString() === menuItemIdStr);

            if (!recipe) {
              console.warn(`⚠️ [SAFE MODE] Resep tidak ditemukan untuk: ${menuItemName} - LANJUTKAN TANPA RESEP`);

              // ✅ UPDATE STOK MENU MESKIPUN TIDAK ADA RESEP (DENGAN FUNGSI BARU)
              const stockUpdateResult = updateMenuStock(menuItemObjectId, menuItemIdStr, item.quantity, menuItemName);

              if (!stockUpdateResult.success) {
                throw new Error(`Gagal update stok menu: ${stockUpdateResult.error}`);
              }

              // ✅ TANDAI SEBAGAI PROBLEMATIC TAPI TETAP SUKSES
              problematicItems.push({
                menuItem: menuItemName,
                menuItemId: item.menuItem,
                quantity: item.quantity,
                issues: ['RESEP_TIDAK_DITEMUKAN'],
                workstation: workstation,
                note: 'Diproses tanpa resep - hanya update stok menu',
                stockUpdate: stockUpdateResult
              });

              console.log(`✅ BERHASIL (NO RECIPE): ${menuItemName} - hanya update stok menu`);
              successItems.push({
                menuItem: menuItemName,
                menuItemId: item.menuItem,
                quantity: item.quantity,
                type: 'SUCCESS_WITH_ISSUES',
                workstation: workstation,
                issues: ['NO_RECIPE'],
                stockUpdate: stockUpdateResult
              });
              continue;
            }

            // ✅ PROCESS BASE INGREDIENTS DENGAN SAFE HANDLING
            console.log(`   🧩 Processing ${recipe.baseIngredients?.length || 0} bahan dasar`);
            const baseIngredientResults = [];
            for (const ing of recipe.baseIngredients || []) {
              const result = await processIngredientStockReduction(
                ing,
                item.quantity,
                orderId,
                `Order ${orderId} - bahan dasar ${menuItemName}`,
                menuItemObjectId,
                menuItemName
              );
              baseIngredientResults.push(result);
            }

            // ✅ PROCESS TOPPINGS DENGAN ENHANCED ERROR HANDLING
            if (item.toppings?.length > 0) {
              console.log(`   🍯 Processing ${item.toppings.length} topping`);
              for (const topping of item.toppings) {
                try {
                  const toppingRecipe = (recipe.toppingOptions || []).find(t =>
                    t && (t.toppingName === topping.name || t._id?.toString() === topping._id?.toString())
                  );

                  if (!toppingRecipe) {
                    console.warn(`   ⚠️ [SAFE MODE] Resep topping tidak ditemukan: ${topping.name} - SKIP TOPPING`);
                    continue;
                  }

                  for (const ing of toppingRecipe.ingredients || []) {
                    await processIngredientStockReduction(
                      ing,
                      item.quantity,
                      orderId,
                      `Order ${orderId} - topping ${topping.name} untuk ${menuItemName}`,
                      menuItemObjectId,
                      menuItemName
                    );
                  }
                } catch (toppingError) {
                  console.warn(`   ⚠️ [SAFE MODE] Error processing topping ${topping.name}:`, toppingError.message);
                }
              }
            }

            // ✅ PROCESS ADDONS DENGAN ENHANCED ERROR HANDLING
            if (item.addons?.length > 0) {
              console.log(`   🥗 Processing ${item.addons.length} addon`);
              for (const addon of item.addons) {
                try {
                  const addonRecipe = (recipe.addonOptions || []).find(a =>
                    a && a.addonName === addon.name && a.optionLabel === addon.option
                  );

                  if (!addonRecipe) {
                    console.warn(`   ⚠️ [SAFE MODE] Resep addon tidak ditemukan: ${addon.name} - ${addon.option} - SKIP ADDON`);
                    continue;
                  }

                  for (const ing of addonRecipe.ingredients || []) {
                    await processIngredientStockReduction(
                      ing,
                      item.quantity,
                      orderId,
                      `Order ${orderId} - addon ${addon.name}:${addon.option} untuk ${menuItemName}`,
                      menuItemObjectId,
                      menuItemName
                    );
                  }
                } catch (addonError) {
                  console.warn(`   ⚠️ [SAFE MODE] Error processing addon ${addon.name}:`, addonError.message);
                }
              }
            }

            // ✅ UPDATE STOK MENU ITEM - DENGAN FUNGSI BARU YANG LEBIH AMAN
            const stockUpdateResult = updateMenuStock(menuItemObjectId, menuItemIdStr, item.quantity, menuItemName);

            if (!stockUpdateResult.success) {
              throw new Error(`Gagal update stok menu: ${stockUpdateResult.error}`);
            }

            // ✅ CHECK JIKA ADA MASALAH DENGAN BAHAN
            const hasStockIssues = baseIngredientResults.some(result =>
              result.note && (result.note.includes('NO_STOCK') || result.note.includes('PARTIAL'))
            );

            if (hasStockIssues) {
              problematicItems.push({
                menuItem: menuItemName,
                menuItemId: item.menuItem,
                quantity: item.quantity,
                issues: ['STOCK_ISSUES'],
                workstation: workstation,
                note: 'Diproses dengan masalah stok bahan',
                stockUpdate: stockUpdateResult
              });
              console.log(`✅ BERHASIL (WITH STOCK ISSUES): ${menuItemName}`);
              successItems.push({
                menuItem: menuItemName,
                menuItemId: item.menuItem,
                quantity: item.quantity,
                type: 'SUCCESS_WITH_ISSUES',
                workstation: workstation,
                issues: ['STOCK_ISSUES'],
                stockUpdate: stockUpdateResult
              });
            } else {
              console.log(`✅ BERHASIL: ${menuItemName} (Qty: ${item.quantity})`);
              successItems.push({
                menuItem: menuItemName,
                menuItemId: item.menuItem,
                quantity: item.quantity,
                type: 'SUCCESS',
                workstation: workstation,
                stockUpdate: stockUpdateResult
              });
            }

          } catch (error) {
            console.error(`❌ [SAFE MODE] GAGAL: ${menuItemName} - ${error.message}`);
            failedItems.push({
              menuItem: menuItemName,
              menuItemId: item.menuItem,
              quantity: item.quantity,
              reason: error.message,
              type: 'ERROR_PROSES',
              workstation: workstation
            });
          }
        }

        // ✅ EXECUTE BULK OPERATIONS MESKIPUN ADA FAILED ITEMS
        if (bulkProductOps.length > 0) {
          try {
            productUpdateResult = await ProductStock.bulkWrite(bulkProductOps, { session });
            console.log(`📊 Update inventory produk: ${productUpdateResult.modifiedCount || 0} dokumen diupdate`);
          } catch (bulkError) {
            console.error('❌ Error dalam bulk product update:', bulkError.message);
            // TETAP LANJUTKAN MESKIPUN ERROR BULK WRITE
          }
        }

        if (bulkMenuStockOps.length > 0) {
          try {
            menuStockUpdateResult = await MenuStock.bulkWrite(bulkMenuStockOps, { session });
            console.log(`🍽️ Update stok menu: ${menuStockUpdateResult.modifiedCount || 0} updated, ${menuStockUpdateResult.upsertedCount || 0} created`);
          } catch (bulkError) {
            console.error('❌ Error dalam bulk menu stock update:', bulkError.message);
            // TETAP LANJUTKAN MESKIPUN ERROR BULK WRITE
          }
        }

        await session.commitTransaction();
        console.log('✅ Transaction committed successfully dengan LOCK');
        break; // Exit retry loop on success

      } catch (error) {
        await session.abortTransaction();
        console.error(`❌ Transaction attempt ${retryCount + 1} failed:`, error.message);

        // ✅ ENHANCED: Detect berbagai jenis konflik yang bisa terjadi saat stock calibration
        const isRetryableError =
          error.message.includes('Write conflict') ||
          error.message.includes('version') ||
          error.message.includes('_v') ||
          error.message.includes('conflict') ||
          error.message.includes('duplicate key') ||
          error.code === 11000 || // Duplicate key error
          error.code === 112 || // WriteConflict
          error.name === 'VersionError' ||
          error.name === 'MongoServerError';

        if (isRetryableError && retryCount < MAX_RETRIES - 1) {
          retryCount++;
          // ✅ ENHANCED: Longer backoff untuk menghindari collision dengan stock calibration
          const backoffDelay = 500 * Math.pow(1.5, retryCount); // 500ms, 750ms, 1125ms, 1687ms, 2531ms, 3796ms, 5694ms
          console.log(`🔄 Retrying transaction (${retryCount}/${MAX_RETRIES}) after ${Math.round(backoffDelay)}ms...`);
          console.log(`   Error type: ${error.name || 'Unknown'}, Code: ${error.code || 'N/A'}`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        } else {
          // Final failure after all retries
          console.error('💥 All transaction attempts failed');

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
            problematicItems: problematicItems,
            summary: {
              totalItems: items.length,
              success: successItems.length,
              failed: failedItems.length,
              problematic: problematicItems.length,
              timestamp: new Date(),
              retryAttempts: retryCount + 1
            }
          };
        }
      } finally {
        await session.endSession();
      }
    }

    // ✅ SUCCESS REPORT
    console.log(`\n🎉 ====== LAPORAN AKHIR UPDATE INVENTORY ======`);
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`✅ BERHASIL: ${successItems.length} item`);

    // Group by workstation untuk reporting yang lebih baik
    const workstationSummary = {};
    successItems.forEach(item => {
      const workstation = item.workstation || 'unknown';
      workstationSummary[workstation] = (workstationSummary[workstation] || 0) + 1;
    });

    console.log(`📊 Distribusi Workstation:`);
    Object.entries(workstationSummary).forEach(([ws, count]) => {
      console.log(`   • ${ws}: ${count} items`);
    });

    if (problematicItems.length > 0) {
      console.log(`⚠️  PROBLEMATIC: ${problematicItems.length} item (tetap diproses)`);
      problematicItems.forEach(item => {
        console.log(`   ⚠️ ${item.menuItem} (${item.workstation}) - Issues: ${item.issues?.join(', ')}`);
      });
    }

    if (failedItems.length > 0) {
      console.log(`❌ GAGAL: ${failedItems.length} item`);
      failedItems.forEach(item => {
        console.log(`   ✗ ${item.menuItem} (Qty: ${item.quantity}) - ${item.reason}`);
      });
    }

    console.log(`📊 Total update: ${productUpdateResult?.modifiedCount || 0} produk, ${menuStockUpdateResult?.modifiedCount || 0} menu (${menuStockUpdateResult?.upsertedCount || 0} baru)`);
    console.log(`🔄 Retry attempts: ${retryCount}`);
    console.log(`⏰ Timestamp: ${new Date().toLocaleString('id-ID')}`);
    console.log(`🔒 LOCK: Inventory update completed dengan atomic lock`);
    console.log(`=============================================\n`);

    return {
      success: true,
      orderId,
      productUpdates: productUpdateResult?.modifiedCount || 0,
      menuStockUpdates: menuStockUpdateResult?.modifiedCount || 0,
      menuStockCreated: menuStockUpdateResult?.upsertedCount || 0,
      successItems: successItems,
      failedItems: failedItems,
      problematicItems: problematicItems,
      summary: {
        totalItems: items.length,
        success: successItems.length,
        failed: failedItems.length,
        problematic: problematicItems.length,
        timestamp: new Date(),
        retryAttempts: retryCount + 1,
        workstationSummary: workstationSummary,
        note: 'SEMUA ITEM DIPROSES - Validasi dilonggarkan untuk memastikan printing'
      }
    };
  }, {
    owner: `inventory-${process.pid}`,
    ttlMs: 120000, // 2 minutes lock untuk inventory (lebih lama karena kompleks)
    retryDelayMs: 300,
    maxRetries: 10,
    onRetry: (attempt) => {
      console.log(`🔄 [LOCK] Retrying inventory lock acquisition for order ${orderId}, attempt ${attempt}`);
    }
  }).catch(lockError => {
    // Handle lock acquisition failure
    console.error(`❌ [LOCK] Failed to acquire lock for inventory update:`, lockError.message);

    return {
      success: false,
      orderId,
      error: `Inventory update sedang diproses untuk order ini: ${lockError.message}`,
      successItems: [],
      failedItems: items.map(item => ({
        menuItem: `Item ${item.menuItem}`,
        menuItemId: item.menuItem,
        quantity: item.quantity,
        reason: 'LOCK_ACQUISITION_FAILED',
        type: 'LOCK_ERROR'
      })),
      problematicItems: [],
      summary: {
        totalItems: items.length,
        success: 0,
        failed: items.length,
        problematic: 0,
        timestamp: new Date(),
        retryAttempts: 0,
        note: 'INVENTORY_LOCK_FAILED'
      }
    };
  });
}