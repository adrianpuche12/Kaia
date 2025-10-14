// Slice de eventos
import { StateCreator } from 'zustand';
import { Event, CreateEventRequest, UpdateEventRequest } from '../../types';
import { eventAPI } from '../../services/api';

export interface EventSlice {
  events: Event[];
  todayEvents: Event[];
  upcomingEvents: Event[];
  selectedEvent: Event | null;
  isLoading: boolean;
  error: string | null;

  fetchEvents: () => Promise<void>;
  fetchTodayEvents: () => Promise<void>;
  fetchUpcomingEvents: () => Promise<void>;
  createEvent: (data: CreateEventRequest) => Promise<Event>;
  updateEvent: (id: string, data: UpdateEventRequest) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  cancelEvent: (id: string) => Promise<void>;
  completeEvent: (id: string) => Promise<void>;
  selectEvent: (event: Event | null) => void;
  clearError: () => void;
}

export const createEventSlice: StateCreator<EventSlice> = (set, get) => ({
  events: [],
  todayEvents: [],
  upcomingEvents: [],
  selectedEvent: null,
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await eventAPI.listEvents();
      set({ events: response.items, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchTodayEvents: async () => {
    try {
      const todayEvents = await eventAPI.getTodayEvents();
      set({ todayEvents });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchUpcomingEvents: async () => {
    try {
      const upcomingEvents = await eventAPI.getUpcomingEvents();
      set({ upcomingEvents });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createEvent: async (data: CreateEventRequest) => {
    set({ isLoading: true, error: null });
    try {
      const event = await eventAPI.createEvent(data);
      set(state => ({
        events: [event, ...state.events],
        isLoading: false,
      }));
      return event;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateEvent: async (id: string, data: UpdateEventRequest) => {
    set({ isLoading: true, error: null });
    try {
      const event = await eventAPI.updateEvent(id, data);
      set(state => ({
        events: state.events.map(e => e.id === id ? event : e),
        isLoading: false,
      }));
      return event;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteEvent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await eventAPI.deleteEvent(id);
      set(state => ({
        events: state.events.filter(e => e.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  cancelEvent: async (id: string) => {
    try {
      const event = await eventAPI.cancelEvent(id);
      set(state => ({
        events: state.events.map(e => e.id === id ? event : e),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  completeEvent: async (id: string) => {
    try {
      const event = await eventAPI.completeEvent(id);
      set(state => ({
        events: state.events.map(e => e.id === id ? event : e),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  selectEvent: (event: Event | null) => {
    set({ selectedEvent: event });
  },

  clearError: () => {
    set({ error: null });
  },
});
