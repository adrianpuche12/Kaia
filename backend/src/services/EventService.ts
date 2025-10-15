import { EventRepository } from '../repositories/EventRepository';
import { ReminderRepository } from '../repositories/ReminderRepository';
import { PlaceRepository } from '../repositories/PlaceRepository';
import { Event } from '@prisma/client';

export interface CreateEventDTO {
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
  createdVia?: string;
}

export interface UpdateEventDTO {
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

export interface EventConflict {
  event: Event;
  message: string;
}

/**
 * EventService
 * Capa de lógica de negocio para eventos
 *
 * Responsabilidades:
 * - Validación de datos
 * - Detección de conflictos
 * - Creación automática de recordatorios
 * - Gestión de lugares
 * - Reglas de negocio
 */
export class EventService {
  constructor(
    private eventRepo: EventRepository,
    private reminderRepo: ReminderRepository,
    private placeRepo: PlaceRepository
  ) {}

  /**
   * Crear un nuevo evento
   * - Valida datos
   * - Detecta conflictos
   * - Crea recordatorios automáticos
   */
  async createEvent(data: CreateEventDTO): Promise<{
    event: Event;
    conflicts: EventConflict[];
    remindersCreated: number;
  }> {
    // 1. Validar datos
    this.validateEventData(data);

    // 2. Detectar conflictos de horario
    const conflicts = await this.checkConflicts(
      data.userId,
      data.startTime,
      data.endTime || data.startTime
    );

    // 3. Crear el evento
    const event = await this.eventRepo.create({
      userId: data.userId,
      title: data.title,
      description: data.description,
      type: data.type || 'OTHER',
      startTime: data.startTime,
      endTime: data.endTime,
      allDay: data.allDay ?? false,
      timezone: data.timezone,
      location: data.location,
      placeId: data.placeId,
      participants: data.participants || [],
      createdVia: (data.createdVia || 'MANUAL') as 'VOICE' | 'MANUAL' | 'IMPORT' | 'MCP'
    });

    // 4. Crear recordatorios automáticos
    const remindersCreated = await this.createDefaultReminders(event);

    return {
      event,
      conflicts: conflicts.map(e => ({
        event: e,
        message: `Conflicto con "${e.title}" a las ${e.startTime.toLocaleTimeString()}`
      })),
      remindersCreated
    };
  }

  /**
   * Actualizar evento existente
   */
  async updateEvent(
    eventId: string,
    data: UpdateEventDTO
  ): Promise<Event> {
    // 1. Verificar que existe
    const existing = await this.eventRepo.findById(eventId);
    if (!existing) {
      throw new Error('Event not found');
    }

    // 2. Si cambia la hora, detectar conflictos
    if (data.startTime) {
      const conflicts = await this.checkConflicts(
        existing.userId,
        data.startTime,
        data.endTime || data.startTime,
        eventId // Excluir el evento actual
      );

      if (conflicts.length > 0) {
        console.warn(`Warning: ${conflicts.length} conflicts detected when updating event ${eventId}`);
      }
    }

    // 3. Actualizar
    return await this.eventRepo.update(eventId, data);
  }

  /**
   * Eliminar evento
   */
  async deleteEvent(eventId: string): Promise<void> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Eliminar recordatorios asociados
    const reminders = await this.reminderRepo.findByEvent(eventId);
    for (const reminder of reminders) {
      await this.reminderRepo.delete(reminder.id);
    }

    // Eliminar evento
    await this.eventRepo.delete(eventId);
  }

  /**
   * Marcar evento como completado
   */
  async completeEvent(eventId: string): Promise<Event> {
    return await this.eventRepo.markAsCompleted(eventId);
  }

  /**
   * Cancelar evento
   */
  async cancelEvent(eventId: string): Promise<Event> {
    return await this.eventRepo.cancel(eventId);
  }

  /**
   * Obtener eventos del día
   */
  async getTodayEvents(userId: string): Promise<Event[]> {
    return await this.eventRepo.getTodayEvents(userId);
  }

  /**
   * Obtener próximo evento
   */
  async getNextEvent(userId: string): Promise<Event | null> {
    return await this.eventRepo.getNextEvent(userId);
  }

  /**
   * Obtener eventos próximos
   */
  async getUpcomingEvents(userId: string, limit?: number): Promise<Event[]> {
    return await this.eventRepo.findUpcoming({
      userId,
      limit,
      excludeCompleted: true,
      excludeCanceled: true
    });
  }

  /**
   * Obtener eventos por rango de fechas
   */
  async getEventsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Event[]> {
    return await this.eventRepo.findByDateRange(userId, startDate, endDate);
  }

  /**
   * Buscar eventos por tipo
   */
  async getEventsByType(userId: string, type: string): Promise<Event[]> {
    return await this.eventRepo.findByType(userId, type);
  }

  /**
   * Buscar eventos por ubicación
   */
  async getEventsByLocation(userId: string, location: string): Promise<Event[]> {
    return await this.eventRepo.findByLocation(userId, location);
  }

  /**
   * Obtener estadísticas de eventos
   */
  async getEventStats(userId: string) {
    return await this.eventRepo.getStats(userId);
  }

  /**
   * Verificar si el usuario llega a tiempo a un evento
   * Requiere ubicación actual y evento con lugar
   */
  async canArriveOnTime(
    eventId: string,
    currentLocation: { latitude: number; longitude: number }
  ): Promise<{
    canArrive: boolean;
    minutesRequired: number;
    minutesAvailable: number;
    message: string;
  }> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.placeId) {
      return {
        canArrive: true,
        minutesRequired: 0,
        minutesAvailable: 0,
        message: 'Event has no location'
      };
    }

    // Obtener lugar del evento
    const place = await this.placeRepo.findById(event.placeId);
    if (!place) {
      return {
        canArrive: true,
        minutesRequired: 0,
        minutesAvailable: 0,
        message: 'Event location not found'
      };
    }

    // Calcular distancia
    const distance = this.placeRepo.calculateDistance(currentLocation, {
      latitude: place.latitude,
      longitude: place.longitude
    });

    // Estimar tiempo de viaje (asumiendo 40 km/h promedio)
    const minutesRequired = Math.ceil((distance / 1000) / 40 * 60);

    // Calcular minutos disponibles hasta el evento
    const now = new Date();
    const minutesAvailable = Math.floor((event.startTime.getTime() - now.getTime()) / (1000 * 60));

    const canArrive = minutesAvailable >= minutesRequired;

    let message = '';
    if (canArrive) {
      message = `Sí, llegas a tiempo. Necesitas ${minutesRequired} minutos y tienes ${minutesAvailable} minutos disponibles.`;
    } else {
      const delay = minutesRequired - minutesAvailable;
      message = `No, llegarás ${delay} minutos tarde. Necesitas ${minutesRequired} minutos pero solo tienes ${minutesAvailable} minutos.`;
    }

    return {
      canArrive,
      minutesRequired,
      minutesAvailable,
      message
    };
  }

  /**
   * Crear recordatorios por defecto para un evento
   * - 1 día antes
   * - 1 hora antes
   * - 15 minutos antes
   */
  private async createDefaultReminders(event: Event): Promise<number> {
    try {
      await this.reminderRepo.createMultipleForEvent(event.id, event.userId);
      return 3; // 3 recordatorios creados
    } catch (error) {
      console.error('Error creating default reminders:', error);
      return 0;
    }
  }

  /**
   * Detectar conflictos de horario
   */
  private async checkConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ): Promise<Event[]> {
    const conflicts = await this.eventRepo.checkConflicts({
      userId,
      startTime,
      endTime,
      excludeEventId
    });

    return conflicts;
  }

  /**
   * Validar datos del evento
   */
  private validateEventData(data: CreateEventDTO): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Event title is required');
    }

    if (!data.startTime) {
      throw new Error('Event start time is required');
    }

    if (data.endTime && data.endTime < data.startTime) {
      throw new Error('End time must be after start time');
    }

    // Validar que la fecha no sea en el pasado (excepto para eventos históricos)
    const now = new Date();
    if (data.startTime < now && data.createdVia !== 'IMPORT') {
      console.warn('Warning: Creating event in the past');
    }
  }
}
