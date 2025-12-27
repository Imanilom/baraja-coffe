
import mongoose from 'mongoose';
import { Order } from './api/models/order.model.js';
import Reservation from './api/models/Reservation.model.js';
import dotenv from 'dotenv';
dotenv.config();

// Connect
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/baraja_coffee_test')
    .then(async () => {
        console.log('Connected to MongoDB');

        // 1. Count total Dine-In orders for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const totalOrders = await Order.countDocuments({
            orderType: 'Dine-In',
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });
        console.log(`Total Dine-In Orders Today: ${totalOrders}`);

        const completedOrders = await Order.countDocuments({
            orderType: 'Dine-In',
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: 'Completed'
        });
        console.log(`Completed Dine-In Orders Today: ${completedOrders}`);

        const activeOrders = await Order.countDocuments({
            orderType: 'Dine-In',
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $nin: ['Canceled', 'Completed'] }
        });
        console.log(`Active (Not Completed/Canceled) Dine-In Orders Today: ${activeOrders}`);

        console.log('\n--- Simulation of getReservations logic ---');
        // Mimic the logic in controller line 1307
        console.log('If status is undefined, controller uses: { $nin: ["Canceled", "Completed"] }');
        console.log(`Expected result count for "All": ${activeOrders}`);
        console.log('User expects: ' + totalOrders);

        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
