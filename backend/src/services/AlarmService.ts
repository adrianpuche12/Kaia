import { AlarmRepository, DaysActive } from '../repositories/AlarmRepository';
import { Alarm } from '@prisma/client';

export interface CreateAlarmDTO {
  userId: string;
  name?: string;
  label?: string;
  time: string; // "HH:MM" format
  daysActive?: number[]; // [0-6] 0=Sunday, 6=Saturday
  enabled?: boolean;
  snooze?: boolean;
  snoozeTime?: number;
  maxSnoozes?: number;
  soundType?: string;
  musicId?: string;
  musicName?: string;
  musicUrl?: string;
  wakeMessage?: string;
  readAgenda?: boolean;
  gradualVolume?: boolean;
  volumeStart?: number;
  volumeEnd?: number;
  volumeDuration?: number;
  vibration?: boolean;
}

export interface UpdateAlarmDTO {
  name?: string;
  label?: string;
  time?: string;
  daysActive?: number[];
  enabled?: boolean;
  snooze?: boolean;
  snoozeTime?: number;
  maxSnoozes?: number;
  soundType?: string;
  musicId?: string;
  musicName?: string;
  musicUrl?: string;
  wakeMessage?: string;
  readAgenda?: boolean;
  gradualVolume?: boolean;
  volumeStart?: number;
  volumeEnd?: number;
  volumeDuration?: number;
  vibration?: boolean;
}

export interface SnoozeAlarmDTO {
  alarmId: string;
  snoozeTime?: number; // Minutos (default: usar snoozeTime de la alarma)
}

/**
 * AlarmService
 * Capa de lógica de negocio para alarmas
 *
 * Responsabilidades:
 * - Validación de datos de alarmas
 * - Creación de alarmas con configuración por defecto
 * - Gestión de snooze con límites
 * - Helpers para crear alarmas comunes (weekday, weekend, daily)
 * - Cálculo de próxima alarma a sonar
 * - Manejo de activación/desactivación
 */
export class AlarmService {
  constructor(private alarmRepo: AlarmRepository) {}

  /**
   * Crear una nueva alarma
   * - Valida formato de hora
   * - Valida días activos
   * - Aplica configuración por defecto
   */
  async createAlarm(data: CreateAlarmDTO): Promise<Alarm> {
    // 1. Validar datos
    this.validateAlarmData(data);

    // 2. Convertir daysActive a DaysActive (objeto con días de la semana)
    const daysActiveObj: DaysActive = this.convertToDaysActive(data.daysActive);

    // 3. Crear alarma
    return await this.alarmRepo.create({
      userId: data.userId,
      name: data.name,
      label: data.label || this.generateDefaultLabel(data.time, data.daysActive),
      time: data.time,
      daysActive: daysActiveObj,
      enabled: data.enabled ?? true,
      snooze: data.snooze ?? true,
      snoozeTime: data.snoozeTime || 5, // 5 minutos default
      maxSnoozes: data.maxSnoozes || 3, // 3 veces máximo
      soundType: data.soundType || 'DEFAULT',
      musicId: data.musicId,
      musicName: data.musicName,
      musicUrl: data.musicUrl,
      wakeMessage: data.wakeMessage,
      readAgenda: data.readAgenda ?? false,
      gradualVolume: data.gradualVolume ?? true,
      volumeStart: data.volumeStart || 30,
      volumeEnd: data.volumeEnd || 100,
      volumeDuration: data.volumeDuration || 60, // 60 segundos
      vibration: data.vibration ?? true,
    });
  }

  /**
   * Actualizar alarma existente
   */
  async updateAlarm(alarmId: string, data: UpdateAlarmDTO): Promise<Alarm> {
    // 1. Verificar que existe
    const existing = await this.alarmRepo.findById(alarmId);
    if (!existing) {
      throw new Error('Alarm not found');
    }

    // 2. Validar datos si se actualizan
    if (data.time) {
      this.validateTime(data.time);
    }
    if (data.daysActive) {
      this.validateDaysActive(data.daysActive);
    }

    // 3. Convertir daysActive si está presente
    const updateData: any = { ...data };
    if (data.daysActive) {
      updateData.daysActive = this.convertToDaysActive(data.daysActive);
    }

    // 4. Actualizar
    return await this.alarmRepo.update(alarmId, updateData);
  }

  /**
   * Eliminar alarma
   */
  async deleteAlarm(alarmId: string): Promise<void> {
    const alarm = await this.alarmRepo.findById(alarmId);
    if (!alarm) {
      throw new Error('Alarm not found');
    }

    await this.alarmRepo.delete(alarmId);
  }

  /**
   * Activar/Desactivar alarma (toggle)
   */
  async toggleAlarm(alarmId: string): Promise<Alarm> {
    return await this.alarmRepo.toggle(alarmId);
  }

  /**
   * Posponer alarma (snooze)
   * - Valida que snooze esté habilitado
   * - Calcula próximo disparo
   */
  async snoozeAlarm(data: SnoozeAlarmDTO): Promise<{
    success: boolean;
    message: string;
    snoozedUntil?: Date;
  }> {
    const alarm = await this.alarmRepo.findById(data.alarmId);
    if (!alarm) {
      throw new Error('Alarm not found');
    }

    // Verificar si snooze está habilitado
    if (!alarm.snooze) {
      return {
        success: false,
        message: 'Snooze is disabled for this alarm',
      };
    }

    // Calcular tiempo de snooze
    const snoozeTime = data.snoozeTime || alarm.snoozeTime;
    const snoozedUntil = new Date(Date.now() + snoozeTime * 60 * 1000);

    // Marcar como disparada (esto actualiza lastTriggered)
    await this.alarmRepo.markAsTriggered(data.alarmId);

    return {
      success: true,
      message: `Alarm snoozed for ${snoozeTime} minutes`,
      snoozedUntil,
    };
  }

  /**
   * Marcar alarma como disparada
   * - Actualiza lastTriggered
   */
  async triggerAlarm(alarmId: string): Promise<Alarm> {
    return await this.alarmRepo.markAsTriggered(alarmId);
  }

  /**
   * Obtener todas las alarmas del usuario
   */
  async getUserAlarms(userId: string): Promise<Alarm[]> {
    return await this.alarmRepo.findByUser(userId);
  }

  /**
   * Obtener alarmas activas del usuario
   */
  async getActiveAlarms(userId: string): Promise<Alarm[]> {
    return await this.alarmRepo.findActive(userId);
  }

  /**
   * Obtener próxima alarma a sonar
   */
  async getNextAlarm(userId: string): Promise<{
    alarm: Alarm | null;
    nextTriggerTime: Date | null;
    hoursUntil: number | null;
    minutesUntil: number | null;
  }> {
    const nextAlarm = await this.alarmRepo.getNextAlarm(userId);

    if (!nextAlarm) {
      return {
        alarm: null,
        nextTriggerTime: null,
        hoursUntil: null,
        minutesUntil: null,
      };
    }

    // Calcular próximo disparo
    const nextTriggerTime = this.calculateNextTriggerTime(nextAlarm);
    const now = new Date();
    const msUntil = nextTriggerTime.getTime() - now.getTime();
    const minutesUntil = Math.floor(msUntil / (1000 * 60));
    const hoursUntil = Math.floor(minutesUntil / 60);

    return {
      alarm: nextAlarm,
      nextTriggerTime,
      hoursUntil,
      minutesUntil,
    };
  }

  /**
   * Obtener alarmas de un día específico
   */
  async getAlarmsByDay(userId: string, dayOfWeek: number): Promise<Alarm[]> {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new Error('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
    }

    // Convertir número a key de DaysActive
    const dayMap: { [key: number]: keyof DaysActive } = {
      0: 'sun',
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
      6: 'sat'
    };

    return await this.alarmRepo.findByDayOfWeek(userId, dayMap[dayOfWeek]);
  }

  /**
   * Obtener estadísticas de alarmas del usuario
   */
  async getAlarmStats(userId: string) {
    return await this.alarmRepo.getStats(userId);
  }

  /**
   * HELPERS: Crear alarmas comunes
   */

  /**
   * Crear alarma de lunes a viernes (días laborales)
   */
  async createWeekdayAlarm(
    userId: string,
    time: string,
    name?: string
  ): Promise<Alarm> {
    return await this.alarmRepo.createWeekdayAlarm(userId, time, name ? { name } : undefined);
  }

  /**
   * Crear alarma de fin de semana
   */
  async createWeekendAlarm(
    userId: string,
    time: string,
    name?: string
  ): Promise<Alarm> {
    return await this.alarmRepo.createWeekendAlarm(userId, time, name ? { name } : undefined);
  }

  /**
   * Crear alarma diaria
   */
  async createDailyAlarm(
    userId: string,
    time: string,
    name?: string
  ): Promise<Alarm> {
    return await this.alarmRepo.createDailyAlarm(userId, time, name ? { name } : undefined);
  }

  /**
   * VALIDACIONES PRIVADAS
   */

  /**
   * Validar datos de alarma
   */
  private validateAlarmData(data: CreateAlarmDTO): void {
    if (!data.time) {
      throw new Error('Alarm time is required');
    }

    this.validateTime(data.time);

    if (data.daysActive) {
      this.validateDaysActive(data.daysActive);
    }

    if (data.snoozeTime && data.snoozeTime < 1) {
      throw new Error('Snooze duration must be at least 1 minute');
    }

    if (data.maxSnoozes && data.maxSnoozes < 0) {
      throw new Error('Max snooze count cannot be negative');
    }

    if (data.gradualVolume) {
      if (
        data.volumeStart !== undefined &&
        (data.volumeStart < 0 || data.volumeStart > 100)
      ) {
        throw new Error('Volume start must be between 0 and 100');
      }
      if (
        data.volumeEnd !== undefined &&
        (data.volumeEnd < 0 || data.volumeEnd > 100)
      ) {
        throw new Error('Volume end must be between 0 and 100');
      }
    }
  }

  /**
   * Validar formato de hora (HH:MM)
   */
  private validateTime(time: string): void {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      throw new Error(
        'Invalid time format. Expected HH:MM (24-hour format)'
      );
    }
  }

  /**
   * Validar días activos
   */
  private validateDaysActive(daysActive: number[]): void {
    if (!Array.isArray(daysActive) || daysActive.length === 0) {
      throw new Error('daysActive must be a non-empty array');
    }

    for (const day of daysActive) {
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        throw new Error('Each day must be an integer between 0 (Sunday) and 6 (Saturday)');
      }
    }
  }

  /**
   * Convertir array de días a objeto DaysActive
   */
  private convertToDaysActive(daysArray?: number[]): DaysActive {
    const allDays = daysArray || [0, 1, 2, 3, 4, 5, 6];

    return {
      mon: allDays.includes(1),
      tue: allDays.includes(2),
      wed: allDays.includes(3),
      thu: allDays.includes(4),
      fri: allDays.includes(5),
      sat: allDays.includes(6),
      sun: allDays.includes(0),
    };
  }

  /**
   * Generar label por defecto para alarma
   */
  private generateDefaultLabel(time: string, daysActive?: number[]): string {
    if (!daysActive || daysActive.length === 7) {
      return `Alarma diaria ${time}`;
    }

    // Weekdays (Mon-Fri)
    if (
      daysActive.length === 5 &&
      daysActive.includes(1) &&
      daysActive.includes(2) &&
      daysActive.includes(3) &&
      daysActive.includes(4) &&
      daysActive.includes(5)
    ) {
      return `Alarma de lunes a viernes ${time}`;
    }

    // Weekend (Sat-Sun)
    if (
      daysActive.length === 2 &&
      daysActive.includes(0) &&
      daysActive.includes(6)
    ) {
      return `Alarma de fin de semana ${time}`;
    }

    return `Alarma ${time}`;
  }

  /**
   * Calcular próximo momento de disparo de alarma
   */
  private calculateNextTriggerTime(alarm: Alarm): Date {
    const now = new Date();
    const [hours, minutes] = alarm.time.split(':').map(Number);

    // Parsear días activos del objeto DaysActive
    const daysActiveObj = this.alarmRepo.parseDaysActive(alarm);

    // Convertir objeto DaysActive a array de números [0-6]
    const dayMap: { [key in keyof DaysActive]: number } = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6
    };

    const activeDays: number[] = [];
    (Object.keys(dayMap) as Array<keyof DaysActive>).forEach(day => {
      if (daysActiveObj[day]) {
        activeDays.push(dayMap[day]);
      }
    });

    // Empezar desde hoy
    let nextTrigger = new Date();
    nextTrigger.setHours(hours, minutes, 0, 0);

    // Si ya pasó hoy, empezar desde mañana
    if (nextTrigger <= now) {
      nextTrigger.setDate(nextTrigger.getDate() + 1);
    }

    // Buscar el próximo día activo (máximo 7 días adelante)
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = nextTrigger.getDay();
      if (activeDays.includes(dayOfWeek)) {
        return nextTrigger;
      }
      nextTrigger.setDate(nextTrigger.getDate() + 1);
    }

    // Fallback (no debería llegar aquí si hay al menos 1 día activo)
    return nextTrigger;
  }
}
