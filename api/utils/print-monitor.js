// utils/print-monitor.js
import { PrintLogger } from '../services/print-logger.service.js';

export class PrintMonitor {
    static startAutoReporting(intervalMinutes = 60) {
        console.log(`🔄 Starting auto print reporting every ${intervalMinutes} minutes`);

        setInterval(async () => {
            try {
                await PrintLogger.getPrintSummary(24);
                await PrintLogger.getRecentFailures(6, 10);
            } catch (error) {
                console.error('❌ Auto report error:', error);
            }
        }, intervalMinutes * 60 * 1000);
    }
}

// Jalankan auto report saat server start
// PrintMonitor.startAutoReporting(60); // Uncomment jika mau auto report tiap 1 jam