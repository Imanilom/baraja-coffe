import { LockService } from '../services/lock.service.js';

export class LockUtil {
  /**
   * Execute function with distributed lock - FIXED VERSION
   */
  static async withLock(resource, fn, options = {}) {
    const {
      owner = `process-${process.pid}-${Date.now()}`,
      ttlMs = 30000,
      retryDelayMs = 100,
      maxRetries = 10,
      onRetry = null,
      skipLocking = false
    } = options;

    // Jika skipLocking true, langsung execute tanpa lock
    if (skipLocking) {
      console.log(`🔓 Skipping lock for resource: ${resource} (skipLocking=true)`);
      return await fn();
    }

    const lockId = resource.startsWith('lock:') ? resource : `lock:${resource}`;
    let lockAcquired = false;
    let lastError = null;

    try {
      // Implementasi retry yang lebih robust
      for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
        try {
          // Acquire lock menggunakan LockService
          lockAcquired = await LockService.acquireLock(
            resource, // resource asli (LockService akan tambahkan 'lock:' sendiri)
            owner,
            ttlMs,
            50, // internal retry delay kecil untuk LockService
            1   // hanya 1 attempt di LockService, retry di-handle di sini
          );

          if (lockAcquired) {
            console.log(`🔒 Lock acquired for: ${resource}`, {
              owner,
              attempt: retryCount + 1
            });
            
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
          console.error(`❌ Lock acquisition error for ${resource}:`, error.message);
          
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
          console.log(`🔓 Lock released for: ${resource}`);
        } catch (releaseError) {
          console.error(`⚠️ Error releasing lock for ${resource}:`, releaseError.message);
          // Jangan throw error di finally block
        }
      }
    }
  }

  /**
   * Execute function with order-specific lock - FIXED VERSION
   */
  static async withOrderLock(orderId, operation, options = {}) {
    const {
      owner = `order-${Date.now()}`,
      ttlMs = 30000,
      retryDelayMs = 300,
      maxRetries = 5,
      skipLocking = false
    } = options;

    const resource = orderId.startsWith('order:') ? orderId : `order:${orderId}`;

    console.log(`🔒 Processing with atomic lock for order:`, {
      orderId,
      resource,
      owner,
      maxRetries,
      skipLocking
    });

    // Gunakan withLock yang sudah difix
    return await LockUtil.withLock(resource, operation, {
      owner,
      ttlMs,
      retryDelayMs,
      maxRetries,
      skipLocking
    });
  }

  /**
   * Check if an order is currently locked
   */
  static async isOrderLocked(orderId) {
    const resource = orderId.startsWith('order:') ? orderId : `order:${orderId}`;
    return await LockService.isLocked(resource);
  }

  /**
   * Force release an order lock (emergency use only)
   */
  static async forceReleaseOrderLock(orderId) {
    const resource = orderId.startsWith('order:') ? orderId : `order:${orderId}`;
    
    try {
      const result = await Lock.findOneAndDelete({
        _id: `lock:${resource}`
      });
      
      if (result) {
        console.log(`⚠️ FORCE released lock for: ${orderId}`, {
          previousOwner: result.owner,
          lockedAt: result.lockedAt
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error force releasing lock for ${orderId}:`, error);
      return false;
    }
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

  /**
   * Clean all locks for debugging/emergency
   */
  static async cleanupAllLocks() {
    try {
      const result = await Lock.deleteMany({});
      console.log(`🧹 Cleaned up all locks: ${result.deletedCount} removed`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning all locks:', error);
      return 0;
    }
  }
}