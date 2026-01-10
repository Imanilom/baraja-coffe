import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fullCleanup() {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const ordersCollection = db.collection('orders');

        // Step 1: Drop the index
        console.log('🗑️  Dropping idempotencyKey index...');
        try {
            await ordersCollection.dropIndex('idempotencyKey_1');
            console.log('✅ Index dropped');
        } catch (e) {
            console.log('⚠️  Index might not exist:', e.message);
        }

        // Step 2: Remove ALL idempotencyKey fields (both null and undefined)
        console.log('🧹 Removing all idempotencyKey fields from existing documents...');
        const result = await ordersCollection.updateMany(
            {},  // Match all documents
            { $unset: { idempotencyKey: "" } }
        );
        console.log(`✅ Processed ${result.modifiedCount} documents`);

        // Step 3: Recreate sparse unique index
        console.log('🔨 Creating new sparse unique index...');
        await ordersCollection.createIndex(
            { idempotencyKey: 1 },
            { unique: true, sparse: true }
        );
        console.log('✅ Index created');

        // Step 4: Verify
        const withKey = await ordersCollection.countDocuments({ idempotencyKey: { $exists: true } });
        console.log(`📊 Documents with idempotencyKey field: ${withKey}`);

        await mongoose.disconnect();
        console.log('✅ Done!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

fullCleanup();
