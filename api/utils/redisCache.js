// utils/redisCache.js - Redis cache utility for GRO performance optimization
// Uses lazy singleton pattern to avoid duplicate connections
import Redis from 'ioredis';

// ✅ Singleton Redis instance - lazy initialized
let redisClient = null;

/**
 * Get or create Redis client (singleton)
 * Uses same config as reservationPaymentQueue.js
 */
const getRedisClient = () => {
    if (!redisClient) {
        redisClient = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true,
            keyPrefix: 'gro_cache:', // ✅ Prefix to avoid key conflicts with BullMQ
            retryDelayOnFailover: 100,
            reconnectOnError: (err) => {
                console.error('GRO Redis reconnect on error:', err.message);
                return true;
            }
        });

        redisClient.on('error', (err) => {
            console.error('GRO Redis cache error:', err.message);
        });

        redisClient.on('connect', () => {
            console.log('✅ GRO Redis cache connected');
        });

        // Connect lazily
        redisClient.connect().catch(err => {
            console.error('GRO Redis initial connection failed:', err.message);
        });
    }
    return redisClient;
};

/**
 * Get data from cache
 */
export const getCache = async (key) => {
    try {
        const client = getRedisClient();
        const data = await client.get(key);
        if (data) {
            console.log(`📦 GRO Cache HIT: ${key}`);
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error(`GRO Redis getCache error for ${key}:`, error.message);
        return null;
    }
};

/**
 * Set data to cache with TTL
 */
export const setCache = async (key, data, ttlSeconds = 30) => {
    try {
        const client = getRedisClient();
        await client.setex(key, ttlSeconds, JSON.stringify(data));
        console.log(`💾 GRO Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
        console.error(`GRO Redis setCache error for ${key}:`, error.message);
    }
};

/**
 * Delete cache by key pattern
 */
export const invalidateCache = async (pattern) => {
    try {
        const client = getRedisClient();
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await Promise.all(keys.map(k => client.del(k.replace('gro_cache:', ''))));
            console.log(`🗑️ GRO Cache invalidated: ${keys.length} keys matching ${pattern}`);
        }
    } catch (error) {
        console.error(`GRO Redis invalidateCache error for ${pattern}:`, error.message);
    }
};

/**
 * Invalidate all GRO-related caches
 */
export const invalidateGROCache = async () => {
    try {
        await Promise.all([
            invalidateCache('reservations:*'),
            invalidateCache('tables:*'),
            invalidateCache('dashboard:*')
        ]);
        console.log('🗑️ All GRO caches invalidated');
    } catch (error) {
        console.error('Error invalidating GRO cache:', error.message);
    }
};

/**
 * Generate cache key for reservations
 */
export const getReservationsCacheKey = (params) => {
    const { date, status, area_id, search, page, limit } = params;
    return `reservations:${date || 'today'}:${status || 'all'}:${area_id || 'all'}:${search || 'none'}:${page}:${limit}`;
};

/**
 * Generate cache key for table availability
 */
export const getTableAvailabilityCacheKey = (params) => {
    const { outletId, date, time, area_id } = params;
    return `tables:${outletId}:${date || 'today'}:${time || 'all'}:${area_id || 'all'}`;
};

/**
 * Generate cache key for dashboard stats
 */
export const getDashboardCacheKey = (date) => {
    return `dashboard:${date || 'today'}`;
};

export default getRedisClient;
