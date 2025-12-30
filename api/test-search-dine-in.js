
// api/test-search-dine-in.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order } from './models/order.model.js';
import Table from './models/Table.model.js';
import Area from './models/Area.model.js';
// We do NOT import controller to avoid server startup side effects.

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('✅ Connected to MongoDB');

        // 1. Create dummy data
        const uniqueName = `DineInGuest_${Date.now()}`;
        console.log(`📝 Creating test Dine-In order for guest: "${uniqueName}"`);

        // Find existing area and table or use null/default if strictly needed
        // For simple search verification, table/area linking isn't strictly required by the filter logic
        // but good for completeness if we want to mimic real structure.

        const order = new Order({
            order_id: `ORD-DINEIN-${Date.now()}`,
            user: uniqueName,
            status: 'OnProcess', // Active status
            items: [],
            totalBeforeDiscount: 0,
            grandTotal: 0,
            totalAfterDiscount: 0,
            orderType: 'Dine-In',
            source: 'Cashier',
            createdAtWIB: new Date(),
            updatedAtWIB: new Date()
        });
        await order.save();
        console.log(`✅ Created dummy Dine-In Order: ${uniqueName} (ID: ${order._id})`);

        // 2. SIMULATE THE SEARCH LOGIC for Dine-In
        console.log('🔍 Executing Dine-In Search Logic...');

        const search = uniqueName;
        const searchRegex = { $regex: search, $options: 'i' };

        // Logic from gro.controller.js (condensed for verification)
        const orderFilter = {
            orderType: 'Dine-In',
            // Default status or specific logic from controller:
            status: { $nin: ['Canceled', 'Completed'] }
        };

        orderFilter.$or = [
            { order_id: searchRegex },
            { user: searchRegex }
        ];

        // Execute Search
        const searchResults = await Order.find(orderFilter);

        // 3. Verify Result
        console.log(`   Found ${searchResults.length} dine-in orders.`);

        if (searchResults.length > 0) {
            const found = searchResults.find(o => o._id.toString() === order._id.toString());

            if (found) {
                console.log(`\n✅ VERIFICATION SUCCESS: The Dine-In order for "${uniqueName}" was found!`);
                console.log(`   Order ID: ${found.order_id}`);
                console.log(`   Customer Name: ${found.user}`);
            } else {
                console.log(`\n❌ VERIFICATION FAILED: Results returned but our specific order was not found.`);
            }
        } else {
            console.log(`\n❌ VERIFICATION FAILED: No results found for "${uniqueName}".`);
        }

        // Cleanup
        await Order.findByIdAndDelete(order._id);
        console.log('\n🧹 Cleanup done');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

runTest();
