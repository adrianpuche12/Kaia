// Rutas de comandos de voz
import { Router } from 'express';
import { VoiceController } from '../controllers/voice.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { voiceRateLimiter } from '../middleware/rateLimiter';
import { schemas } from '../utils/validators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET routes
router.get('/history', VoiceController.getHistory);
router.get('/stats', VoiceController.getStats);
router.get('/accuracy', VoiceController.getAccuracyByIntent);
router.get('/intents', VoiceController.getCommonIntents);

// POST routes (con rate limiting para procesamiento de voz)
router.post('/process', voiceRateLimiter, validateBody(schemas.processVoice), VoiceController.processCommand);
router.post('/query', voiceRateLimiter, validateBody(schemas.processVoice), VoiceController.processQuery);

export default router;
