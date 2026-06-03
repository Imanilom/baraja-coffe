// test/socketTest.js
const io = require('socket.io-client');
const SERVER_URL = 'http://localhost:3000';

describe('Socket Server', () => {
    let customerSocket, cashierSocket;

    beforeAll((done) => {
        // Setup koneksi test
        customerSocket = io.connect(SERVER_URL);
        cashierSocket = io.connect(SERVER_URL);

        cashierSocket.on('connect', () => {
            cashierSocket.emit('join_cashier_room');
            done();
        });
    });

    afterAll(() => {
        customerSocket.disconnect();
        cashierSocket.disconnect();
    });

    test('Kasir menerima order baru', (done) => {
        // Mock order data
        const testOrder = {
            id: 'test-123',
            items: [{ name: 'Nasi Goreng', qty: 2 }]
        };

        // Listen event di sisi kasir
        cashierSocket.on('order_created', (order) => {
            expect(order.id).toBe(testOrder.id);
            done();
        });

        // Kirim order dari customer
        customerSocket.emit('new_order', testOrder);
    });
});