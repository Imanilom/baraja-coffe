// services/lock.service.js
import Lock from '../models/Lock.model.js';

export class LockService {
  /**
   * Acquire a distributed lock
   * @param {string} resource - Resource identifier to lock
   * @param {string} owner - Owner identifier
   * @param {number} ttlMs - Time to live in milliseconds (default: 30 seconds)
   * @param {number} retryDelayMs - Retry delay in milliseconds (default: 100ms)
   * @param {number} maxRetries - Maximum retry attempts (default: 10)
   * @returns {Promise<boolean>} - True if lock acquired, false otherwise
   */
  static async acquireLock(resource, owner, ttlMs = 30000, retryDelayMs = 100, maxRetries = 10) {
    const lockId = `lock:${resource}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Try to create lock document
        const lock = await Lock.findOneAndUpdate(
          { _id: lockId },
          { 
            $setOnInsert: {
              _id: lockId,
              lockedAt: now,
              expiresAt: expiresAt,
              owner: owner
            }
          },
          {
            upsert: true,
            new: true,
            runValidators: true
          }
        );

        // If document was created (upsert), we got the lock
        if (lock) {
          console.log(`🔒 Lock acquired for resource: ${resource}`, {
            owner,
            lockedAt: lock.lockedAt,
            expiresAt: lock.expiresAt,
            attempt: attempt + 1
          });
          return true;
        }

        // Check if existing lock has expired
        const existingLock = await Lock.findById(lockId);
        if (existingLock && existingLock.expiresAt < now) {
          // Lock expired, try to take it over
          const takenOver = await Lock.findOneAndUpdate(
            { 
              _id: lockId,
              expiresAt: { $lt: now }
            },
            {
              $set: {
                lockedAt: now,
                expiresAt: expiresAt,
                owner: owner
              }
            }
          );

          if (takenOver) {
            console.log(`🔒 Expired lock taken over for resource: ${resource}`, {
              previousOwner: existingLock.owner,
              newOwner: owner,
              attempt: attempt + 1
            });
            return true;
          }
        }

        // Lock is held by someone else, wait and retry
        if (attempt < maxRetries - 1) {
          console.log(`⏳ Waiting for lock on resource: ${resource}`, {
            owner,
            attempt: attempt + 1,
            maxRetries,
            retryDelayMs
          });
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }

      } catch (error) {
        // Handle duplicate key error (lock already exists)
        if (error.code === 11000) {
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            continue;
          }
        }
        console.error(`❌ Error acquiring lock for ${resource}:`, error);
        return false;
      }
    }

    console.log(`❌ Failed to acquire lock for resource: ${resource} after ${maxRetries} attempts`, {
      owner,
      maxRetries
    });
    return false;
  }

  /**
   * Release a distributed lock
   * @param {string} resource - Resource identifier
   * @param {string} owner - Owner identifier (must match to release)
   * @returns {Promise<boolean>} - True if lock released, false otherwise
   */
  static async releaseLock(resource, owner) {
    const lockId = `lock:${resource}`;
    
    try {
      const result = await Lock.findOneAndDelete({
        _id: lockId,
        owner: owner
      });

      if (result) {
        console.log(`🔓 Lock released for resource: ${resource}`, {
          owner,
          lockDuration: Date.now() - result.lockedAt.getTime()
        });
        return true;
      } else {
        console.warn(`⚠️ Failed to release lock for resource: ${resource} - lock not found or owner mismatch`, {
          owner
        });
        return false;
      }
    } catch (error) {
      console.error(`❌ Error releasing lock for ${resource}:`, error);
      return false;
    }
  }

  /**
   * Check if a lock exists and is valid
   * @param {string} resource - Resource identifier
   * @returns {Promise<boolean>} - True if lock exists and is valid
   */
  static async isLocked(resource) {
    const lockId = `lock:${resource}`;
    const now = new Date();
    
    try {
      const lock = await Lock.findOne({
        _id: lockId,
        expiresAt: { $gt: now }
      });
      return !!lock;
    } catch (error) {
      console.error(`❌ Error checking lock status for ${resource}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired locks
   * @returns {Promise<number>} - Number of expired locks removed
   */
  static async cleanupExpiredLocks() {
    const now = new Date();
    
    try {
      const result = await Lock.deleteMany({
        expiresAt: { $lt: now }
      });
      
      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} expired locks`);
      }
      
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up expired locks:', error);
      return 0;
    }
  }
}