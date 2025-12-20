// Test script for unified-order endpoint
// Run with: node test-unified-order.js

const ENDPOINT = 'https://ece685eb6a3e.ngrok-free.app/api/unified-order';
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
        const orderId = data.orderId || 'N/A';
        const error = data.error || data.message || '';

        console.log(`${status} Request ${index + 1}: ${duration}ms | Order: ${orderId} | ${error ? 'Error: ' + error.substring(0, 60) : 'OK'}`);

        return {
            index: index + 1,
            success: data.success !== false && data.status === 'Completed',
            duration,
            orderId,
            error: error || null,
            errorType: data.errorType || null
        };
    } catch (err) {
        const duration = Date.now() - startTime;
        console.log(`❌ Request ${index + 1}: ${duration}ms | Network Error: ${err.message}`);
        return {
            index: index + 1,
            success: false,
            duration,
            error: err.message,
            networkError: true
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
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log('='.repeat(80));
    console.log('\n📊 Summary:');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length);
    const transactionErrors = results.filter(r => r.errorType === 'TRANSACTION_CONFLICT' || (r.error && r.error.includes('transaction number'))).length;

    console.log(`✅ Successful: ${successful}/${NUM_REQUESTS}`);
    console.log(`❌ Failed: ${failed}/${NUM_REQUESTS}`);
    console.log(`⏱️  Avg response time: ${avgDuration}ms`);
    console.log(`🔄 Transaction conflicts: ${transactionErrors}`);

    if (failed > 0) {
        console.log('\n❌ Failed requests:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   Request ${r.index}: ${r.error?.substring(0, 80) || 'Unknown error'}`);
        });
    }

    console.log('\n✨ Test complete!');
}

runTests();
