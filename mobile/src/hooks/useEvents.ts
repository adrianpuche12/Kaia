// Hook personalizado para eventos
import { useEffect } from 'react';
import { useEvents as useEventsStore } from '../store/store';
import { CreateEventRequest, UpdateEventRequest } from '../types';

export const useEvents = () => {
  const events = useEventsStore();

  // Cargar eventos al montar
  useEffect(() => {
    events.fetchTodayEvents();
    events.fetchUpcomingEvents();
  }, []);

  const createEvent = async (data: CreateEventRequest) => {
    try {
      const event = await events.createEvent(data);
      // Refrescar listas
      await Promise.all([
        events.fetchTodayEvents(),
        events.fetchUpcomingEvents(),
      ]);
      return { success: true, event };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateEvent = async (id: string, data: UpdateEventRequest) => {
    try {
      const event = await events.updateEvent(id, data);
      await Promise.all([
        events.fetchTodayEvents(),
        events.fetchUpcomingEvents(),
      ]);
      return { success: true, event };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await events.deleteEvent(id);
      await Promise.all([
        events.fetchTodayEvents(),
        events.fetchUpcomingEvents(),
      ]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const cancelEvent = async (id: string) => {
    try {
      await events.cancelEvent(id);
      await Promise.all([
        events.fetchTodayEvents(),
        events.fetchUpcomingEvents(),
      ]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const completeEvent = async (id: string) => {
    try {
      await events.completeEvent(id);
      await Promise.all([
        events.fetchTodayEvents(),
        events.fetchUpcomingEvents(),
      ]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const refreshEvents = async () => {
    await Promise.all([
      events.fetchEvents(),
      events.fetchTodayEvents(),
      events.fetchUpcomingEvents(),
    ]);
  };

  return {
    events: events.events,
    todayEvents: events.todayEvents,
    upcomingEvents: events.upcomingEvents,
    selectedEvent: events.selectedEvent,
    isLoading: events.isLoading,
    error: events.error,
    createEvent,
    updateEvent,
    deleteEvent,
    cancelEvent,
    completeEvent,
    selectEvent: events.selectEvent,
    refreshEvents,
    clearError: events.clearError,
  };
};

export default useEvents;
