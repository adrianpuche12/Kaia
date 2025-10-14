/**
 * ReminderRepository - Repositorio para gestión de recordatorios
 *
 * Funcionalidades:
 * - CRUD completo de recordatorios
 * - Recordatorios asociados a eventos
 * - Recordatorios independientes
 * - Snooze (posponer) recordatorios
 * - Recordatorios recurrentes
 * - Búsqueda de recordatorios pendientes
 * - Integración con Observer pattern para notificar a IA
 */

import { Reminder, Prisma } from '@prisma/client';
import { BaseRepository, RepositoryEvent } from './base/BaseRepository';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ReminderCreateData {
  userId: string;
  eventId?: string;
  title: string;
  message?: string;
  remindAt: Date;
  channel?: 'PUSH' | 'EMAIL' | 'SMS' | 'VOICE';
  recurring?: boolean;
  recurrenceRule?: string;
}

export interface ReminderUpdateData {
  title?: string;
  message?: string;
  remindAt?: Date;
  channel?: 'PUSH' | 'EMAIL' | 'SMS' | 'VOICE';
  sent?: boolean;
  read?: boolean;
  snoozed?: boolean;
  snoozeUntil?: Date;
  recurring?: boolean;
  recurrenceRule?: string;
}

export interface ReminderFilters {
  userId: string;
  eventId?: string;
  sent?: boolean;
  read?: boolean;
  snoozed?: boolean;
  channel?: string;
  recurring?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface PendingRemindersOptions {
  userId: string;
  beforeTime?: Date;
  limit?: number;
  channel?: string;
}

// ============================================================================
// REMINDER REPOSITORY
// ============================================================================

export class ReminderRepository extends BaseRepository<Reminder> {

  /**
   * Constructor
   */
  constructor() {
    super();
  }

  // ==========================================================================
  // CRUD BÁSICO
  // ==========================================================================

  /**
   * Crear un nuevo recordatorio
   */
  async create(data: ReminderCreateData): Promise<Reminder> {
    const reminderData: Prisma.ReminderCreateInput = {
      user: {
        connect: { id: data.userId }
      },
      title: data.title,
      message: data.message,
      remindAt: data.remindAt,
      channel: data.channel || 'PUSH',
      recurring: data.recurring || false,
      recurrenceRule: data.recurrenceRule,
    };

    // Asociar a evento si existe
    if (data.eventId) {
      reminderData.event = {
        connect: { id: data.eventId }
      };
    }

    const reminder = await this.prisma.reminder.create({
      data: reminderData,
      include: {
        event: true,
      }
    });

    // Notificar a observers (AI system)
    await this.notifyObservers({
      type: RepositoryEvent.CREATE,
      entityType: 'Reminder',
      entityId: reminder.id,
      userId: reminder.userId,
      data: reminder,
      timestamp: new Date(),
    });

    return reminder;
  }

  /**
   * Buscar recordatorio por ID
   */
  async findById(id: string): Promise<Reminder | null> {
    return await this.prisma.reminder.findUnique({
      where: { id },
      include: {
        event: true,
      }
    });
  }

  /**
   * Actualizar un recordatorio
   */
  async update(id: string, data: ReminderUpdateData): Promise<Reminder> {
    const updateData: Prisma.ReminderUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.remindAt !== undefined) updateData.remindAt = data.remindAt;
    if (data.channel !== undefined) updateData.channel = data.channel;
    if (data.sent !== undefined) updateData.sent = data.sent;
    if (data.read !== undefined) updateData.read = data.read;
    if (data.snoozed !== undefined) updateData.snoozed = data.snoozed;
    if (data.snoozeUntil !== undefined) updateData.snoozeUntil = data.snoozeUntil;
    if (data.recurring !== undefined) updateData.recurring = data.recurring;
    if (data.recurrenceRule !== undefined) updateData.recurrenceRule = data.recurrenceRule;

    const reminder = await this.prisma.reminder.update({
      where: { id },
      data: updateData,
      include: {
        event: true,
      }
    });

    // Notificar a observers
    await this.notifyObservers({
      type: RepositoryEvent.UPDATE,
      entityType: 'Reminder',
      entityId: reminder.id,
      userId: reminder.userId,
      data: reminder,
      timestamp: new Date(),
    });

    return reminder;
  }

  /**
   * Eliminar un recordatorio
   */
  async delete(id: string): Promise<void> {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id }
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    await this.prisma.reminder.delete({
      where: { id }
    });

    // Notificar a observers
    await this.notifyObservers({
      type: RepositoryEvent.DELETE,
      entityType: 'Reminder',
      entityId: id,
      userId: reminder.userId,
      data: { id },
      timestamp: new Date(),
    });
  }

  // ==========================================================================
  // BÚSQUEDA Y FILTRADO
  // ==========================================================================

  /**
   * Buscar recordatorios con filtros
   */
  async findMany(filters: ReminderFilters): Promise<Reminder[]> {
    const where: Prisma.ReminderWhereInput = {
      userId: filters.userId,
    };

    if (filters.eventId !== undefined) {
      where.eventId = filters.eventId;
    }

    if (filters.sent !== undefined) {
      where.sent = filters.sent;
    }

    if (filters.read !== undefined) {
      where.read = filters.read;
    }

    if (filters.snoozed !== undefined) {
      where.snoozed = filters.snoozed;
    }

    if (filters.channel) {
      where.channel = filters.channel;
    }

    if (filters.recurring !== undefined) {
      where.recurring = filters.recurring;
    }

    // Filtro por rango de fechas
    if (filters.startDate || filters.endDate) {
      where.remindAt = {};

      if (filters.startDate) {
        where.remindAt.gte = filters.startDate;
      }

      if (filters.endDate) {
        where.remindAt.lte = filters.endDate;
      }
    }

    return await this.prisma.reminder.findMany({
      where,
      include: {
        event: true,
      },
      orderBy: {
        remindAt: 'asc'
      }
    });
  }

  /**
   * Obtener recordatorios pendientes (no enviados, tiempo <= ahora)
   */
  async findPending(options: PendingRemindersOptions): Promise<Reminder[]> {
    const now = new Date();
    const checkUntil = options.beforeTime || now;

    const where: Prisma.ReminderWhereInput = {
      userId: options.userId,
      sent: false,
      remindAt: {
        lte: checkUntil,
      }
    };

    if (options.channel) {
      where.channel = options.channel;
    }

    return await this.prisma.reminder.findMany({
      where,
      include: {
        event: true,
      },
      orderBy: {
        remindAt: 'asc'
      },
      take: options.limit,
    });
  }

  /**
   * Obtener recordatorios asociados a un evento
   */
  async findByEvent(eventId: string): Promise<Reminder[]> {
    return await this.prisma.reminder.findMany({
      where: { eventId },
      include: {
        event: true,
      },
      orderBy: {
        remindAt: 'asc'
      }
    });
  }

  /**
   * Obtener recordatorios próximos (siguiente hora, día, etc.)
   */
  async findUpcoming(
    userId: string,
    hoursAhead: number = 24
  ): Promise<Reminder[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    return await this.prisma.reminder.findMany({
      where: {
        userId,
        sent: false,
        remindAt: {
          gte: now,
          lte: futureTime,
        }
      },
      include: {
        event: true,
      },
      orderBy: {
        remindAt: 'asc'
      }
    });
  }

  /**
   * Buscar recordatorios no leídos
   */
  async findUnread(userId: string): Promise<Reminder[]> {
    return await this.prisma.reminder.findMany({
      where: {
        userId,
        sent: true,
        read: false,
      },
      include: {
        event: true,
      },
      orderBy: {
        remindAt: 'desc'
      }
    });
  }

  /**
   * Buscar recordatorios pospuestos (snoozed)
   */
  async findSnoozed(userId: string): Promise<Reminder[]> {
    return await this.prisma.reminder.findMany({
      where: {
        userId,
        snoozed: true,
      },
      include: {
        event: true,
      },
      orderBy: {
        snoozeUntil: 'asc'
      }
    });
  }

  // ==========================================================================
  // FUNCIONES ESPECIALES
  // ==========================================================================

  /**
   * Marcar recordatorio como enviado
   */
  async markAsSent(id: string): Promise<Reminder> {
    return await this.update(id, { sent: true });
  }

  /**
   * Marcar recordatorio como leído
   */
  async markAsRead(id: string): Promise<Reminder> {
    return await this.update(id, { read: true });
  }

  /**
   * Posponer (snooze) un recordatorio
   */
  async snooze(id: string, snoozeMinutes: number = 10): Promise<Reminder> {
    const now = new Date();
    const snoozeUntil = new Date(now.getTime() + snoozeMinutes * 60 * 1000);

    return await this.update(id, {
      snoozed: true,
      snoozeUntil,
      remindAt: snoozeUntil, // Actualizar también el remindAt
    });
  }

  /**
   * Cancelar snooze de un recordatorio
   */
  async unsnooze(id: string): Promise<Reminder> {
    return await this.update(id, {
      snoozed: false,
      snoozeUntil: null,
    });
  }

  /**
   * Crear recordatorio automático para un evento
   * (15 minutos antes por defecto)
   */
  async createForEvent(
    eventId: string,
    userId: string,
    minutesBefore: number = 15
  ): Promise<Reminder> {
    // Obtener el evento
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Calcular tiempo de recordatorio
    const remindAt = new Date(event.startTime.getTime() - minutesBefore * 60 * 1000);

    return await this.create({
      userId,
      eventId,
      title: `Recordatorio: ${event.title}`,
      message: `Tu evento "${event.title}" comienza en ${minutesBefore} minutos`,
      remindAt,
      channel: 'PUSH',
    });
  }

  /**
   * Crear múltiples recordatorios para un evento
   * (por ejemplo: 1 día antes, 1 hora antes, 15 min antes)
   */
  async createMultipleForEvent(
    eventId: string,
    userId: string,
    minutesBeforeList: number[] = [1440, 60, 15] // 1 día, 1 hora, 15 min
  ): Promise<Reminder[]> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const reminders: Reminder[] = [];

    for (const minutesBefore of minutesBeforeList) {
      const remindAt = new Date(event.startTime.getTime() - minutesBefore * 60 * 1000);

      // No crear recordatorios en el pasado
      if (remindAt > new Date()) {
        const timeLabel = this.getTimeLabel(minutesBefore);

        const reminder = await this.create({
          userId,
          eventId,
          title: `Recordatorio: ${event.title}`,
          message: `Tu evento "${event.title}" comienza ${timeLabel}`,
          remindAt,
          channel: 'PUSH',
        });

        reminders.push(reminder);
      }
    }

    return reminders;
  }

  /**
   * Obtener label descriptivo del tiempo
   */
  private getTimeLabel(minutes: number): string {
    if (minutes < 60) {
      return `en ${minutes} minutos`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `en ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `en ${days} día${days > 1 ? 's' : ''}`;
    }
  }

  /**
   * Procesar recordatorios pospuestos que ya deben activarse
   */
  async processSnoozed(userId: string): Promise<Reminder[]> {
    const now = new Date();

    const snoozedReminders = await this.prisma.reminder.findMany({
      where: {
        userId,
        snoozed: true,
        snoozeUntil: {
          lte: now,
        }
      },
      include: {
        event: true,
      }
    });

    // Desactivar snooze
    const processed: Reminder[] = [];
    for (const reminder of snoozedReminders) {
      const updated = await this.unsnooze(reminder.id);
      processed.push(updated);
    }

    return processed;
  }

  /**
   * Obtener estadísticas de recordatorios del usuario
   */
  async getStats(userId: string): Promise<{
    total: number;
    sent: number;
    pending: number;
    read: number;
    snoozed: number;
    byChannel: Record<string, number>;
  }> {
    const total = await this.prisma.reminder.count({
      where: { userId }
    });

    const sent = await this.prisma.reminder.count({
      where: { userId, sent: true }
    });

    const pending = await this.prisma.reminder.count({
      where: {
        userId,
        sent: false,
        remindAt: { lte: new Date() }
      }
    });

    const read = await this.prisma.reminder.count({
      where: { userId, read: true }
    });

    const snoozed = await this.prisma.reminder.count({
      where: { userId, snoozed: true }
    });

    // Recordatorios por canal
    const remindersByChannel = await this.prisma.reminder.groupBy({
      by: ['channel'],
      where: { userId },
      _count: {
        channel: true
      }
    });

    const byChannel: Record<string, number> = {};
    remindersByChannel.forEach(item => {
      byChannel[item.channel] = item._count.channel;
    });

    return {
      total,
      sent,
      pending,
      read,
      snoozed,
      byChannel,
    };
  }

  /**
   * Limpiar recordatorios antiguos enviados y leídos
   */
  async cleanupOld(userId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.reminder.deleteMany({
      where: {
        userId,
        sent: true,
        read: true,
        recurring: false,
        remindAt: {
          lt: cutoffDate,
        }
      }
    });

    return result.count;
  }

  /**
   * Contar todos los recordatorios del usuario
   */
  async countAll(userId: string): Promise<number> {
    return await this.prisma.reminder.count({
      where: { userId }
    });
  }
}
