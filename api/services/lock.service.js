import Lock from '../models/Lock.model.js';

export class LockService {
  /**
   * Acquire a distributed lock dengan retry mechanism
   */
  static async acquireLock(resource, owner, ttlMs = 30000, retryDelayMs = 100, maxRetries = 10) {
    const lockId = `lock:${resource}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Cek lock existing
        const existingLock = await Lock.findById(lockId);
        
        if (existingLock) {
          // Cek jika lock sudah expired
          if (existingLock.expiresAt < now) {
            // Hapus lock yang expired dan buat baru
            await Lock.findByIdAndDelete(lockId);
            
            // Buat lock baru
            const newLock = await Lock.create({
              _id: lockId,
              lockedAt: now,
              expiresAt: expiresAt,
              owner: owner
            });
            
            console.log(`🔒 Expired lock taken over for: ${resource}`, {
              previousOwner: existingLock.owner,
              newOwner: owner,
              attempt: attempt + 1
            });
            return true;
          } else {
            // Lock masih aktif, tunggu dan coba lagi
            if (attempt < maxRetries - 1) {
              const waitTime = retryDelayMs * (attempt + 1);
              console.log(`⏳ Lock busy, waiting ${waitTime}ms for: ${resource}`, {
                currentOwner: existingLock.owner,
                attempt: attempt + 1,
                maxRetries
              });
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
        } else {
          // Tidak ada lock, buat baru
          try {
            const newLock = await Lock.create({
              _id: lockId,
              lockedAt: now,
              expiresAt: expiresAt,
              owner: owner
            });
            
            console.log(`🔒 Lock acquired for: ${resource}`, {
              owner,
              lockedAt: newLock.lockedAt,
              expiresAt: newLock.expiresAt,
              attempt: attempt + 1
            });
            return true;
          } catch (createError) {
            // Handle duplicate key error - race condition saat create
            if (createError.code === 11000) {
              if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                continue;
              }
            }
            throw createError;
          }
        }
      } catch (error) {
        console.error(`❌ Error acquiring lock for ${resource}:`, error);
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          continue;
        }
        return false;
      }
    }

    console.log(`❌ Failed to acquire lock for: ${resource} after ${maxRetries} attempts`);
    return false;
  }

  /**
   * Release lock dengan error handling yang lebih baik
   */
  static async releaseLock(resource, owner) {
    const lockId = `lock:${resource}`;
    
    try {
      const result = await Lock.findOneAndDelete({
        _id: lockId,
        owner: owner // Hanya hapus jika owner match
      });

      if (result) {
        console.log(`🔓 Lock released for: ${resource}`, {
          owner,
          lockDuration: Date.now() - result.lockedAt.getTime()
        });
        return true;
      } else {
        // Cek jika lock sudah diambil alih atau expired
        const currentLock = await Lock.findById(lockId);
        if (!currentLock) {
          console.log(`🔓 Lock already released for: ${resource}`);
          return true;
        }
        
        if (currentLock.owner !== owner) {
          console.warn(`⚠️ Cannot release lock - owned by different process:`, {
            resource,
            expectedOwner: owner,
            actualOwner: currentLock.owner
          });
        }
        
        return false;
      }
    } catch (error) {
      console.error(`❌ Error releasing lock for ${resource}:`, error);
      return false;
    }
  }

  /**
   * Check if a lock exists and is valid
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

  /**
   * Background cleanup service
   */
  static startLockCleanupInterval() {
    // Clean up expired locks every 5 minutes
    setInterval(async () => {
      try {
        const cleanedCount = await LockService.cleanupExpiredLocks();
        if (cleanedCount > 0) {
          console.log(`🧹 Background cleanup: Removed ${cleanedCount} expired locks`);
        }
      } catch (error) {
        console.error('Background lock cleanup error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('🔄 Lock cleanup service started');
  }
}