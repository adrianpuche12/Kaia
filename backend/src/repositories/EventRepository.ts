/**
 * EventRepository - Repositorio para gestión de eventos del calendario
 *
 * Funcionalidades:
 * - CRUD completo de eventos
 * - Filtrado por fechas, tipo, ubicación
 * - Búsqueda de eventos próximos
 * - Detección de conflictos de horario
 * - Integración con Observer pattern para notificar a IA
 */

import { Event, Prisma } from '@prisma/client';
import { BaseRepository, RepositoryEvent } from './base/BaseRepository';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EventCreateData {
  userId: string;
  title: string;
  description?: string;
  type?: string;
  startTime: Date;
  endTime?: Date;
  allDay?: boolean;
  timezone?: string;
  location?: string;
  placeId?: string;
  participants?: string[];
  createdVia?: 'VOICE' | 'MANUAL' | 'IMPORT' | 'MCP';
}

export interface EventUpdateData {
  title?: string;
  description?: string;
  type?: string;
  startTime?: Date;
  endTime?: Date;
  allDay?: boolean;
  timezone?: string;
  location?: string;
  placeId?: string;
  participants?: string[];
  completed?: boolean;
  canceled?: boolean;
}

export interface EventFilters {
  userId: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  placeId?: string;
  completed?: boolean;
  canceled?: boolean;
  createdVia?: string;
}

export interface UpcomingEventsOptions {
  userId: string;
  hoursAhead?: number;
  limit?: number;
  excludeCompleted?: boolean;
  excludeCanceled?: boolean;
}

export interface ConflictCheckOptions {
  userId: string;
  startTime: Date;
  endTime?: Date;
  excludeEventId?: string;
}

// ============================================================================
// EVENT REPOSITORY
// ============================================================================

export class EventRepository extends BaseRepository<Event> {

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
   * Crear un nuevo evento
   */
  async create(data: EventCreateData): Promise<Event> {
    const eventData: Prisma.EventCreateInput = {
      user: {
        connect: { id: data.userId }
      },
      title: data.title,
      description: data.description,
      type: data.type || 'OTHER',
      startTime: data.startTime,
      endTime: data.endTime,
      allDay: data.allDay || false,
      timezone: data.timezone,
      location: data.location,
      participants: data.participants ? JSON.stringify(data.participants) : '[]',
      createdVia: data.createdVia || 'VOICE',
    };

    // Agregar place si existe
    if (data.placeId) {
      eventData.place = {
        connect: { id: data.placeId }
      };
    }

    const event = await this.prisma.event.create({
      data: eventData,
      include: {
        place: true,
        reminders: true,
      }
    });

    // Notificar a observers (AI system)
    await this.notifyObservers({
      type: RepositoryEvent.CREATE,
      entityType: 'Event',
      entityId: event.id,
      userId: event.userId,
      data: event,
      timestamp: new Date(),
    });

    return event;
  }

  /**
   * Buscar evento por ID
   */
  async findById(id: string): Promise<Event | null> {
    return await this.prisma.event.findUnique({
      where: { id },
      include: {
        place: true,
        reminders: true,
        locationLogs: true,
      }
    });
  }

  /**
   * Actualizar un evento
   */
  async update(id: string, data: EventUpdateData): Promise<Event> {
    const updateData: Prisma.EventUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.allDay !== undefined) updateData.allDay = data.allDay;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.completed !== undefined) updateData.completed = data.completed;
    if (data.canceled !== undefined) updateData.canceled = data.canceled;

    if (data.participants !== undefined) {
      updateData.participants = JSON.stringify(data.participants);
    }

    if (data.placeId !== undefined) {
      updateData.place = {
        connect: { id: data.placeId }
      };
    }

    const event = await this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        place: true,
        reminders: true,
      }
    });

    // Notificar a observers
    await this.notifyObservers({
      type: RepositoryEvent.UPDATE,
      entityType: 'Event',
      entityId: event.id,
      userId: event.userId,
      data: event,
      timestamp: new Date(),
    });

    return event;
  }

  /**
   * Eliminar un evento
   */
  async delete(id: string): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    await this.prisma.event.delete({
      where: { id }
    });

    // Notificar a observers
    await this.notifyObservers({
      type: RepositoryEvent.DELETE,
      entityType: 'Event',
      entityId: id,
      userId: event.userId,
      data: { id },
      timestamp: new Date(),
    });
  }

  // ==========================================================================
  // BÚSQUEDA Y FILTRADO
  // ==========================================================================

  /**
   * Buscar eventos con filtros
   */
  async findMany(filters: EventFilters): Promise<Event[]> {
    const where: Prisma.EventWhereInput = {
      userId: filters.userId,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.location) {
      where.location = {
        contains: filters.location,
      };
    }

    if (filters.placeId) {
      where.placeId = filters.placeId;
    }

    if (filters.completed !== undefined) {
      where.completed = filters.completed;
    }

    if (filters.canceled !== undefined) {
      where.canceled = filters.canceled;
    }

    if (filters.createdVia) {
      where.createdVia = filters.createdVia;
    }

    // Filtro por rango de fechas
    if (filters.startDate || filters.endDate) {
      where.startTime = {};

      if (filters.startDate) {
        where.startTime.gte = filters.startDate;
      }

      if (filters.endDate) {
        where.startTime.lte = filters.endDate;
      }
    }

    return await this.prisma.event.findMany({
      where,
      include: {
        place: true,
        reminders: true,
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  }

  /**
   * Obtener eventos próximos (útil para agenda del día)
   */
  async findUpcoming(options: UpcomingEventsOptions): Promise<Event[]> {
    const now = new Date();
    const hoursAhead = options.hoursAhead || 24;
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const where: Prisma.EventWhereInput = {
      userId: options.userId,
      startTime: {
        gte: now,
        lte: futureTime,
      }
    };

    if (options.excludeCompleted) {
      where.completed = false;
    }

    if (options.excludeCanceled) {
      where.canceled = false;
    }

    return await this.prisma.event.findMany({
      where,
      include: {
        place: true,
        reminders: true,
      },
      orderBy: {
        startTime: 'asc'
      },
      take: options.limit,
    });
  }

  /**
   * Buscar eventos por rango de fechas (para calendario)
   */
  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Event[]> {
    return await this.prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        place: true,
        reminders: true,
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  }

  /**
   * Buscar eventos por tipo
   */
  async findByType(userId: string, type: string): Promise<Event[]> {
    return await this.prisma.event.findMany({
      where: {
        userId,
        type,
      },
      include: {
        place: true,
        reminders: true,
      },
      orderBy: {
        startTime: 'desc'
      }
    });
  }

  /**
   * Buscar eventos en una ubicación específica
   */
  async findByLocation(userId: string, location: string): Promise<Event[]> {
    return await this.prisma.event.findMany({
      where: {
        userId,
        location: {
          contains: location,
        }
      },
      include: {
        place: true,
        reminders: true,
      },
      orderBy: {
        startTime: 'desc'
      }
    });
  }

  // ==========================================================================
  // FUNCIONES ESPECIALES
  // ==========================================================================

  /**
   * Verificar conflictos de horario
   * Retorna eventos que se solapan con el horario dado
   */
  async checkConflicts(options: ConflictCheckOptions): Promise<Event[]> {
    const { userId, startTime, endTime, excludeEventId } = options;

    const where: Prisma.EventWhereInput = {
      userId,
      canceled: false,
      completed: false,
      OR: [
        // Caso 1: Evento existente comienza durante el nuevo evento
        {
          startTime: {
            gte: startTime,
            lt: endTime || startTime,
          }
        },
        // Caso 2: Evento existente termina durante el nuevo evento
        {
          AND: [
            {
              endTime: {
                gt: startTime,
                lte: endTime || startTime,
              }
            },
            {
              endTime: {
                not: null
              }
            }
          ]
        },
        // Caso 3: Evento existente envuelve completamente al nuevo evento
        {
          AND: [
            {
              startTime: {
                lte: startTime,
              }
            },
            {
              endTime: {
                gte: endTime || startTime,
              }
            }
          ]
        }
      ]
    };

    // Excluir el evento actual si estamos editando
    if (excludeEventId) {
      where.id = {
        not: excludeEventId
      };
    }

    return await this.prisma.event.findMany({
      where,
      include: {
        place: true,
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  }

  /**
   * Marcar evento como completado
   */
  async markAsCompleted(id: string): Promise<Event> {
    return await this.update(id, { completed: true });
  }

  /**
   * Cancelar evento
   */
  async cancel(id: string): Promise<Event> {
    return await this.update(id, { canceled: true });
  }

  /**
   * Obtener estadísticas de eventos del usuario
   */
  async getStats(userId: string): Promise<{
    total: number;
    completed: number;
    canceled: number;
    upcoming: number;
    byType: Record<string, number>;
  }> {
    const total = await this.prisma.event.count({
      where: { userId }
    });

    const completed = await this.prisma.event.count({
      where: { userId, completed: true }
    });

    const canceled = await this.prisma.event.count({
      where: { userId, canceled: true }
    });

    const now = new Date();
    const upcoming = await this.prisma.event.count({
      where: {
        userId,
        startTime: { gte: now },
        completed: false,
        canceled: false,
      }
    });

    // Eventos por tipo
    const eventsByType = await this.prisma.event.groupBy({
      by: ['type'],
      where: { userId },
      _count: {
        type: true
      }
    });

    const byType: Record<string, number> = {};
    eventsByType.forEach(item => {
      byType[item.type] = item._count.type;
    });

    return {
      total,
      completed,
      canceled,
      upcoming,
      byType,
    };
  }

  /**
   * Obtener el próximo evento del usuario
   */
  async getNextEvent(userId: string): Promise<Event | null> {
    const now = new Date();

    return await this.prisma.event.findFirst({
      where: {
        userId,
        startTime: { gte: now },
        completed: false,
        canceled: false,
      },
      include: {
        place: true,
        reminders: true,
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  }

  /**
   * Obtener eventos del día actual
   */
  async getTodayEvents(userId: string): Promise<Event[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.findByDateRange(userId, today, tomorrow);
  }

  /**
   * Buscar eventos que requieren acción (sin recordatorios, próximos a comenzar, etc.)
   */
  async findEventsNeedingAttention(userId: string): Promise<Event[]> {
    const now = new Date();
    const oneDayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Eventos próximos sin recordatorios
    const eventsWithoutReminders = await this.prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: now,
          lte: oneDayAhead,
        },
        completed: false,
        canceled: false,
      },
      include: {
        reminders: true,
        place: true,
      }
    });

    return eventsWithoutReminders.filter(event => event.reminders.length === 0);
  }

  /**
   * Contar todos los eventos del usuario
   */
  async countAll(userId: string): Promise<number> {
    return await this.prisma.event.count({
      where: { userId }
    });
  }
}
