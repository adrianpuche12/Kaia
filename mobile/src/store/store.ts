// Store principal de Zustand
import { create } from 'zustand';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createEventSlice, EventSlice } from './slices/eventSlice';

// Tipo combinado del store
export type AppStore = AuthSlice & EventSlice;

// Crear store con todos los slices
export const useStore = create<AppStore>((set, get, store) => ({
  ...createAuthSlice(set, get, store),
  ...createEventSlice(set, get, store),
}));

// Selector conveniente para eventos
export const useEvents = () => useStore(state => ({
  events: state.events,
  todayEvents: state.todayEvents,
  upcomingEvents: state.upcomingEvents,
  selectedEvent: state.selectedEvent,
  isLoading: state.isLoading,
  error: state.error,
  fetchEvents: state.fetchEvents,
  fetchTodayEvents: state.fetchTodayEvents,
  fetchUpcomingEvents: state.fetchUpcomingEvents,
  createEvent: state.createEvent,
  updateEvent: state.updateEvent,
  deleteEvent: state.deleteEvent,
  cancelEvent: state.cancelEvent,
  completeEvent: state.completeEvent,
  selectEvent: state.selectEvent,
  clearError: state.clearError,
}));

export default useStore;
