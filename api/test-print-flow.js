// test-print-flow-standalone.js
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:3000/api';

const testPrintFlow = async () => {
    console.log('🧪 Starting Standalone Print Tracking Flow Test...\n');

    let logId = null;
    const testOrderId = `TEST_${Date.now()}`; // Unique ID setiap test run

    try {
        // 🟡 TEST 1: Print Attempt (TIDAK perlu order exist di database)
        console.log('1. Testing Print Attempt...');
        const attemptResponse = await fetch(`${baseUrl}/orders/workstation/print-attempt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: testOrderId, // Pakai unique ID
                item: {
                    _id: '65f4a1b8c8e9f2001a8b7c3d', // ObjectId format
                    id: 'ITEM_TEST_001',
                    name: '[TEST] Nasi Goreng Spesial',
                    qty: 2,
                    quantity: 2,
                    notes: 'Ini item testing',
                    workstation: 'kitchen' // Tambahkan workstation di item
                },
                workstation: 'kitchen',
                printer_config: {
                    type: 'wifi',
                    info: '192.168.1.100:9100'
                },
                stock_info: {
                    available: true,
                    requiresPreparation: true
                }
                // Hapus timestamp karena backend handle sendiri
            })
        });

        if (!attemptResponse.ok) {
            const errorText = await attemptResponse.text();
            console.log('❌ Response status:', attemptResponse.status);
            console.log('❌ Response body:', errorText);
            throw new Error(`HTTP ${attemptResponse.status}: ${errorText}`);
        }

        const attemptData = await attemptResponse.json();
        console.log('📝 Print Attempt Response:', JSON.stringify(attemptData, null, 2));

        if (attemptData.success && attemptData.data?.log_id) {
            logId = attemptData.data.log_id;
            console.log('✅ Print Attempt SUCCESS - Log ID:', logId);
        } else {
            throw new Error('Print Attempt failed: ' + JSON.stringify(attemptData));
        }

        // 🟡 TEST 2: Print Success
        console.log('\n2. Testing Print Success...');
        const successResponse = await fetch(`${baseUrl}/orders/workstation/print-success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                log_id: logId,
                duration: 1250
            })
        });

        const successData = await successResponse.json();
        console.log('✅ Print Success Response:', successData);

        // 🟡 TEST 3: Print Failure
        console.log('\n3. Testing Print Failure...');

        // Buat log baru untuk failure test
        const failureAttemptResponse = await fetch(`${baseUrl}/orders/workstation/print-attempt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: testOrderId + '_FAIL',
                item: {
                    _id: '65f4a1b8c8e9f2001a8b7c3e',
                    id: 'ITEM_TEST_002',
                    name: '[TEST] Es Jeruk',
                    qty: 1,
                    quantity: 1,
                    workstation: 'bar_depan'
                },
                workstation: 'bar_depan',
                printer_config: { type: 'bluetooth', info: 'Printer-BT-001' },
                stock_info: { available: true }
            })
        });

        const failureAttemptData = await failureAttemptResponse.json();
        const failureLogId = failureAttemptData.data?.log_id;

        if (failureLogId) {
            const failureResponse = await fetch(`${baseUrl}/orders/workstation/print-failure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    log_id: failureLogId,
                    reason: 'printer_timeout',
                    details: 'Printer tidak merespons - TEST SIMULATION'
                })
            });

            const failureData = await failureResponse.json();
            console.log('❌ Print Failure Response:', failureData);
        }

        // 🟡 TEST 4: Skipped Item
        console.log('\n4. Testing Skipped Item...');
        const skippedResponse = await fetch(`${baseUrl}/orders/workstation/print-skipped`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: testOrderId + '_SKIP',
                item: {
                    _id: '65f4a1b8c8e9f2001a8b7c3f',
                    id: 'ITEM_TEST_003',
                    name: '[TEST] Avocado Juice',
                    qty: 3,
                    quantity: 3,
                    workstation: 'bar_belakang'
                },
                workstation: 'bar_belakang',
                reason: 'out_of_stock',
                details: 'TEST: Stok alpukat habis'
            })
        });

        const skippedData = await skippedResponse.json();
        console.log('⏭️ Skipped Item Response:', skippedData);

        // 🟡 TEST 5: Get Print Stats (selalu work)
        console.log('\n5. Testing Print Statistics...');
        const statsResponse = await fetch(`${baseUrl}/orders/workstation/print-stats?hours=1`); // 1 jam saja
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('📊 Print Stats Response:', statsData);
        } else {
            console.log('ℹ️  Print Stats endpoint mungkin belum ready');
        }

        // 🟡 TEST 6: Manual test problematic item (jika route ada)
        console.log('\n6. Testing Problematic Item (if route exists)...');
        try {
            const problematicResponse = await fetch(`${baseUrl}/orders/workstation/print-problematic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: testOrderId + '_PROBLEM',
                    item: {
                        id: 'ITEM_TEST_004',
                        name: '[TEST] Steak Wagyu',
                        qty: 1,
                        quantity: 1
                    },
                    workstation: 'kitchen',
                    issues: ['out_of_stock', 'workstation_mismatch'],
                    details: 'TEST: Item bermasalah simulation',
                    stock_info: { available: false }
                })
            });

            if (problematicResponse.ok) {
                const problematicData = await problematicResponse.json();
                console.log('⚠️ Problematic Item Response:', problematicData);
            } else {
                console.log('ℹ️  Problematic Item endpoint belum ada (normal)');
            }
        } catch (problematicError) {
            console.log('ℹ️  Problematic Item endpoint belum ada:', problematicError.message);
        }

        // 🎯 FINAL RESULTS
        console.log('\n' + '='.repeat(60));
        console.log('🎉 STANDALONE PRINT TRACKING TEST COMPLETED!');
        console.log('='.repeat(60));
        console.log('📋 Test Order ID:', testOrderId);
        console.log('📝 Generated Log ID:', logId);
        console.log('\n✅ Semua test print tracking berjalan tanpa perlu data existing!');

        // Verify data di database
        console.log('\n🔍 Untuk verifikasi, cek data di database:');
        console.log('   db.printlogs.find({ order_id: "' + testOrderId + '" })');

    } catch (error) {
        console.error('\n💥 TEST ERROR:', error.message);
        console.log('\n🔧 Debugging Tips:');
        console.log('   1. Pastikan backend server running di', baseUrl);
        console.log('   2. Cek console backend untuk error details');
        console.log('   3. Pastikan model PrintLog sudah terdaftar di MongoDB');
    }
};

// Run the test
testPrintFlow();