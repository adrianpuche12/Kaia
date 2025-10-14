// Rutas de contactos
import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody, validateId } from '../middleware/validationMiddleware';
import { schemas } from '../utils/validators';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET routes
router.get('/', ContactController.listContacts);
router.get('/search', ContactController.searchContacts);
router.get('/frequent', ContactController.getFrequentContacts);
router.get('/recent', ContactController.getRecentContacts);
router.get('/whatsapp', ContactController.getWhatsAppContacts);
router.get('/tags', ContactController.getAllTags);
router.get('/tags/:tag', ContactController.getContactsByTag);
router.get('/stats', ContactController.getContactStats);
router.get('/:id', validateId(), ContactController.getContactById);

// POST routes
router.post('/', validateBody(schemas.createContact), ContactController.createContact);
router.post('/sync', validateBody(schemas.syncContacts), ContactController.syncFromDevice);
router.post('/cleanup', validateBody(schemas.cleanupContacts), ContactController.cleanupInactive);
router.post('/:id/tags', validateId(), validateBody(schemas.addTag), ContactController.addTag);

// PUT routes
router.put('/:id', validateId(), validateBody(schemas.updateContact), ContactController.updateContact);

// DELETE routes
router.delete('/:id', validateId(), ContactController.deleteContact);
router.delete('/:id/tags/:tag', validateId(), ContactController.removeTag);

export default router;
