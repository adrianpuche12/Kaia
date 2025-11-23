// Upstash Redis REST client configuration
import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger';

class RedisClient {
  private static instance: Redis | null = null;
  private static isConnected: boolean = false;

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
   * Create Upstash Redis client with REST API
   */
  private static createClient(): Redis | null {
    // Skip Redis if not enabled
    const cacheEnabled = process.env.CACHE_ENABLED === 'true';

    if (!cacheEnabled) {
      logger.info('⚠️  Redis cache is disabled (CACHE_ENABLED=false)');
      return null;
    }

    // Check for Upstash REST credentials
    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!restUrl || !restToken) {
      logger.warn('⚠️  Upstash Redis credentials not configured (UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing)');
      return null;
    }

    try {
      logger.info('🔌 Connecting to Upstash Redis (REST API)...');

      const redis = new Redis({
        url: restUrl,
        token: restToken,
      });

      this.isConnected = true;
      logger.info('✅ Upstash Redis connected successfully!');

      return redis;
    } catch (error) {
      logger.error('❌ Failed to create Upstash Redis client:', error);
      this.isConnected = false;
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
    return {
      connected: this.isConnected,
      uptime: this.isConnected ? process.uptime() : null,
    };
  }

  /**
   * Health check - ping Redis
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
      const result = await this.instance.ping();
      const latency = Date.now() - start;

      if (result === 'PONG' || result === 'pong' || result === true) {
        return {
          healthy: true,
          latency,
        };
      }

      return {
        healthy: false,
        error: 'Unexpected ping response',
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * Get Redis info (Upstash REST compatible)
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
      // Note: Upstash REST API has limited INFO command support
      // We'll get what we can
      const dbSize = await this.instance.dbsize();

      return {
        version: 'Upstash REST',
        uptime: Math.floor(process.uptime()),
        connectedClients: 1, // REST is stateless
        usedMemory: 'N/A (REST API)',
        totalKeys: dbSize,
      };
    } catch (error) {
      logger.error('Error getting Redis info:', error);
      return null;
    }
  }

  /**
   * Gracefully disconnect (no-op for REST client)
   */
  static async disconnect(): Promise<void> {
    this.isConnected = false;
    this.instance = null;
    logger.info('✅ Redis client disconnected');
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
