// services/printer-direct.service.js
import axios from 'axios';
import { PrintLogger } from './print-logger.service.js';

const PRINTER_SERVICE_URL = process.env.PRINTER_SERVICE_URL || 'http://localhost:9090';

export const directPrintOrder = async ({ orderId, orderData, outletId, source }) => {
    try {
        console.log(`🖨️ [DIRECT PRINT] Starting for ${orderId}`);

        // Get printer config dari database
        const printerConfig = await getPrinterConfig(outletId);
        if (!printerConfig) {
            console.warn('⚠️ No printer configured for outlet:', outletId);
            return false;
        }

        // Process each item
        const printPromises = [];

        for (const item of orderData.items) {
            const logId = await PrintLogger.logPrintAttempt(
                orderId,
                item,
                item.workstation || 'kitchen',
                printerConfig,
                { is_auto_print: true }
            );

            // Send print job ke printer service
            const printPromise = sendPrintJob({
                orderId,
                item,
                printerConfig,
                orderData,
                logId
            });

            printPromises.push(printPromise);
        }

        // Wait for all prints
        const results = await Promise.allSettled(printPromises);

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        console.log(`✅ [DIRECT PRINT] ${successCount}/${results.length} items printed`);

        return successCount > 0;

    } catch (error) {
        console.error('❌ Direct print error:', error);
        return false;
    }
};

const sendPrintJob = async ({ orderId, item, printerConfig, orderData, logId }) => {
    const startTime = Date.now();

    try {
        // Kirim ke printer service (bisa ESC/POS printer atau thermal printer API)
        const response = await axios.post(`${PRINTER_SERVICE_URL}/print`, {
            orderId,
            item,
            printerConfig,
            orderType: orderData.orderType,
            tableNumber: orderData.tableNumber,
            customerName: orderData.name,
            service: orderData.service
        }, {
            timeout: 5000 // Max 5 detik per print
        });

        const duration = Date.now() - startTime;

        if (response.data.success) {
            await PrintLogger.logPrintSuccess(logId, duration);
            console.log(`✅ Item ${item.name} printed in ${duration}ms`);
            return true;
        } else {
            await PrintLogger.logPrintFailure(logId, 'print_failed', response.data.error);
            return false;
        }

    } catch (error) {
        const duration = Date.now() - startTime;
        await PrintLogger.logPrintFailure(logId, 'printer_error', error.message);
        console.error(`❌ Print failed for ${item.name}:`, error.message);
        return false;
    }
};

const getPrinterConfig = async (outletId) => {
    // Query dari database atau cache
    // Return printer IP/config untuk outlet ini
    return {
        type: 'wifi',
        ip: '192.168.1.100',
        port: 9100,
        outletId
    };
};