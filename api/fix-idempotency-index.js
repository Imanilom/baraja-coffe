import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixIndex() {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const ordersCollection = db.collection('orders');

        // Drop the old index
        console.log('🗑️  Dropping old idempotencyKey index...');
        try {
            await ordersCollection.dropIndex('idempotencyKey_1');
            console.log('✅ Old index dropped');
        } catch (e) {
            console.log('⚠️  Index might not exist:', e.message);
        }

        // Create new sparse unique index
        console.log('🔨 Creating new sparse unique index...');
        await ordersCollection.createIndex(
            { idempotencyKey: 1 },
            { unique: true, sparse: true }
        );
        console.log('✅ New sparse unique index created');

        await mongoose.disconnect();
        console.log('✅ Done!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

fixIndex();
