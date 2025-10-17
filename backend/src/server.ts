import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimiter';
import { generalRedisRateLimiter } from './middleware/redisRateLimiter';
import { RedisClient } from './config/redis';
import routes from './routes';
import { swaggerSpec } from './config/swagger';
import { initSentry, Sentry } from './config/sentry';

// Load environment variables
dotenv.config();

// Initialize Sentry (must be first)
initSentry();

const app = express();
const PORT = config.port;

// Security middleware with custom configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Para permitir recursos externos
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigin || '*',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Rate limiting (use Redis if available, fallback to memory)
app.use('/api', (req, res, next) => {
  if (RedisClient.isReady()) {
    return generalRedisRateLimiter(req, res, next);
  }
  return generalRateLimiter(req, res, next);
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Kaia Backend API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      mcps: '/api/mcps',
      voice: '/api/voice',
      messages: '/api/messages',
      location: '/api/location',
      users: '/api/users',
    },
  });
});

// Health check
app.get('/health', async (req, res) => {
  const { RedisClient } = await import('./config/redis');
  const { cacheService } = await import('./services/cache/cacheService');

  const redisHealth = await RedisClient.healthCheck();
  const redisInfo = await RedisClient.getInfo();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    cache: {
      enabled: config.cacheEnabled,
      redis: {
        connected: redisHealth.healthy,
        latency: redisHealth.latency,
        error: redisHealth.error,
        info: redisInfo,
      },
      metrics: cacheService.getMetrics(),
    },
  });
});

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Kaia API Documentation',
  customfavIcon: '/favicon.ico',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (must be before other error handlers but after routes)
Sentry.setupExpressErrorHandler(app);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Kaia Backend running on port ${PORT}`);
  logger.info(`📝 Environment: ${config.nodeEnv}`);
  logger.info(`🔒 Database: ${config.databaseUrl.includes('file:') ? 'SQLite (dev)' : 'PostgreSQL'}`);
  logger.info(`✅ Server ready at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;