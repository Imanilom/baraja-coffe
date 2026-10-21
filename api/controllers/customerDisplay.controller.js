import { io } from '../index.js';

export const syncCart = async (req, res) => {
    try {
        const { deviceId, cartItems, grandTotal, subTotal, tax, discount } = req.body;
        
        if (!deviceId) {
            return res.status(400).json({ success: false, message: 'deviceId is required' });
        }

        const roomName = `customer_display_${deviceId}`;
        io.to(roomName).emit('cart_updated', {
            cartItems: cartItems || [],
            grandTotal: grandTotal || 0,
            subTotal: subTotal || 0,
            tax: tax || 0,
            discount: discount || 0
        });

        res.status(200).json({ success: true, message: 'Cart synced to customer display' });
    } catch (error) {
        console.error('Error syncing cart:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const showQris = async (req, res) => {
    try {
        const { deviceId, qrString, amount, orderId } = req.body;
        
        if (!deviceId || !qrString) {
            return res.status(400).json({ success: false, message: 'deviceId and qrString are required' });
        }

        const roomName = `customer_display_${deviceId}`;
        io.to(roomName).emit('qris_generated', {
            qrString,
            amount,
            orderId
        });

        res.status(200).json({ success: true, message: 'QRIS displayed to customer' });
    } catch (error) {
        console.error('Error showing QRIS:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const clearDisplay = async (req, res) => {
    try {
        const { deviceId, message } = req.body;
        
        if (!deviceId) {
            return res.status(400).json({ success: false, message: 'deviceId is required' });
        }

        const roomName = `customer_display_${deviceId}`;
        io.to(roomName).emit('display_cleared', {
            message: message || 'Terima kasih atas pesanan Anda'
        });

        res.status(200).json({ success: true, message: 'Display cleared' });
    } catch (error) {
        console.error('Error clearing display:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};
