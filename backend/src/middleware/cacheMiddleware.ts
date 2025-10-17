// Cache middleware for HTTP requests
import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache/cacheService';
import { logger } from '../utils/logger';

/**
 * Cache middleware options
 */
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string; // Custom key generator
  condition?: (req: Request) => boolean; // Conditional caching
}

/**
 * Generate default cache key from request
 */
function generateDefaultKey(req: Request): string {
  const userId = (req as any).user?.id || 'anonymous';
  const path = req.path.replace(/\//g, ':');
  const query = JSON.stringify(req.query);

  return `api${path}:user:${userId}:${query}`;
}

/**
 * Cache middleware factory
 *
 * Usage:
 * ```typescript
 * router.get('/events', cacheMiddleware({ ttl: 60 }), eventController.getEvents);
 * ```
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 60,
    keyGenerator = generateDefaultKey,
    condition = () => true,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if cache is disabled
    if (!cacheService.isEnabled()) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check condition
    if (!condition(req)) {
      return next();
    }

    try {
      // Generate cache key
      const key = keyGenerator(req);

      // Try to get from cache
      const cached = await cacheService.get(key);

      if (cached) {
        // Cache hit - return cached response
        logger.debug(`Cache HIT: ${key}`);
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Cache miss - continue to controller
      logger.debug(`Cache MISS: ${key}`);
      res.setHeader('X-Cache', 'MISS');

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        // Cache the response (fire and forget)
        cacheService.set(key, body, ttl).catch((error) => {
          logger.error(`Background cache set failed: ${error.message}`);
        });

        return originalJson(body);
      };

      next();
    } catch (error: any) {
      // On error, continue without cache
      logger.error('Cache middleware error:', error.message);
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 * Invalidates cache for specific patterns after write operations
 *
 * Usage:
 * ```typescript
 * router.post('/events',
 *   invalidateCache(['events:user:*']),
 *   eventController.createEvent
 * );
 * ```
 */
export function invalidateCache(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send/json functions
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    // Override to invalidate after successful response
    const invalidate = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          // Replace {userId} placeholder with actual user ID
          const userId = (req as any).user?.id;
          const processedPattern = pattern.replace('{userId}', userId || '*');

          try {
            const deleted = await cacheService.delPattern(processedPattern);
            if (deleted > 0) {
              logger.debug(`Cache invalidated: ${processedPattern} (${deleted} keys)`);
            }
          } catch (error: any) {
            logger.error(`Cache invalidation error for ${processedPattern}:`, error.message);
          }
        }
      }
    };

    res.send = function (body: any) {
      invalidate().catch((error) => logger.error('Invalidation error:', error));
      return originalSend(body);
    };

    res.json = function (body: any) {
      invalidate().catch((error) => logger.error('Invalidation error:', error));
      return originalJson(body);
    };

    next();
  };
}

/**
 * Conditional cache middleware - only cache if user is authenticated
 */
export function cacheIfAuthenticated(options: CacheOptions = {}) {
  return cacheMiddleware({
    ...options,
    condition: (req) => !!(req as any).user,
  });
}

/**
 * Generate cache key for user-specific resources
 */
export function userCacheKey(resource: string) {
  return (req: Request) => {
    const userId = (req as any).user?.id || 'anonymous';
    const query = req.query;
    const queryStr = Object.keys(query).length > 0
      ? `:${JSON.stringify(query)}`
      : '';

    return `${resource}:user:${userId}${queryStr}`;
  };
}

/**
 * Generate cache key for ID-based resources
 */
export function idCacheKey(resource: string) {
  return (req: Request) => {
    const id = req.params.id;
    return `${resource}:${id}`;
  };
}

export default cacheMiddleware;
