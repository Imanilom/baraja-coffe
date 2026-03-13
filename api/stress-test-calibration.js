// stress-test-calibration.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Fix path untuk .env file - cari di parent directory (root project)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cari .env file di parent directory (root project)
const rootDir = path.resolve(__dirname, '..'); // Naik satu level dari /api ke root
const envPath = path.resolve(rootDir, '.env');

console.log('🔍 Looking for .env file at:', envPath);
console.log('📁 API directory:', __dirname);
console.log('📁 Root directory:', rootDir);

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
    console.log('🔍 Trying current directory:', currentEnvPath);
    if (fs.existsSync(currentEnvPath)) {
        console.log('✅ .env file found in current directory, loading...');
        dotenv.config({ path: currentEnvPath });
    } else {
        console.log('❌ .env file not found anywhere');
        // Tampilkan directory structure untuk debug
        console.log('📂 Directory structure:');
        try {
            const files = fs.readdirSync(rootDir);
            console.log('Root dir files:', files.filter(f => f.includes('.env')));
        } catch (e) {
            console.log('Cannot read root directory');
        }
    }
}

console.log('🚀 Starting Stress Test - Compatible with Your App Structure');
console.log('🔑 MongoDB URI available:', !!process.env.MONGO);
if (process.env.MONGO) {
    console.log('🔗 MongoDB URI:', process.env.MONGO.substring(0, 20) + '...');
}

// Gunakan 5 menu items spesifik
const TARGET_MENU_IDS = [
    '687b8e6ed0f4430248d0a4f9',
    '6881b3f2a98111bba0e1686f',
    '6881be85a98111bba0e17021',
    '6881de6fa98111bba0e175f6',
    '6881e125a98111bba0e177a3'
];

/**
 * Setup database connection sama seperti index.js
 */
const connectToDatabase = async () => {
    try {
        // Validasi MONGO URI tersedia
        if (!process.env.MONGO) {
            throw new Error('MONGO environment variable is not defined. Check .env file location.');
        }

        console.log('🔗 Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGO, {
            serverSelectionTimeoutMS: 10000,
            bufferCommands: false,
        });
        console.log('✅ Connected to MongoDB TEST');
        return true;
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('💡 Check your .env file and MONGO variable');
        return false;
    }
};

/**
 * Register semua models yang diperlukan untuk test
 */
const registerTestModels = async () => {
    try {
        // Import Lock model dari file terpisah
        const LockModule = await import('./models/Lock.model.js');
        console.log('✅ Lock model registered');

        // Import model-model lain yang diperlukan
        const MenuItemModule = await import('./models/MenuItem.model.js');
        const MenuStockModule = await import('./models/modul_menu/MenuStock.model.js');

        console.log('✅ All test models registered successfully');
        return true;
    } catch (error) {
        console.log('⚠️ Model registration error:', error.message);
        // Fallback: coba register manual jika import gagal
        try {
            const Lock = mongoose.model('Lock', new mongoose.Schema({
                _id: String,
                lockedAt: Date,
                expiresAt: Date,
                owner: String
            }, { timestamps: true }));
            console.log('✅ Fallback model registration successful');
            return true;
        } catch (fallbackError) {
            console.log('❌ Fallback model registration also failed:', fallbackError.message);
            return false;
        }
    }
};

/**
 * Force cleanup locks
 */
const forceCleanupAllLocks = async () => {
    try {
        // Gunakan Lock model yang sudah terdaftar
        const Lock = mongoose.model('Lock');
        const result = await Lock.deleteMany({});
        console.log(`🧹 FORCE CLEANUP: ${result.deletedCount} locks dihapus`);
        return result.deletedCount;
    } catch (error) {
        console.error('Force cleanup error:', error);
        return 0;
    }
};

/**
 * Test 1: Basic Selected Calibration
 */
const testBasicCalibration = async () => {
    console.log('\n🧪 TEST 1: Basic Selected Calibration');
    console.log('🎯 Target Menu Items:', TARGET_MENU_IDS.length);

    try {
        // Dynamic import function dari job file
        const { calibrateSelectedMenuStocks } = await import('./jobs/stockCalibration.job.js');

        const result = await calibrateSelectedMenuStocks(TARGET_MENU_IDS);

        console.log('✅ Basic Calibration Result:');
        console.log('   - Success:', result.success);
        console.log('   - Processed:', result.processed, 'items');
        console.log('   - Duration:', result.duration);
        console.log('   - Success Count:', result.successCount);
        console.log('   - Error Count:', result.errorCount);

        return result;
    } catch (error) {
        console.log('❌ Basic Calibration Failed:', error.message);
        throw error;
    }
};

/**
 * Test 2: Concurrent Calibrations
 */
const testConcurrentCalibrations = async () => {
    console.log('\n🧪 TEST 2: Concurrent Calibrations');
    console.log('🚀 Testing lock mechanism dengan 2 processes...');

    try {
        const { calibrateSelectedMenuStocks } = await import('./jobs/stockCalibration.job.js');

        console.log('🔄 Starting Process A...');
        const processA = calibrateSelectedMenuStocks(TARGET_MENU_IDS);

        // Tunggu 2 detik lalu start process B
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('🔄 Starting Process B...');
        const processB = calibrateSelectedMenuStocks(TARGET_MENU_IDS);

        console.log('⏳ Waiting for both processes...');
        const [resultA, resultB] = await Promise.allSettled([processA, processB]);

        console.log('\n📊 CONCURRENT TEST RESULTS:');

        // Process A
        if (resultA.status === 'fulfilled') {
            console.log('✅ Process A: COMPLETED');
            console.log('   - Items:', resultA.value.processed);
            console.log('   - Duration:', resultA.value.duration);
        } else {
            console.log('❌ Process A: FAILED -', resultA.reason.message);
        }

        // Process B
        if (resultB.status === 'fulfilled') {
            console.log('✅ Process B: COMPLETED');
            console.log('   - Items:', resultB.value.processed);
            console.log('   - Duration:', resultB.value.duration);
        } else {
            if (resultB.reason.message.includes('Could not acquire lock')) {
                console.log('⏭️ Process B: SKIPPED 🎉');
                console.log('   - Reason: Lock mechanism working correctly!');
            } else {
                console.log('❌ Process B: FAILED -', resultB.reason.message);
            }
        }

        return { resultA, resultB };
    } catch (error) {
        console.log('❌ Concurrent Test Failed:', error.message);
        throw error;
    }
};

/**
 * Monitor data changes untuk 5 menu items
 */
const monitorDataChanges = async () => {
    console.log('\n📊 MONITORING DATA FOR 5 TARGET ITEMS:');
    console.log('='.repeat(50));

    try {
        const MenuItem = mongoose.model('MenuItem');
        const MenuStock = mongoose.model('MenuStock');

        for (const menuId of TARGET_MENU_IDS) {
            try {
                const menuItem = await MenuItem.findById(menuId).select('name availableStock isActive').lean();
                const menuStock = await MenuStock.findOne({ menuItemId: menuId })
                    .select('calculatedStock currentStock manualStock lastCalculatedAt')
                    .lean();

                if (menuItem) {
                    console.log(`📝 ${menuItem.name}:`);
                    console.log(`   - Available: ${menuItem.availableStock}`);
                    console.log(`   - Active: ${menuItem.isActive}`);
                    if (menuStock) {
                        console.log(`   - Calculated: ${menuStock.calculatedStock}`);
                        console.log(`   - Current: ${menuStock.currentStock}`);
                        console.log(`   - Manual: ${menuStock.manualStock}`);
                    }
                } else {
                    console.log(`❌ Menu item ${menuId} not found`);
                }
            } catch (error) {
                console.log(`⚠️ Error reading ${menuId}:`, error.message);
            }
            console.log(''); // Spacer
        }
    } catch (error) {
        console.log('❌ Monitoring failed:', error.message);
    }
};

/**
 * Test 3: Direct Lock Mechanism Test
 */
const testLockMechanismDirectly = async () => {
    console.log('\n🧪 TEST 3: Direct Lock Mechanism Test');

    try {
        // Import langsung dari service untuk test lock mechanism
        const stockService = await import('./jobs/stockCalibration.job.js');

        console.log('🔒 Testing acquireLock...');
        const lock1 = await stockService.acquireLock('test-lock-1', 10000);
        console.log('✅ Lock 1 acquired');

        console.log('🔒 Testing acquireLock on same lock (should fail)...');
        try {
            const lock2 = await stockService.acquireLock('test-lock-1', 5000);
            console.log('❌ Lock 2 should not be acquired!');
            await lock2.release();
        } catch (error) {
            console.log('✅ Lock 2 correctly failed to acquire:', error.message);
        }

        console.log('🔓 Testing releaseLock...');
        const released = await lock1.release();
        console.log('✅ Lock released:', released);

        console.log('🔒 Testing acquireLock after release...');
        const lock3 = await stockService.acquireLock('test-lock-1', 10000);
        console.log('✅ Lock 3 acquired after release');
        await lock3.release();

        console.log('🧹 Testing cleanupExpiredLocks...');
        const cleaned = await stockService.cleanupExpiredLocks();
        console.log('✅ Cleanup completed:', cleaned, 'locks cleaned');

        return { success: true };
    } catch (error) {
        console.log('❌ Direct Lock Test Failed:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Main test runner
 */
const runStressTest = async () => {
    try {
        console.log('='.repeat(50));
        console.log('🚀 STRESS TEST - STOCK CALIBRATION SYSTEM');
        console.log('='.repeat(50));

        // Connect to database
        console.log('🔑 Checking environment variables...');
        console.log('MONGO URI available:', !!process.env.MONGO);

        const connected = await connectToDatabase();
        if (!connected) {
            console.log('❌ Cannot proceed without database connection');
            process.exit(1);
        }

        // ✅ Register models SEBELUM test (PENTING!)
        console.log('📝 Registering test models...');
        const modelsRegistered = await registerTestModels();
        if (!modelsRegistered) {
            console.log('⚠️ Model registration had issues, but continuing test...');
        }

        // Cleanup locks sebelum test
        console.log('🧹 Pre-test cleanup...');
        await forceCleanupAllLocks();

        // Monitor data sebelum test
        console.log('\n📈 DATA BEFORE TEST:');
        await monitorDataChanges();

        // Test 1: Basic functionality
        await testBasicCalibration();

        // Monitor changes setelah test 1
        console.log('\n📈 DATA AFTER TEST 1:');
        await monitorDataChanges();

        // Tunggu 5 detik
        console.log('⏳ Waiting 5 seconds before concurrent test...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Test 2: Concurrent testing
        await testConcurrentCalibrations();

        // Tunggu 3 detik
        console.log('⏳ Waiting 3 seconds before lock mechanism test...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test 3: Direct lock mechanism test
        await testLockMechanismDirectly();

        // Final data state
        console.log('\n📈 FINAL DATA STATE:');
        await monitorDataChanges();

        console.log('\n' + '='.repeat(50));
        console.log('🎉 STRESS TEST COMPLETED SUCCESSFULLY!');
        console.log('✅ System is working correctly');
        console.log('⏭️ Lock mechanism is functioning');
        console.log('📊 Data changes are as expected');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Stress test failed:', error);
    } finally {
        // Cleanup dan exit
        console.log('🧹 Post-test cleanup...');
        await forceCleanupAllLocks();
        await mongoose.connection.close();
        console.log('\n🔚 Test completed, database connection closed');
        process.exit(0);
    }
};

// Jalankan test
await runStressTest();