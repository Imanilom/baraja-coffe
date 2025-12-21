// Test script for unified-order endpoint
// Run with: node test-unified-order.js

const ENDPOINT = 'https://qmvjgsln-3000.asse.devtunnels.ms/api/unified-order';
const PRINT_HISTORY_ENDPOINT = 'https://qmvjgsln-3000.asse.devtunnels.ms/api/print/order';
const NUM_REQUESTS = 10;

const requestBody = {
    "order_id": null,
    "user_id": null,
    "user": "iko",
    "cashierId": "6945a16deec92dbe3b1bdcd4",
    "device_id": null,
    "items": [
        {
            "id": "6881e29ca98111bba0e178b7",
            "quantity": 1,
            "selectedAddons": [],
            "selectedToppings": [],
            "notes": null,
            "dineType": "Dine-In",
            "device_id": "68f057b89f9855f13ecf5018",
            "station": "kitchen"
        },
        {
            "id": "68838ece2ee578dafb841da9",
            "quantity": 1,
            "selectedAddons": [],
            "selectedToppings": [],
            "notes": null,
            "dineType": "Dine-In",
            "device_id": "68dc9622674b2ca3adbe142c",
            "station": "bar"
        }
    ],
    "orderType": "Dine-In",
    "tableNumber": "I",
    "paymentMethod": "Cash",
    "outletId": "67cbc9560f025d897d69f889",
    "outlet": "67cbc9560f025d897d69f889",
    "totalPrice": 37576,
    "source": "Cashier",
    "isOpenBill": false,
    "isSplitPayment": true,
    "customAmountItems": [],
    "paymentDetails": [
        {
            "status": "partial",
            "method": "QRIS",
            "methodType": "Full",
            "amount": 12526,
            "remainingAmount": 25050,
            "tenderedAmount": 12526,
            "changeAmount": 0,
            "vaNumbers": [],
            "actions": [{ "name": "BSI", "method": "QRIS", "url": null }]
        },
        {
            "status": "partial",
            "method": "Debit",
            "methodType": "Full",
            "amount": 12525,
            "remainingAmount": 12525,
            "tenderedAmount": 12525,
            "changeAmount": 0,
            "vaNumbers": [{ "bank": "BCA", "vaNumber": null }],
            "actions": []
        },
        {
            "status": "settlement",
            "method": "Cash",
            "methodType": "Full",
            "amount": 12525,
            "remainingAmount": 0,
            "tenderedAmount": 12525,
            "changeAmount": 425,
            "vaNumbers": [],
            "actions": []
        }
    ]
};

async function checkPrintStatus(orderId) {
    if (!orderId || orderId === 'N/A') return { success: false, items: [] };

    let attempts = 0;
    const maxAttempts = 4;

    while (attempts < maxAttempts) {
        attempts++;
        try {
            // Poll every 3 seconds
            await new Promise(r => setTimeout(r, 3000));

            const response = await fetch(`${PRINT_HISTORY_ENDPOINT}/${orderId}/history`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            const data = await response.json();

            if (data.success && data.data && data.data.print_history) {
                const history = data.data.print_history;

                if (history.length > 0) {
                    // We found logs!
                    const successCount = history.filter(h => h.print_status === 'success' || h.print_status === 'printed_with_issues' || h.print_status === 'forced_print').length;
                    const failCount = history.filter(h => h.print_status === 'failed').length;
                    const pendingCount = history.filter(h => h.print_status === 'pending' || h.print_status === 'printing').length;

                    return {
                        checked: true,
                        successCount,
                        failCount,
                        pendingCount,
                        historyLength: history.length,
                        logs: history.map(h => `${h.item_name}: ${h.print_status}`).join(', ')
                    };
                }
            }
        } catch (e) {
            console.log(`       ⚠️ Error checking print status (attempt ${attempts}): ${e.message}`);
        }

        // If we are here, we didn't return. Continue polling if not max attempts.
        if (attempts < maxAttempts) {
            console.log(`       ⏳ Waiting for print logs... (Attempt ${attempts}/${maxAttempts})`);
        }
    }

    return { checked: true, successCount: 0, failCount: 0, pendingCount: 0, historyLength: 0, error: 'No history found after polling' };
}

async function sendRequest(index) {
    const startTime = Date.now();

    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(requestBody)
        });

        const duration = Date.now() - startTime;
        const data = await response.json();

        const status = data.success !== false && data.status === 'Completed' ? '✅' : '❌';

        // Extract IDs - Prioritize Readable ID for print check
        const readableId = (data.order && data.order.order_id) || (data.data && data.data.order_id) || data.orderId || 'N/A';
        const objectId = (data.order && data.order._id) || (data.data && data.data._id) || (data.data && data.data.order && data.data.order._id) || null;

        const idToCheck = readableId !== 'N/A' ? readableId : objectId;
        const error = data.error || data.message || '';

        console.log(`${status} Request ${index + 1}: ${duration}ms | Order: ${readableId} (${idToCheck}) | ${error ? 'Msg: ' + error.substring(0, 60) : 'OK'}`);

        let printStatus = { checked: false };
        if (data.success !== false && idToCheck !== 'N/A') {
            console.log(`   ⏳ Checking print status for ${idToCheck}...`);
            printStatus = await checkPrintStatus(idToCheck);

            const printIcon = printStatus.successCount > 0 ? '🖨️✅' : (printStatus.failCount > 0 ? '🖨️❌' : (printStatus.pendingCount > 0 ? '🖨️⏳' : '🖨️❓'));
            const logDetails = printStatus.logs ? `| Items: ${printStatus.logs}` : '| No logs';
            console.log(`   ${printIcon} Print: Success=${printStatus.successCount || 0}, Failed=${printStatus.failCount || 0}, Pending=${printStatus.pendingCount || 0} ${logDetails}`);
        }

        return {
            index: index + 1,
            success: data.success !== false && data.status === 'Completed',
            duration,
            orderId: readableId,
            error: error || null,
            errorType: data.errorType || null,
            printStatus
        };
    } catch (err) {
        const duration = Date.now() - startTime;
        console.log(`❌ Request ${index + 1}: ${duration}ms | Network Error: ${err.message}`);
        return {
            index: index + 1,
            success: false,
            duration,
            error: err.message,
            networkError: true,
            printStatus: { checked: false }
        };
    }
}

async function runTests() {
    console.log('🚀 Starting unified-order test...');
    console.log(`📍 Endpoint: ${ENDPOINT}`);
    console.log(`📝 Total requests: ${NUM_REQUESTS}\n`);
    console.log('='.repeat(80));

    const results = [];

    for (let i = 0; i < NUM_REQUESTS; i++) {
        const result = await sendRequest(i);
        results.push(result);

        // Small delay between requests to avoid overwhelming
        if (i < NUM_REQUESTS - 1) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log('='.repeat(80));
    console.log('\n📊 Summary:');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length);
    const transactionErrors = results.filter(r => r.errorType === 'TRANSACTION_CONFLICT' || (r.error && r.error.includes('transaction number'))).length;

    // Print stats
    const totalPrintSuccessItemAttempts = results.reduce((sum, r) => sum + (r.printStatus?.successCount || 0), 0);
    const totalPrintFailedItemAttempts = results.reduce((sum, r) => sum + (r.printStatus?.failCount || 0), 0);
    const totalPrintPendingItemAttempts = results.reduce((sum, r) => sum + (r.printStatus?.pendingCount || 0), 0);

    const ordersWithVerifiedPrint = results.filter(r => (r.printStatus?.successCount || 0) > 0).length;
    const ordersWithPendingPrint = results.filter(r => (r.printStatus?.pendingCount || 0) > 0).length;

    console.log(`✅ Successful Orders: ${successful}/${NUM_REQUESTS}`);
    console.log(`❌ Failed Orders: ${failed}/${NUM_REQUESTS}`);
    console.log(`⏱️  Avg response time: ${avgDuration}ms`);
    console.log(`🔄 Transaction conflicts: ${transactionErrors}`);
    console.log(`\n🖨️  Print Summary:`);
    console.log(`    - Orders Verified: ${ordersWithVerifiedPrint}, Pending: ${ordersWithPendingPrint}`);
    console.log(`    - Items:  Success: ${totalPrintSuccessItemAttempts}, Pending: ${totalPrintPendingItemAttempts}, Failed: ${totalPrintFailedItemAttempts}`);

    if (failed > 0) {
        console.log('\n❌ Failed requests:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   Request ${r.index}: ${r.error?.substring(0, 80) || 'Unknown error'}`);
        });
    }

    console.log('\n✨ Test complete!');
}

runTests();
