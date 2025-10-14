// Rutas de usuario
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody, validateId } from '../middleware/validationMiddleware';
import { schemas } from '../utils/validators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Onboarding
router.post('/onboarding', UserController.completeOnboarding);

router.get('/preferences', UserController.getPreferences);
router.put('/preferences', validateBody(schemas.updatePreferences), UserController.updatePreferences);

router.get('/contacts', UserController.listContacts);
router.post('/contacts', validateBody(schemas.createContact), UserController.createContact);
router.get('/contacts/:id', validateId(), UserController.getContactById);
router.put('/contacts/:id', validateId(), validateBody(schemas.updateContact), UserController.updateContact);
router.delete('/contacts/:id', validateId(), UserController.deleteContact);

export default router;
