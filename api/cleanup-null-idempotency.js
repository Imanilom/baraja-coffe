import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupNullIdempotencyKeys() {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const ordersCollection = db.collection('orders');

        // Count documents with null idempotencyKey
        const nullCount = await ordersCollection.countDocuments({ idempotencyKey: null });
        console.log(`📊 Found ${nullCount} orders with idempotencyKey: null`);

        if (nullCount > 0) {
            // Remove the idempotencyKey field from documents where it's null
            // This makes them truly "not indexed" in a sparse index
            const result = await ordersCollection.updateMany(
                { idempotencyKey: null },
                { $unset: { idempotencyKey: "" } }
            );
            console.log(`✅ Removed idempotencyKey field from ${result.modifiedCount} documents`);
        }

        // Verify
        const remainingNull = await ordersCollection.countDocuments({ idempotencyKey: null });
        console.log(`📊 Remaining documents with idempotencyKey: null: ${remainingNull}`);

        await mongoose.disconnect();
        console.log('✅ Done!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

cleanupNullIdempotencyKeys();
