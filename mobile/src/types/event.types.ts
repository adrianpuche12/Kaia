// Tipos relacionados con eventos
export interface Event {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  latitude?: number;
  longitude?: number;
  isAllDay: boolean;
  category: EventCategory;
  reminderMinutes: number;
  isRecurring: boolean;
  recurrenceRule?: string;
  attendees?: string[];
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type EventCategory =
  | 'WORK'
  | 'PERSONAL'
  | 'HEALTH'
  | 'SOCIAL'
  | 'FINANCE'
  | 'EDUCATION'
  | 'OTHER';

export type EventStatus =
  | 'SCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'IN_PROGRESS';

export interface CreateEventRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  isAllDay?: boolean;
  category?: EventCategory;
  reminderMinutes?: number;
  isRecurring?: boolean;
  recurrenceRule?: string;
  attendees?: string[];
  checkConflicts?: boolean;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  isAllDay?: boolean;
  category?: EventCategory;
  reminderMinutes?: number;
  status?: EventStatus;
  attendees?: string[];
}

export interface EventFilters {
  startDate?: Date;
  endDate?: Date;
  category?: EventCategory;
  status?: EventStatus;
  searchQuery?: string;
}
