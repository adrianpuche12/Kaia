import { ReminderRepository } from '../repositories/ReminderRepository';
import { EventRepository } from '../repositories/EventRepository';
import { Reminder } from '@prisma/client';

export interface CreateReminderDTO {
  userId: string;
  eventId?: string;
  title: string;
  message?: string;
  remindAt: Date;
  channel?: 'PUSH' | 'EMAIL' | 'SMS' | 'VOICE';
  recurring?: boolean;
  recurrenceRule?: string;
}

export interface UpdateReminderDTO {
  title?: string;
  message?: string;
  remindAt?: Date;
  channel?: 'PUSH' | 'EMAIL' | 'SMS' | 'VOICE';
  recurring?: boolean;
  recurrenceRule?: string;
}

/**
 * ReminderService
 * Capa de lógica de negocio para recordatorios
 *
 * Responsabilidades:
 * - Validación de recordatorios
 * - Procesamiento de recordatorios pendientes
 * - Gestión de snooze
 * - Envío de notificaciones
 * - Recordatorios recurrentes
 */
export class ReminderService {
  constructor(
    private reminderRepo: ReminderRepository,
    private eventRepo: EventRepository
  ) {}

  /**
   * Crear un nuevo recordatorio
   */
  async createReminder(data: CreateReminderDTO): Promise<Reminder> {
    // Validar datos
    this.validateReminderData(data);

    // Si tiene eventId, verificar que el evento existe
    if (data.eventId) {
      const event = await this.eventRepo.findById(data.eventId);
      if (!event) {
        throw new Error('Event not found');
      }
    }

    // Crear recordatorio
    return await this.reminderRepo.create({
      userId: data.userId,
      eventId: data.eventId,
      title: data.title,
      message: data.message,
      remindAt: data.remindAt,
      channel: data.channel || 'PUSH',
      recurring: data.recurring ?? false,
      recurrenceRule: data.recurrenceRule
    });
  }

  /**
   * Actualizar recordatorio
   */
  async updateReminder(
    reminderId: string,
    data: UpdateReminderDTO
  ): Promise<Reminder> {
    const existing = await this.reminderRepo.findById(reminderId);
    if (!existing) {
      throw new Error('Reminder not found');
    }

    return await this.reminderRepo.update(reminderId, data);
  }

  /**
   * Eliminar recordatorio
   */
  async deleteReminder(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepo.findById(reminderId);
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    await this.reminderRepo.delete(reminderId);
  }

  /**
   * Obtener recordatorios pendientes del usuario
   */
  async getPendingReminders(userId: string): Promise<Reminder[]> {
    return await this.reminderRepo.findPending(userId);
  }

  /**
   * Obtener recordatorios próximos (en las próximas X horas)
   */
  async getUpcomingReminders(
    userId: string,
    hours: number = 24
  ): Promise<Reminder[]> {
    return await this.reminderRepo.findUpcoming(userId, hours);
  }

  /**
   * Obtener recordatorios no leídos
   */
  async getUnreadReminders(userId: string): Promise<Reminder[]> {
    return await this.reminderRepo.findUnread(userId);
  }

  /**
   * Posponer (snooze) un recordatorio
   */
  async snoozeReminder(
    reminderId: string,
    minutes: number = 10
  ): Promise<Reminder> {
    const reminder = await this.reminderRepo.findById(reminderId);
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    return await this.reminderRepo.snooze(reminderId, minutes);
  }

  /**
   * Cancelar snooze de un recordatorio
   */
  async unsnoozeReminder(reminderId: string): Promise<Reminder> {
    const reminder = await this.reminderRepo.findById(reminderId);
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    return await this.reminderRepo.unsnooze(reminderId);
  }

  /**
   * Marcar recordatorio como enviado
   */
  async markAsSent(reminderId: string): Promise<Reminder> {
    return await this.reminderRepo.markAsSent(reminderId);
  }

  /**
   * Marcar recordatorio como leído
   */
  async markAsRead(reminderId: string): Promise<Reminder> {
    return await this.reminderRepo.markAsRead(reminderId);
  }

  /**
   * Crear recordatorios automáticos para un evento
   * - 1 día antes
   * - 1 hora antes
   * - 15 minutos antes
   */
  async createRemindersForEvent(eventId: string): Promise<Reminder[]> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    await this.reminderRepo.createMultipleForEvent(eventId);

    // Retornar los recordatorios creados
    return await this.reminderRepo.findByEvent(eventId);
  }

  /**
   * Procesar recordatorios que deben enviarse
   * Este método debe ejecutarse periódicamente (ej: cada minuto)
   */
  async processRemindersToSend(): Promise<{
    sent: number;
    failed: number;
    errors: Array<{ reminderId: string; error: string }>;
  }> {
    const now = new Date();
    const pendingReminders = await this.reminderRepo.findPending('');

    // Filtrar solo los que ya deben enviarse
    const remindersToSend = pendingReminders.filter(r => r.remindAt <= now);

    let sent = 0;
    let failed = 0;
    const errors: Array<{ reminderId: string; error: string }> = [];

    for (const reminder of remindersToSend) {
      try {
        // Aquí iría la lógica de envío según el canal
        await this.sendReminderNotification(reminder);

        // Marcar como enviado
        await this.reminderRepo.markAsSent(reminder.id);
        sent++;
      } catch (error) {
        failed++;
        errors.push({
          reminderId: reminder.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { sent, failed, errors };
  }

  /**
   * Procesar recordatorios snoozed que ya están listos
   */
  async processSnoozedReminders(): Promise<Reminder[]> {
    return await this.reminderRepo.processSnoozed();
  }

  /**
   * Obtener estadísticas de recordatorios
   */
  async getReminderStats(userId: string) {
    return await this.reminderRepo.getStats(userId);
  }

  /**
   * Limpiar recordatorios antiguos
   */
  async cleanupOldReminders(userId: string, days: number = 30): Promise<number> {
    return await this.reminderRepo.cleanupOld(userId, days);
  }

  /**
   * Enviar notificación de recordatorio según el canal
   * (Esta es una implementación simulada - en producción conectar con servicios reales)
   */
  private async sendReminderNotification(reminder: Reminder): Promise<void> {
    console.log(`[ReminderService] Sending ${reminder.channel} notification for reminder ${reminder.id}`);

    switch (reminder.channel) {
      case 'PUSH':
        await this.sendPushNotification(reminder);
        break;
      case 'EMAIL':
        await this.sendEmailNotification(reminder);
        break;
      case 'SMS':
        await this.sendSMSNotification(reminder);
        break;
      case 'VOICE':
        await this.sendVoiceNotification(reminder);
        break;
      default:
        throw new Error(`Unknown channel: ${reminder.channel}`);
    }
  }

  /**
   * Enviar notificación push
   */
  private async sendPushNotification(reminder: Reminder): Promise<void> {
    // TODO: Integrar con servicio de push notifications (Firebase Cloud Messaging)
    console.log(`[PUSH] ${reminder.title}: ${reminder.message}`);
  }

  /**
   * Enviar notificación por email
   */
  private async sendEmailNotification(reminder: Reminder): Promise<void> {
    // TODO: Integrar con servicio de email (SendGrid, etc.)
    console.log(`[EMAIL] ${reminder.title}: ${reminder.message}`);
  }

  /**
   * Enviar notificación por SMS
   */
  private async sendSMSNotification(reminder: Reminder): Promise<void> {
    // TODO: Integrar con servicio de SMS (Twilio, etc.)
    console.log(`[SMS] ${reminder.title}: ${reminder.message}`);
  }

  /**
   * Enviar notificación por voz
   */
  private async sendVoiceNotification(reminder: Reminder): Promise<void> {
    // TODO: Integrar con servicio de llamadas de voz (Twilio Voice, etc.)
    console.log(`[VOICE] ${reminder.title}: ${reminder.message}`);
  }

  /**
   * Validar datos del recordatorio
   */
  private validateReminderData(data: CreateReminderDTO): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Reminder title is required');
    }

    if (!data.remindAt) {
      throw new Error('Reminder time is required');
    }

    // Validar que la fecha no sea en el pasado
    const now = new Date();
    if (data.remindAt < now) {
      throw new Error('Reminder time cannot be in the past');
    }

    // Validar canal
    const validChannels = ['PUSH', 'EMAIL', 'SMS', 'VOICE'];
    if (data.channel && !validChannels.includes(data.channel)) {
      throw new Error(`Invalid channel. Must be one of: ${validChannels.join(', ')}`);
    }

    // Si es recurrente, debe tener regla de recurrencia
    if (data.recurring && !data.recurrenceRule) {
      throw new Error('Recurrence rule is required for recurring reminders');
    }
  }
}
