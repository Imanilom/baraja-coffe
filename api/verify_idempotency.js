import { randomUUID } from 'crypto';

// Default endpoint, change if needed
const ENDPOINT = process.env.API_URL || 'http://localhost:3000/api/unified-order';

const requestBody = {
    "order_id": null,
    "user_id": null,
    "user": "verify_script",
    "cashierId": "6945a16deec92dbe3b1bdcd4", // Assumed valid from existing test
    "items": [
        {
            "id": "6881e29ca98111bba0e178b7", // Assumed valid
            "quantity": 1,
            "selectedAddons": [],
            "selectedToppings": [],
            "notes": "Idempotency Test Item",
            "dineType": "Dine-In",
            "station": "kitchen"
        }
    ],
    "orderType": "Dine-In",
    "tableNumber": "99",
    "paymentMethod": "Cash",
    "outletId": "67cbc9560f025d897d69f889", // Assumed valid
    "outlet": "67cbc9560f025d897d69f889",
    "totalPrice": 10000,
    "source": "Cashier",
    "isOpenBill": false,
    "isSplitPayment": false,
    "paymentDetails": [
        {
            "status": "settlement",
            "method": "Cash",
            "methodType": "Full",
            "amount": 10000,
            "remainingAmount": 0,
            "tenderedAmount": 10000,
            "changeAmount": 0,
            "vaNumbers": [],
            "actions": []
        }
    ]
};

async function sendRequest(index, idempotencyKey) {
    const startTime = Date.now();
    try {
        console.log(`[Req ${index}] Sending...`);
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-idempotency-key': idempotencyKey,
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(requestBody)
        });

        const duration = Date.now() - startTime;
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`Non-JSON response: ${text.substring(0, 100)}`);
        }

        const success = response.ok && data.success !== false; // Check HTTP status too

        console.log(`[Req ${index}] Finished in ${duration}ms. Success: ${success}`);
        return { index, success, data, error: !success ? (data.message || response.statusText) : null };

    } catch (e) {
        console.log(`[Req ${index}] Error: ${e.message}`);
        return { index, success: false, error: e.message };
    }
}

async function runTest() {
    console.log('🚀 Starting Idempotency Verification Test');
    console.log(`Target: ${ENDPOINT}`);

    // 1. Generate Key
    const idempotencyKey = crypto.randomUUID();
    console.log(`🔑 Generated Idempotency Key: ${idempotencyKey}`);

    // 2. Send 2 Concurrent Requests
    console.log('⚡ Sending 2 concurrent requests with SAME key...');
    const results = await Promise.all([
        sendRequest(1, idempotencyKey),
        sendRequest(2, idempotencyKey)
    ]);

    // 3. Analyze Results
    const [res1, res2] = results;

    if (res1.success && res2.success) {
        const id1 = res1.data.orderId || res1.data.data?.orderId || res1.data.order?.order_id;
        const id2 = res2.data.orderId || res2.data.data?.orderId || res2.data.order?.order_id;

        console.log('\n📊 Results Analysis:');
        console.log(`Req 1 Order ID: ${id1}`);
        console.log(`Req 2 Order ID: ${id2}`);

        if (id1 && id2 && id1 === id2) {
            console.log('✅ SUCCESS: Both requests returned the SAME Order ID. Idempotency is working!');
        } else {
            console.log('❌ FAILURE: Requests returned DIFFERENT Order IDs or IDs are missing.');
            console.log('dump:', JSON.stringify(results, null, 2));
        }
    } else {
        console.log('\n⚠️ INCONCLUSIVE / FAILURE: One or both requests failed.');
        console.log('Req 1 Error:', res1.error);
        console.log('Req 2 Error:', res2.error);
    }
}

runTest();
