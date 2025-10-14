import { TimeOfDay } from '../../enums/TimeOfDay';

/**
 * Contexto Temporal
 * Dimensión 1: Información sobre tiempo y fechas
 */
export interface ITemporalContext {
  timestamp: Date;
  timeOfDay: TimeOfDay;
  dayOfWeek: number; // 0-6 (Domingo-Sábado)
  isWorkday: boolean;
  isHoliday: boolean;

  relativeTime: {
    isPast: boolean;
    isCurrent: boolean;
    isFuture: boolean;
    hoursUntil?: number;
    daysUntil?: number;
  };

  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
}
