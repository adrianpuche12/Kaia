// Redis-based rate limiter for distributed environments
import { Request, Response, NextFunction } from 'express';
import { redis, RedisClient } from '../config/redis';
import { errorResponse } from '../utils/helpers';
import { HTTP_STATUS, ERROR_CODES, RATE_LIMITS } from '../config/constants';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
}

/**
 * Generate default key (IP + User ID)
 */
function getDefaultKey(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userId = (req as any).user?.id || 'anonymous';
  return `ratelimit:${ip}:${userId}`;
}

/**
 * Redis-based rate limiter
 * Uses sliding window algorithm with Redis
 */
export function redisRateLimiter(options: RateLimitOptions) {
  const { maxRequests, windowMs, keyGenerator } = options;
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    // Fallback to no rate limiting if Redis not available
    if (!redis || !RedisClient.isReady()) {
      logger.warn('⚠️  Redis not available - rate limiting disabled');
      return next();
    }

    try {
      // Generate key
      const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req);
      const now = Date.now();

      // Use sorted set for sliding window
      const windowStart = now - windowMs;

      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Count requests in window
      const count = await redis.zcard(key);

      // Check limit
      if (count >= maxRequests) {
        // Get window reset time
        const oldestEntry = await redis.zrange(key, 0, 0);
        const resetAt = oldestEntry.length > 1
          ? parseInt(String(oldestEntry[1]), 10) + windowMs
          : now + windowMs;

        const retryAfter = Math.ceil((resetAt - now) / 1000);

        res.setHeader('Retry-After', retryAfter.toString());
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', new Date(resetAt).toISOString());

        return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
          errorResponse(
            ERROR_CODES.RATE_LIMIT_EXCEEDED,
            `Demasiadas solicitudes. Intenta de nuevo en ${retryAfter} segundos.`
          )
        );
      }

      // Add current request
      await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });

      // Set expiry
      await redis.expire(key, windowSeconds);

      // Add headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - count - 1).toString());
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

      next();
    } catch (error: any) {
      // On error, allow request (fail open)
      logger.error('Rate limiter error:', error.message);
      next();
    }
  };
}

/**
 * Rate limiter general (100 req/15min)
 */
export const generalRedisRateLimiter = redisRateLimiter({
  maxRequests: RATE_LIMITS.GENERAL,
  windowMs: 15 * 60 * 1000,
});

/**
 * Rate limiter para auth (10 req/15min por IP)
 */
export const authRedisRateLimiter = redisRateLimiter({
  maxRequests: RATE_LIMITS.AUTH,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (req) => `ratelimit:auth:${(req as any).ip || 'unknown'}`,
});

/**
 * Rate limiter para MCPs (30 exec/min por usuario)
 */
export const mcpRedisRateLimiter = redisRateLimiter({
  maxRequests: RATE_LIMITS.MCP_EXECUTION,
  windowMs: 60 * 1000,
  keyGenerator: (req) => `ratelimit:mcp:${(req as any).user?.id || 'anonymous'}`,
});

/**
 * Rate limiter para mensajes (20 mensajes/hora por usuario)
 */
export const messageRedisRateLimiter = redisRateLimiter({
  maxRequests: 20,
  windowMs: 60 * 60 * 1000,
  keyGenerator: (req) => `ratelimit:message:${(req as any).user?.id || 'anonymous'}`,
});

/**
 * Rate limiter para procesamiento de voz (30 requests/hora por usuario)
 */
export const voiceRedisRateLimiter = redisRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 60 * 1000,
  keyGenerator: (req) => `ratelimit:voice:${(req as any).user?.id || 'anonymous'}`,
});

/**
 * Rate limiter para geolocalización (100 requests/hora por usuario)
 */
export const locationRedisRateLimiter = redisRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 60 * 1000,
  keyGenerator: (req) => `ratelimit:location:${(req as any).user?.id || 'anonymous'}`,
});

export default {
  redisRateLimiter,
  generalRedisRateLimiter,
  authRedisRateLimiter,
  mcpRedisRateLimiter,
  messageRedisRateLimiter,
  voiceRedisRateLimiter,
  locationRedisRateLimiter,
};
