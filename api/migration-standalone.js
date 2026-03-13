/**
 * 🔄 STANDALONE Migration Script: Add Tracking Fields
 * 
 * Script ini bisa dijalankan langsung tanpa tergantung model files
 * Langsung update MongoDB collection dengan native driver
 * 
 * Run dengan: node migration-standalone.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const log = {
    info: (msg) => console.log(`ℹ️  [INFO] ${msg}`),
    success: (msg) => console.log(`✅ [SUCCESS] ${msg}`),
    warning: (msg) => console.log(`⚠️  [WARNING] ${msg}`),
    error: (msg, err) => console.error(`❌ [ERROR] ${msg}`, err || '')
};

// Database connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO || process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error('MONGODB_URI not found in .env file');
        }

        log.info('Connecting to MongoDB...');

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });

        log.success(`MongoDB connected: ${mongoose.connection.name}`);
        return mongoose.connection.db;
    } catch (error) {
        log.error('MongoDB connection failed:', error.message);
        throw error;
    }
};

// Disconnect from database
const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        log.info('MongoDB connection closed\n');
    } catch (error) {
        log.error('Error closing MongoDB connection:', error.message);
    }
};

// Update Order Schema dengan field baru
const addOrderTrackingFields = async (db) => {
    try {
        log.info('Starting Order schema migration...');

        const ordersCollection = db.collection('orders');

        // Tambahkan field baru ke semua orders yang belum punya
        const result = await ordersCollection.updateMany(
            {
                $or: [
                    { stockRolledBack: { $exists: false } },
                    { tableReleased: { $exists: false } },
                    { canceledBySystem: { $exists: false } }
                ]
            },
            {
                $set: {
                    stockRolledBack: false,
                    stockRollbackAt: null,
                    stockRollbackDetails: [],
                    tableReleased: false,
                    tableReleasedAt: null,
                    canceledBySystem: false,
                    canceledAt: null,
                    autoCompletedAt: null,
                    autoCompletedReason: null
                }
            }
        );

        log.success(`Order migration completed: ${result.modifiedCount} documents updated`);
        return result;

    } catch (error) {
        log.error('Error migrating Order schema:', error.message);
        throw error;
    }
};

// Update Payment Schema dengan field baru
const addPaymentTrackingFields = async (db) => {
    try {
        log.info('Starting Payment schema migration...');

        const paymentsCollection = db.collection('payments');

        // Tambahkan field baru ke semua payments yang belum punya
        const result = await paymentsCollection.updateMany(
            {
                $or: [
                    { processedExpiry: { $exists: false } },
                    { expiredAt: { $exists: false } },
                    { orphanedAt: { $exists: false } }
                ]
            },
            {
                $set: {
                    processedExpiry: false,
                    expiredAt: null,
                    orphanedAt: null
                }
            }
        );

        log.success(`Payment migration completed: ${result.modifiedCount} documents updated`);
        return result;

    } catch (error) {
        log.error('Error migrating Payment schema:', error.message);
        throw error;
    }
};

// Fix existing expired payments dengan tracking
const fixExistingExpiredPayments = async (db) => {
    try {
        log.info('Fixing existing expired payments...');

        const paymentsCollection = db.collection('payments');

        // Update semua payment dengan status 'expire' tapi belum di-mark processedExpiry
        const result = await paymentsCollection.updateMany(
            {
                status: 'expire',
                processedExpiry: { $ne: true }
            },
            {
                $set: {
                    processedExpiry: true,
                    expiredAt: new Date()
                }
            }
        );

        log.success(`Fixed ${result.modifiedCount} existing expired payments`);
        return result;

    } catch (error) {
        log.error('Error fixing expired payments:', error.message);
        throw error;
    }
};

// Fix existing orphaned payments
const fixExistingOrphanedPayments = async (db) => {
    try {
        log.info('Fixing existing orphaned payments...');

        const paymentsCollection = db.collection('payments');

        // Update semua payment dengan status 'orphaned' tapi belum punya orphanedAt
        const result = await paymentsCollection.updateMany(
            {
                status: 'orphaned',
                orphanedAt: { $exists: false }
            },
            {
                $set: {
                    orphanedAt: new Date(),
                    processedExpiry: true
                }
            }
        );

        log.success(`Fixed ${result.modifiedCount} existing orphaned payments`);
        return result;

    } catch (error) {
        log.error('Error fixing orphaned payments:', error.message);
        throw error;
    }
};

// Fix existing canceled orders
const fixExistingCanceledOrders = async (db) => {
    try {
        log.info('Fixing existing canceled orders...');

        const ordersCollection = db.collection('orders');

        // Mark semua order yang sudah canceled sebagai sudah di-rollback
        // Ini untuk prevent double rollback pada order lama
        const result = await ordersCollection.updateMany(
            {
                status: 'Canceled',
                stockRolledBack: { $ne: true }
            },
            {
                $set: {
                    stockRolledBack: true, // Assume sudah di-rollback sebelumnya
                    stockRollbackAt: new Date(),
                    canceledAt: new Date()
                }
            }
        );

        log.success(`Fixed ${result.modifiedCount} existing canceled orders`);
        return result;

    } catch (error) {
        log.error('Error fixing canceled orders:', error.message);
        throw error;
    }
};

// Create indexes untuk performance
const createIndexes = async (db) => {
    try {
        log.info('Creating indexes for better performance...');

        const ordersCollection = db.collection('orders');
        const paymentsCollection = db.collection('payments');

        // Create indexes on orders collection
        await ordersCollection.createIndex({ stockRolledBack: 1, status: 1 });
        await ordersCollection.createIndex({ tableReleased: 1, orderType: 1 });

        log.success('Created indexes on orders collection');

        // Create index on payments collection
        await paymentsCollection.createIndex({ processedExpiry: 1, status: 1 });

        log.success('Created indexes on payments collection');

    } catch (error) {
        // Jika index sudah ada, skip saja
        if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
            log.warning('Some indexes already exist, skipping...');
        } else {
            log.error('Error creating indexes:', error.message);
        }
    }
};

// Verify migration results
const verifyMigration = async (db) => {
    try {
        log.info('\n📊 Verifying migration results...\n');

        const ordersCollection = db.collection('orders');
        const paymentsCollection = db.collection('payments');

        // Check Orders
        const totalOrders = await ordersCollection.countDocuments();
        const ordersWithTracking = await ordersCollection.countDocuments({
            stockRolledBack: { $exists: true },
            tableReleased: { $exists: true }
        });

        log.info(`Orders: ${ordersWithTracking}/${totalOrders} have tracking fields`);

        // Check Payments
        const totalPayments = await paymentsCollection.countDocuments();
        const paymentsWithTracking = await paymentsCollection.countDocuments({
            processedExpiry: { $exists: true }
        });

        log.info(`Payments: ${paymentsWithTracking}/${totalPayments} have tracking fields`);

        // Check specific cases
        const expiredPaymentsProcessed = await paymentsCollection.countDocuments({
            status: 'expire',
            processedExpiry: true
        });

        const orphanedPaymentsTracked = await paymentsCollection.countDocuments({
            status: 'orphaned',
            orphanedAt: { $exists: true }
        });

        const canceledOrdersTracked = await ordersCollection.countDocuments({
            status: 'Canceled',
            stockRolledBack: true
        });

        log.info(`\n📈 Migration Summary:`);
        log.success(`✅ Total Orders: ${totalOrders}`);
        log.success(`✅ Orders with tracking: ${ordersWithTracking}`);
        log.success(`✅ Total Payments: ${totalPayments}`);
        log.success(`✅ Payments with tracking: ${paymentsWithTracking}`);
        log.success(`✅ Expired payments processed: ${expiredPaymentsProcessed}`);
        log.success(`✅ Orphaned payments tracked: ${orphanedPaymentsTracked}`);
        log.success(`✅ Canceled orders tracked: ${canceledOrdersTracked}`);

        if (ordersWithTracking === totalOrders && paymentsWithTracking === totalPayments) {
            log.success('\n🎉 Migration completed successfully!\n');
            return true;
        } else {
            log.warning('\n⚠️  Some documents were not migrated. Run script again or check manually.\n');
            return false;
        }

    } catch (error) {
        log.error('Error verifying migration:', error.message);
        throw error;
    }
};

// Rollback migration (jika diperlukan)
const rollbackMigration = async (db) => {
    try {
        log.warning('⚠️  Starting rollback migration...');

        const ordersCollection = db.collection('orders');
        const paymentsCollection = db.collection('payments');

        const orderResult = await ordersCollection.updateMany(
            {},
            {
                $unset: {
                    stockRolledBack: "",
                    stockRollbackAt: "",
                    stockRollbackDetails: "",
                    tableReleased: "",
                    tableReleasedAt: "",
                    canceledBySystem: "",
                    canceledAt: "",
                    autoCompletedAt: "",
                    autoCompletedReason: ""
                }
            }
        );

        const paymentResult = await paymentsCollection.updateMany(
            {},
            {
                $unset: {
                    processedExpiry: "",
                    expiredAt: "",
                    orphanedAt: ""
                }
            }
        );

        log.success(`Rollback completed: ${orderResult.modifiedCount} orders, ${paymentResult.modifiedCount} payments`);

    } catch (error) {
        log.error('Error during rollback:', error.message);
        throw error;
    }
};

// Main migration function
const runMigration = async () => {
    let db;

    try {
        log.info('🚀 Starting migration process...\n');

        // Connect to database first
        db = await connectDB();

        // Step 1: Add tracking fields to Orders
        await addOrderTrackingFields(db);

        // Step 2: Add tracking fields to Payments
        await addPaymentTrackingFields(db);

        // Step 3: Fix existing expired payments
        await fixExistingExpiredPayments(db);

        // Step 4: Fix existing orphaned payments
        await fixExistingOrphanedPayments(db);

        // Step 5: Fix existing canceled orders
        await fixExistingCanceledOrders(db);

        // Step 6: Create indexes
        await createIndexes(db);

        // Step 7: Verify migration
        await verifyMigration(db);

        log.success('\n✅ All migration steps completed!\n');

        // Disconnect from database
        await disconnectDB();
        process.exit(0);

    } catch (error) {
        log.error('Migration failed:', error.message);
        await disconnectDB();
        process.exit(1);
    }
};

// Run verify only
const runVerifyOnly = async () => {
    let db;

    try {
        log.info('🔍 Running verification only...\n');

        db = await connectDB();
        await verifyMigration(db);
        await disconnectDB();

        process.exit(0);
    } catch (error) {
        log.error('Verification failed:', error.message);
        await disconnectDB();
        process.exit(1);
    }
};

// Run rollback
const runRollback = async () => {
    let db;

    try {
        log.warning('🔄 Running rollback mode...\n');

        db = await connectDB();
        await rollbackMigration(db);

        log.success('Rollback completed successfully');

        await disconnectDB();
        process.exit(0);
    } catch (error) {
        log.error('Rollback failed:', error.message);
        await disconnectDB();
        process.exit(1);
    }
};

// CLI interface
const args = process.argv.slice(2);

if (args.includes('--rollback')) {
    runRollback();
} else if (args.includes('--verify-only')) {
    runVerifyOnly();
} else if (args.includes('--help')) {
    console.log(`
📋 Migration Script Usage:

  node migration-standalone.js              Run full migration
  node migration-standalone.js --verify-only  Verify migration status only
  node migration-standalone.js --rollback    Rollback all changes
  node migration-standalone.js --help        Show this help message

Make sure .env file contains MONGODB_URI or MONGO_URI
    `);
    process.exit(0);
} else {
    runMigration();
}