// API de eventos
import { apiClient } from './apiClient';
import {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventFilters,
  PaginatedResponse,
} from '../../types';

class EventAPI {
  async createEvent(data: CreateEventRequest): Promise<Event> {
    const response = await apiClient.post<{ event: Event }>('/events', data);
    return response.data!.event;
  }

  async listEvents(filters?: EventFilters & { page?: number; limit?: number }): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get<PaginatedResponse<Event>>('/events', filters);
    return response.data!;
  }

  async getTodayEvents(): Promise<Event[]> {
    const response = await apiClient.get<{ events: Event[] }>('/events/today');
    return response.data!.events;
  }

  async getWeekEvents(): Promise<Event[]> {
    const response = await apiClient.get<{ events: Event[] }>('/events/week');
    return response.data!.events;
  }

  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const response = await apiClient.get<{ events: Event[] }>('/events/upcoming', { limit });
    return response.data!.events;
  }

  async getEventById(id: string): Promise<Event> {
    const response = await apiClient.get<{ event: Event }>(`/events/${id}`);
    return response.data!.event;
  }

  async updateEvent(id: string, data: UpdateEventRequest): Promise<Event> {
    const response = await apiClient.put<{ event: Event }>(`/events/${id}`, data);
    return response.data!.event;
  }

  async cancelEvent(id: string): Promise<Event> {
    const response = await apiClient.post<{ event: Event }>(`/events/${id}/cancel`);
    return response.data!.event;
  }

  async completeEvent(id: string): Promise<Event> {
    const response = await apiClient.post<{ event: Event }>(`/events/${id}/complete`);
    return response.data!.event;
  }

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
  }

  // Nuevos endpoints agregados - Fase 1
  async updateEventStatus(id: string, status: 'pending' | 'completed' | 'cancelled'): Promise<Event> {
    const response = await apiClient.patch<{ event: Event }>(`/events/${id}/status`, { status });
    return response.data!.event;
  }

  async addParticipant(id: string, userId: string): Promise<Event> {
    const response = await apiClient.post<{ event: Event }>(`/events/${id}/participants`, { userId });
    return response.data!.event;
  }

  async removeParticipant(id: string, userId: string): Promise<Event> {
    const response = await apiClient.delete<{ event: Event }>(`/events/${id}/participants/${userId}`);
    return response.data!.event;
  }

  async searchEvents(query: string, filters?: EventFilters): Promise<Event[]> {
    const response = await apiClient.get<{ events: Event[] }>('/events/search', {
      q: query,
      ...filters
    });
    return response.data!.events;
  }

  async bulkCreateEvents(events: CreateEventRequest[]): Promise<Event[]> {
    const response = await apiClient.post<{ events: Event[] }>('/events/bulk', { events });
    return response.data!.events;
  }

  async getMonthCalendar(month: string): Promise<Event[]> {
    const response = await apiClient.get<{ events: Event[] }>(`/events/calendar/${month}`);
    return response.data!.events;
  }
}

export const eventAPI = new EventAPI();
export default eventAPI;
