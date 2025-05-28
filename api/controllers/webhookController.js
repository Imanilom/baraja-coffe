// webhookController.js
import { io } from '../index.js'; // Make sure the path is correct
import { coreApi } from '../utils/MidtransConfig.js';
import Payment from '../models/Payment.model.js';

export const midtransWebhook = async (req, res) => {
    try {
        const notificationJson = req.body;
        const { transaction_status, order_id } = notificationJson;

        console.log('Received notification:', notificationJson);
        console.log('Transaction status:', transaction_status);
        console.log('Order ID:', order_id);

        if (transaction_status === 'settlement' || transaction_status === 'capture' ||
            transaction_status === 'pending') {

            // First, check if the room exists and log information
            const roomExists = io.sockets.adapter.rooms.has(order_id);
            console.log(`Does room ${order_id} exist?`, roomExists);
            console.log('Current rooms:', Array.from(io.sockets.adapter.rooms.keys()));

            // Try to emit to specific room first
            if (roomExists) {
                console.log(`Emitting to room ${order_id}`);
                io.to(order_id).emit('payment_status_update', {
                    order_id,
                    transaction_status
                });
            }

            // Also emit to all connected clients as a fallback
            console.log('Broadcasting payment update to all clients');
            io.emit('payment_status_update', {
                order_id,
                transaction_status
            });

            // Update payment status in database
            await Payment.updateOne(
                { order_id: order_id },
                { $set: { status: transaction_status } },
                { upsert: true }
            );

            console.log(`Payment record updated for order ${order_id} with status ${transaction_status}`);
        }

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Failed to handle webhook', error: error.message });
    }
};