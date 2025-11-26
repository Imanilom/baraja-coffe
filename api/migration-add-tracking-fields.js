import mongoose from 'mongoose';
import { Order } from './models/order.model.js';
import Payment from './models/Payment.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ✅ FIX: Load .env dari root project (sama seperti stress-test)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cari .env file di parent directory (root project)
const rootDir = path.resolve(__dirname, '..'); // Naik satu level dari /api ke root
const envPath = path.resolve(rootDir, '.env');

console.log('🔍 Looking for .env file at:', envPath);

// Check if .env file exists
if (fs.existsSync(envPath)) {
    console.log('✅ .env file found, loading...');
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.log('❌ Error loading .env:', result.error);
    } else {
        console.log('✅ .env loaded successfully');
    }
} else {
    console.log('❌ .env file not found at:', envPath);
    // Fallback: coba di current directory juga
    const currentEnvPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(currentEnvPath)) {
        console.log('✅ .env file found in current directory, loading...');
        dotenv.config({ path: currentEnvPath });
    }
}

/**
 * 🔄 Migration Script: Add Tracking Fields
 * 
 * Script ini menambahkan field tracking untuk prevent double processing:
 * - Order: stockRolledBack, tableReleased, canceledBySystem
 * - Payment: processedExpiry, expiredAt, orphanedAt
 * 
 * Run dengan: node api/migration-add-tracking-fields.js
 * 
 * Note: .env file harus ada di root project dengan variable MONGO
 */

const log = {
    info: (msg) => console.log(`ℹ️  [INFO] ${msg}`),
    success: (msg) => console.log(`✅ [SUCCESS] ${msg}`),
    warning: (msg) => console.log(`⚠️  [WARNING] ${msg}`),
    error: (msg, err) => console.error(`❌ [ERROR] ${msg}`, err || '')
};

// ✅ FIX: Add database connection (sama seperti stress-test)
const connectDB = async () => {
    try {
        // ✅ CRITICAL: Gunakan MONGO bukan MONGODB_URI (sesuai dengan .env Anda)
        // const mongoURI = process.env.MONGO_PROD;
        const mongoURI = process.env.MONGO;
        if (!mongoURI) {
            throw new Error('MONGO environment variable not found. Check .env file location.');
        }

        log.info('Connecting to MongoDB...');
        log.info('MongoDB URI available: ' + (mongoURI ? 'YES' : 'NO'));

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 10000,
            bufferCommands: false,
        });

        log.success(`MongoDB connected: ${mongoose.connection.name}`);
        return true;
    } catch (error) {
        log.error('MongoDB connection failed:', error.message);
        log.error('💡 Check your .env file and MONGO variable');
        throw error;
    }
};

// ✅ FIX: Add disconnect function
const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        log.info('MongoDB connection closed');
    } catch (error) {
        log.error('Error closing MongoDB connection:', error.message);
    }
};

// Update Order Schema dengan field baru
const addOrderTrackingFields = async () => {
    try {
        log.info('Starting Order schema migration...');

        // Tambahkan field baru ke semua orders yang belum punya
        const result = await Order.updateMany(
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
const addPaymentTrackingFields = async () => {
    try {
        log.info('Starting Payment schema migration...');

        // Tambahkan field baru ke semua payments yang belum punya
        const result = await Payment.updateMany(
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
const fixExistingExpiredPayments = async () => {
    try {
        log.info('Fixing existing expired payments...');

        // Update semua payment dengan status 'expire' tapi belum di-mark processedExpiry
        const result = await Payment.updateMany(
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
const fixExistingOrphanedPayments = async () => {
    try {
        log.info('Fixing existing orphaned payments...');

        // Update semua payment dengan status 'orphaned' tapi belum punya orphanedAt
        const result = await Payment.updateMany(
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
const fixExistingCanceledOrders = async () => {
    try {
        log.info('Fixing existing canceled orders...');

        // Mark semua order yang sudah canceled sebagai sudah di-rollback
        // Ini untuk prevent double rollback pada order lama
        const result = await Order.updateMany(
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

// ✅ NEW: Create indexes untuk performance
const createIndexes = async () => {
    try {
        log.info('Creating indexes for better performance...');

        // Create indexes on Order collection
        await Order.collection.createIndex({ stockRolledBack: 1, status: 1 });
        await Order.collection.createIndex({ tableReleased: 1, orderType: 1 });

        log.success('Created indexes on Order collection');

        // Create index on Payment collection
        await Payment.collection.createIndex({ processedExpiry: 1, status: 1 });

        log.success('Created indexes on Payment collection');

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
const verifyMigration = async () => {
    try {
        log.info('\n📊 Verifying migration results...\n');

        // Check Orders
        const totalOrders = await Order.countDocuments();
        const ordersWithTracking = await Order.countDocuments({
            stockRolledBack: { $exists: true },
            tableReleased: { $exists: true }
        });

        log.info(`Orders: ${ordersWithTracking}/${totalOrders} have tracking fields`);

        // Check Payments
        const totalPayments = await Payment.countDocuments();
        const paymentsWithTracking = await Payment.countDocuments({
            processedExpiry: { $exists: true }
        });

        log.info(`Payments: ${paymentsWithTracking}/${totalPayments} have tracking fields`);

        // Check specific cases
        const expiredPaymentsProcessed = await Payment.countDocuments({
            status: 'expire',
            processedExpiry: true
        });

        const orphanedPaymentsTracked = await Payment.countDocuments({
            status: 'orphaned',
            orphanedAt: { $exists: true }
        });

        const canceledOrdersTracked = await Order.countDocuments({
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
const rollbackMigration = async () => {
    try {
        log.warning('⚠️  Starting rollback migration...');

        const orderResult = await Order.updateMany(
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

        const paymentResult = await Payment.updateMany(
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

// ✅ FIX: Main migration function with database connection
const runMigration = async () => {
    try {
        log.info('🚀 Starting migration process...\n');

        // ✅ CRITICAL: Connect to database first
        await connectDB();

        // Step 1: Add tracking fields to Orders
        await addOrderTrackingFields();

        // Step 2: Add tracking fields to Payments
        await addPaymentTrackingFields();

        // Step 3: Fix existing expired payments
        await fixExistingExpiredPayments();

        // Step 4: Fix existing orphaned payments
        await fixExistingOrphanedPayments();

        // Step 5: Fix existing canceled orders
        await fixExistingCanceledOrders();

        // Step 6: Create indexes
        await createIndexes();

        // Step 7: Verify migration
        await verifyMigration();

        log.success('\n✅ All migration steps completed!\n');

        // ✅ CRITICAL: Disconnect from database
        await disconnectDB();
        process.exit(0);

    } catch (error) {
        log.error('Migration failed:', error.message);
        await disconnectDB();
        process.exit(1);
    }
};

// ✅ FIX: Add connection for all CLI commands
const args = process.argv.slice(2);

if (args.includes('--rollback')) {
    log.warning('🔄 Running rollback mode...\n');
    connectDB()
        .then(() => rollbackMigration())
        .then(() => {
            log.success('Rollback completed successfully');
            return disconnectDB();
        })
        .then(() => process.exit(0))
        .catch((error) => {
            log.error('Rollback failed:', error.message);
            disconnectDB().then(() => process.exit(1));
        });
} else if (args.includes('--verify-only')) {
    log.info('🔍 Running verification only...\n');
    connectDB()
        .then(() => verifyMigration())
        .then(() => disconnectDB())
        .then(() => process.exit(0))
        .catch((error) => {
            log.error('Verification failed:', error.message);
            disconnectDB().then(() => process.exit(1));
        });
} else if (args.includes('--help')) {
    console.log(`
📋 Migration Script Usage:

  node api/migration-add-tracking-fields.js              Run full migration
  node api/migration-add-tracking-fields.js --verify-only  Verify migration status only
  node api/migration-add-tracking-fields.js --rollback    Rollback all changes
  node api/migration-add-tracking-fields.js --help        Show this help message

Make sure .env file contains MONGODB_URI or MONGO_URI
    `);
    process.exit(0);
} else {
    // Run full migration
    runMigration();
}

// Export functions untuk digunakan di tempat lain
export {
    addOrderTrackingFields,
    addPaymentTrackingFields,
    fixExistingExpiredPayments,
    fixExistingOrphanedPayments,
    fixExistingCanceledOrders,
    verifyMigration,
    rollbackMigration,
    runMigration,
    connectDB,
    disconnectDB
};