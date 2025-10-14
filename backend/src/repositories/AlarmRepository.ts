import { PrismaClient, Alarm } from '@prisma/client';
import { BaseRepository } from './base/BaseRepository';
import { RepositoryEvent } from './base/IRepository';

export interface AlarmCreateData {
  userId: string;
  name?: string;
  label?: string;
  time: string; // "07:00" formato 24h
  daysActive: DaysActive;
  soundType?: string;
  musicId?: string;
  musicName?: string;
  musicUrl?: string;
  wakeMessage?: string;
  readAgenda?: boolean;
  vibration?: boolean;
  snooze?: boolean;
  snoozeTime?: number;
  maxSnoozes?: number;
  gradualVolume?: boolean;
  volumeStart?: number;
  volumeEnd?: number;
  volumeDuration?: number;
  enabled?: boolean;
}

export interface AlarmUpdateData {
  name?: string;
  label?: string;
  time?: string;
  daysActive?: DaysActive;
  soundType?: string;
  musicId?: string;
  musicName?: string;
  musicUrl?: string;
  wakeMessage?: string;
  readAgenda?: boolean;
  vibration?: boolean;
  snooze?: boolean;
  snoozeTime?: number;
  maxSnoozes?: number;
  gradualVolume?: boolean;
  volumeStart?: number;
  volumeEnd?: number;
  volumeDuration?: number;
  enabled?: boolean;
}

export interface DaysActive {
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
}

export interface AlarmFilters {
  userId?: string;
  enabled?: boolean;
  dayOfWeek?: keyof DaysActive;
}

/**
 * AlarmRepository
 * Gestiona alarmas/despertador con funcionalidades avanzadas:
 * - Alarmas recurrentes (días de la semana)
 * - Snooze con límite máximo
 * - Música personalizada
 * - Mensaje de despertar + lectura de agenda
 * - Volumen gradual
 */
export class AlarmRepository extends BaseRepository<Alarm> {
  /**
   * Crear una nueva alarma
   */
  async create(data: AlarmCreateData): Promise<Alarm> {
    const alarm = await this.prisma.alarm.create({
      data: {
        userId: data.userId,
        name: data.name,
        label: data.label,
        time: data.time,
        daysActive: JSON.stringify(data.daysActive),
        soundType: data.soundType || 'DEFAULT',
        musicId: data.musicId,
        musicName: data.musicName,
        musicUrl: data.musicUrl,
        wakeMessage: data.wakeMessage,
        readAgenda: data.readAgenda ?? true,
        vibration: data.vibration ?? true,
        snooze: data.snooze ?? true,
        snoozeTime: data.snoozeTime || 5,
        maxSnoozes: data.maxSnoozes || 3,
        gradualVolume: data.gradualVolume ?? true,
        volumeStart: data.volumeStart || 30,
        volumeEnd: data.volumeEnd || 70,
        volumeDuration: data.volumeDuration || 60,
        enabled: data.enabled ?? true
      }
    });

    // Notificar a observers
    await this.notifyObservers({
      type: 'CREATE',
      entityType: 'ALARM',
      entityId: alarm.id,
      userId: alarm.userId,
      data: alarm,
      timestamp: new Date()
    });

    return alarm;
  }

  /**
   * Buscar alarma por ID
   */
  async findById(id: string): Promise<Alarm | null> {
    return await this.prisma.alarm.findUnique({
      where: { id }
    });
  }

  /**
   * Actualizar alarma
   */
  async update(id: string, data: AlarmUpdateData): Promise<Alarm> {
    const updateData: any = { ...data };

    // Convertir daysActive a JSON string si está presente
    if (data.daysActive) {
      updateData.daysActive = JSON.stringify(data.daysActive);
    }

    const alarm = await this.prisma.alarm.update({
      where: { id },
      data: updateData
    });

    await this.notifyObservers({
      type: 'UPDATE',
      entityType: 'ALARM',
      entityId: alarm.id,
      userId: alarm.userId,
      data: alarm,
      timestamp: new Date()
    });

    return alarm;
  }

  /**
   * Eliminar alarma
   */
  async delete(id: string): Promise<void> {
    const alarm = await this.findById(id);
    if (!alarm) {
      throw new Error('Alarm not found');
    }

    await this.prisma.alarm.delete({
      where: { id }
    });

    await this.notifyObservers({
      type: 'DELETE',
      entityType: 'ALARM',
      entityId: id,
      userId: alarm.userId,
      data: null,
      timestamp: new Date()
    });
  }

  /**
   * Buscar múltiples alarmas con filtros
   */
  async findMany(filters: AlarmFilters): Promise<Alarm[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.enabled !== undefined) {
      where.enabled = filters.enabled;
    }

    let alarms = await this.prisma.alarm.findMany({
      where,
      orderBy: { time: 'asc' }
    });

    // Filtrar por día de la semana si está especificado
    if (filters.dayOfWeek) {
      alarms = alarms.filter(alarm => {
        const daysActive: DaysActive = JSON.parse(alarm.daysActive);
        return daysActive[filters.dayOfWeek!] === true;
      });
    }

    return alarms;
  }

  /**
   * Buscar alarmas activas de un usuario
   */
  async findActive(userId: string): Promise<Alarm[]> {
    return await this.findMany({ userId, enabled: true });
  }

  /**
   * Buscar alarmas que deben sonar en un día específico
   */
  async findByDayOfWeek(userId: string, dayOfWeek: keyof DaysActive): Promise<Alarm[]> {
    return await this.findMany({ userId, enabled: true, dayOfWeek });
  }

  /**
   * Buscar todas las alarmas de un usuario (activas e inactivas)
   */
  async findByUser(userId: string): Promise<Alarm[]> {
    return await this.prisma.alarm.findMany({
      where: { userId },
      orderBy: { time: 'asc' }
    });
  }

  /**
   * Activar/Desactivar una alarma
   */
  async toggle(id: string): Promise<Alarm> {
    const alarm = await this.findById(id);
    if (!alarm) {
      throw new Error('Alarm not found');
    }

    return await this.update(id, { enabled: !alarm.enabled });
  }

  /**
   * Marcar alarma como disparada (última ejecución)
   */
  async markAsTriggered(id: string): Promise<Alarm> {
    const alarm = await this.prisma.alarm.update({
      where: { id },
      data: { lastTriggered: new Date() }
    });

    await this.notifyObservers({
      type: 'UPDATE',
      entityType: 'ALARM',
      entityId: alarm.id,
      userId: alarm.userId,
      data: { ...alarm, event: 'TRIGGERED' },
      timestamp: new Date()
    });

    return alarm;
  }

  /**
   * Obtener la próxima alarma que debe sonar para un usuario
   */
  async getNextAlarm(userId: string): Promise<Alarm | null> {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDayMap: { [key: number]: keyof DaysActive } = {
      0: 'sun',
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
      6: 'sat'
    };
    const currentDay = currentDayMap[now.getDay()];

    const activeAlarms = await this.findActive(userId);

    // Filtrar alarmas que pueden sonar hoy y aún no han pasado
    const upcomingToday = activeAlarms.filter(alarm => {
      const daysActive: DaysActive = JSON.parse(alarm.daysActive);
      return daysActive[currentDay] && alarm.time > currentTime;
    });

    if (upcomingToday.length > 0) {
      // Ordenar por hora y tomar la primera
      upcomingToday.sort((a, b) => a.time.localeCompare(b.time));
      return upcomingToday[0];
    }

    // Si no hay ninguna hoy, buscar la primera del próximo día activo
    // (implementación simplificada, se puede mejorar)
    if (activeAlarms.length > 0) {
      activeAlarms.sort((a, b) => a.time.localeCompare(b.time));
      return activeAlarms[0];
    }

    return null;
  }

  /**
   * Contar todas las alarmas
   */
  async countAll(userId?: string): Promise<number> {
    return await this.count('alarm', userId ? { userId } : {});
  }

  /**
   * Obtener estadísticas de alarmas del usuario
   */
  async getStats(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    withMusic: number;
    withWakeMessage: number;
    avgSnoozeTime: number;
  }> {
    const alarms = await this.findByUser(userId);

    const active = alarms.filter(a => a.enabled).length;
    const withMusic = alarms.filter(a => a.soundType !== 'DEFAULT').length;
    const withWakeMessage = alarms.filter(a => a.wakeMessage && a.wakeMessage.length > 0).length;
    const avgSnoozeTime = alarms.length > 0
      ? alarms.reduce((sum, a) => sum + a.snoozeTime, 0) / alarms.length
      : 0;

    return {
      total: alarms.length,
      active,
      inactive: alarms.length - active,
      withMusic,
      withWakeMessage,
      avgSnoozeTime: Math.round(avgSnoozeTime)
    };
  }

  /**
   * Parsear daysActive de JSON string a objeto
   */
  parseDaysActive(alarm: Alarm): DaysActive {
    return JSON.parse(alarm.daysActive);
  }

  /**
   * Verificar si una alarma debe sonar en un día específico
   */
  shouldRingOn(alarm: Alarm, dayOfWeek: keyof DaysActive): boolean {
    const daysActive = this.parseDaysActive(alarm);
    return daysActive[dayOfWeek] === true;
  }

  /**
   * Crear alarma de lunes a viernes (helper)
   */
  async createWeekdayAlarm(userId: string, time: string, data?: Partial<AlarmCreateData>): Promise<Alarm> {
    return await this.create({
      userId,
      time,
      daysActive: {
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: false,
        sun: false
      },
      ...data
    });
  }

  /**
   * Crear alarma de fin de semana (helper)
   */
  async createWeekendAlarm(userId: string, time: string, data?: Partial<AlarmCreateData>): Promise<Alarm> {
    return await this.create({
      userId,
      time,
      daysActive: {
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: true,
        sun: true
      },
      ...data
    });
  }

  /**
   * Crear alarma diaria (helper)
   */
  async createDailyAlarm(userId: string, time: string, data?: Partial<AlarmCreateData>): Promise<Alarm> {
    return await this.create({
      userId,
      time,
      daysActive: {
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: true,
        sun: true
      },
      ...data
    });
  }
}
