// Rutas de eventos
import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody, validateId } from '../middleware/validationMiddleware';
import { schemas } from '../utils/validators';
import { cacheMiddleware, invalidateCache, userCacheKey, idCacheKey } from '../middleware/cacheMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Write operations - invalidate cache
router.post('/',
  validateBody(schemas.createEvent),
  invalidateCache(['events:user:{userId}:*']),
  EventController.createEvent
);

// Voice command - invalidate cache
router.post('/voice-command',
  invalidateCache(['events:user:{userId}:*']),
  EventController.processVoiceCommand
);

// Read operations - with cache
router.get('/',
  cacheMiddleware({ ttl: 60, keyGenerator: userCacheKey('events') }),
  EventController.listEvents
);

router.get('/today',
  cacheMiddleware({ ttl: 60, keyGenerator: userCacheKey('events:today') }),
  EventController.getTodayEvents
);

router.get('/week',
  cacheMiddleware({ ttl: 120, keyGenerator: userCacheKey('events:week') }),
  EventController.getWeekEvents
);

router.get('/upcoming',
  cacheMiddleware({ ttl: 60, keyGenerator: userCacheKey('events:upcoming') }),
  EventController.getUpcomingEvents
);

router.get('/:id',
  validateId(),
  cacheMiddleware({ ttl: 300, keyGenerator: idCacheKey('events') }),
  EventController.getEventById
);

// Update operations - invalidate cache
router.put('/:id',
  validateId(),
  validateBody(schemas.updateEvent),
  invalidateCache(['events:user:{userId}:*', 'events:{id}']),
  EventController.updateEvent
);

router.post('/:id/cancel',
  validateId(),
  invalidateCache(['events:user:{userId}:*', 'events:{id}']),
  EventController.cancelEvent
);

router.post('/:id/complete',
  validateId(),
  invalidateCache(['events:user:{userId}:*', 'events:{id}']),
  EventController.completeEvent
);

router.delete('/:id',
  validateId(),
  invalidateCache(['events:user:{userId}:*', 'events:{id}']),
  EventController.deleteEvent
);

export default router;
