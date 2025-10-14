// Rutas de autenticación
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { authRateLimiter } from '../middleware/rateLimiter';
import { schemas } from '../utils/validators';

const router = Router();

// Rutas públicas (con rate limiting especial)
router.post(
  '/register',
  authRateLimiter,
  validateBody(schemas.register),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(schemas.login),
  AuthController.login
);

router.post(
  '/refresh',
  validateBody(schemas.refreshToken),
  AuthController.refreshToken
);

// Rutas protegidas
router.get('/profile', authenticate, AuthController.getProfile);

router.put(
  '/profile',
  authenticate,
  validateBody(schemas.updateProfile),
  AuthController.updateProfile
);

router.post(
  '/change-password',
  authenticate,
  validateBody(schemas.changePassword),
  AuthController.changePassword
);

router.delete('/account', authenticate, AuthController.deleteAccount);

export default router;
