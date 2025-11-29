import { LockService } from '../services/lock.service.js';

export class LockUtil {
  /**
   * Execute function with distributed lock - IMPROVED VERSION
   */
  static async withLock(resource, fn, options = {}) {
    const {
      owner = `process-${process.pid}-${Date.now()}`,
      ttlMs = 30000,
      retryDelayMs = 100,
      maxRetries = 10,
      onRetry = null
    } = options;

    let lockAcquired = false;
    let lastError = null;

    try {
      // Implementasi retry yang lebih robust
      for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
        try {
          // Acquire lock
          lockAcquired = await LockService.acquireLock(resource, owner, ttlMs, retryDelayMs, 1);
          
          if (lockAcquired) {
            // Execute function with lock
            const result = await fn();
            return result;
          }

          // Jika gagal acquire, tunggu dan coba lagi
          if (retryCount < maxRetries) {
            const waitTime = retryDelayMs * Math.pow(1.5, retryCount); // Exponential backoff
            console.log(`🔄 Retrying lock acquisition for ${resource}...`, {
              retryCount: retryCount + 1,
              maxRetries,
              waitTime,
              owner
            });
            
            if (onRetry) onRetry(retryCount + 1, maxRetries);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        } catch (error) {
          lastError = error;
          if (retryCount < maxRetries) {
            const waitTime = retryDelayMs * Math.pow(1.5, retryCount);
            console.log(`🔄 Retrying after error for ${resource}...`, {
              error: error.message,
              retryCount: retryCount + 1,
              waitTime
            });
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      throw lastError || new Error(`Failed to acquire lock for resource: ${resource} after ${maxRetries} retries`);

    } finally {
      // Pastikan lock selalu di-release
      if (lockAcquired) {
        try {
          await LockService.releaseLock(resource, owner);
        } catch (releaseError) {
          console.error(`⚠️ Error releasing lock for ${resource}:`, releaseError);
          // Jangan throw error di finally block
        }
      }
    }
  }

  static async withOrderLock(orderId, fn, options = {}) {
    const resource = `order:${orderId}`;
    return await LockUtil.withLock(resource, fn, {
      owner: `order-process-${process.pid}-${Date.now()}`,
      ttlMs: 30000,
      retryDelayMs: 300,
      maxRetries: 5,
      ...options
    });
  }


  /**
   * Execute function with reservation-specific lock
   */
  static async withReservationLock(reservationData, fn, options = {}) {
    const { area_id, reservation_date, reservation_time, table_ids } = reservationData;
    const resource = `reservation:${area_id}:${reservation_date}:${reservation_time}:${table_ids.sort().join(',')}`;
    
    return await LockUtil.withLock(resource, fn, {
      owner: `reservation-process-${process.pid}-${Date.now()}`,
      ttlMs: 45000, // 45 detik untuk reservation process
      retryDelayMs: 250,
      maxRetries: 8,
      ...options
    });
  }

  /**
   * Execute function with table-specific lock
   */
  static async withTableLock(tableIds, fn, options = {}) {
    const resource = `tables:${tableIds.sort().join(',')}`;
    return await LockUtil.withLock(resource, fn, {
      owner: `table-process-${process.pid}-${Date.now()}`,
      ttlMs: 30000,
      retryDelayMs: 150,
      maxRetries: 12,
      ...options
    });
  }

  /**
   * Execute function with area-specific lock
   */
  static async withAreaLock(areaId, fn, options = {}) {
    const resource = `area:${areaId}`;
    return await LockUtil.withLock(resource, fn, {
      owner: `area-process-${process.pid}-${Date.now()}`,
      ttlMs: 30000,
      retryDelayMs: 100,
      maxRetries: 10,
      ...options
    });
  }
}