// Tipos relacionados con alarmas
export interface Alarm {
  id: string;
  userId: string;
  time: string; // HH:MM format
  label?: string;
  enabled: boolean;
  daysOfWeek?: string[]; // ['monday', 'tuesday', ...]
  sound?: string;
  vibrate: boolean;
  snoozeEnabled: boolean;
  snoozeDuration: number;
  lastTriggered?: Date;
  createdAt: Date;
}

export interface CreateAlarmRequest {
  time: string;
  label?: string;
  enabled?: boolean;
  daysOfWeek?: string[];
  sound?: string;
  vibrate?: boolean;
  snoozeEnabled?: boolean;
  snoozeDuration?: number;
}

export interface UpdateAlarmRequest {
  time?: string;
  label?: string;
  enabled?: boolean;
  daysOfWeek?: string[];
  sound?: string;
  vibrate?: boolean;
  snoozeEnabled?: boolean;
  snoozeDuration?: number;
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';
