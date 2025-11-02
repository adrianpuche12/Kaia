import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushSuccessTicket } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';

const expo = new Expo();
const prisma = new PrismaClient();

export interface SendNotificationOptions {
  userId: string;
  title: string;
  body: string;
  data?: any;
  priority?: 'default' | 'normal' | 'high';
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

export class NotificationService {

  /**
   * Registrar o actualizar push token de un dispositivo
   */
  async registerPushToken(
    userId: string,
    token: string,
    deviceInfo?: {
      deviceId?: string;
      deviceName?: string;
      deviceType?: string;
      appVersion?: string;
      osVersion?: string;
      platform?: string;
    }
  ) {
    // Validar que el token sea válido para Expo
    if (!Expo.isExpoPushToken(token)) {
      throw new Error('Invalid Expo Push Token');
    }

    // Buscar token existente
    const existingToken = await prisma.pushToken.findUnique({
      where: { token }
    });

    if (existingToken) {
      // Actualizar token existente
      return await prisma.pushToken.update({
        where: { token },
        data: {
          userId,
          active: true,
          lastUsed: new Date(),
          ...deviceInfo,
        }
      });
    }

    // Crear nuevo token
    return await prisma.pushToken.create({
      data: {
        userId,
        token,
        active: true,
        ...deviceInfo,
      }
    });
  }

  /**
   * Enviar notificación a un usuario específico
   */
  async sendToUser(options: SendNotificationOptions) {
    const { userId, ...notificationData } = options;

    // Obtener tokens activos del usuario
    const tokens = await prisma.pushToken.findMany({
      where: {
        userId,
        active: true,
      }
    });

    if (tokens.length === 0) {
      console.log(`No active push tokens for user ${userId}`);
      return { success: false, message: 'No active tokens' };
    }

    // Construir mensajes
    const messages: ExpoPushMessage[] = tokens.map(({ token }) => ({
      to: token,
      sound: notificationData.sound ?? 'default',
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data,
      priority: notificationData.priority ?? 'high',
      badge: notificationData.badge,
      channelId: notificationData.channelId ?? 'default',
    }));

    // Enviar en batches (Expo recomienda max 100 por batch)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notifications:', error);
      }
    }

    // Procesar tickets y manejar errores
    await this.handleTickets(tickets, tokens.map(t => t.token));

    return {
      success: true,
      sent: tickets.filter(t => t.status === 'ok').length,
      errors: tickets.filter(t => t.status === 'error').length,
    };
  }

  /**
   * Enviar notificación de evento próximo
   */
  async sendEventReminder(
    userId: string,
    event: {
      id: string;
      title: string;
      startTime: Date;
      location?: string;
    },
    minutesBefore: number
  ) {
    const timeText = minutesBefore >= 1440
      ? 'mañana'
      : minutesBefore >= 60
        ? `en ${Math.floor(minutesBefore / 60)} horas`
        : `en ${minutesBefore} minutos`;

    return await this.sendToUser({
      userId,
      title: `📅 Evento ${timeText}`,
      body: `${event.title}${event.location ? ` en ${event.location}` : ''}`,
      data: {
        type: 'event_reminder',
        eventId: event.id,
        minutesBefore,
      },
      channelId: 'events',
    });
  }

  /**
   * Enviar notificación de alarma
   */
  async sendAlarmNotification(
    userId: string,
    alarm: {
      id: string;
      label?: string;
      wakeMessage?: string;
    }
  ) {
    return await this.sendToUser({
      userId,
      title: '⏰ ¡Es hora de despertar!',
      body: alarm.wakeMessage || alarm.label || 'Tu alarma está sonando',
      data: {
        type: 'alarm',
        alarmId: alarm.id,
      },
      priority: 'high',
      sound: 'default',
      channelId: 'reminders',
    });
  }

  /**
   * Enviar notificación de recordatorio
   */
  async sendReminderNotification(
    userId: string,
    reminder: {
      id: string;
      title: string;
      description?: string;
    }
  ) {
    return await this.sendToUser({
      userId,
      title: `🔔 Recordatorio: ${reminder.title}`,
      body: reminder.description || reminder.title,
      data: {
        type: 'reminder',
        reminderId: reminder.id,
      },
      channelId: 'reminders',
    });
  }

  /**
   * Enviar notificación de mensaje recibido
   */
  async sendMessageNotification(
    userId: string,
    message: {
      id: string;
      from: string;
      preview: string;
    }
  ) {
    return await this.sendToUser({
      userId,
      title: `💬 Mensaje de ${message.from}`,
      body: message.preview,
      data: {
        type: 'message',
        messageId: message.id,
      },
      channelId: 'messages',
    });
  }

  /**
   * Enviar notificación de geofence
   */
  async sendGeofenceNotification(
    userId: string,
    geofence: {
      id: string;
      name: string;
      entered: boolean;
    }
  ) {
    return await this.sendToUser({
      userId,
      title: geofence.entered ? `📍 Llegaste a ${geofence.name}` : `📍 Saliste de ${geofence.name}`,
      body: geofence.entered
        ? `Has entrado en la zona: ${geofence.name}`
        : `Has salido de la zona: ${geofence.name}`,
      data: {
        type: 'geofence',
        geofenceId: geofence.id,
        entered: geofence.entered,
      },
      channelId: 'location',
    });
  }

  /**
   * Manejar tickets de respuesta de Expo
   */
  private async handleTickets(
    tickets: ExpoPushTicket[],
    tokens: string[]
  ) {
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const token = tokens[i];

      if (ticket.status === 'error') {
        console.error(`Error for token ${token}:`, ticket.message);

        // Si el token es inválido, marcarlo como inactivo
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await prisma.pushToken.update({
            where: { token },
            data: {
              active: false,
              failureCount: { increment: 1 },
              lastError: ticket.message,
              lastErrorAt: new Date(),
            }
          });
        }
      }
    }
  }

  /**
   * Desactivar un push token
   */
  async deactivateToken(token: string) {
    return await prisma.pushToken.update({
      where: { token },
      data: { active: false }
    });
  }

  /**
   * Obtener tokens de un usuario
   */
  async getUserTokens(userId: string) {
    return await prisma.pushToken.findMany({
      where: { userId, active: true }
    });
  }

  /**
   * Limpiar tokens expirados o con muchos fallos
   */
  async cleanupInactiveTokens() {
    // Desactivar tokens con más de 10 fallos
    await prisma.pushToken.updateMany({
      where: {
        failureCount: { gte: 10 },
        active: true,
      },
      data: { active: false }
    });

    // Eliminar tokens inactivos por más de 90 días
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    await prisma.pushToken.deleteMany({
      where: {
        active: false,
        lastUsed: { lt: ninetyDaysAgo }
      }
    });
  }
}

export const notificationService = new NotificationService();
