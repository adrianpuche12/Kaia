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
}

export const eventAPI = new EventAPI();
export default eventAPI;
