// Servicio de gestión de eventos
import { PrismaClient } from '@prisma/client';
import { EventDTO, CreateEventDTO, UpdateEventDTO, PaginatedResponse } from '../../types';
import { logger } from '../../utils/logger';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMinutes } from 'date-fns';

const prisma = new PrismaClient();

export class EventService {
  /**
   * Crea un nuevo evento
   */
  static async createEvent(userId: string, data: CreateEventDTO): Promise<EventDTO> {
    // Validar que startTime esté en el futuro
    const startTime = new Date(data.startTime);
    if (startTime < new Date()) {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'La fecha del evento debe ser en el futuro',
      };
    }

    // Calcular endTime si no se proporciona
    let endTime = data.endTime ? new Date(data.endTime) : undefined;
    if (!endTime && data.duration) {
      endTime = addMinutes(startTime, data.duration);
    } else if (!endTime) {
      // Por defecto, 1 hora de duración
      endTime = addMinutes(startTime, 60);
    }

    // Verificar conflictos si se solicita
    if (data.checkConflicts !== false) {
      const hasConflict = await this.checkConflicts(userId, startTime, endTime);
      if (hasConflict) {
        throw {
          statusCode: 409,
          code: 'EVENT_CONFLICT',
          message: 'Ya tienes un evento en ese horario',
        };
      }
    }

    const event = await prisma.event.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        type: data.type || 'OTHER',
        startTime,
        endTime,
        allDay: data.allDay || false,
        timezone: data.timezone,
        location: data.location,
        placeId: data.placeId,
        participants: data.participants ? JSON.stringify(data.participants) : '',
        createdVia: 'VOICE',
      },
    });

    logger.info('Event created', { eventId: event.id, userId, title: event.title });

    return this.toDTO(event);
  }

  /**
   * Obtiene un evento por ID
   */
  static async getEventById(userId: string, eventId: string): Promise<EventDTO> {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId,
      },
      include: {
        reminders: true,
      },
    });

    if (!event) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Evento no encontrado',
      };
    }

    return this.toDTO(event);
  }

  /**
   * Lista eventos del usuario con filtros y paginación
   */
  static async listEvents(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
      status?: string;
      searchQuery?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<EventDTO>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Construir where clause
    const where: any = {
      userId,
    };

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

    // Filtro por categoría
    if (filters.category) {
      where.category = filters.category;
    }

    // Filtro por estado
    if (filters.status) {
      where.status = filters.status;
    }

    // Búsqueda por texto
    if (filters.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery } },
        { description: { contains: filters.searchQuery } },
        { location: { contains: filters.searchQuery } },
      ];
    }

    // Ejecutar query
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          reminders: true,
        },
        orderBy: { startTime: 'asc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return {
      items: events.map(e => this.toDTO(e)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene eventos de hoy
   */
  static async getTodayEvents(userId: string): Promise<EventDTO[]> {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const events = await prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: 'SCHEDULED',
      },
      include: {
        reminders: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return events.map(e => this.toDTO(e));
  }

  /**
   * Obtiene eventos de esta semana
   */
  static async getWeekEvents(userId: string): Promise<EventDTO[]> {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Lunes
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const events = await prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: 'SCHEDULED',
      },
      include: {
        reminders: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return events.map(e => this.toDTO(e));
  }

  /**
   * Obtiene próximos N eventos
   */
  static async getUpcomingEvents(userId: string, limit: number = 10): Promise<EventDTO[]> {
    const events = await prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date(),
        },
        status: 'SCHEDULED',
      },
      include: {
        reminders: true,
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    });

    return events.map(e => this.toDTO(e));
  }

  /**
   * Actualiza un evento
   */
  static async updateEvent(
    userId: string,
    eventId: string,
    data: UpdateEventDTO
  ): Promise<EventDTO> {
    // Verificar que el evento existe y pertenece al usuario
    const existingEvent = await prisma.event.findFirst({
      where: { id: eventId, userId },
    });

    if (!existingEvent) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Evento no encontrado',
      };
    }

    // Validar fechas si se actualizan
    let startTime = data.startTime ? new Date(data.startTime) : existingEvent.startTime;
    let endTime = data.endTime ? new Date(data.endTime) : existingEvent.endTime;

    if (data.startTime && startTime < new Date()) {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'La fecha del evento debe ser en el futuro',
      };
    }

    // Verificar conflictos si cambió la hora
    if (data.startTime || data.endTime) {
      const hasConflict = await this.checkConflicts(userId, startTime, endTime, eventId);
      if (hasConflict) {
        throw {
          statusCode: 409,
          code: 'EVENT_CONFLICT',
          message: 'Ya tienes un evento en ese horario',
        };
      }
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startTime && { startTime }),
        ...(data.endTime && { endTime }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.isAllDay !== undefined && { isAllDay: data.isAllDay }),
        ...(data.category && { category: data.category }),
        ...(data.reminderMinutes !== undefined && { reminderMinutes: data.reminderMinutes }),
        ...(data.status && { status: data.status }),
        ...(data.attendees !== undefined && { attendees: data.attendees }),
      },
      include: {
        reminders: true,
      },
    });

    logger.info('Event updated', { eventId, userId });

    return this.toDTO(event);
  }

  /**
   * Cancela un evento
   */
  static async cancelEvent(userId: string, eventId: string): Promise<EventDTO> {
    return this.updateEvent(userId, eventId, { status: 'CANCELLED' });
  }

  /**
   * Completa un evento
   */
  static async completeEvent(userId: string, eventId: string): Promise<EventDTO> {
    return this.updateEvent(userId, eventId, { status: 'COMPLETED' });
  }

  /**
   * Elimina un evento
   */
  static async deleteEvent(userId: string, eventId: string): Promise<void> {
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

    await prisma.event.delete({
      where: { id: eventId },
    });

    logger.info('Event deleted', { eventId, userId });
  }

  /**
   * Verifica conflictos de horario
   */
  private static async checkConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ): Promise<boolean> {
    const where: any = {
      userId,
      canceled: false,
      OR: [
        // El nuevo evento empieza durante un evento existente
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        // El nuevo evento termina durante un evento existente
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        // El nuevo evento contiene completamente un evento existente
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    };

    // Excluir el evento actual si es una actualización
    if (excludeEventId) {
      where.NOT = { id: excludeEventId };
    }

    const conflictingEvents = await prisma.event.findMany({ where });

    return conflictingEvents.length > 0;
  }

  /**
   * Convierte modelo Prisma a DTO
   */
  private static toDTO(event: any): EventDTO {
    return {
      id: event.id,
      userId: event.userId,
      title: event.title,
      description: event.description || undefined,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location || undefined,
      latitude: event.latitude || undefined,
      longitude: event.longitude || undefined,
      isAllDay: event.isAllDay,
      category: event.category,
      reminderMinutes: event.reminderMinutes,
      isRecurring: event.isRecurring,
      recurrenceRule: event.recurrenceRule || undefined,
      attendees: event.attendees || undefined,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      reminders: event.reminders?.map((r: any) => ({
        id: r.id,
        content: r.content,
        remindAt: r.remindAt,
        status: r.status,
      })),
    };
  }
}

export default EventService;
