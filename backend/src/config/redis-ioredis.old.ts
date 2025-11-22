// Redis client configuration
import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

class RedisClient {
  private static instance: Redis | null = null;
  private static isConnected: boolean = false;
  private static connectionAttempts: number = 0;
  private static maxReconnectAttempts: number = 5;

  /**
   * Get Redis client instance (singleton)
   */
  static getInstance(): Redis | null {
    if (!this.instance) {
      this.instance = this.createClient();
    }
    return this.instance;
  }

  /**
   * Create Redis client with configuration
   */
  private static createClient(): Redis | null {
    // Skip Redis if not enabled or URL not provided
    const cacheEnabled = process.env.CACHE_ENABLED === 'true';

    if (!cacheEnabled) {
      logger.info('⚠️  Redis cache is disabled (CACHE_ENABLED=false)');
      return null;
    }

    if (!config.redisUrl || config.redisUrl === 'redis://localhost:6379') {
      logger.warn('⚠️  Redis URL not configured, caching disabled');
      return null;
    }

    try {
      logger.info('🔌 Connecting to Redis...');

      const redis = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > this.maxReconnectAttempts) {
            logger.error('❌ Redis max reconnection attempts reached');
            return null; // Stop reconnecting
          }

          const delay = Math.min(times * 200, 2000);
          logger.warn(`⏳ Redis reconnecting... Attempt ${times}/${this.maxReconnectAttempts} (delay: ${delay}ms)`);
          return delay;
        },
        reconnectOnError: (err) => {
          logger.error('Redis connection error:', err.message);
          return true; // Retry on error
        },
        lazyConnect: false,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        // Upstash compatibility: disable CLIENT SETINFO command
        enableAutoPipelining: false,
      });

      // Connection events
      redis.on('connect', () => {
        this.connectionAttempts = 0;
        logger.info('🔌 Redis connecting...');
      });

      redis.on('ready', () => {
        this.isConnected = true;
        logger.info('✅ Redis connected and ready!');
      });

      redis.on('error', (error) => {
        this.isConnected = false;
        logger.error('❌ Redis error:', error.message);
      });

      redis.on('close', () => {
        this.isConnected = false;
        logger.warn('⚠️  Redis connection closed');
      });

      redis.on('reconnecting', (delay) => {
        this.connectionAttempts++;
        logger.info(`⏳ Redis reconnecting in ${delay}ms... (attempt ${this.connectionAttempts})`);
      });

      redis.on('end', () => {
        this.isConnected = false;
        logger.warn('⚠️  Redis connection ended');
      });

      return redis;
    } catch (error) {
      logger.error('❌ Failed to create Redis client:', error);
      return null;
    }
  }

  /**
   * Check if Redis is connected
   */
  static isReady(): boolean {
    return this.isConnected && this.instance !== null;
  }

  /**
   * Get connection status
   */
  static getStatus(): { connected: boolean; uptime: number | null } {
    if (!this.instance) {
      return { connected: false, uptime: null };
    }

    return {
      connected: this.isConnected,
      uptime: this.instance.status === 'ready' ? process.uptime() : null,
    };
  }

  /**
   * Gracefully disconnect Redis
   */
  static async disconnect(): Promise<void> {
    if (this.instance) {
      try {
        await this.instance.quit();
        this.isConnected = false;
        this.instance = null;
        logger.info('✅ Redis disconnected gracefully');
      } catch (error) {
        logger.error('❌ Error disconnecting Redis:', error);
      }
    }
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{
    healthy: boolean;
    latency?: number;
    error?: string;
  }> {
    if (!this.instance || !this.isConnected) {
      return {
        healthy: false,
        error: 'Redis not connected',
      };
    }

    try {
      const start = Date.now();
      await this.instance.ping();
      const latency = Date.now() - start;

      return {
        healthy: true,
        latency,
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * Get Redis info
   */
  static async getInfo(): Promise<{
    version?: string;
    uptime?: number;
    connectedClients?: number;
    usedMemory?: string;
    totalKeys?: number;
  } | null> {
    if (!this.instance || !this.isConnected) {
      return null;
    }

    try {
      const info = await this.instance.info();
      const dbSize = await this.instance.dbsize();

      // Parse info string
      const lines = info.split('\r\n');
      const data: any = {};

      lines.forEach((line) => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            data[key] = value;
          }
        }
      });

      return {
        version: data.redis_version,
        uptime: parseInt(data.uptime_in_seconds, 10),
        connectedClients: parseInt(data.connected_clients, 10),
        usedMemory: data.used_memory_human,
        totalKeys: dbSize,
      };
    } catch (error) {
      logger.error('Error getting Redis info:', error);
      return null;
    }
  }
}

// Initialize Redis on module load
const redis = RedisClient.getInstance();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await RedisClient.disconnect();
});

process.on('SIGINT', async () => {
  await RedisClient.disconnect();
});

export { RedisClient, redis };
export default redis;
// Force redeploy - 17 Oct 2025 03:25:57
