import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from './env';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only initializes in production environment
 */
export function initSentry() {
  // Only initialize Sentry in production
  if (config.nodeEnv === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: config.nodeEnv,

      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% de las transacciones para performance monitoring

      // Profiling
      profilesSampleRate: 0.1, // 10% de las transacciones para profiling
      integrations: [
        nodeProfilingIntegration(),
      ],

      // Release tracking
      release: process.env.npm_package_version || '1.0.0',

      // Before send hook para filtrar eventos sensibles
      beforeSend(event, hint) {
        // No enviar errores de validación (400)
        if (event.exception?.values?.[0]?.type === 'ValidationError') {
          return null;
        }

        // Remover datos sensibles
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
        }

        return event;
      },
    });

    console.log('✅ Sentry initialized for error tracking');
  } else if (!process.env.SENTRY_DSN && config.nodeEnv === 'production') {
    console.warn('⚠️  SENTRY_DSN not configured - Error tracking disabled');
  } else {
    console.log('ℹ️  Sentry disabled (development mode)');
  }
}

export { Sentry };
