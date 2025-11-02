import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { z } from 'zod';

// Validation schemas
const registerTokenSchema = z.object({
  token: z.string().min(1),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    deviceName: z.string().optional(),
    deviceType: z.enum(['android', 'ios']).optional(),
    appVersion: z.string().optional(),
    osVersion: z.string().optional(),
    platform: z.enum(['mobile', 'web']).optional(),
  }).optional(),
});

const sendNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(300),
  data: z.record(z.any()).optional(),
  priority: z.enum(['default', 'normal', 'high']).optional(),
  badge: z.number().optional(),
});

export class NotificationController {

  /**
   * POST /api/notifications/register-token
   * Registrar o actualizar push token del dispositivo
   */
  async registerToken(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id; // De auth middleware
      const { token, deviceInfo } = registerTokenSchema.parse(req.body);

      const result = await notificationService.registerPushToken(
        userId,
        token,
        deviceInfo
      );

      res.status(200).json({
        success: true,
        message: 'Push token registered successfully',
        tokenId: result.id,
      });
    } catch (error: any) {
      console.error('Error registering push token:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to register push token'
      });
    }
  }

  /**
   * POST /api/notifications/send
   * Enviar notificación de prueba (testing)
   */
  async sendNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id;
      const data = sendNotificationSchema.parse(req.body);

      const result = await notificationService.sendToUser({
        userId,
        ...data,
      });

      res.status(200).json({
        success: true,
        result,
      });
    } catch (error: any) {
      console.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send notification'
      });
    }
  }

  /**
   * GET /api/notifications/tokens
   * Obtener tokens del usuario actual
   */
  async getTokens(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id;
      const tokens = await notificationService.getUserTokens(userId);

      res.status(200).json({
        success: true,
        tokens: tokens.map(t => ({
          id: t.id,
          deviceName: t.deviceName,
          deviceType: t.deviceType,
          lastUsed: t.lastUsed,
          createdAt: t.createdAt,
        }))
      });
    } catch (error: any) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch tokens'
      });
    }
  }

  /**
   * DELETE /api/notifications/token/:tokenId
   * Desactivar un push token
   */
  async deactivateToken(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;

      // TODO: Verificar que el token pertenezca al usuario
      const userId = (req as any).user!.id;

      await notificationService.deactivateToken(tokenId);

      res.status(200).json({
        success: true,
        message: 'Token deactivated successfully'
      });
    } catch (error: any) {
      console.error('Error deactivating token:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to deactivate token'
      });
    }
  }

  /**
   * POST /api/notifications/test-event
   * Enviar notificación de prueba de evento
   */
  async testEventNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id;

      const result = await notificationService.sendEventReminder(
        userId,
        {
          id: 'test-event-1',
          title: 'Reunión de prueba',
          startTime: new Date(Date.now() + 15 * 60 * 1000), // 15 min
          location: 'Sala virtual',
        },
        15 // 15 minutos antes
      );

      res.status(200).json({
        success: true,
        message: 'Test event notification sent',
        result,
      });
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send test notification'
      });
    }
  }
}

export const notificationController = new NotificationController();
