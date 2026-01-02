import mongoose from 'mongoose';
import { Outlet } from './api/models/Outlet.model.js';
import dotenv from 'dotenv';
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/baraja_coffee_test')
    .then(async () => {
        console.log('Connected to MongoDB');

        // Find all outlets regardless of status
        const allOutlets = await Outlet.find({}).lean();
        console.log(`Found ${allOutlets.length} total outlets.`);

        allOutlets.forEach(o => {
            console.log(`Outlet: ${o.name}, ID: ${o._id}`);
            console.log(`  isActive (schema field): ${o.isActive}`);
            // Check if there is an 'is_active' property in the raw document
            console.log(`  is_active (raw field check): ${o['is_active']}`);
            console.log('  Full Object keys:', Object.keys(o));
        });

        // Test the problematic query
        const problemQuery = await Outlet.find({ is_active: true }).lean();
        console.log(`Query { is_active: true } returned ${problemQuery.length} outlets.`);

        // Test the likely correct query
        const correctQuery = await Outlet.find({ isActive: true }).lean();
        console.log(`Query { isActive: true } returned ${correctQuery.length} outlets.`);

        mongoose.disconnect();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
