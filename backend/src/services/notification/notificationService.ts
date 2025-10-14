// Servicio de notificaciones push y programadas
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { config } from '../../config/env';

const prisma = new PrismaClient();

interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  priority?: 'normal' | 'high';
}

export class NotificationService {
  /**
   * Envía notificación push a un usuario
   */
  static async sendPushNotification(
    userId: string,
    notification: PushNotification
  ): Promise<void> {
    // Obtener tokens de dispositivo del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Usuario no encontrado',
      };
    }

    // Aquí deberías obtener los push tokens del usuario (almacenados en tu BD)
    // Por ahora simulamos el envío
    logger.info('Sending push notification', { userId, title: notification.title });

    // Integración con Firebase Cloud Messaging (FCM) o similar
    if (config.fcmServerKey) {
      await this.sendFCM(userId, notification);
    }
  }

  /**
   * Envía notificación vía FCM
   */
  private static async sendFCM(userId: string, notification: PushNotification): Promise<void> {
    // Aquí implementarías la integración con FCM
    // Por ahora es un placeholder

    const payload = {
      notification: {
        title: notification.title,
        body: notification.body,
        sound: notification.sound || 'default',
      },
      data: notification.data || {},
      priority: notification.priority || 'high',
    };

    logger.info('FCM payload prepared', { userId, payload });

    // En producción:
    // await fetch('https://fcm.googleapis.com/fcm/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `key=${config.fcmServerKey}`
    //   },
    //   body: JSON.stringify({ to: deviceToken, ...payload })
    // });
  }

  /**
   * Programa notificación de recordatorio
   */
  static async scheduleReminder(
    userId: string,
    reminderId: string,
    remindAt: Date
  ): Promise<void> {
    const reminder = await prisma.reminder.findFirst({
      where: { id: reminderId, userId },
    });

    if (!reminder) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Recordatorio no encontrado',
      };
    }

    logger.info('Reminder notification scheduled', { reminderId, remindAt });

    // En producción, esto usaría un job scheduler (Bull, Agenda, etc.)
    // Por ahora solo lo loggeamos
  }

  /**
   * Programa notificación de evento
   */
  static async scheduleEventReminder(
    userId: string,
    eventId: string,
    minutesBefore: number
  ): Promise<void> {
    const event = await prisma.event.findFirst({
      where: { id: eventId, userId },
    });

    if (!event) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Evento no encontrado',
      };
    }

    const notificationTime = new Date(event.startTime.getTime() - minutesBefore * 60 * 1000);

    logger.info('Event reminder scheduled', {
      eventId,
      eventTitle: event.title,
      notificationTime,
    });

    // En producción usaría job scheduler
  }

  /**
   * Activa alarma
   */
  static async triggerAlarm(alarmId: string): Promise<void> {
    const alarm = await prisma.alarm.findUnique({
      where: { id: alarmId },
      include: { user: true },
    });

    if (!alarm) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Alarma no encontrada',
      };
    }

    if (!alarm.enabled) {
      logger.info('Alarm is disabled, skipping', { alarmId });
      return;
    }

    // Enviar notificación push
    await this.sendPushNotification(alarm.userId, {
      title: '⏰ Alarma',
      body: alarm.label || `Alarma programada para las ${alarm.time}`,
      sound: alarm.sound || 'alarm',
      priority: 'high',
      data: {
        type: 'ALARM',
        alarmId: alarm.id,
      },
    });

    // Marcar como disparada
    await prisma.alarm.update({
      where: { id: alarmId },
      data: { lastTriggered: new Date() },
    });

    logger.info('Alarm triggered', { alarmId, userId: alarm.userId });
  }

  /**
   * Envía notificación de mensaje recibido
   */
  static async notifyNewMessage(
    userId: string,
    messageId: string,
    senderName: string,
    preview: string
  ): Promise<void> {
    await this.sendPushNotification(userId, {
      title: `💬 Mensaje de ${senderName}`,
      body: preview.substring(0, 100),
      data: {
        type: 'MESSAGE',
        messageId,
      },
    });
  }

  /**
   * Envía notificación de evento próximo
   */
  static async notifyUpcomingEvent(
    userId: string,
    eventId: string,
    eventTitle: string,
    startsIn: string
  ): Promise<void> {
    await this.sendPushNotification(userId, {
      title: `📅 Evento próximo: ${eventTitle}`,
      body: `Tu evento comienza ${startsIn}`,
      data: {
        type: 'EVENT',
        eventId,
      },
    });
  }

  /**
   * Envía notificación de tráfico
   */
  static async notifyTrafficAlert(
    userId: string,
    destination: string,
    delay: number
  ): Promise<void> {
    await this.sendPushNotification(userId, {
      title: '🚗 Alerta de tráfico',
      body: `Hay ${delay} minutos de retraso hacia ${destination}. Considera salir antes.`,
      data: {
        type: 'TRAFFIC',
        destination,
        delay,
      },
    });
  }

  /**
   * Procesa notificaciones pendientes (cron job)
   */
  static async processPendingNotifications(): Promise<void> {
    const now = new Date();

    // Procesar recordatorios pendientes
    const pendingReminders = await prisma.reminder.findMany({
      where: {
        remindAt: { lte: now },
        status: 'PENDING',
      },
    });

    for (const reminder of pendingReminders) {
      try {
        await this.sendPushNotification(reminder.userId, {
          title: '🔔 Recordatorio',
          body: reminder.content,
          data: {
            type: 'REMINDER',
            reminderId: reminder.id,
          },
        });

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: 'SENT' },
        });

        logger.info('Reminder notification sent', { reminderId: reminder.id });
      } catch (error) {
        logger.error('Failed to send reminder notification', error);
      }
    }

    // Procesar alarmas que deben dispararse
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM
    const currentDay = now.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

    const alarmsToTrigger = await prisma.alarm.findMany({
      where: {
        enabled: true,
        time: currentTime,
      },
    });

    for (const alarm of alarmsToTrigger) {
      // Verificar si la alarma aplica hoy
      if (alarm.daysOfWeek) {
        const days = JSON.parse(alarm.daysOfWeek);
        if (!days.includes(currentDay)) {
          continue;
        }
      }

      try {
        await this.triggerAlarm(alarm.id);
      } catch (error) {
        logger.error('Failed to trigger alarm', error);
      }
    }

    // Procesar recordatorios de eventos (30 min antes)
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startTime: {
          gte: now,
          lte: thirtyMinutesFromNow,
        },
        status: 'SCHEDULED',
      },
    });

    for (const event of upcomingEvents) {
      const minutesUntilEvent = Math.round(
        (event.startTime.getTime() - now.getTime()) / (1000 * 60)
      );

      if (minutesUntilEvent <= event.reminderMinutes) {
        try {
          await this.notifyUpcomingEvent(
            event.userId,
            event.id,
            event.title,
            `en ${minutesUntilEvent} minutos`
          );

          logger.info('Event reminder sent', { eventId: event.id });
        } catch (error) {
          logger.error('Failed to send event reminder', error);
        }
      }
    }
  }
}

export default NotificationService;
