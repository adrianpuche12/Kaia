// Middleware de rate limiting simple (memoria)
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/helpers';
import { HTTP_STATUS, ERROR_CODES, RATE_LIMITS } from '../config/constants';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Almacenamiento en memoria (en producción usar Redis)
const store = new Map<string, RateLimitEntry>();

/**
 * Limpia entradas expiradas cada 5 minutos
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Crea un rate limiter con límite y ventana de tiempo configurables
 */
export function rateLimiter(options: {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
}) {
  const { maxRequests, windowMs, keyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Generar clave única para el cliente
    const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req);
    const now = Date.now();

    // Obtener o crear entrada
    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      // Nueva ventana de tiempo
      entry = {
        count: 0,
        resetAt: now + windowMs,
      };
      store.set(key, entry);
    }

    // Incrementar contador
    entry.count++;

    // Verificar límite
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(entry.resetAt).toISOString());

      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
        errorResponse(
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          `Demasiadas solicitudes. Intenta de nuevo en ${retryAfter} segundos.`
        )
      );
    }

    // Agregar headers informativos
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetAt).toISOString());

    next();
  };
}

/**
 * Genera clave por defecto (IP + User ID si está autenticado)
 */
function getDefaultKey(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userId = (req as any).user?.id || 'anonymous';
  return `${ip}:${userId}`;
}

/**
 * Rate limiter general (100 req/15min)
 */
export const generalRateLimiter = rateLimiter({
  maxRequests: RATE_LIMITS.GENERAL,
  windowMs: 15 * 60 * 1000, // 15 minutos
});

/**
 * Rate limiter para auth (10 req/15min por IP)
 */
export const authRateLimiter = rateLimiter({
  maxRequests: RATE_LIMITS.AUTH,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
});

/**
 * Rate limiter para MCPs (30 exec/min por usuario)
 */
export const mcpRateLimiter = rateLimiter({
  maxRequests: RATE_LIMITS.MCP_EXECUTION,
  windowMs: 60 * 1000, // 1 minuto
  keyGenerator: (req) => `mcp:${(req as any).user?.id || 'anonymous'}`,
});

/**
 * Rate limiter para envío de mensajes (20 mensajes/hora por usuario)
 */
export const messageRateLimiter = rateLimiter({
  maxRequests: 20,
  windowMs: 60 * 60 * 1000, // 1 hora
  keyGenerator: (req) => `message:${(req as any).user?.id || 'anonymous'}`,
});

/**
 * Rate limiter para procesamiento de voz (30 requests/hora por usuario)
 */
export const voiceRateLimiter = rateLimiter({
  maxRequests: 30,
  windowMs: 60 * 60 * 1000, // 1 hora
  keyGenerator: (req) => `voice:${(req as any).user?.id || 'anonymous'}`,
});

/**
 * Rate limiter para geolocalización (100 requests/hora por usuario)
 */
export const locationRateLimiter = rateLimiter({
  maxRequests: 100,
  windowMs: 60 * 60 * 1000, // 1 hora
  keyGenerator: (req) => `location:${(req as any).user?.id || 'anonymous'}`,
});

export default {
  rateLimiter,
  generalRateLimiter,
  authRateLimiter,
  mcpRateLimiter,
  messageRateLimiter,
  voiceRateLimiter,
  locationRateLimiter,
};
