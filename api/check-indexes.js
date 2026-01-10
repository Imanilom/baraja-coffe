import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkIndexes() {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const ordersCollection = db.collection('orders');

        // List all indexes
        console.log('📋 Current indexes on orders collection:');
        const indexes = await ordersCollection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

        await mongoose.disconnect();
        console.log('✅ Done!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

checkIndexes();
