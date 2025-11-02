import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /api/notifications/register-token:
 *   post:
 *     summary: Registrar push token del dispositivo
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Expo Push Token
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   deviceName:
 *                     type: string
 *                   deviceType:
 *                     type: string
 *                     enum: [android, ios]
 *                   appVersion:
 *                     type: string
 *                   osVersion:
 *                     type: string
 *                   platform:
 *                     type: string
 *                     enum: [mobile, web]
 *     responses:
 *       200:
 *         description: Token registered successfully
 *       400:
 *         description: Invalid token
 */
router.post(
  '/register-token',
  notificationController.registerToken.bind(notificationController)
);

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Enviar notificación de prueba
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               body:
 *                 type: string
 *                 maxLength: 300
 *               data:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [default, normal, high]
 *               badge:
 *                 type: number
 *     responses:
 *       200:
 *         description: Notification sent successfully
 */
router.post(
  '/send',
  notificationController.sendNotification.bind(notificationController)
);

/**
 * @swagger
 * /api/notifications/tokens:
 *   get:
 *     summary: Obtener tokens del usuario actual
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tokens
 */
router.get(
  '/tokens',
  notificationController.getTokens.bind(notificationController)
);

/**
 * @swagger
 * /api/notifications/token/{tokenId}:
 *   delete:
 *     summary: Desactivar un push token
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token deactivated successfully
 */
router.delete(
  '/token/:tokenId',
  notificationController.deactivateToken.bind(notificationController)
);

/**
 * @swagger
 * /api/notifications/test-event:
 *   post:
 *     summary: Enviar notificación de prueba de evento
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test notification sent
 */
router.post(
  '/test-event',
  notificationController.testEventNotification.bind(notificationController)
);

export default router;
