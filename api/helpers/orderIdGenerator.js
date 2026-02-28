import { Order } from '../models/order.model.js';
import { Device } from '../models/Device.model.js';
import dayjs from 'dayjs';

export const generateCashierOrderId = async ({ outletId, tableNumber, deviceId }) => {
    try {
        // 1. Get Device Name
        let deviceName = 'UNKNOWN';
        if (deviceId) {
            const device = await Device.findById(deviceId);
            if (device) {
                deviceName = device.name.toUpperCase().replace(/\s+/g, '');
            }
        }

        // 2. Format Date (DD)
        const now = dayjs();
        const dayStr = now.format('DD');

        // 3. Table Number (Pad 2)
        // Handle tableNumber being string or number
        let tableStr = '00';
        if (tableNumber) {
            const num = parseInt(tableNumber);
            if (!isNaN(num)) {
                tableStr = String(num).padStart(2, '0');
            }
        }

        // 4. Get Sequence
        // Count orders created today at this outlet
        const startOfDay = now.startOf('day').toDate();
        const endOfDay = now.endOf('day').toDate();

        const count = await Order.countDocuments({
            outletId: outletId,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const seqStr = String(count + 1).padStart(3, '0');

        // 5. Construct ID
        // Format: ORD-{DD}{TT}-{SEQ}-ONL-{DEVICE}
        // Note: Using 'ONL' (Online) to distinguish from 'OFF' (Offline) but keeping structure same
        return `ORD-${dayStr}${tableStr}-${seqStr}-ONL-${deviceName}`;
    } catch (error) {
        console.error('Error generating order ID:', error);
        // Fallback ID if generation fails
        return `ORD-${Date.now()}`;
    }
};
