// Rutas de mensajes
import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody, validateId } from '../middleware/validationMiddleware';
import { messageRateLimiter } from '../middleware/rateLimiter';
import { schemas } from '../utils/validators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET routes
router.get('/', MessageController.listMessages);
router.get('/conversations', MessageController.getConversations);
router.get('/conversation/:contactId', MessageController.getConversation);
router.get('/unread', MessageController.getUnreadMessages);
router.get('/unread/count', MessageController.getUnreadCount);
router.get('/search', MessageController.searchMessages);
router.get('/stats', MessageController.getStats);

// POST routes (con rate limiting para envío de mensajes)
router.post('/', messageRateLimiter, validateBody(schemas.sendMessage), MessageController.sendMessage);
router.post('/:id/read', validateId(), MessageController.markAsRead);
router.post('/conversation/:contactId/read', MessageController.markConversationAsRead);
router.post('/:id/retry', messageRateLimiter, validateId(), MessageController.retryMessage);

// DELETE routes
router.delete('/:id', validateId(), MessageController.deleteMessage);

export default router;
