// // services/stockCalibration.service.js
// import cron from 'node-cron';
// import mongoose from 'mongoose';
// import Recipe from '../models/modul_menu/Recipe.model.js';
// import { MenuItem } from '../models/MenuItem.model.js';
// import ProductStock from '../models/modul_menu/ProductStock.model.js';
// import MenuStock from '../models/modul_menu/MenuStock.model.js';
// import Lock from '../models/Lock.model.js'; // ✅ Import dari model terpisah
// import { calculateMaxPortions } from '../utils/stockCalculator.js';
// /**
//  * ✅ Atomic Lock Implementation dengan retry mechanism (SILENT MODE)
//  */
// const acquireLock = async (lockId, timeoutMs = 30000, retryDelayMs = 500) => {
//     const owner = `stock-calibration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//     const expiresAt = new Date(Date.now() + timeoutMs);

//     let attempts = 0;
//     const maxAttempts = Math.floor(timeoutMs / retryDelayMs);

//     while (attempts < maxAttempts) {
//         try {
//             // Try to create lock document atomically
//             const result = await Lock.findOneAndUpdate(
//                 {
//                     _id: lockId,
//                     $or: [
//                         { expiresAt: { $lt: new Date() } }, // Expired lock
//                         { expiresAt: { $exists: false } }   // No expiration
//                     ]
//                 },
//                 {
//                     $set: {
//                         _id: lockId,
//                         lockedAt: new Date(),
//                         expiresAt: expiresAt,
//                         owner: owner
//                     }
//                 },
//                 {
//                     upsert: true,
//                     new: true,
//                     runValidators: true
//                 }
//             );

//             if (result.owner === owner) {
//                 // 🔇 SILENT MODE: Tidak log acquire lock untuk single items
//                 if (!lockId.startsWith('calibrate-single-')) {
//                     console.log(`🔒 Lock acquired: ${lockId}`);
//                 }
//                 return {
//                     success: true,
//                     lockId,
//                     owner,
//                     release: () => releaseLock(lockId, owner)
//                 };
//             }
//         } catch (error) {
//             // If duplicate key error or other issues, wait and retry
//             if (error.code === 11000 || error.message.includes('duplicate')) {
//                 // Lock is held by another process
//                 attempts++;
//                 if (attempts < maxAttempts) {
//                     await new Promise(resolve => setTimeout(resolve, retryDelayMs));
//                     continue;
//                 }
//             }
//             throw error;
//         }

//         attempts++;
//         if (attempts < maxAttempts) {
//             await new Promise(resolve => setTimeout(resolve, retryDelayMs));
//         }
//     }

//     throw new Error(`Could not acquire lock ${lockId} after ${maxAttempts} attempts`);
// };

// /**
//  * ✅ Release lock dengan ownership verification (SILENT MODE)
//  */
// const releaseLock = async (lockId, owner) => {
//     try {
//         const result = await Lock.findOneAndDelete({
//             _id: lockId,
//             owner: owner
//         });

//         if (result) {
//             // 🔇 SILENT MODE: Tidak log release lock untuk single items
//             if (!lockId.startsWith('calibrate-single-')) {
//                 console.log(`🔓 Lock released: ${lockId}`);
//             }
//             return true;
//         } else {
//             // ❌ Hanya log warning jika lock tidak ditemukan (ini adalah error condition)
//             console.warn(`⚠️ Lock ${lockId} not found or ownership changed`);
//             return false;
//         }
//     } catch (error) {
//         console.error(`❌ Error releasing lock ${lockId}:`, error.message);
//         return false;
//     }
// };

// /**
//  * ✅ Cleanup expired locks (should run periodically)
//  */
// const cleanupExpiredLocks = async () => {
//     try {
//         const result = await Lock.deleteMany({
//             expiresAt: { $lt: new Date() }
//         });

//         if (result.deletedCount > 0) {
//             console.log(`🧹 Cleaned up ${result.deletedCount} expired locks`);
//         }

//         return result.deletedCount;
//     } catch (error) {
//         console.error('Error cleaning up expired locks:', error);
//         return 0;
//     }
// };

// /**
//  * Kalibrasi stok semua menu items dengan ATOMIC LOCK + optimasi
//  */
// export const calibrateAllMenuStocks = async () => {
//     const lockId = 'calibrate-all-menu-stocks';
//     let lock;

//     try {
//         // ✅ Acquire atomic lock
//         lock = await acquireLock(lockId, 600000); // 10 minute timeout

//         let successCount = 0;
//         let errorCount = 0;
//         let activatedCount = 0;
//         let deactivatedCount = 0;
//         let resetMinusCount = 0;
//         const batchSize = 25;
//         const startTime = Date.now();

//         console.log('🔄 Memulai kalibrasi stok semua menu items dengan ATOMIC LOCK...');

//         // Ambil hanya ID dan name saja dengan optimasi query
//         const menuItems = await MenuItem.find()
//             .select('_id name isActive availableStock')
//             .lean()
//             .maxTimeMS(30000); // Timeout 30 detik

//         console.log(`📊 Total menu items: ${menuItems.length}`);

//         // Process in batches dengan sequential processing dan error handling
//         for (let i = 0; i < menuItems.length; i += batchSize) {
//             const batchStartTime = Date.now();
//             const batch = menuItems.slice(i, i + batchSize);
//             const batchNumber = Math.floor(i / batchSize) + 1;
//             const totalBatches = Math.ceil(menuItems.length / batchSize);

//             console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)...`);

//             let batchSuccessCount = 0;
//             let batchErrorCount = 0;

//             // Process batch secara SEQUENTIAL untuk hindari database overload
//             for (const menuItem of batch) {
//                 try {
//                     const result = await calibrateSingleMenuStock(menuItem._id.toString());

//                     if (result.statusChange) {
//                         if (result.statusChange === 'activated') activatedCount++;
//                         if (result.statusChange === 'deactivated') deactivatedCount++;
//                     }
//                     if (result.manualStockReset) {
//                         resetMinusCount++;
//                     }

//                     successCount++;
//                     batchSuccessCount++;
//                 } catch (error) {
//                     errorCount++;
//                     batchErrorCount++;
//                     // ❌ HANYA TAMPILKAN JIKA ADA ERROR
//                     console.error(`❌ Gagal mengkalibrasi ${menuItem.name}:`, error.message);
//                     continue;
//                 }

//                 // Tambahkan delay kecil antara setiap item
//                 await new Promise(resolve => setTimeout(resolve, 50));
//             }

//             const batchDuration = Date.now() - batchStartTime;
//             const avgTimePerItem = batchDuration / batch.length;

//             // ✅ Hanya tampilkan summary batch, tidak detail per item
//             console.log(`✅ Batch ${batchNumber} selesai: ${batchSuccessCount} berhasil, ${batchErrorCount} gagal (${batchDuration}ms, avg ${avgTimePerItem.toFixed(0)}ms/item)`);

//             // Delay antara batch
//             if (i + batchSize < menuItems.length) {
//                 await new Promise(resolve => setTimeout(resolve, 500));
//             }

//             // ✅ Extend lock duration setiap batch untuk long-running processes
//             if (lock) {
//                 await extendLock(lockId, lock.owner, 300000); // Extend 5 minutes
//             }
//         }

//         const totalDuration = Math.round((Date.now() - startTime) / 1000);
//         const avgTimeTotal = (Date.now() - startTime) / menuItems.length;

//         console.log(`🎉 KALIBRASI SELESAI dalam ${totalDuration} detik`);
//         console.log(`📊 Hasil: ${successCount} berhasil, ${errorCount} gagal dari ${menuItems.length} total`);
//         console.log(`🔄 Status changes: ${activatedCount} diaktifkan, ${deactivatedCount} dinonaktifkan`);
//         console.log(`🔄 Manual stock reset: ${resetMinusCount} direset dari minus ke 0`);
//         console.log(`⏱️  Rata-rata waktu per item: ${avgTimeTotal.toFixed(0)}ms`);

//         return {
//             success: true,
//             processed: menuItems.length,
//             successCount,
//             errorCount,
//             activatedCount,
//             deactivatedCount,
//             resetMinusCount,
//             duration: `${totalDuration} seconds`,
//             avgTimePerItem: `${avgTimeTotal.toFixed(0)}ms`,
//             timestamp: new Date()
//         };

//     } catch (error) {
//         console.error('❌ Kalibrasi semua menu items gagal:', error);
//         return {
//             success: false,
//             error: error.message,
//             timestamp: new Date()
//         };
//     } finally {
//         // ✅ Always release lock
//         if (lock) {
//             await lock.release();
//         }
//     }
// };

// /**
//  * ✅ Extend lock duration
//  */
// const extendLock = async (lockId, owner, additionalMs) => {
//     try {
//         const result = await Lock.findOneAndUpdate(
//             {
//                 _id: lockId,
//                 owner: owner,
//                 expiresAt: { $gt: new Date() }
//             },
//             {
//                 $set: {
//                     expiresAt: new Date(Date.now() + additionalMs)
//                 }
//             }
//         );

//         return !!result;
//     } catch (error) {
//         console.error(`Error extending lock ${lockId}:`, error);
//         return false;
//     }
// };

// /**
//  * Kalibrasi stok untuk menu item tertentu dengan ATOMIC LOCK per item (SILENT MODE)
//  */
// export const calibrateSingleMenuStock = async (menuItemId) => {
//     const lockId = `calibrate-single-${menuItemId}`;
//     let lock;

//     try {
//         // ✅ Acquire lock untuk menu item spesifik (SILENT mode)
//         lock = await acquireLock(lockId, 60000); // 1 minute timeout

//         const menuItem = await MenuItem.findById(menuItemId);
//         if (!menuItem) {
//             throw new Error('Menu item tidak ditemukan');
//         }

//         const recipe = await Recipe.findOne({ menuItemId: menuItem._id })
//             .select('baseIngredients')
//             .lean()
//             .maxTimeMS(10000);

//         let calculatedStock = 0;

//         // Hitung stok berdasarkan resep dengan optimasi
//         if (recipe?.baseIngredients?.length > 0) {
//             const defaultIngredients = recipe.baseIngredients.filter(ing => ing.isDefault);
//             if (defaultIngredients.length > 0) {
//                 calculatedStock = await calculateMaxPortions(defaultIngredients);
//             }
//         }

//         // Cari atau buat MenuStock dengan atomic operations
//         let menuStock = await MenuStock.findOne({ menuItemId: menuItem._id });

//         // ✅ Reset manualStock yang minus ke 0 dengan atomic update
//         let manualStockReset = false;
//         let previousManualStock = null;

//         if (menuStock) {
//             const previousStock = menuStock.currentStock;

//             // ✅ ATOMIC UPDATE: Reset manual stock minus
//             if (menuStock.manualStock !== null && menuStock.manualStock !== undefined && menuStock.manualStock < 0) {
//                 previousManualStock = menuStock.manualStock;

//                 // Gunakan atomic update untuk menghindari race condition
//                 const updateResult = await MenuStock.findOneAndUpdate(
//                     {
//                         _id: menuStock._id,
//                         manualStock: { $lt: 0 } // Conditional update
//                     },
//                     {
//                         $set: {
//                             manualStock: 0,
//                             currentStock: 0,
//                             lastAdjustedAt: new Date(),
//                             adjustedBy: 'system',
//                             notes: `Auto-reset minus stock: ${previousManualStock} → 0`
//                         }
//                     },
//                     { new: true }
//                 );

//                 if (updateResult) {
//                     manualStockReset = true;
//                     menuStock = updateResult;
//                     // ✅ Hanya tampilkan jika benar-benar ada reset
//                     console.log(`🔄 Reset manual stock ${menuItem.name}: ${previousManualStock} → 0`);
//                 }
//             }

//             // Only update calculatedStock if manualStock is not set
//             if (menuStock.manualStock === null || menuStock.manualStock === undefined || menuStock.manualStock === 0) {
//                 // Atomic update untuk calculated stock
//                 const updateResult = await MenuStock.findOneAndUpdate(
//                     { _id: menuStock._id },
//                     {
//                         $set: {
//                             calculatedStock: calculatedStock,
//                             currentStock: calculatedStock,
//                             quantity: calculatedStock - menuStock.currentStock,
//                             lastCalculatedAt: new Date()
//                         }
//                     },
//                     { new: true }
//                 );

//                 if (updateResult) {
//                     menuStock = updateResult;
//                 }
//             } else {
//                 // Update current stock based on manual stock
//                 const updateResult = await MenuStock.findOneAndUpdate(
//                     { _id: menuStock._id },
//                     {
//                         $set: {
//                             currentStock: menuStock.manualStock,
//                             quantity: 0,
//                             lastCalculatedAt: new Date()
//                         }
//                     },
//                     { new: true }
//                 );

//                 if (updateResult) {
//                     menuStock = updateResult;
//                 }
//             }
//         } else {
//             // Buat MenuStock baru dengan atomic operation
//             menuStock = await MenuStock.create({
//                 menuItemId: menuItem._id,
//                 type: 'adjustment',
//                 quantity: 0,
//                 reason: 'manual_adjustment',
//                 previousStock: 0,
//                 currentStock: calculatedStock,
//                 calculatedStock: calculatedStock,
//                 manualStock: null,
//                 handledBy: 'system',
//                 notes: 'Initial stock calibration by system',
//                 lastCalculatedAt: new Date(),
//                 lastAdjustedAt: new Date()
//             });
//         }

//         // Hitung effective stock
//         const effectiveStock = menuStock.manualStock !== null && menuStock.manualStock !== undefined
//             ? menuStock.manualStock
//             : menuStock.calculatedStock;

//         // ✅ ATOMIC UPDATE: Auto activate/deactivate berdasarkan stok
//         let statusChange = null;
//         const previousStatus = menuItem.isActive;

//         // Logic untuk auto activate/deactivate
//         const shouldBeActive = (menuStock.manualStock !== null && menuStock.manualStock !== undefined)
//             ? menuStock.manualStock >= 1
//             : effectiveStock > 0;

//         // Atomic update untuk menu item status
//         const menuItemUpdate = await MenuItem.findOneAndUpdate(
//             { _id: menuItemId },
//             {
//                 $set: {
//                     isActive: shouldBeActive,
//                     availableStock: effectiveStock
//                 }
//             },
//             { new: true }
//         );

//         if (menuItemUpdate) {
//             if (previousStatus !== shouldBeActive) {
//                 statusChange = shouldBeActive ? 'activated' : 'deactivated';
//                 // ✅ Hanya tampilkan jika ada perubahan status
//                 console.log(`${shouldBeActive ? '🟢' : '🔴'} ${statusChange} ${menuItem.name} - stok: ${effectiveStock}`);
//             }
//         }

//         return {
//             success: true,
//             menuItemId: menuItem._id.toString(),
//             menuItemName: menuItem.name,
//             calculatedStock,
//             manualStock: menuStock.manualStock,
//             previousManualStock,
//             effectiveStock,
//             previousStatus,
//             currentStatus: shouldBeActive,
//             statusChange,
//             manualStockReset,
//             timestamp: new Date()
//         };

//     } catch (error) {
//         console.error(`❌ Gagal mengkalibrasi menu item ${menuItemId}:`, error);

//         // ✅ Fallback dengan atomic operation
//         if (error.message.includes('manualStock') || error.message.includes('Write conflict')) {
//             try {
//                 await resetMinusManualStock(menuItemId);
//                 return {
//                     success: true,
//                     menuItemId: menuItemId,
//                     menuItemName: 'Unknown (fallback)',
//                     manualStockReset: true,
//                     fallbackUsed: true,
//                     timestamp: new Date()
//                 };
//             } catch (fallbackError) {
//                 console.error(`❌ Fallback reset juga gagal untuk ${menuItemId}:`, fallbackError.message);
//             }
//         }

//         throw error;
//     } finally {
//         // ✅ Always release lock (SILENT mode)
//         if (lock) {
//             await lock.release();
//         }
//     }
// };

// /**
//  * ✅ FUNGSI BARU: Reset manual stock yang minus dengan approach langsung ke database
//  */
// export const resetMinusManualStock = async (menuItemId) => {
//     const session = await mongoose.startSession();

//     try {
//         await session.startTransaction();

//         // Update langsung dengan $set untuk menghindari validation error
//         const result = await MenuStock.findOneAndUpdate(
//             { menuItemId: new mongoose.Types.ObjectId(menuItemId) },
//             {
//                 $set: {
//                     manualStock: 0,
//                     currentStock: 0,
//                     lastAdjustedAt: new Date(),
//                     adjustedBy: 'system',
//                     notes: 'Auto-reset minus manual stock to 0'
//                 }
//             },
//             { session, new: true }
//         );

//         if (result) {
//             console.log(`✅ Berhasil reset manual stock untuk ${menuItemId}: ${result.manualStock} → 0`);

//             // Update juga MenuItem
//             await MenuItem.findByIdAndUpdate(
//                 menuItemId,
//                 {
//                     $set: {
//                         availableStock: 0,
//                         isActive: false
//                     }
//                 },
//                 { session }
//             );
//         }

//         await session.commitTransaction();
//         return { success: true, reset: true };

//     } catch (error) {
//         await session.abortTransaction();
//         console.error(`❌ Gagal reset manual stock untuk ${menuItemId}:`, error.message);
//         throw error;
//     } finally {
//         await session.endSession();
//     }
// };

// /**
//  * ✅ Bulk reset dengan ATOMIC LOCK
//  */
// export const bulkResetMinusManualStocks = async () => {
//     const lockId = 'bulk-reset-minus-stocks';
//     let lock;

//     try {
//         lock = await acquireLock(lockId, 300000); // 5 minute timeout

//         console.log('🔄 Memulai bulk reset manual stock yang minus dengan ATOMIC LOCK...');

//         // Gunakan bulk operations untuk efisiensi
//         const minusStocks = await MenuStock.find({
//             manualStock: { $lt: 0 }
//         }).select('_id manualStock menuItemId').lean();

//         console.log(`📊 Ditemukan ${minusStocks.length} menu dengan manual stock minus`);

//         if (minusStocks.length === 0) {
//             return {
//                 success: true,
//                 totalMinus: 0,
//                 resetCount: 0,
//                 errorCount: 0,
//                 timestamp: new Date()
//             };
//         }

//         // ✅ Gunakan bulkWrite untuk atomic operations
//         const bulkOperations = [];
//         const menuItemUpdates = [];

//         for (const stock of minusStocks) {
//             bulkOperations.push({
//                 updateOne: {
//                     filter: { _id: stock._id },
//                     update: {
//                         $set: {
//                             manualStock: 0,
//                             currentStock: 0,
//                             lastAdjustedAt: new Date(),
//                             adjustedBy: 'system',
//                             notes: `Bulk reset: ${stock.manualStock} → 0`
//                         }
//                     }
//                 }
//             });

//             menuItemUpdates.push({
//                 updateOne: {
//                     filter: { _id: stock.menuItemId },
//                     update: {
//                         $set: {
//                             availableStock: 0,
//                             isActive: false
//                         }
//                     }
//                 }
//             });
//         }

//         // Eksekusi bulk operations
//         const [stockResult, menuItemResult] = await Promise.all([
//             MenuStock.bulkWrite(bulkOperations, { ordered: false }), // ordered: false untuk continue meski ada error
//             MenuItem.bulkWrite(menuItemUpdates, { ordered: false })
//         ]);

//         const resetCount = stockResult.modifiedCount || 0;

//         console.log(`✅ Bulk reset selesai: ${resetCount} berhasil`);

//         return {
//             success: true,
//             totalMinus: minusStocks.length,
//             resetCount,
//             errorCount: minusStocks.length - resetCount,
//             timestamp: new Date()
//         };

//     } catch (error) {
//         console.error('❌ Bulk reset manual stock gagal:', error);
//         return {
//             success: false,
//             error: error.message,
//             timestamp: new Date()
//         };
//     } finally {
//         if (lock) {
//             await lock.release();
//         }
//     }
// };

// /**
//  * Setup cron job dengan ATOMIC LOCK protection
//  */
// export const setupStockCalibrationCron = () => {
//     // Jalankan setiap 3 jam pada menit 5
//     cron.schedule('5 */3 * * *', async () => {
//         console.log('⏰ Menjalankan scheduled stock calibration dengan ATOMIC LOCK...');

//         const lockId = 'scheduled-stock-calibration';
//         let lock;

//         try {
//             // ✅ Coba acquire lock untuk scheduled job
//             lock = await acquireLock(lockId, 3540000); // 59 minutes (kurang dari interval 3 jam)

//             // Cek koneksi database sebelum mulai
//             if (mongoose.connection.readyState !== 1) {
//                 console.warn('⚠️ Database tidak terkoneksi, skip scheduled calibration');
//                 return;
//             }

//             // ✅ Cleanup expired locks terlebih dahulu
//             await cleanupExpiredLocks();

//             const calibrationStartTime = Date.now();

//             // ✅ Jalankan bulk reset terlebih dahulu
//             const resetResult = await bulkResetMinusManualStocks();
//             if (resetResult.success && resetResult.resetCount > 0) {
//                 console.log(`🔄 Sebelum kalibrasi: ${resetResult.resetCount} manual stock direset dari minus`);
//             }

//             const result = await calibrateAllMenuStocks();

//             const totalDuration = Math.round((Date.now() - calibrationStartTime) / 1000);

//             if (result.success) {
//                 console.log(`📈 Scheduled stock calibration completed in ${totalDuration}s:`, {
//                     processed: result.processed,
//                     successCount: result.successCount,
//                     errorCount: result.errorCount,
//                     activatedCount: result.activatedCount,
//                     deactivatedCount: result.deactivatedCount,
//                     resetMinusCount: result.resetMinusCount
//                 });
//             } else {
//                 console.error('❌ Scheduled stock calibration failed:', result.error);
//             }
//         } catch (error) {
//             if (error.message.includes('Could not acquire lock')) {
//                 console.log('⏭️ Scheduled calibration skipped - already running in another process');
//             } else {
//                 console.error('❌ Scheduled stock calibration failed:', error);
//             }
//         } finally {
//             if (lock) {
//                 await lock.release();
//             }
//         }
//     });

//     // Jalankan sekali saat startup dengan delay dan lock protection
//     setTimeout(async () => {
//         const lockId = 'initial-stock-calibration';
//         let lock;

//         try {
//             lock = await acquireLock(lockId, 3600000); // 1 hour timeout
//             console.log('🚀 Menjalankan initial stock calibration dengan ATOMIC LOCK...');

//             const startTime = Date.now();

//             // ✅ Reset minus stocks terlebih dahulu
//             await bulkResetMinusManualStocks();
//             await calibrateAllMenuStocks();

//             const duration = Math.round((Date.now() - startTime) / 1000);
//             console.log(`🎯 Initial calibration completed in ${duration} seconds`);

//         } catch (error) {
//             if (error.message.includes('Could not acquire lock')) {
//                 console.log('⏭️ Initial calibration skipped - already running in another process');
//             } else {
//                 console.error('Initial calibration failed:', error);
//             }
//         } finally {
//             if (lock) {
//                 await lock.release();
//             }
//         }
//     }, 30000); // Delay 30 detik setelah startup
// };

// /**
//  * Kalibrasi stok untuk menu items tertentu saja dengan auto activate/deactivate
//  */
// export const calibrateSelectedMenuStocks = async (menuItemIds) => {
//     let successCount = 0;
//     let errorCount = 0;
//     let activatedCount = 0;
//     let deactivatedCount = 0;
//     let resetMinusCount = 0;

//     try {
//         console.log(`🔄 Memulai kalibrasi ${menuItemIds.length} menu items terpilih...`);

//         // Validasi input
//         if (!Array.isArray(menuItemIds) || menuItemIds.length === 0) {
//             throw new Error('menuItemIds harus berupa array yang tidak kosong');
//         }

//         const startTime = Date.now();

//         // Process dengan concurrency terbatas
//         const concurrencyLimit = 10;
//         for (let i = 0; i < menuItemIds.length; i += concurrencyLimit) {
//             const batchStartTime = Date.now();
//             const batch = menuItemIds.slice(i, i + concurrencyLimit);
//             const batchNumber = Math.floor(i / concurrencyLimit) + 1;
//             const totalBatches = Math.ceil(menuItemIds.length / concurrencyLimit);

//             console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)...`);

//             const batchPromises = batch.map(async (menuItemId) => {
//                 try {
//                     const result = await calibrateSingleMenuStock(menuItemId);

//                     if (result.statusChange) {
//                         if (result.statusChange === 'activated') activatedCount++;
//                         if (result.statusChange === 'deactivated') deactivatedCount++;
//                     }
//                     if (result.manualStockReset) {
//                         resetMinusCount++;
//                     }

//                     successCount++;
//                     return result;
//                 } catch (error) {
//                     console.error(`❌ Gagal mengkalibrasi menu item ${menuItemId}:`, error.message);
//                     errorCount++;
//                     return null;
//                 }
//             });

//             await Promise.allSettled(batchPromises);

//             const batchDuration = Date.now() - batchStartTime;
//             console.log(`✅ Batch ${batchNumber} selesai: ${batch.length} items (${batchDuration}ms)`);

//             // Delay antara batch
//             if (i + concurrencyLimit < menuItemIds.length) {
//                 await new Promise(resolve => setTimeout(resolve, 500));
//             }
//         }

//         const totalDuration = Math.round((Date.now() - startTime) / 1000);

//         console.log(`✅ Kalibrasi terpilih selesai dalam ${totalDuration} detik: ${successCount} berhasil, ${errorCount} gagal`);
//         console.log(`🔄 Status changes: ${activatedCount} diaktifkan, ${deactivatedCount} dinonaktifkan`);
//         console.log(`🔄 Manual stock reset: ${resetMinusCount} direset dari minus ke 0`);

//         return {
//             success: true,
//             processed: menuItemIds.length,
//             successCount,
//             errorCount,
//             activatedCount,
//             deactivatedCount,
//             resetMinusCount,
//             duration: `${totalDuration} seconds`,
//             timestamp: new Date()
//         };

//     } catch (error) {
//         console.error('❌ Kalibrasi selected menu stocks gagal:', error);
//         return {
//             success: false,
//             error: error.message,
//             timestamp: new Date()
//         };
//     }
// };

// /**
//  * Kalibrasi manual via API
//  */
// export const manualStockCalibration = async (req, res) => {
//     try {
//         console.log('🎛️ Manual stock calibration requested');

//         const { type, menuItemIds, includeStatusFix = true, resetMinusFirst = true } = req.body;

//         let result;

//         // ✅ Reset minus stocks terlebih dahulu jika diminta
//         if (resetMinusFirst) {
//             const resetResult = await bulkResetMinusManualStocks();
//             console.log(`🔄 Pre-reset: ${resetResult.resetCount || 0} manual stock direset`);
//         }

//         if (type === 'selected' && menuItemIds && Array.isArray(menuItemIds)) {
//             if (menuItemIds.length === 0) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'menuItemIds tidak boleh kosong'
//                 });
//             }
//             result = await calibrateSelectedMenuStocks(menuItemIds);
//         } else {
//             result = await calibrateAllMenuStocks();
//         }

//         res.status(200).json({
//             success: result.success,
//             message: 'Kalibrasi stok manual selesai',
//             data: result
//         });
//     } catch (error) {
//         console.error('Manual stock calibration failed:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Kalibrasi stok manual gagal',
//             error: error.message
//         });
//     }
// };

// // Ekspor fungsi lock untuk testing dan manual cleanup
// export { acquireLock, releaseLock, cleanupExpiredLocks };