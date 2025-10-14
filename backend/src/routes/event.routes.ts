// Rutas de eventos
import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody, validateId } from '../middleware/validationMiddleware';
import { schemas } from '../utils/validators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.post('/', validateBody(schemas.createEvent), EventController.createEvent);
router.get('/', EventController.listEvents);
router.get('/today', EventController.getTodayEvents);
router.get('/week', EventController.getWeekEvents);
router.get('/upcoming', EventController.getUpcomingEvents);
router.get('/:id', validateId(), EventController.getEventById);
router.put('/:id', validateId(), validateBody(schemas.updateEvent), EventController.updateEvent);
router.post('/:id/cancel', validateId(), EventController.cancelEvent);
router.post('/:id/complete', validateId(), EventController.completeEvent);
router.delete('/:id', validateId(), EventController.deleteEvent);

export default router;
