// Exportación centralizada de rutas
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user/userRoutes';
import eventRoutes from './event.routes';
import contactRoutes from './contact.routes';
import messageRoutes from './message.routes';
import voiceRoutes from './voice.routes';
import locationRoutes from './location.routes';
import mcpRoutes from './mcp.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// Montar rutas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/contacts', contactRoutes);
router.use('/messages', messageRoutes);
router.use('/voice', voiceRoutes);
router.use('/location', locationRoutes);
router.use('/mcps', mcpRoutes);
router.use('/notifications', notificationRoutes);

export default router;
