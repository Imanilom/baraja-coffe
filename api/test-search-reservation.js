
// api/test-search-reservation.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Reservation from './models/Reservation.model.js';
import { Order } from './models/order.model.js';
import Area from './models/Area.model.js';
import Table from './models/Table.model.js';
import { getReservations } from './controllers/gro.controller.js';

dotenv.config();

const mockRes = {
    json: (data) => data,
    status: (code) => ({ json: (data) => console.log(`[${code}]`, data) })
};

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('✅ Connected to MongoDB');

        // 1. Create dummy data
        const area = await Area.findOne();
        const table = await Table.findOne({ area_id: area._id });

        if (!area || !table) {
            console.error('❌ No Area or Table found to create dummy data');
            process.exit(1);
        }

        const uniqueName = `TestGuest_${Date.now()}`;

        // Create matching Order first (simulating what createReservation does)
        const order = new Order({
            order_id: `ORD-TEST-${Date.now()}`,
            user: uniqueName, // This is the guest name we search for
            status: 'Reserved',
            items: [],
            totalBeforeDiscount: 0,
            grandTotal: 0,
            orderType: 'Reservation'
        });
        await order.save();
        console.log(`✅ Created dummy Order with user: ${uniqueName}`);

        // Create Reservation linked to Order
        const reservation = new Reservation({
            reservation_code: `RSV-TEST-${Date.now()}`,
            reservation_date: new Date(),
            reservation_time: '12:00',
            area_id: area._id,
            table_id: [table._id],
            guest_count: 2,
            order_id: order._id
        });
        await reservation.save();
        console.log(`✅ Created dummy Reservation linked to Order`);

        // 2. Perform Search via Controller Logic
        // We will simulate the request object
        const req = {
            query: {
                search: uniqueName,
                page: 1,
                limit: 10
            }
        }

        console.log(`🔍 Searching for "${uniqueName}"...`);

        // Temporarily mock res.json to capture output
        let searchResult = null;
        const res = {
            json: (data) => {
                searchResult = data;
            },
            status: (code) => ({
                json: (data) => {
                    console.log(`Error ${code}:`, data);
                }
            })
        };

        await getReservations(req, res);

        // 3. Verify Result
        if (searchResult && Array.isArray(searchResult) && searchResult.length > 0) {
            const found = searchResult.find(r => r.guest_name === uniqueName || (r.order_id && r.order_id.user === uniqueName));

            if (found) {
                console.log(`✅ SUCCESS: Found reservation for ${uniqueName}`);
            } else {
                console.log(`❌ FAILED: Search returned results but ${uniqueName} was not among them.`);
                console.log('Results:', JSON.stringify(searchResult, null, 2));
            }
        } else {
            console.log(`❌ FAILED: No results found for ${uniqueName}`);
        }

        // Cleanup
        await Reservation.findByIdAndDelete(reservation._id);
        await Order.findByIdAndDelete(order._id);
        console.log('🧹 Cleanup done');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

runTest();
