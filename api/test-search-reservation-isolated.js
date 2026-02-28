
// api/test-search-reservation-isolated.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Reservation from './models/Reservation.model.js';
import { Order } from './models/order.model.js';
import Area from './models/Area.model.js';
import Table from './models/Table.model.js';
// NOTE: We do NOT import the controller to avoid starting the server loop.

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('✅ Connected to MongoDB');

        // 1. Create dummy data
        const area = await Area.findOne();
        if (!area) {
            console.log('⚠️ No Area found. Creating dummy area.');
        }

        // Use existing area or create one if needed (skipped for brevity, assuming dev env has data)
        const areaId = area ? area._id : new mongoose.Types.ObjectId();

        // Find a table
        const table = await Table.findOne();
        const tableId = table ? table._id : new mongoose.Types.ObjectId();

        const uniqueName = `TestGuest_${Date.now()}`;
        console.log(`📝 Creating test data for guest name: "${uniqueName}"`);

        // Create matching Order first
        const order = new Order({
            order_id: `ORD-TEST-${Date.now()}`,
            user: uniqueName, // This is the guest name we search for
            status: 'Reserved',
            items: [],
            totalBeforeDiscount: 0,
            grandTotal: 0,
            totalAfterDiscount: 0,
            orderType: 'Reservation',
            source: 'Gro',
            createdAtWIB: new Date(),
            updatedAtWIB: new Date()
        });
        await order.save();
        console.log(`✅ Created dummy Order with user: ${uniqueName} (ID: ${order._id})`);

        // Create Reservation linked to Order
        const reservation = new Reservation({
            reservation_code: `RSV-TEST-${Date.now()}`,
            reservation_date: new Date(),
            reservation_time: '12:00',
            area_id: areaId,
            table_id: [tableId],
            guest_count: 2,
            order_id: order._id,
            status: 'pending',
            created_by: { employee_name: 'TestBot' }
        });
        await reservation.save();
        console.log(`✅ Created dummy Reservation linked to Order (ID: ${reservation._id})`);

        // 2. SIMULATE THE SEARCH LOGIC (The fix we implemented)
        console.log('🔍 Executing Search Logic...');

        const search = uniqueName;
        const searchRegex = { $regex: search, $options: 'i' };

        // Step A: Find Orders matching the name
        const matchingOrders = await Order.find({
            user: searchRegex
        }).select('_id');

        const matchingOrderIds = matchingOrders.map(o => o._id);
        console.log(`   Found ${matchingOrders.length} matching orders.`);

        // Step B: Build Reservation Filter
        const reservationFilter = {};
        reservationFilter.$or = [
            { reservation_code: searchRegex },
            { 'created_by.employee_name': searchRegex },
            { order_id: { $in: matchingOrderIds } } // This is what we added
        ];

        // Step C: Execute Reservation Search
        const searchResults = await Reservation.find(reservationFilter)
            .populate({
                path: 'order_id',
                select: '_id user'
            });

        // 3. Verify Result
        console.log(`   Found ${searchResults.length} reservations.`);

        if (searchResults.length > 0) {
            const found = searchResults.find(r => r._id.toString() === reservation._id.toString());

            if (found) {
                console.log(`\n✅ VERIFICATION SUCCESS: The reservation for "${uniqueName}" was found via the search query!`);
                console.log(`   Reservation ID: ${found._id}`);
                console.log(`   Linked Order User: ${found.order_id ? found.order_id.user : 'N/A'}`);
            } else {
                console.log(`\n❌ VERIFICATION FAILED: Results returned but our specific reservation was not found.`);
            }
        } else {
            console.log(`\n❌ VERIFICATION FAILED: No results found for "${uniqueName}". The logic didn't work.`);
        }

        // Cleanup
        await Reservation.findByIdAndDelete(reservation._id);
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
