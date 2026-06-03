import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MenuItem } from '../models/MenuItem.model.js';
import MenuStock from '../models/modul_menu/MenuStock.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function activateAllMenus() {
    try {
        const mongoUri = process.env.MONGO_PROD || process.env.MONGO;
        if (!mongoUri) {
            console.error('❌ MONGO_PROD or MONGO environment variable is missing');
            process.exit(1);
        }

        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const menuItems = await MenuItem.find({});
        console.log(`📊 Found ${menuItems.length} total menu items`);

        let activatedCount = 0;
        let stockSeedCount = 0;

        for (const item of menuItems) {
            let needsSave = false;

            // 1. Activate menu if not active
            if (!item.isActive) {
                item.isActive = true;
                needsSave = true;
                activatedCount++;
            }

            // 2. Seed stock if availableStock is 0 or less
            if (item.availableStock <= 0) {
                // Try to find a target warehouse
                // 1. From workstationMapping
                // 2. From warehouseStocks
                // 3. Fallback to any warehouse if available (or skip)

                let targetWarehouseId = null;
                if (item.workstationMapping && item.workstationMapping.length > 0) {
                    const primaryMapping = item.workstationMapping.find(m => m.isPrimary) || item.workstationMapping[0];
                    targetWarehouseId = primaryMapping.warehouseId;
                } else if (item.warehouseStocks && item.warehouseStocks.length > 0) {
                    targetWarehouseId = item.warehouseStocks[0].warehouseId;
                }

                if (targetWarehouseId) {
                    // Upsert MenuStock
                    await MenuStock.findOneAndUpdate(
                        { menuItemId: item._id, warehouseId: targetWarehouseId },
                        {
                            $set: {
                                manualStock: 50,
                                adjustmentNote: 'Initial seed via script to activate menu',
                                lastAdjustedAt: new Date()
                            }
                        },
                        { upsert: true, new: true }
                    );

                    // Update item's warehouse stock array for immediate reflected availableStock
                    const wsIndex = item.warehouseStocks.findIndex(ws => ws.warehouseId.toString() === targetWarehouseId.toString());
                    if (wsIndex >= 0) {
                        item.warehouseStocks[wsIndex].stock = 50;
                    } else {
                        item.warehouseStocks.push({
                            warehouseId: targetWarehouseId,
                            stock: 50,
                            workstation: item.workstation
                        });
                    }

                    // Re-sum available stock
                    item.availableStock = item.warehouseStocks.reduce((sum, ws) => sum + ws.stock, 0);
                    needsSave = true;
                    stockSeedCount++;
                } else {
                    console.warn(`⚠️ No target warehouse found for menu item: ${item.name} (${item._id})`);
                }
            }

            if (needsSave) {
                await item.save();
            }
        }

        console.log('\n✨ Execution Summary:');
        console.log(`✅ Menus activated: ${activatedCount}`);
        console.log(`📦 Stocks seeded: ${stockSeedCount}`);
        console.log('🏁 Process finished successfully');

    } catch (error) {
        console.error('❌ Error executing script:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

activateAllMenus();
