// utils/lock.util.js
import { LockService } from '../services/lock.service.js';

export class LockUtil {
  /**
   * Execute function with distributed lock
   * @param {string} resource - Resource to lock
   * @param {Function} fn - Function to execute
   * @param {Object} options - Lock options
   * @returns {Promise<*>} - Function result
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

    try {
      // Acquire lock
      lockAcquired = await LockService.acquireLock(resource, owner, ttlMs, retryDelayMs, maxRetries);
      
      if (!lockAcquired) {
        throw new Error(`Failed to acquire lock for resource: ${resource} after ${maxRetries} attempts`);
      }

      // Execute function with lock
      const result = await fn();
      return result;

    } finally {
      // Always release lock if acquired
      if (lockAcquired) {
        await LockService.releaseLock(resource, owner);
      }
    }
  }

  /**
   * Execute function with order-specific lock to prevent duplicate orders
   * @param {string} orderId - Order ID to lock
   * @param {Function} fn - Function to execute
   * @param {Object} options - Lock options
   * @returns {Promise<*>} - Function result
   */
  static async withOrderLock(orderId, fn, options = {}) {
    const resource = `order:${orderId}`;
    return await LockUtil.withLock(resource, fn, {
      owner: `order-process-${process.pid}`,
      ttlMs: 60000, // 60 seconds for order processing
      retryDelayMs: 200,
      maxRetries: 15,
      ...options
    });
  }

  /**
   * Execute function with outlet-specific lock
   * @param {string} outletId - Outlet ID to lock
   * @param {Function} fn - Function to execute
   * @param {Object} options - Lock options
   * @returns {Promise<*>} - Function result
   */
  static async withOutletLock(outletId, fn, options = {}) {
    const resource = `outlet:${outletId}`;
    return await LockUtil.withLock(resource, fn, {
      owner: `outlet-process-${process.pid}`,
      ttlMs: 45000, // 45 seconds for outlet operations
      retryDelayMs: 150,
      maxRetries: 12,
      ...options
    });
  }
}