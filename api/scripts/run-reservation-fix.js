/**
 * Script untuk menjalankan identifikasi dan perbaikan masalah reservasi
 * 
 * CARA PENGGUNAAN:
 * 
 * 1. IDENTIFIKASI (aman, hanya lihat masalah):
 *    node api/scripts/run-reservation-fix.js identify
 * 
 * 2. PERBAIKAN DRY RUN (simulasi, tidak ubah data):
 *    node api/scripts/run-reservation-fix.js fix-dry-run
 * 
 * 3. PERBAIKAN LIVE (HATI-HATI, ubah data sesungguhnya):
 *    node api/scripts/run-reservation-fix.js fix-live
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fixReservation from './fix-reservation-payments.js';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory (parent of api folder)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        // Validate MONGO environment variable
        if (!process.env.MONGO) {
            throw new Error('MONGO environment variable is not defined in .env file');
        }

        await mongoose.connect(process.env.MONGO_PROD, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

const main = async () => {
    const command = process.argv[2] || 'identify';

    await connectDB();

    console.log('\n' + '='.repeat(80));
    console.log('🔧 RESERVATION PAYMENT FIX SCRIPT');
    console.log('='.repeat(80) + '\n');

    try {
        switch (command) {
            case 'identify':
                console.log('📋 MODE: IDENTIFIKASI (hanya lihat masalah)\n');
                await fixReservation.identifyAllReservationIssues();
                break;

            case 'fix-dry-run':
                console.log('🧪 MODE: DRY RUN (simulasi perbaikan, tidak ubah data)\n');
                await fixReservation.fixAllReservationIssues('Reserved', true);
                break;

            case 'fix-live':
                console.log('⚠️  MODE: LIVE (PERBAIKAN SESUNGGUHNYA - HATI-HATI!)\n');
                console.log('Tunggu 5 detik untuk cancel dengan Ctrl+C...\n');

                await new Promise(resolve => setTimeout(resolve, 5000));

                console.log('🚀 Memulai perbaikan...\n');
                await fixReservation.fixAllReservationIssues('Reserved', false);
                break;

            case 'fix-payments-only':
                console.log('💳 MODE: Fix Payments Only (DRY RUN)\n');
                await fixReservation.fixExpiredReservationPayments(true);
                break;

            case 'fix-payments-live':
                console.log('💳 MODE: Fix Payments Only (LIVE)\n');
                await fixReservation.fixExpiredReservationPayments(false);
                break;

            case 'fix-orders-only':
                console.log('📦 MODE: Fix Orders Only (DRY RUN)\n');
                await fixReservation.fixCanceledReservationOrders('Reserved', true);
                break;

            case 'fix-orders-live':
                console.log('📦 MODE: Fix Orders Only (LIVE)\n');
                await fixReservation.fixCanceledReservationOrders('Reserved', false);
                break;

            case 'fix-stock-only':
                console.log('📊 MODE: Fix Stock Only (DRY RUN)\n');
                await fixReservation.fixWrongStockRollbacks(true);
                break;

            case 'fix-stock-live':
                console.log('📊 MODE: Fix Stock Only (LIVE)\n');
                await fixReservation.fixWrongStockRollbacks(false);
                break;

            default:
                console.log('❌ Command tidak dikenal. Gunakan salah satu:');
                console.log('   - identify');
                console.log('   - fix-dry-run');
                console.log('   - fix-live');
                console.log('   - fix-payments-only / fix-payments-live');
                console.log('   - fix-orders-only / fix-orders-live');
                console.log('   - fix-stock-only / fix-stock-live');
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ Script selesai');
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

main();
