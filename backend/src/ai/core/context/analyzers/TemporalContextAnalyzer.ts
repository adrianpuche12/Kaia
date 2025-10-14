import { ITemporalContext } from '../../interfaces/context/ITemporalContext';
import { TimeOfDay } from '../../enums/TimeOfDay';

/**
 * Analizador de Contexto Temporal
 * Analiza y enriquece el contexto temporal de una entidad
 */
export class TemporalContextAnalyzer {
  /**
   * Analizar contexto temporal
   * @param temporal Contexto temporal base
   * @param entity Entidad a analizar
   * @returns Contexto temporal enriquecido
   */
  async analyze(
    temporal: ITemporalContext,
    entity: any
  ): Promise<ITemporalContext> {
    // Enriquecer con cálculos derivados
    return {
      ...temporal,
      timeOfDay: this.getTimeOfDay(temporal.timestamp),
      dayOfWeek: temporal.timestamp.getDay(),
      isWorkday: this.isWorkday(temporal.timestamp),
      isHoliday: false, // TODO: integrar con API de festivos
      relativeTime: {
        isPast: temporal.timestamp < new Date(),
        isCurrent: this.isToday(temporal.timestamp),
        isFuture: temporal.timestamp > new Date(),
        hoursUntil: this.calculateHoursUntil(temporal.timestamp),
        daysUntil: this.calculateDaysUntil(temporal.timestamp)
      },
      recurrence: temporal.recurrence
    };
  }

  /**
   * Determinar período del día
   */
  private getTimeOfDay(date: Date): TimeOfDay {
    const hour = date.getHours();
    if (hour < 12) return TimeOfDay.MORNING;
    if (hour < 18) return TimeOfDay.AFTERNOON;
    if (hour < 21) return TimeOfDay.EVENING;
    return TimeOfDay.NIGHT;
  }

  /**
   * Verificar si es día laboral (Lunes-Viernes)
   */
  private isWorkday(date: Date): boolean {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  }

  /**
   * Verificar si es hoy
   */
  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Calcular horas hasta la fecha objetivo
   */
  private calculateHoursUntil(target: Date): number {
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }

  /**
   * Calcular días hasta la fecha objetivo
   */
  private calculateDaysUntil(target: Date): number {
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Verificar si está en el pasado
   */
  isPast(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Verificar si está en el futuro
   */
  isFuture(date: Date): boolean {
    return date > new Date();
  }

  /**
   * Calcular urgencia temporal (0-100)
   * Basado en qué tan cerca está el deadline
   */
  calculateTemporalUrgency(deadline: Date): number {
    const hoursUntil = this.calculateHoursUntil(deadline);

    if (hoursUntil < 0) return 0; // Ya pasó
    if (hoursUntil < 1) return 100; // Menos de 1 hora
    if (hoursUntil < 6) return 90; // Menos de 6 horas
    if (hoursUntil < 24) return 75; // Menos de 1 día
    if (hoursUntil < 48) return 60; // Menos de 2 días
    if (hoursUntil < 168) return 40; // Menos de 1 semana

    return 20; // Más de 1 semana
  }
}
