/**
 * TTS Routes
 *
 * Endpoints for text-to-speech conversion
 */

import { Router } from 'express';
import { TTSController } from '../controllers/tts.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { ttsRateLimiter } from '../middleware/rateLimiter';
import { schemas } from '../utils/validators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// POST /api/tts/speak - Convert text to speech
router.post('/speak', ttsRateLimiter, validateBody(schemas.speak), TTSController.speak);

// GET /api/tts/voices - Get available voices
router.get('/voices', TTSController.getVoices);

// GET /api/tts/status - Get TTS service status
router.get('/status', TTSController.getStatus);

export default router;
