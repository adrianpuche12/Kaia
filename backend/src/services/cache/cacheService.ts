// Cache service for managing Redis operations
import { redis, RedisClient } from '../../config/redis';
import { logger } from '../../utils/logger';
import { config } from '../../config/env';

/**
 * Cache metrics for monitoring
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

class CacheService {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
  };

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redis || !RedisClient.isReady()) {
      return null;
    }

    try {
      const cached = await redis.get(key);

      if (cached) {
        this.metrics.hits++;
        this.updateHitRate();
        return JSON.parse(cached) as T;
      }

      this.metrics.misses++;
      this.updateHitRate();
      return null;
    } catch (error: any) {
      this.metrics.errors++;
      logger.error(`Cache get error for key "${key}":`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache with TTL (time to live in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!redis || !RedisClient.isReady()) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || config.cacheDefaultTtl;

      await redis.setex(key, expiry, serialized);
      this.metrics.sets++;
      return true;
    } catch (error: any) {
      this.metrics.errors++;
      logger.error(`Cache set error for key "${key}":`, error.message);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!redis || !RedisClient.isReady()) {
      return false;
    }

    try {
      await redis.del(key);
      this.metrics.deletes++;
      return true;
    } catch (error: any) {
      this.metrics.errors++;
      logger.error(`Cache delete error for key "${key}":`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!redis || !RedisClient.isReady()) {
      return 0;
    }

    try {
      const keys = await redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      const deleted = await redis.del(...keys);
      this.metrics.deletes += deleted;
      return deleted;
    } catch (error: any) {
      this.metrics.errors++;
      logger.error(`Cache delete pattern error for "${pattern}":`, error.message);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!redis || !RedisClient.isReady()) {
      return false;
    }

    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error: any) {
      this.metrics.errors++;
      logger.error(`Cache exists error for key "${key}":`, error.message);
      return false;
    }
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    if (!redis || !RedisClient.isReady()) {
      return false;
    }

    try {
      await redis.flushdb();
      logger.warn('⚠️  Cache flushed (all keys deleted)');
      return true;
    } catch (error: any) {
      this.metrics.errors++;
      logger.error('Cache flush error:', error.message);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    if (!redis || !RedisClient.isReady()) {
      return -2; // Key doesn't exist
    }

    try {
      return await redis.ttl(key);
    } catch (error: any) {
      logger.error(`Cache TTL error for key "${key}":`, error.message);
      return -2;
    }
  }

  /**
   * Increment a counter in cache
   */
  async incr(key: string, ttl?: number): Promise<number> {
    if (!redis || !RedisClient.isReady()) {
      return 0;
    }

    try {
      const value = await redis.incr(key);

      // Set TTL if provided and this is a new key
      if (ttl && value === 1) {
        await redis.expire(key, ttl);
      }

      return value;
    } catch (error: any) {
      this.metrics.errors++;
      logger.error(`Cache incr error for key "${key}":`, error.message);
      return 0;
    }
  }

  /**
   * Decrement a counter in cache
   */
  async decr(key: string): Promise<number> {
    if (!redis || !RedisClient.isReady()) {
      return 0;
    }

    try {
      return await redis.decr(key);
    } catch (error: any) {
      this.metrics.errors++;
      logger.error(`Cache decr error for key "${key}":`, error.message);
      return 0;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetchFn();

    // Store in cache (fire and forget)
    this.set(key, data, ttl).catch((error) => {
      logger.error(`Background cache set failed for key "${key}":`, error);
    });

    return data;
  }

  /**
   * Generate cache key with pattern
   */
  generateKey(parts: string[]): string {
    return parts.filter(Boolean).join(':');
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
    };
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  /**
   * Check if cache is enabled and ready
   */
  isEnabled(): boolean {
    return config.cacheEnabled && RedisClient.isReady();
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
