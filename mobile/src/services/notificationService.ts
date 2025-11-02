// Servicio de notificaciones push usando Expo Notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuración del comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  trigger?: {
    seconds?: number;
    date?: Date;
    repeats?: boolean;
  };
}

class NotificationService {
  private expoPushToken: string | null = null;
  private backendUrl: string = 'https://kaia-production.up.railway.app'; // PRODUCTION URL

  /**
   * Inicializar el servicio de notificaciones
   * - Solicita permisos
   * - Obtiene el token de push
   * - Configura listeners
   */
  async initialize(): Promise<string | null> {
    try {
      // Verificar si es un dispositivo físico
      if (!Device.isDevice) {
        console.log('⚠️ Push notifications only work on physical devices');
        return null;
      }

      // Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Failed to get push notification permissions');
        return null;
      }

      // Obtener el token de push
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.log('⚠️ Project ID not found in app config');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;
      console.log('✅ Push notification token:', token.data);

      // Configurar canal de notificaciones para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7256F6',
        });

        await Notifications.setNotificationChannelAsync('events', {
          name: 'Eventos',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7256F6',
        });

        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Recordatorios',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B6B',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  /**
   * Obtener el token de push actual
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Enviar una notificación local inmediata
   */
  async sendLocalNotification(notification: NotificationData): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: notification.trigger || null, // null = inmediato
      });

      console.log('📬 Local notification sent:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  }

  /**
   * Programar una notificación para un momento específico
   */
  async scheduleNotification(
    notification: NotificationData,
    triggerDate: Date
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: triggerDate,
        },
      });

      console.log('📅 Notification scheduled for:', triggerDate, 'ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Programar notificación para evento
   * Crea notificaciones 15 min antes y 1 día antes
   */
  async scheduleEventNotifications(event: {
    id: string;
    title: string;
    startTime: Date;
    location?: string;
  }): Promise<{ before15min: string | null; dayBefore: string | null }> {
    const results = {
      before15min: null as string | null,
      dayBefore: null as string | null,
    };

    try {
      const startTime = new Date(event.startTime);
      const now = new Date();

      // Notificación 15 minutos antes
      const before15min = new Date(startTime.getTime() - 15 * 60 * 1000);
      if (before15min > now) {
        results.before15min = await this.scheduleNotification(
          {
            title: `📅 Evento en 15 minutos`,
            body: `${event.title}${event.location ? ` en ${event.location}` : ''}`,
            data: {
              type: 'event_reminder',
              eventId: event.id,
              minutesBefore: 15,
            },
          },
          before15min
        );
      }

      // Notificación 1 día antes
      const dayBefore = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
      if (dayBefore > now) {
        results.dayBefore = await this.scheduleNotification(
          {
            title: `📅 Evento mañana`,
            body: `Recordatorio: ${event.title}`,
            data: {
              type: 'event_reminder',
              eventId: event.id,
              minutesBefore: 1440, // 24 horas = 1440 minutos
            },
          },
          dayBefore
        );
      }

      console.log('✅ Event notifications scheduled:', results);
      return results;
    } catch (error) {
      console.error('Error scheduling event notifications:', error);
      return results;
    }
  }

  /**
   * Cancelar una notificación programada
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('❌ Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Cancelar todas las notificaciones de un evento
   */
  async cancelEventNotifications(eventId: string): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();

      for (const notification of scheduled) {
        if (notification.content.data?.eventId === eventId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      console.log('❌ All event notifications cancelled for:', eventId);
    } catch (error) {
      console.error('Error cancelling event notifications:', error);
    }
  }

  /**
   * Cancelar todas las notificaciones programadas
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Obtener todas las notificaciones programadas
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 Scheduled notifications:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Añadir listener para notificaciones recibidas (app en foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Añadir listener para cuando el usuario toca una notificación
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Obtener el último notification response (útil para deep linking)
   */
  async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    return await Notifications.getLastNotificationResponseAsync();
  }

  /**
   * Limpiar el badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log('🔢 Badge count set to:', count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Obtener badge count actual
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Notificación de cumpleaños
   */
  async scheduleBirthdayNotification(contact: {
    id: string;
    name: string;
    birthDate: Date;
  }): Promise<string | null> {
    try {
      const birthday = new Date(contact.birthDate);
      const today = new Date();

      // Calcular próximo cumpleaños
      const nextBirthday = new Date(
        today.getFullYear(),
        birthday.getMonth(),
        birthday.getDate(),
        9, // 9 AM
        0
      );

      // Si ya pasó este año, programar para el próximo
      if (nextBirthday < today) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
      }

      return await this.scheduleNotification(
        {
          title: `🎂 ¡Feliz Cumpleaños!`,
          body: `Hoy es el cumpleaños de ${contact.name}`,
          data: {
            type: 'birthday',
            contactId: contact.id,
          },
        },
        nextBirthday
      );
    } catch (error) {
      console.error('Error scheduling birthday notification:', error);
      return null;
    }
  }

  /**
   * Notificación de ubicación (geofence)
   */
  async sendLocationNotification(data: {
    title: string;
    location: string;
    type: 'enter' | 'exit';
    reminderText?: string;
  }): Promise<string> {
    const emoji = data.type === 'enter' ? '📍' : '🚶';
    const action = data.type === 'enter' ? 'Has llegado a' : 'Has salido de';

    return await this.sendLocalNotification({
      title: `${emoji} ${data.title}`,
      body: data.reminderText || `${action} ${data.location}`,
      data: {
        type: 'geofence',
        action: data.type,
      },
    });
  }

  /**
   * Registrar push token con el backend
   */
  async registerTokenWithBackend(token: string, accessToken: string) {
    try {
      const deviceInfo = {
        deviceName: Device.deviceName || 'Unknown',
        deviceType: Platform.OS as 'android' | 'ios',
        appVersion: Constants.expoConfig?.version || '1.0.0',
        osVersion: Platform.Version?.toString(),
        platform: 'mobile' as const,
      };

      const response = await fetch(`${this.backendUrl}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token,
          deviceInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Token registered with backend:', data.tokenId);
      } else {
        console.error('❌ Failed to register token:', data.error);
      }

      return data;
    } catch (error) {
      console.error('Error registering token with backend:', error);
      throw error;
    }
  }

  /**
   * Obtener el token actual
   */
  getToken(): string | null {
    return this.expoPushToken;
  }
}

// Exportar instancia única (singleton)
export const notificationService = new NotificationService();
export default notificationService;
