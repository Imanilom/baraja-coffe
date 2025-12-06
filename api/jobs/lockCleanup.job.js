// jobs/lockCleanup.job.js
import { LockService } from '../services/lock.service.js';
import cron from 'node-cron';

export class LockCleanupJob {
  static start() {
    // Jalankan setiap 5 menit untuk membersihkan expired locks
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('🕒 Running expired locks cleanup...');
        const cleanedCount = await LockService.cleanupExpiredLocks();
        
        if (cleanedCount > 0) {
          console.log(`✅ Successfully cleaned ${cleanedCount} expired locks`);
        }
      } catch (error) {
        console.error('❌ Lock cleanup job failed:', error);
      }
    });

    console.log('✅ Lock cleanup job scheduled');
  }
}

// Start job ketika aplikasi jalan
LockCleanupJob.start();